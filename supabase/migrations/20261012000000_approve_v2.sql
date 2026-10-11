-- =============================================================================
-- Vitals Approve · v2
--  - Client portal: one permanent link per client (clients.portal_token)
--  - Content calendar: deliverables.publish_date
--  - Pin comments: feedback.pins  [{ "x": 0-100, "y": 0-100, "text": "…" }]
--  - Reminders: deliverables.reminded_at, workspaces.remind_after_days
-- Safe to run more than once.
-- =============================================================================

alter table public.clients add column if not exists portal_token text unique default encode(gen_random_bytes(18), 'hex');
update public.clients set portal_token = encode(gen_random_bytes(18), 'hex') where portal_token is null;
alter table public.clients alter column portal_token set not null;

alter table public.deliverables add column if not exists publish_date date;
alter table public.deliverables add column if not exists reminded_at timestamptz;
alter table public.feedback add column if not exists pins jsonb not null default '[]'::jsonb;
alter table public.workspaces add column if not exists remind_after_days int not null default 2 check (remind_after_days between 1 and 14);

create index if not exists idx_deliv_publish on public.deliverables(workspace_id, publish_date);

-- ---------------------------------------------------------------- review page (adds pins + publish date)
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
    'client', jsonb_build_object('name', c.name, 'lang', c.lang, 'portal_token', c.portal_token),
    'project', jsonb_build_object('name', p.name),
    'deliverable', jsonb_build_object('id', d.id, 'title', d.title, 'kind', d.kind, 'status', d.status, 'current_version', d.current_version, 'revision_count', d.revision_count, 'approved_at', d.approved_at, 'publish_date', d.publish_date),
    'revisions_included', s.revisions_included,
    'versions', coalesce((select jsonb_agg(to_jsonb(v) order by v.number desc) from public.versions v where v.deliverable_id = d.id), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('kind', f.kind, 'author_name', f.author_name, 'comment', f.comment, 'version_number', f.version_number, 'created_at', f.created_at, 'pins', f.pins) order by f.created_at) from public.feedback f where f.deliverable_id = d.id), '[]'::jsonb)
  );
end $$;

-- New signature with pins. Drop the v1 overload so PostgREST resolves one function.
drop function if exists public.hq_review_respond(text, text, text, text);
create or replace function public.hq_review_respond(p_token text, p_action text, p_name text, p_comment text, p_pins jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliverables; s public.scope_items; nm text; cm text; cls text; pins jsonb; pin_text text;
begin
  select * into d from public.deliverables where review_token = p_token for update;
  if not found then raise exception 'Link not found'; end if;
  if d.status <> 'in_review' then raise exception 'This version is no longer awaiting review'; end if;
  nm := coalesce(nullif(left(trim(p_name), 120), ''), 'Client');
  cm := left(trim(coalesce(p_comment, '')), 4000);
  -- keep at most 30 pins with sane coordinates and short text
  select coalesce(jsonb_agg(jsonb_build_object('x', least(100, greatest(0, (e->>'x')::numeric)), 'y', least(100, greatest(0, (e->>'y')::numeric)), 'text', left(coalesce(e->>'text', ''), 500))), '[]'::jsonb)
    into pins from (select e from jsonb_array_elements(case when jsonb_typeof(p_pins) = 'array' then p_pins else '[]'::jsonb end) e limit 30) x;
  select string_agg(e->>'text', ' ') into pin_text from jsonb_array_elements(pins) e;
  select * into s from public.scope_items where id = d.scope_item_id;
  if p_action = 'approved' then
    update public.deliverables set status = 'approved', approved_at = now() where id = d.id;
    insert into public.feedback (workspace_id, deliverable_id, version_number, kind, author_name, comment, resolved, pins)
      values (d.workspace_id, d.id, d.current_version, 'approved', nm, cm, true, '[]'::jsonb);
    insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary)
      values (d.workspace_id, 'approval.approved', d.project_id, d.id, nm, format('approved “%s” v%s', d.title, d.current_version));
  elsif p_action = 'changes' then
    if cm = '' and jsonb_array_length(pins) = 0 then raise exception 'Please describe the changes'; end if;
    cls := public.hq_classify(cm || ' ' || coalesce(pin_text, ''));
    update public.deliverables set status = 'changes', revision_count = revision_count + 1,
      out_of_scope = out_of_scope or (s.id is not null and revision_count + 1 > s.revisions_included)
      where id = d.id;
    insert into public.feedback (workspace_id, deliverable_id, version_number, kind, author_name, comment, classification, pins)
      values (d.workspace_id, d.id, d.current_version, 'changes', nm, cm, cls, pins);
    insert into public.activity (workspace_id, type, project_id, entity_id, actor, summary, data)
      values (d.workspace_id, 'approval.changes', d.project_id, d.id, nm, format('requested changes on “%s” v%s', d.title, d.current_version), jsonb_build_object('classification', cls, 'pins', jsonb_array_length(pins)));
  else
    raise exception 'Unknown action';
  end if;
end $$;

-- ---------------------------------------------------------------- client portal (public)
create or replace function public.hq_portal_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.clients; w public.workspaces;
begin
  select * into c from public.clients where portal_token = p_token;
  if not found then return null; end if;
  select * into w from public.workspaces where id = c.workspace_id;
  return jsonb_build_object(
    'workspace', jsonb_build_object('name', w.name, 'currency', w.currency),
    'client', jsonb_build_object('name', c.name, 'lang', c.lang),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', d.title, 'kind', d.kind, 'status', d.status, 'review_token', d.review_token, 'project', p.name,
        'current_version', d.current_version, 'publish_date', d.publish_date, 'due_date', d.due_date, 'sent_at', d.sent_at, 'approved_at', d.approved_at,
        'thumb', (select jsonb_build_object('file_url', v.file_url, 'file_type', v.file_type, 'link_url', v.link_url) from public.versions v where v.deliverable_id = d.id and v.number = d.current_version)
      ) order by coalesce(d.publish_date, d.due_date, d.created_at::date))
      from public.deliverables d join public.projects p on p.id = d.project_id
      where p.client_id = c.id and d.status <> 'draft' and (d.status <> 'approved' or d.approved_at > now() - interval '45 days')
    ), '[]'::jsonb),
    'change_orders', coalesce((
      select jsonb_agg(jsonb_build_object('title', co.title, 'amount', co.amount, 'currency', co.currency, 'status', co.status, 'token', co.token, 'created_at', co.created_at) order by co.created_at desc)
      from public.change_orders co join public.projects p on p.id = co.project_id
      where p.client_id = c.id and co.status <> 'draft'
    ), '[]'::jsonb)
  );
end $$;

grant execute on function public.hq_review_respond(text, text, text, text, jsonb), public.hq_portal_get(text) to anon, authenticated;
