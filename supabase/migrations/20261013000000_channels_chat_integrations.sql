-- =============================================================================
-- Vitals Approve · v3
--  - Channels: each client picks how work reaches them (email, WhatsApp, SMS,
--    Slack, Teams, or just the portal link)
--  - Conversations: threads on a client, project or deliverable; every message
--    is either internal (team only) or shared with the client
--  - Integrations: outgoing webhooks (Zapier, Make, n8n, Slack, Teams...)
-- Safe to run more than once.
-- =============================================================================

alter table public.clients add column if not exists preferred_channel text not null default 'whatsapp';
do $$ begin
  alter table public.clients add constraint clients_channel_chk check (preferred_channel in ('email','whatsapp','sms','slack','teams','link'));
exception when duplicate_object then null; end $$;
alter table public.clients add column if not exists chat_webhook text not null default '';

-- ---------------------------------------------------------------- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  thread_type text not null check (thread_type in ('client','project','deliverable')),
  thread_id uuid not null,
  client_id uuid references public.clients(id) on delete cascade,
  visibility text not null default 'internal' check (visibility in ('internal','client')),
  author_type text not null default 'member' check (author_type in ('member','client')),
  author_member_id uuid references public.members(id) on delete set null,
  author_name text not null default '',
  body text not null default '' check (char_length(body) <= 8000),
  attachments jsonb not null default '[]'::jsonb,
  mentions uuid[] not null default '{}',
  classification text check (classification in ('revision','new_request')),
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_thread on public.messages(thread_id, created_at);
create index if not exists idx_messages_ws on public.messages(workspace_id, created_at desc);
create index if not exists idx_messages_client on public.messages(client_id, created_at desc);

alter table public.messages enable row level security;
drop policy if exists messages_member_all on public.messages;
create policy messages_member_all on public.messages for all to authenticated
  using (public.hq_is_member(workspace_id)) with check (public.hq_is_member(workspace_id) and author_type = 'member');

-- ---------------------------------------------------------------- webhooks
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default '',
  kind text not null default 'generic' check (kind in ('generic','slack','teams')),
  url text not null check (url ~ '^https://'),
  events text[] not null default '{approval.approved,approval.changes,change_order.approved,change_order.declined,message.client}',
  secret text not null default encode(gen_random_bytes(16), 'hex'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.webhooks enable row level security;
drop policy if exists webhooks_admin on public.webhooks;
create policy webhooks_admin on public.webhooks for all to authenticated
  using (public.hq_is_admin(workspace_id)) with check (public.hq_is_admin(workspace_id));

-- Deliver activity events to webhooks from the database (Supabase pg_net).
-- Created only where pg_net exists, so local test databases still work.
do $outer$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
    execute $fn$
      create or replace function public.hq_fire_webhooks() returns trigger
      language plpgsql security definer set search_path = public as $body$
      declare h public.webhooks; payload jsonb; link text;
      begin
        for h in select * from public.webhooks where workspace_id = new.workspace_id and active and new.type = any(events) loop
          payload := case h.kind
            when 'slack' then jsonb_build_object('text', format('*%s* %s', new.actor, new.summary))
            when 'teams' then jsonb_build_object('text', format('**%s** %s', new.actor, new.summary))
            else jsonb_build_object('event', new.type, 'actor', new.actor, 'summary', new.summary, 'project_id', new.project_id,
              'entity_id', new.entity_id, 'data', new.data, 'created_at', new.created_at, 'secret', h.secret)
          end;
          perform net.http_post(url := h.url, body := payload, headers := '{"Content-Type":"application/json"}'::jsonb);
        end loop;
        return new;
      end $body$;
    $fn$;
    execute 'drop trigger if exists hq_activity_webhooks on public.activity';
    execute 'create trigger hq_activity_webhooks after insert on public.activity for each row execute function public.hq_fire_webhooks()';
  end if;
end $outer$;

-- Live updates for chat and the activity feed (Supabase Realtime respects RLS).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table public.messages'; exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.activity'; exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.deliverables'; exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------------------------------------------------------------- client messages (public, by token)
-- Writes a client message into a thread; scope guard runs on it too.
create or replace function public.hq_client_message_insert(c public.clients, p_thread_type text, p_thread_id uuid, p_name text, p_body text, p_project uuid)
returns void language plpgsql security definer set search_path = public as $$
declare nm text; b text; cls text;
begin
  nm := coalesce(nullif(left(trim(p_name), 120), ''), c.name);
  b := left(trim(coalesce(p_body, '')), 4000);
  if b = '' then raise exception 'Message is empty'; end if;
  cls := public.hq_classify(b);
  insert into public.messages (workspace_id, thread_type, thread_id, client_id, visibility, author_type, author_name, body, classification)
    values (c.workspace_id, p_thread_type, p_thread_id, c.id, 'client', 'client', nm, b, case when cls = 'new_request' then cls end);
  insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary, data)
    values (c.workspace_id, 'message.client', p_project, p_thread_id, nm, format('wrote: “%s”', left(b, 140)), jsonb_build_object('classification', cls, 'thread_type', p_thread_type));
end $$;

-- From the review page (thread = the deliverable)
create or replace function public.hq_review_message(p_token text, p_name text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliverables; c public.clients;
begin
  select * into d from public.deliverables where review_token = p_token;
  if not found then raise exception 'Link not found'; end if;
  select cl.* into c from public.clients cl join public.projects p on p.client_id = cl.id where p.id = d.project_id;
  perform public.hq_client_message_insert(c, 'deliverable', d.id, p_name, p_body, d.project_id);
end $$;

-- From the portal (thread = the client)
create or replace function public.hq_portal_message(p_token text, p_name text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare c public.clients;
begin
  select * into c from public.clients where portal_token = p_token;
  if not found then raise exception 'Link not found'; end if;
  perform public.hq_client_message_insert(c, 'client', c.id, p_name, p_body, null);
end $$;

revoke all on function public.hq_client_message_insert(public.clients, text, uuid, text, text, uuid) from public, anon, authenticated;

-- Shared (client-visible) messages for a thread, read by token.
create or replace function public.hq_review_messages(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('author_name', m.author_name, 'author_type', m.author_type, 'body', m.body, 'attachments', m.attachments, 'created_at', m.created_at) order by m.created_at), '[]'::jsonb)
  from public.messages m join public.deliverables d on d.id = m.thread_id
  where d.review_token = p_token and m.thread_type = 'deliverable' and m.visibility = 'client';
$$;
create or replace function public.hq_portal_messages(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('author_name', m.author_name, 'author_type', m.author_type, 'body', m.body, 'attachments', m.attachments, 'created_at', m.created_at) order by m.created_at), '[]'::jsonb)
  from public.messages m join public.clients c on c.id = m.thread_id
  where c.portal_token = p_token and m.thread_type = 'client' and m.visibility = 'client';
$$;

grant execute on function public.hq_review_message(text, text, text), public.hq_portal_message(text, text, text),
  public.hq_review_messages(text), public.hq_portal_messages(text) to anon, authenticated;
