-- =============================================================================
-- Vitals Approve · v4 — native integrations and billing
--  - connections: ClickUp, Asana, Meta, Google Ads, Stripe, Paymob, Tap
--    (secrets live in connection_secrets, encrypted, readable only by the server)
--  - external_links: our deliverable <-> their task / ad / post
--  - project sync targets, ad results, publishing from the calendar
--  - invoices with payment links, public by token
--  - activity -> /api/sync delivery from the database (pg_net)
-- Safe to run more than once.
-- =============================================================================

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('clickup','asana','meta','google_ads','stripe','paymob','tap')),
  account_label text not null default '',
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','error','revoked')),
  last_error text not null default '',
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, provider)
);
alter table public.connections enable row level security;
drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections for select to authenticated using (public.hq_is_member(workspace_id));
drop policy if exists connections_admin_update on public.connections;
create policy connections_admin_update on public.connections for update to authenticated using (public.hq_is_admin(workspace_id)) with check (public.hq_is_admin(workspace_id));
drop policy if exists connections_admin_delete on public.connections;
create policy connections_admin_delete on public.connections for delete to authenticated using (public.hq_is_admin(workspace_id));
-- inserts happen only from the server (service role) after OAuth / key validation

-- Tokens and API keys. RLS on with NO policies: only the service role can read or write.
create table if not exists public.connection_secrets (
  connection_id uuid primary key references public.connections(id) on delete cascade,
  data text not null,              -- AES-256-GCM ciphertext (see api/_lib/crypto.js)
  updated_at timestamptz not null default now()
);
alter table public.connection_secrets enable row level security;
revoke all on public.connection_secrets from anon, authenticated;

create table if not exists public.external_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  entity_type text not null check (entity_type in ('deliverable','change_order','invoice')),
  entity_id uuid not null,
  external_id text not null,
  url text not null default '',
  created_at timestamptz not null default now(),
  unique (provider, entity_type, entity_id)
);
alter table public.external_links enable row level security;
drop policy if exists external_links_select on public.external_links;
create policy external_links_select on public.external_links for select to authenticated using (public.hq_is_member(workspace_id));

alter table public.projects add column if not exists sync_targets jsonb not null default '{}'::jsonb; -- {"clickup":{"list_id":..},"asana":{"project_gid":..}}
alter table public.deliverables add column if not exists ad_ref text not null default '';          -- "meta:<ad_id>" or "google:<customer_id>:<ad_id>"
alter table public.deliverables add column if not exists caption text not null default '';
alter table public.deliverables add column if not exists auto_publish boolean not null default false;
alter table public.deliverables add column if not exists publish_targets jsonb not null default '[]'::jsonb; -- [{"network":"facebook"|"instagram","id":"..."}]
alter table public.deliverables add column if not exists published_at timestamptz;
alter table public.deliverables add column if not exists publish_error text not null default '';

-- ---------------------------------------------------------------- invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  change_order_id uuid references public.change_orders(id) on delete set null,
  number text not null,
  title text not null default '',
  lines jsonb not null default '[]'::jsonb,  -- [{"description":..,"qty":..,"unit_price":..}]
  amount numeric not null default 0 check (amount >= 0),
  currency text not null default 'EGP',
  status text not null default 'draft' check (status in ('draft','sent','paid','void')),
  provider text not null default '' check (provider in ('','stripe','paymob','tap','manual')),
  payment_url text not null default '',
  provider_ref text not null default '',
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, number)
);
create index if not exists idx_invoices_ws on public.invoices(workspace_id, status);
alter table public.invoices enable row level security;
drop policy if exists invoices_member_all on public.invoices;
create policy invoices_member_all on public.invoices for all to authenticated using (public.hq_is_member(workspace_id)) with check (public.hq_is_member(workspace_id));

create or replace function public.hq_invoice_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare i public.invoices; c public.clients; w public.workspaces;
begin
  select * into i from public.invoices where token = p_token and status <> 'draft';
  if not found then return null; end if;
  select * into c from public.clients where id = i.client_id;
  select * into w from public.workspaces where id = i.workspace_id;
  return jsonb_build_object(
    'workspace', jsonb_build_object('name', w.name),
    'client', jsonb_build_object('name', c.name, 'lang', c.lang),
    'invoice', jsonb_build_object('number', i.number, 'title', i.title, 'lines', i.lines, 'amount', i.amount, 'currency', i.currency, 'status', i.status,
      'payment_url', i.payment_url, 'due_date', i.due_date, 'sent_at', i.sent_at, 'paid_at', i.paid_at, 'created_at', i.created_at)
  );
end $$;
grant execute on function public.hq_invoice_get(text) to anon, authenticated;

-- ---------------------------------------------------------------- server-side sync trigger
-- Holds the deployment URL and a shared secret for /api/sync. Set once:
--   insert into public.app_config values ('sync_url', 'https://brandvitals.io/api/sync'), ('sync_secret', '<same as SYNC_SECRET>')
--   on conflict (key) do update set value = excluded.value;
create table if not exists public.app_config (key text primary key, value text not null);
alter table public.app_config enable row level security;
revoke all on public.app_config from anon, authenticated;

do $outer$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
    execute $fn$
      create or replace function public.hq_fire_sync() returns trigger
      language plpgsql security definer set search_path = public as $body$
      declare u text; s text;
      begin
        select value into u from public.app_config where key = 'sync_url';
        select value into s from public.app_config where key = 'sync_secret';
        if u is null or s is null then return new; end if;
        if not exists (select 1 from public.connections where workspace_id = new.workspace_id and provider in ('clickup','asana') and status = 'active') then return new; end if;
        perform net.http_post(url := u, body := to_jsonb(new), headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-secret', s));
        return new;
      end $body$;
    $fn$;
    execute 'drop trigger if exists hq_activity_sync on public.activity';
    execute 'create trigger hq_activity_sync after insert on public.activity for each row execute function public.hq_fire_sync()';
  end if;
end $outer$;
