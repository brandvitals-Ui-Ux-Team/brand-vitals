// Runs the Vitals Approve migration against real Postgres (PGlite) with Supabase stubs,
// then exercises onboarding, RLS isolation, and the public review/change-order RPCs.
// Usage: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import fs from "node:fs";

const migrations = ["20261011000000_vitals_hq.sql", "20261012000000_approve_v2.sql", "20261013000000_channels_chat_integrations.sql", "20261014000000_integrations_billing.sql"].map(f => fs.readFileSync(new URL("../migrations/" + f, import.meta.url), "utf8"));
const db = new PGlite({ extensions: { pgcrypto } });
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("ok  ", m); };

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema public, auth, storage to anon, authenticated;
`);
for (const m of migrations) await db.exec(m);
for (const m of migrations) await db.exec(m); // must be safe to re-run
await db.exec(`grant all on all tables in schema public to authenticated; grant select on all tables in schema public to anon;`);
console.log("migration applied");

const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b";
await db.exec(`insert into auth.users values ('${A}', 'a@agency.test'), ('${B}', 'b@other.test');`);
const as = async (uid, role, sql, params) => {
  await db.exec(`reset role; select set_config('request.jwt.sub', '${uid || ""}', false);`);
  await db.exec(`set role ${role};`);
  try { return await db.query(sql, params); } finally { await db.exec("reset role;"); }
};

// onboarding
const w = (await as(A, "authenticated", `select * from public.hq_create_workspace('Agency A', 'EGP', 'Ali')`)).rows[0];
ok(w && w.name === "Agency A", "user A creates workspace via RPC");
const wb = (await as(B, "authenticated", `select * from public.hq_create_workspace('Agency B', 'SAR', 'Bassem')`)).rows[0];
ok(wb, "user B creates their own workspace");

// data as A
const c = (await as(A, "authenticated", `insert into public.clients (workspace_id, name, phone, lang) values ($1, 'Client X', '2010', 'ar') returning *`, [w.id])).rows[0];
const p = (await as(A, "authenticated", `insert into public.projects (workspace_id, client_id, name) values ($1, $2, 'Retainer') returning *`, [w.id, c.id])).rows[0];
const s = (await as(A, "authenticated", `insert into public.scope_items (workspace_id, project_id, title, kind, quantity, period, revisions_included, extra_price) values ($1, $2, 'Posts', 'post', 12, 'month', 1, 1500) returning *`, [w.id, p.id])).rows[0];
const d = (await as(A, "authenticated", `insert into public.deliverables (workspace_id, project_id, scope_item_id, title, kind, status, current_version, review_token) values ($1, $2, $3, 'Post 1', 'post', 'in_review', 1, 'tok123') returning *`, [w.id, p.id, s.id])).rows[0];
await as(A, "authenticated", `insert into public.versions (workspace_id, deliverable_id, number, file_url) values ($1, $2, 1, 'https://x/1.png')`, [w.id, d.id]);
ok(d && d.review_token === "tok123", "member A inserts client/project/scope/deliverable/version");

// RLS isolation
const seenByB = (await as(B, "authenticated", `select count(*)::int n from public.deliverables`)).rows[0].n;
ok(seenByB === 0, "RLS: user B cannot see agency A's deliverables");
let blocked = false;
try { await as(B, "authenticated", `insert into public.clients (workspace_id, name) values ($1, 'evil')`, [w.id]); } catch { blocked = true; }
ok(blocked, "RLS: user B cannot insert into agency A's workspace");
const anonRows = (await as(null, "anon", `select count(*)::int n from public.deliverables`)).rows[0].n;
ok(anonRows === 0, "RLS: anonymous users see no rows directly");

// public review flow (anon)
const g = (await as(null, "anon", `select public.hq_review_get('tok123') r`)).rows[0].r;
ok(g && g.deliverable.title === "Post 1" && g.versions.length === 1 && g.revisions_included === 1, "anon can read review payload by token");
ok((await as(null, "anon", `select public.hq_review_get('wrong') r`)).rows[0].r === null, "wrong token returns null");

await as(null, "anon", `select public.hq_review_respond('tok123', 'changes', 'Omar', 'غيّر اللون')`);
let dd = (await as(A, "authenticated", `select * from public.deliverables where id = $1`, [d.id])).rows[0];
ok(dd.status === "changes" && dd.revision_count === 1 && dd.out_of_scope === false, "changes request increments revisions (1 of 1 included)");
const f1 = (await as(A, "authenticated", `select classification from public.feedback where deliverable_id = $1 order by created_at`, [d.id])).rows;
ok(f1[0].classification === "revision", "Arabic tweak classified as revision");

let notWaiting = false;
try { await as(null, "anon", `select public.hq_review_respond('tok123', 'approved', 'Omar', '')`); } catch { notWaiting = true; }
ok(notWaiting, "cannot respond when version is not awaiting review");

await as(A, "authenticated", `update public.deliverables set status = 'in_review', current_version = 2 where id = $1`, [d.id]);
await as(null, "anon", `select public.hq_review_respond('tok123', 'changes', 'Omar', 'عايزين كمان بوست تاني للفرع الجديد')`);
dd = (await as(A, "authenticated", `select * from public.deliverables where id = $1`, [d.id])).rows[0];
const f2 = (await as(A, "authenticated", `select classification from public.feedback where deliverable_id = $1 order by created_at`, [d.id])).rows;
ok(dd.revision_count === 2 && dd.out_of_scope === true, "second round goes over the included limit → out_of_scope");
ok(f2[1].classification === "new_request", "Arabic 'كمان بوست تاني' classified as new_request");
const en = (await db.query(`select public.hq_classify('Can you also make one more version for stories?') a, public.hq_classify('make the logo bigger') b`)).rows[0];
ok(en.a === "new_request" && en.b === "revision", "English classification matches the app");

await as(A, "authenticated", `update public.deliverables set status = 'in_review' where id = $1`, [d.id]);
await as(null, "anon", `select public.hq_review_respond('tok123', 'approved', 'Omar', 'Perfect')`);
dd = (await as(A, "authenticated", `select * from public.deliverables where id = $1`, [d.id])).rows[0];
ok(dd.status === "approved" && dd.approved_at, "client approval sets approved + timestamp");
const acts = (await as(A, "authenticated", `select type from public.activity where workspace_id = $1 order by created_at`, [w.id])).rows.map(r => r.type);
ok(acts.filter(t => t === "approval.changes").length === 2 && acts.includes("approval.approved"), "ledger entries written for every client decision");

// change orders
await as(A, "authenticated", `insert into public.change_orders (workspace_id, project_id, title, amount, status, token) values ($1, $2, 'Extra post', 1500, 'draft', 'co1')`, [w.id, p.id]);
ok((await as(null, "anon", `select public.hq_co_get('co1') r`)).rows[0].r === null, "draft change orders are not visible to clients");
await as(A, "authenticated", `update public.change_orders set status = 'sent' where token = 'co1'`);
ok((await as(null, "anon", `select public.hq_co_get('co1') r`)).rows[0].r.change_order.amount == 1500, "sent change order visible by token");
await as(null, "anon", `select public.hq_co_respond('co1', 'approved', 'Omar')`);
const co = (await as(A, "authenticated", `select * from public.change_orders where token = 'co1'`)).rows[0];
ok(co.status === "approved" && co.decided_by === "Omar", "client approves change order");
let twice = false;
try { await as(null, "anon", `select public.hq_co_respond('co1', 'declined', 'Omar')`); } catch { twice = true; }
ok(twice, "change order cannot be decided twice");

// invites
const inv = (await as(A, "authenticated", `insert into public.invites (workspace_id, email, role) values ($1, 'b@other.test', 'member') returning token`, [w.id])).rows[0];
let anonCreate = false;
try { await as(null, "anon", `select public.hq_create_workspace('x','EGP','x')`); } catch { anonCreate = true; }
ok(anonCreate, "anon cannot create workspaces");
await as(B, "authenticated", `select public.hq_accept_invite($1, 'Bassem')`, [inv.token]);
const seenNow = (await as(B, "authenticated", `select count(*)::int n from public.deliverables`)).rows[0].n;
ok(seenNow === 1, "after accepting the invite, B sees agency A's data");
let memberDelete = false;
try { const r = await as(B, "authenticated", `delete from public.members where workspace_id = $1 and role = 'owner' returning id`, [w.id]); memberDelete = r.rows.length === 0; } catch { memberDelete = true; }
ok(memberDelete, "a plain member cannot remove the owner");

// v2: pins, portal, publish date
await as(A, "authenticated", "update public.deliverables set status = 'in_review', current_version = 3, publish_date = '2026-11-05' where id = $1", [d.id]);
await as(null, "anon", `select public.hq_review_respond('tok123', 'changes', 'Omar', '', '[{"x":40,"y":120,"text":"كبّر اللوجو"},{"x":10,"y":20,"text":"add another version for stories"}]'::jsonb)`);
const pinned = (await as(A, "authenticated", "select pins, classification from public.feedback where deliverable_id = $1 order by created_at desc limit 1", [d.id])).rows[0];
ok(pinned.pins.length === 2 && Number(pinned.pins[0].y) === 100, "pins saved, coordinates clamped to 0-100");
ok(pinned.classification === "new_request", "pin text is classified too");
await as(A, "authenticated", "update public.deliverables set status = 'in_review' where id = $1", [d.id]);
let emptyBlocked = false;
try { await as(null, "anon", "select public.hq_review_respond('tok123', 'changes', 'Omar', '', '[]'::jsonb)"); } catch { emptyBlocked = true; }
ok(emptyBlocked, "a change request needs a comment or at least one pin");
const ptok = (await as(A, "authenticated", "select portal_token from public.clients where id = $1", [c.id])).rows[0].portal_token;
ok(ptok && ptok.length >= 24, "every client gets a portal token");
const portal = (await as(null, "anon", "select public.hq_portal_get($1) r", [ptok])).rows[0].r;
ok(portal && portal.client.name === "Client X" && portal.items.length === 1 && portal.items[0].publish_date === "2026-11-05", "anon portal lists the client's items with publish dates");
ok(portal.change_orders.length === 1 && portal.change_orders[0].token === "co1", "portal lists non-draft change orders");
ok((await as(null, "anon", "select public.hq_portal_get('nope') r")).rows[0].r === null, "unknown portal token returns null");
let anonList = (await as(null, "anon", "select count(*)::int n from public.clients")).rows[0].n;
ok(anonList === 0, "anon still cannot list clients (portal tokens stay private)");

// v3: chat + channels + webhooks
const proj2 = (await as(A, "authenticated", "insert into public.projects (workspace_id, client_id, name) values ($1, $2, 'Chat project') returning *", [w.id, c.id])).rows[0];
const d2 = (await as(A, "authenticated", "insert into public.deliverables (workspace_id, project_id, title, review_token, status, current_version) values ($1, $2, 'Chat item', 'tok999', 'in_review', 1) returning *", [w.id, proj2.id])).rows[0];
await as(A, "authenticated", "insert into public.messages (workspace_id, thread_type, thread_id, client_id, visibility, author_type, author_name, body) values ($1, 'deliverable', $2, $3, 'internal', 'member', 'Ali', 'internal only: client is picky')", [w.id, d2.id, c.id]);
await as(A, "authenticated", "insert into public.messages (workspace_id, thread_type, thread_id, client_id, visibility, author_type, author_name, body) values ($1, 'deliverable', $2, $3, 'client', 'member', 'Ali', 'Here is v1 for you')", [w.id, d2.id, c.id]);
let shared = (await as(null, "anon", "select public.hq_review_messages('tok999') r")).rows[0].r;
ok(shared.length === 1 && shared[0].body === "Here is v1 for you", "client sees only shared messages, never internal ones");
await as(null, "anon", "select public.hq_review_message('tok999', 'Omar', 'Looks good, can you also make a version for TikTok?')");
const flagged = (await as(A, "authenticated", "select classification, author_type, visibility from public.messages where thread_id = $1 and author_type = 'client'", [d2.id])).rows[0];
ok(flagged.author_type === "client" && flagged.visibility === "client" && flagged.classification === "new_request", "client chat message saved and flagged as extra work");
const actMsg = (await as(A, "authenticated", "select count(*)::int n from public.activity where type = 'message.client' and workspace_id = $1", [w.id])).rows[0].n;
ok(actMsg === 1, "client message lands in the activity feed (and webhooks)");
await as(null, "anon", "select public.hq_portal_message($1, 'Omar', 'When is the next shoot?')", [ptok]);
const pm = (await as(null, "anon", "select public.hq_portal_messages($1) r", [ptok])).rows[0].r;
ok(pm.length === 1 && pm[0].author_type === "client", "portal conversation works by token");
let fake = false;
try { await as(A, "authenticated", "insert into public.messages (workspace_id, thread_type, thread_id, visibility, author_type, author_name, body) values ($1, 'client', $2, 'client', 'client', 'Omar', 'fake')", [w.id, c.id]); } catch { fake = true; }
ok(fake, "team members cannot post messages pretending to be the client");
const seenB = (await as(B, "authenticated", "select count(*)::int n from public.messages where workspace_id = $1", [wb.id])).rows[0].n;
ok(seenB === 0, "RLS: other agencies don't see the conversation");
let directFn = false;
try { await as(null, "anon", "select public.hq_client_message_insert(null::public.clients, 'client', gen_random_uuid(), 'x', 'y', null)"); } catch { directFn = true; }
ok(directFn, "internal message helper is not callable from outside");
let memberHook = false;
try { await as(B, "authenticated", "insert into public.webhooks (workspace_id, url) values ($1, 'https://hooks.example.com/x')", [w.id]); } catch { memberHook = true; }
ok(memberHook, "only admins of a workspace can add webhooks");
let httpHook = false;
try { await as(A, "authenticated", "insert into public.webhooks (workspace_id, url) values ($1, 'http://insecure.example.com')", [w.id]); } catch { httpHook = true; }
ok(httpHook, "webhooks must use https");
await as(A, "authenticated", "update public.clients set preferred_channel = 'email' where id = $1", [c.id]);
let badCh = false;
try { await as(A, "authenticated", "update public.clients set preferred_channel = 'fax' where id = $1", [c.id]); } catch { badCh = true; }
ok(badCh, "client channel limited to supported channels");

// v4: integrations + billing
await db.exec("reset role;");
const conn = (await db.query("insert into public.connections (workspace_id, provider, account_label) values ($1, 'clickup', 'Agency A ClickUp') returning *", [w.id])).rows[0];
await db.query("insert into public.connection_secrets (connection_id, data) values ($1, 'ciphertext')", [conn.id]);
const seeConn = (await as(A, "authenticated", "select count(*)::int n from public.connections where workspace_id = $1", [w.id])).rows[0].n;
ok(seeConn === 1, "members see their workspace's connections");
const seeConnB = (await as(B, "authenticated", "select count(*)::int n from public.connections where workspace_id = $1", [wb.id])).rows[0].n;
ok(seeConnB === 0, "other agencies don't see them");
let secretRead = false;
try { const r = await as(A, "authenticated", "select data from public.connection_secrets"); secretRead = r.rows.length > 0; } catch { secretRead = false; }
ok(!secretRead, "connection secrets are not readable by app users (even admins)");
let anonSecret = false;
try { const r = await as(null, "anon", "select data from public.connection_secrets"); anonSecret = r.rows.length > 0; } catch { anonSecret = false; }
ok(!anonSecret, "connection secrets are not readable anonymously");
let connInsert = false;
try { await as(A, "authenticated", "insert into public.connections (workspace_id, provider) values ($1, 'asana')", [w.id]); connInsert = true; } catch { connInsert = false; }
ok(!connInsert, "connections can only be created by the server");
await db.exec("reset role; insert into public.app_config values ('sync_secret', 's3cret') on conflict (key) do nothing;");
let cfgRead = false;
try { const r = await as(A, "authenticated", "select * from public.app_config"); cfgRead = r.rows.length > 0; } catch { cfgRead = false; }
ok(!cfgRead, "app config (sync secret) is not readable by users");

const invoice1 = (await as(A, "authenticated", "insert into public.invoices (workspace_id, client_id, number, title, amount, currency, lines) values ($1, $2, 'INV-0001', 'Extra post', 1500, 'EGP', '[{\"description\":\"Extra post\",\"qty\":1,\"unit_price\":1500}]') returning *", [w.id, c.id])).rows[0];
ok((await as(null, "anon", "select public.hq_invoice_get($1) r", [invoice1.token])).rows[0].r === null, "draft invoices are not public");
await as(A, "authenticated", "update public.invoices set status = 'sent', sent_at = now() where id = $1", [invoice1.id]);
const pub = (await as(null, "anon", "select public.hq_invoice_get($1) r", [invoice1.token])).rows[0].r;
ok(pub && pub.invoice.number === "INV-0001" && Number(pub.invoice.amount) === 1500, "sent invoice is visible to the client by token");
let dupNum = false;
try { await as(A, "authenticated", "insert into public.invoices (workspace_id, client_id, number) values ($1, $2, 'INV-0001')", [w.id, c.id]); } catch { dupNum = true; }
ok(dupNum, "invoice numbers are unique per workspace");
let negative = false;
try { await as(A, "authenticated", "insert into public.invoices (workspace_id, client_id, number, amount) values ($1, $2, 'INV-0002', -5)", [w.id, c.id]); } catch { negative = true; }
ok(negative, "invoice amounts can't be negative");
await as(A, "authenticated", "update public.deliverables set ad_ref = 'meta:1234', caption = 'New menu!', auto_publish = true where id = $1", [d2.id]);
const dd2 = (await as(A, "authenticated", "select ad_ref, auto_publish from public.deliverables where id = $1", [d2.id])).rows[0];
ok(dd2.ad_ref === "meta:1234" && dd2.auto_publish === true, "deliverables carry ad and publishing settings");

// cascade
await as(A, "authenticated", `delete from public.projects where id = $1`, [p.id]);
const left = (await as(A, "authenticated", `select (select count(*) from public.deliverables where id = $1)::int d, (select count(*) from public.versions where deliverable_id = $1)::int v, (select count(*) from public.feedback where deliverable_id = $1)::int f`, [d.id])).rows[0];
ok(left.d === 0 && left.v === 0 && left.f === 0, "deleting a project cascades to deliverables, versions, feedback");
console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
