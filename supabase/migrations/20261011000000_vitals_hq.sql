-- =============================================================================
-- Vitals Approve · database schema
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Multi-tenant: every row belongs to a workspace; row-level security lets
-- users see only workspaces they are a member of. Clients never log in: the
-- public review / change-order pages call SECURITY DEFINER functions that
-- require the unguessable link token.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  currency text not null default 'EGP',
  owner_id uuid not null references auth.users(id) on delete restrict,
  wa_template_en text not null default 'Hi {client}, {item} is ready for your review: {link}',
  wa_template_ar text not null default 'أهلًا {client}، {item} جاهز للمراجعة: {link}',
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin','member')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  lang text not null default 'ar' check (lang in ('ar','en')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  status text not null default 'active' check (status in ('active','paused','done')),
  color text not null default '#2EE6A6',
  start_date date, due_date date, budget numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.scope_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  kind text not null default 'design' check (kind in ('design','video','copy','post','web','other')),
  quantity int not null default 1 check (quantity >= 0),
  period text not null default 'project' check (period in ('project','month')),
  revisions_included int not null default 2 check (revisions_included >= 0),
  extra_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  scope_item_id uuid references public.scope_items(id) on delete set null,
  title text not null,
  kind text not null default 'design' check (kind in ('design','video','copy','post','web','other')),
  status text not null default 'draft' check (status in ('draft','in_review','changes','approved')),
  due_date date,
  assignee_id uuid references public.members(id) on delete set null,
  review_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  current_version int not null default 0,
  revision_count int not null default 0,
  out_of_scope boolean not null default false,
  sent_at timestamptz, approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  number int not null,
  file_url text not null default '', file_name text not null default '', file_type text not null default '',
  link_url text not null default '', note text not null default '', created_by text not null default '',
  created_at timestamptz not null default now(),
  unique (deliverable_id, number)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  version_number int not null,
  kind text not null check (kind in ('approved','changes')),
  author_name text not null default '',
  comment text not null default '',
  classification text check (classification in ('revision','new_request')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  deliverable_id uuid references public.deliverables(id) on delete set null,
  feedback_id uuid references public.feedback(id) on delete set null,
  title text not null,
  description text not null default '',
  amount numeric not null default 0,
  currency text not null default 'EGP',
  status text not null default 'draft' check (status in ('draft','sent','approved','declined')),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  decided_by text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  deliverable_id uuid references public.deliverables(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','review','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assignee_id uuid references public.members(id) on delete set null,
  due_date date,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('deliverable','task')),
  entity_id uuid not null,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  project_id uuid references public.projects(id) on delete set null,
  entity_id uuid,
  actor text not null default '',
  summary text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_user on public.members(user_id);
create index if not exists idx_projects_ws on public.projects(workspace_id);
create index if not exists idx_deliv_ws on public.deliverables(workspace_id, status);
create index if not exists idx_deliv_project on public.deliverables(project_id);
create index if not exists idx_versions_deliv on public.versions(deliverable_id);
create index if not exists idx_feedback_deliv on public.feedback(deliverable_id);
create index if not exists idx_tasks_ws on public.tasks(workspace_id, status);
create index if not exists idx_activity_ws on public.activity(workspace_id, created_at desc);
create index if not exists idx_comments_entity on public.comments(entity_id);

-- ---------------------------------------------------------------- helpers
create or replace function public.hq_is_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.workspace_id = ws and m.user_id = auth.uid());
$$;

create or replace function public.hq_is_admin(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.workspace_id = ws and m.user_id = auth.uid() and m.role in ('owner','admin'));
$$;

-- Same rule as apps/hq/src/lib/logic.ts → classify()
create or replace function public.hq_classify(t text) returns text
language sql immutable as $$
  select case
    when coalesce(t, '') ~* '(\m(add|additional|another|extra|new|one more)\M|also (make|design|create|do)|more (posts?|designs?|videos?|reels?|stories|pages?|versions?))'
      or coalesce(t, '') ~ '(كمان|زود|زوّد|ضيف|اضافي|إضافي|إضافية|جديد|جديدة|واحد تاني|واحدة تانية|تاني واحد|بوست تاني|فيديو تاني|اعمل لنا|ممكن تعمل|نسخة إضافية|صفحة جديدة)'
    then 'new_request' else 'revision' end;
$$;

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array['clients','projects','scope_items','deliverables','versions','feedback','change_orders','tasks','comments','activity'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.hq_is_member(workspace_id)) with check (public.hq_is_member(workspace_id))', t || '_member_all', t);
  end loop;
end $$;

alter table public.workspaces enable row level security;
drop policy if exists ws_select on public.workspaces;
create policy ws_select on public.workspaces for select to authenticated using (public.hq_is_member(id));
drop policy if exists ws_update on public.workspaces;
create policy ws_update on public.workspaces for update to authenticated using (public.hq_is_admin(id)) with check (public.hq_is_admin(id));

alter table public.members enable row level security;
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated using (public.hq_is_member(workspace_id));
drop policy if exists members_admin on public.members;
create policy members_admin on public.members for update to authenticated using (public.hq_is_admin(workspace_id)) with check (public.hq_is_admin(workspace_id));
drop policy if exists members_delete on public.members;
create policy members_delete on public.members for delete to authenticated using (public.hq_is_admin(workspace_id) and role <> 'owner');

alter table public.invites enable row level security;
drop policy if exists invites_admin on public.invites;
create policy invites_admin on public.invites for all to authenticated using (public.hq_is_admin(workspace_id)) with check (public.hq_is_admin(workspace_id));

-- ---------------------------------------------------------------- RPC: onboarding
create or replace function public.hq_create_workspace(p_name text, p_currency text, p_owner_name text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare w public.workspaces; u record;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id, email into u from auth.users where id = auth.uid();
  insert into public.workspaces (name, currency, owner_id) values (left(trim(p_name), 120), coalesce(nullif(p_currency, ''), 'EGP'), auth.uid()) returning * into w;
  insert into public.members (workspace_id, user_id, role, name, email) values (w.id, auth.uid(), 'owner', left(coalesce(p_owner_name, ''), 120), coalesce(u.email, ''));
  return w;
end $$;

create or replace function public.hq_accept_invite(p_token text, p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare i public.invites; u record;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into i from public.invites where token = p_token and accepted_at is null;
  if not found then raise exception 'Invite not found or already used'; end if;
  select email into u from auth.users where id = auth.uid();
  insert into public.members (workspace_id, user_id, role, name, email)
    values (i.workspace_id, auth.uid(), i.role, left(coalesce(p_name, ''), 120), coalesce(u.email, ''))
    on conflict (workspace_id, user_id) do nothing;
  update public.invites set accepted_at = now() where id = i.id;
  return i.workspace_id;
end $$;

-- ---------------------------------------------------------------- RPC: client review (public)
create or replace function public.hq_review_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d public.deliverables; p public.projects; c public.clients; w public.workspaces; s public.scope_items;
begin
  select * into d from public.deliverables where review_token = p_token;
  if not found then return null; end if;
  select * into p from public.projects where id = d.project_id;
  select * into c from public.clients where id = p.client_id;
  select * into w from public.workspaces where id = d.workspace_id;
  select * into s from public.scope_items where id = d.scope_item_id;
  return jsonb_build_object(
    'workspace', jsonb_build_object('name', w.name, 'currency', w.currency),
    'client', jsonb_build_object('name', c.name, 'lang', c.lang),
    'project', jsonb_build_object('name', p.name),
    'deliverable', jsonb_build_object('id', d.id, 'title', d.title, 'kind', d.kind, 'status', d.status, 'current_version', d.current_version, 'revision_count', d.revision_count, 'approved_at', d.approved_at),
    'revisions_included', s.revisions_included,
    'versions', coalesce((select jsonb_agg(to_jsonb(v) order by v.number desc) from public.versions v where v.deliverable_id = d.id), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('kind', f.kind, 'author_name', f.author_name, 'comment', f.comment, 'version_number', f.version_number, 'created_at', f.created_at) order by f.created_at) from public.feedback f where f.deliverable_id = d.id), '[]'::jsonb)
  );
end $$;

create or replace function public.hq_review_respond(p_token text, p_action text, p_name text, p_comment text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliverables; s public.scope_items; nm text; cm text; cls text;
begin
  select * into d from public.deliverables where review_token = p_token for update;
  if not found then raise exception 'Link not found'; end if;
  if d.status <> 'in_review' then raise exception 'This version is no longer awaiting review'; end if;
  nm := coalesce(nullif(left(trim(p_name), 120), ''), 'Client');
  cm := left(trim(coalesce(p_comment, '')), 4000);
  select * into s from public.scope_items where id = d.scope_item_id;
  if p_action = 'approved' then
    update public.deliverables set status = 'approved', approved_at = now() where id = d.id;
    insert into public.feedback (workspace_id, deliverable_id, version_number, kind, author_name, comment, resolved)
      values (d.workspace_id, d.id, d.current_version, 'approved', nm, cm, true);
    insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary)
      values (d.workspace_id, 'approval.approved', d.project_id, d.id, nm, format('approved “%s” v%s', d.title, d.current_version));
  elsif p_action = 'changes' then
    if cm = '' then raise exception 'Please describe the changes'; end if;
    cls := public.hq_classify(cm);
    update public.deliverables set status = 'changes', revision_count = revision_count + 1,
      out_of_scope = out_of_scope or (s.id is not null and revision_count + 1 > s.revisions_included)
      where id = d.id;
    insert into public.feedback (workspace_id, deliverable_id, version_number, kind, author_name, comment, classification)
      values (d.workspace_id, d.id, d.current_version, 'changes', nm, cm, cls);
    insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary, data)
      values (d.workspace_id, 'approval.changes', d.project_id, d.id, nm, format('requested changes on “%s” v%s', d.title, d.current_version), jsonb_build_object('classification', cls));
  else
    raise exception 'Unknown action';
  end if;
end $$;

-- ---------------------------------------------------------------- RPC: change orders (public)
create or replace function public.hq_co_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare co public.change_orders; p public.projects; c public.clients; w public.workspaces;
begin
  select * into co from public.change_orders where token = p_token and status <> 'draft';
  if not found then return null; end if;
  select * into p from public.projects where id = co.project_id;
  select * into c from public.clients where id = p.client_id;
  select * into w from public.workspaces where id = co.workspace_id;
  return jsonb_build_object(
    'workspace', jsonb_build_object('name', w.name),
    'client', jsonb_build_object('name', c.name, 'lang', c.lang),
    'project', jsonb_build_object('name', p.name),
    'change_order', jsonb_build_object('title', co.title, 'description', co.description, 'amount', co.amount, 'currency', co.currency, 'status', co.status, 'decided_by', co.decided_by, 'decided_at', co.decided_at, 'created_at', co.created_at)
  );
end $$;

create or replace function public.hq_co_respond(p_token text, p_action text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare co public.change_orders; nm text;
begin
  if p_action not in ('approved','declined') then raise exception 'Unknown action'; end if;
  select * into co from public.change_orders where token = p_token for update;
  if not found then raise exception 'Link not found'; end if;
  if co.status <> 'sent' then raise exception 'This change order is not awaiting a decision'; end if;
  nm := coalesce(nullif(left(trim(p_name), 120), ''), 'Client');
  update public.change_orders set status = p_action, decided_by = nm, decided_at = now() where id = co.id;
  insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary, data)
    values (co.workspace_id, 'change_order.' || p_action, co.project_id, co.id, nm, format('%s change order “%s”', p_action, co.title), jsonb_build_object('amount', co.amount, 'currency', co.currency));
end $$;

revoke all on function public.hq_create_workspace(text, text, text) from public, anon;
revoke all on function public.hq_accept_invite(text, text) from public, anon;
grant execute on function public.hq_create_workspace(text, text, text) to authenticated;
grant execute on function public.hq_accept_invite(text, text) to authenticated;
grant execute on function public.hq_review_get(text), public.hq_review_respond(text, text, text, text), public.hq_co_get(text), public.hq_co_respond(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- storage
-- Public-read bucket; object paths start with the workspace id and a random
-- uuid, so files are only reachable through links the agency shares.
insert into storage.buckets (id, name, public, file_size_limit)
values ('hq-files', 'hq-files', true, 104857600)
on conflict (id) do nothing;

drop policy if exists hq_files_insert on storage.objects;
create policy hq_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'hq-files' and public.hq_is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists hq_files_delete on storage.objects;
create policy hq_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'hq-files' and public.hq_is_member(((storage.foldername(name))[1])::uuid));
