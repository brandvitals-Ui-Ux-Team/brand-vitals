-- Review language per client: Egyptian Arabic (default) or Saudi Arabic copy on the client's screens.
alter table public.clients add column if not exists dialect text not null default 'eg' check (dialect in ('eg', 'sa'));

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
    'client', jsonb_build_object('name', c.name, 'lang', c.lang, 'dialect', c.dialect, 'portal_token', c.portal_token),
    'project', jsonb_build_object('name', p.name),
    'deliverable', jsonb_build_object('id', d.id, 'title', d.title, 'kind', d.kind, 'status', d.status, 'current_version', d.current_version, 'revision_count', d.revision_count, 'approved_at', d.approved_at, 'publish_date', d.publish_date),
    'revisions_included', s.revisions_included,
    'versions', coalesce((select jsonb_agg(to_jsonb(v) order by v.number desc) from public.versions v where v.deliverable_id = d.id), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('kind', f.kind, 'author_name', f.author_name, 'comment', f.comment, 'version_number', f.version_number, 'created_at', f.created_at, 'pins', f.pins) order by f.created_at) from public.feedback f where f.deliverable_id = d.id), '[]'::jsonb)
  );
end $$;

create or replace function public.hq_portal_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c public.clients; w public.workspaces;
begin
  select * into c from public.clients where portal_token = p_token;
  if not found then return null; end if;
  select * into w from public.workspaces where id = c.workspace_id;
  return jsonb_build_object(
    'workspace', jsonb_build_object('name', w.name, 'currency', w.currency),
    'client', jsonb_build_object('name', c.name, 'lang', c.lang, 'dialect', c.dialect),
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
