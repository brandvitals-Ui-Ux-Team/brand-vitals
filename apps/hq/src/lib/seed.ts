// Demo workspace with fictional sample data, so every screen has something real to show.
import { token, uid } from "./backend";
import type { Activity, ChangeOrder, Client, Deliverable, Feedback, Member, Message, Project, ScopeItem, SessionUser, Task, Tables, TableName, Version, Workspace } from "./types";
import { demoDesign } from "./designs";

type DB = { [K in TableName]: Tables[K][] };
const ago = (days: number, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

// Simple branded placeholder artwork for sample versions.
function art(title: string, hue: number, sub: string, v: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 22%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 75% 45%)"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g)"/><circle cx="${780 - v * 40}" cy="${300 + v * 30}" r="${220 + v * 20}" fill="hsl(${(hue + 80) % 360} 80% 60% / .35)"/><text x="90" y="760" font-family="Arial, sans-serif" font-size="92" font-weight="700" fill="#fff">${title}</text><text x="90" y="850" font-family="Arial, sans-serif" font-size="44" fill="rgba(255,255,255,.75)">${sub}</text><text x="90" y="140" font-family="monospace" font-size="34" fill="rgba(255,255,255,.6)">v${v}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export function seed(u: SessionUser): DB {
  const W = uid();
  const ws: Workspace = { id: W, name: "Brand Vitals (demo)", currency: "EGP", owner_id: u.id, created_at: ago(60),
    wa_template_en: "Hi {client}, {item} is ready for your review: {link}",
    wa_template_ar: "أهلًا {client}، {item} جاهز للمراجعة: {link}", remind_after_days: 2 };

  const me: Member = { id: uid(), workspace_id: W, user_id: u.id, role: "owner", name: u.name, email: u.email, created_at: ago(60) };
  const team: Member[] = [
    me,
    { id: uid(), workspace_id: W, user_id: "demo-mona", role: "admin", name: "Mona Adel", email: "mona@example.com", created_at: ago(55) },
    { id: uid(), workspace_id: W, user_id: "demo-karim", role: "member", name: "Karim Fathy", email: "karim@example.com", created_at: ago(50) },
    { id: uid(), workspace_id: W, user_id: "demo-salma", role: "member", name: "Salma Nabil", email: "salma@example.com", created_at: ago(40) }
  ];
  const [, mona, karim, salma] = team;

  const clients: Client[] = [
    { id: uid(), workspace_id: W, name: "Nile Roastery", contact_name: "Omar Hassan", phone: "201000000001", email: "omar@nileroastery.example", lang: "ar", notes: "Specialty coffee, 4 branches in Cairo.", portal_token: token(), preferred_channel: "whatsapp", chat_webhook: "", created_at: ago(58) },
    { id: uid(), workspace_id: W, name: "Atlas Residences", contact_name: "Faisal Al-Otaibi", phone: "966500000002", email: "faisal@atlas.example", lang: "ar", notes: "Riyadh luxury development launch.", portal_token: token(), preferred_channel: "email", chat_webhook: "", created_at: ago(45) },
    { id: uid(), workspace_id: W, name: "Glow Lab Skincare", contact_name: "Nour Samir", phone: "201000000003", email: "nour@glowlab.example", lang: "en", notes: "D2C skincare, Shopify store.", portal_token: token(), preferred_channel: "slack", chat_webhook: "", created_at: ago(30) }
  ];
  const [nile, atlas, glow] = clients;

  const projects: Project[] = [
    { id: uid(), workspace_id: W, client_id: nile.id, name: "Monthly social retainer", status: "active", color: "#2EE6A6", start_date: ago(58).slice(0, 10), due_date: null, budget: 45000, sync_targets: {}, created_at: ago(58) },
    { id: uid(), workspace_id: W, client_id: atlas.id, name: "Launch campaign", status: "active", color: "#7C8CFF", start_date: ago(45).slice(0, 10), due_date: ahead(21), budget: 180000, sync_targets: {}, created_at: ago(45) },
    { id: uid(), workspace_id: W, client_id: glow.id, name: "Ramadan performance push", status: "active", color: "#FFB547", start_date: ago(20).slice(0, 10), due_date: ahead(10), budget: 60000, sync_targets: {}, created_at: ago(20) }
  ];
  const [pNile, pAtlas, pGlow] = projects;

  const scope: ScopeItem[] = [
    { id: uid(), workspace_id: W, project_id: pNile.id, title: "Social posts", kind: "post", quantity: 12, period: "month", revisions_included: 2, extra_price: 1500, created_at: ago(58) },
    { id: uid(), workspace_id: W, project_id: pNile.id, title: "Reels", kind: "video", quantity: 4, period: "month", revisions_included: 2, extra_price: 4000, created_at: ago(58) },
    { id: uid(), workspace_id: W, project_id: pAtlas.id, title: "Key visuals", kind: "design", quantity: 3, period: "project", revisions_included: 3, extra_price: 6000, created_at: ago(45) },
    { id: uid(), workspace_id: W, project_id: pAtlas.id, title: "Launch film", kind: "video", quantity: 1, period: "project", revisions_included: 2, extra_price: 15000, created_at: ago(45) },
    { id: uid(), workspace_id: W, project_id: pGlow.id, title: "Ad creatives", kind: "design", quantity: 10, period: "project", revisions_included: 1, extra_price: 1200, created_at: ago(20) },
    { id: uid(), workspace_id: W, project_id: pGlow.id, title: "Landing page", kind: "web", quantity: 1, period: "project", revisions_included: 2, extra_price: 8000, created_at: ago(20) }
  ];
  const [sPosts, sReels, sKV, sFilm, sAds, sLanding] = scope;

  const D = (p: Project, s: ScopeItem, title: string, status: Deliverable["status"], v: number, rev: number, sentDaysAgo: number | null, extra: Partial<Deliverable> = {}): Deliverable => ({
    id: uid(), workspace_id: W, project_id: p.id, scope_item_id: s.id, title, kind: s.kind, status, due_date: ahead(3 + Math.round(Math.random() * 10)),
    assignee_id: [mona.id, karim.id, salma.id][Math.floor(Math.random() * 3)], review_token: token(), current_version: v, revision_count: rev,
    out_of_scope: rev > s.revisions_included, sent_at: sentDaysAgo == null ? null : ago(sentDaysAgo, 3), approved_at: status === "approved" ? ago(Math.max(0, (sentDaysAgo ?? 1) - 1)) : null,
    publish_date: null, reminded_at: null, ad_ref: "", caption: "", auto_publish: false, publish_targets: [], published_at: null, publish_error: "", created_at: ago((sentDaysAgo ?? 1) + 3), ...extra
  });

  const deliverables: Deliverable[] = [
    D(pNile, sPosts, "New seasonal menu post", "in_review", 1, 0, 2, { publish_date: ahead(2) }),
    D(pNile, sPosts, "Cold brew launch carousel", "changes", 2, 1, 4, { publish_date: ahead(4) }),
    D(pNile, sPosts, "Barista story post", "approved", 1, 0, 6, { publish_date: ahead(-2) }),
    D(pNile, sReels, "Latte art reel", "in_review", 3, 2, 1, { publish_date: ahead(6) }),
    D(pNile, sPosts, "Weekend offer story", "changes", 3, 3, 3, { publish_date: ahead(3) }),
    D(pAtlas, sKV, "Key visual · Sunset terrace", "approved", 2, 1, 12),
    D(pAtlas, sKV, "Key visual · Family courtyard", "in_review", 2, 1, 5),
    D(pAtlas, sFilm, "Launch film · rough cut", "changes", 1, 1, 2),
    D(pGlow, sAds, "Vitamin C serum ad · UGC", "approved", 1, 0, 8),
    D(pGlow, sAds, "Ramadan bundle static", "in_review", 1, 0, 0),
    D(pGlow, sLanding, "Ramadan landing page", "draft", 0, 0, null),
    D(pNile, sPosts, "Customer of the week", "draft", 0, 0, null, { publish_date: ahead(9) }),
    D(pNile, sPosts, "Behind the roast", "draft", 0, 0, null, { publish_date: ahead(12) }),
    D(pNile, sReels, "Pour-over tutorial reel", "draft", 0, 0, null, { publish_date: ahead(15) }),
    D(pGlow, sAds, "Eid gift set static", "draft", 0, 0, null, { publish_date: ahead(8) })
  ];

  const hues = [160, 230, 30, 200, 300, 20, 140, 260, 340, 45, 190];
  const versions: Version[] = [];
  deliverables.forEach((d, i) => {
    for (let n = 1; n <= d.current_version; n++)
      versions.push({ id: uid(), workspace_id: W, deliverable_id: d.id, number: n, file_url: d.kind === "web" ? "" : demoDesign(d.title, n) || art(d.title.split("·")[0].trim().slice(0, 22), hues[i], d.kind.toUpperCase(), n),
        file_name: d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + `-v${n}.svg`, file_type: "image/svg+xml", link_url: "", note: n === 1 ? "First version" : "Updated per feedback", created_by: [mona.name, karim.name, salma.name][i % 3], created_at: ago(Math.max(0, 6 - n)) });
  });

  const fb = (d: Deliverable, v: number, kind: Feedback["kind"], author: string, comment: string, cls: Feedback["classification"], days: number, resolved = false, pins: Feedback["pins"] = []): Feedback =>
    ({ id: uid(), workspace_id: W, deliverable_id: d.id, version_number: v, kind, author_name: author, comment, classification: cls, resolved, pins, created_at: ago(days) });
  const feedback: Feedback[] = [
    fb(deliverables[1], 1, "changes", "Omar Hassan", "كبّر اللوجو شوية وخلّي اللون أغمق", "revision", 3, true),
    fb(deliverables[1], 2, "changes", "Omar Hassan", "Can you also make a version for stories? And one more for the new branch.", "new_request", 1),
    fb(deliverables[2], 1, "approved", "Omar Hassan", "Perfect 👌", null, 5, true),
    fb(deliverables[4], 1, "changes", "Omar Hassan", "غيّر الخط", "revision", 6, true),
    fb(deliverables[4], 2, "changes", "Omar Hassan", "Make the price bigger", "revision", 4, true),
    fb(deliverables[4], 3, "changes", "Omar Hassan", "عايزين كمان بوست تاني للعرض بتاع الجمعة", "new_request", 1),
    fb(deliverables[5], 1, "changes", "Faisal Al-Otaibi", "Warmer light please", "revision", 14, true),
    fb(deliverables[5], 2, "approved", "Faisal Al-Otaibi", "Approved. Beautiful.", null, 11, true),
    fb(deliverables[7], 1, "changes", "Faisal Al-Otaibi", "Shorten the intro and replace the music", "revision", 1),
    fb(deliverables[6], 1, "changes", "Faisal Al-Otaibi", "", "revision", 6, true, [{ x: 68, y: 30, text: "Warmer sky here" }, { x: 22, y: 74, text: "Make the family smaller, more space" }]),
    fb(deliverables[8], 1, "approved", "Nour Samir", "", null, 7, true)
  ];

  const changeOrders: ChangeOrder[] = [
    { id: uid(), workspace_id: W, project_id: pNile.id, deliverable_id: deliverables[4].id, feedback_id: feedback[5].id, title: "Extra Friday offer post", description: "Additional post requested outside the 12 posts in this month's scope.", amount: 1500, currency: "EGP", status: "sent", token: token(), decided_by: "", decided_at: null, created_at: ago(1) },
    { id: uid(), workspace_id: W, project_id: pAtlas.id, deliverable_id: null, feedback_id: null, title: "Arabic voice-over version of launch film", description: "Second language version with professional Arabic voice-over.", amount: 12000, currency: "EGP", status: "approved", token: token(), decided_by: "Faisal Al-Otaibi", decided_at: ago(9), created_at: ago(10) },
    { id: uid(), workspace_id: W, project_id: pGlow.id, deliverable_id: null, feedback_id: null, title: "4 extra story sizes", description: "Story (9:16) adaptations of four approved ad creatives.", amount: 4800, currency: "EGP", status: "approved", token: token(), decided_by: "Nour Samir", decided_at: ago(3), created_at: ago(5) }
  ];

  const T = (title: string, status: Task["status"], priority: Task["priority"], who: Member, p: Project | null, due: number | null, pos: number, dl: Deliverable | null = null): Task =>
    ({ id: uid(), workspace_id: W, project_id: p ? p.id : null, deliverable_id: dl ? dl.id : null, title, description: "", status, priority, assignee_id: who.id, due_date: due == null ? null : ahead(due), position: pos, created_at: ago(4) });
  const tasks: Task[] = [
    T("Apply Omar's logo + color feedback", "doing", "high", mona, pNile, 1, 1, deliverables[1]),
    T("Plan next month content calendar", "todo", "medium", me, pNile, 6, 2),
    T("Edit launch film: shorter intro, new music", "doing", "urgent", karim, pAtlas, 2, 1, deliverables[7]),
    T("Book Riyadh shoot crew", "todo", "high", salma, pAtlas, 5, 2),
    T("Build Ramadan landing page", "doing", "high", salma, pGlow, 4, 1, deliverables[10]),
    T("Set up Meta CAPI for Glow Lab", "review", "medium", me, pGlow, 2, 1),
    T("Weekly performance report", "todo", "low", mona, pGlow, 3, 3),
    T("Export approved key visual for print", "done", "medium", karim, pAtlas, -1, 1),
    T("Send Ramadan bundle static to Nour", "done", "medium", salma, pGlow, -1, 2)
  ];

  const A = (type: string, p: Project, entity: string | null, actor: string, summary: string, days: number): Activity =>
    ({ id: uid(), workspace_id: W, type, project_id: p.id, entity_id: entity, actor, summary, data: {}, created_at: ago(days) });
  const activity: Activity[] = [
    A("approval.approved", pAtlas, deliverables[5].id, "Faisal Al-Otaibi", "approved “Key visual · Sunset terrace” v2", 11),
    A("change_order.approved", pAtlas, changeOrders[1].id, "Faisal Al-Otaibi", "approved change order “Arabic voice-over version of launch film”", 9),
    A("approval.approved", pGlow, deliverables[8].id, "Nour Samir", "approved “Vitamin C serum ad · UGC” v1", 7),
    A("approval.approved", pNile, deliverables[2].id, "Omar Hassan", "approved “Barista story post” v1", 5),
    A("change_order.approved", pGlow, changeOrders[2].id, "Nour Samir", "approved change order “4 extra story sizes”", 3),
    A("approval.changes", pNile, deliverables[1].id, "Omar Hassan", "requested changes on “Cold brew launch carousel” v2", 1),
    A("approval.changes", pNile, deliverables[4].id, "Omar Hassan", "requested changes on “Weekend offer story” v3", 1),
    A("approval.changes", pAtlas, deliverables[7].id, "Faisal Al-Otaibi", "requested changes on “Launch film · rough cut” v1", 1),
    A("review.sent", pGlow, deliverables[9].id, salma.name, "sent “Ramadan bundle static” v1 for review", 0)
  ];

  const M = (thread_type: Message["thread_type"], thread_id: string, client: Client, visibility: Message["visibility"], who: Member | null, body: string, hours: number, classification: Message["classification"] = null): Message =>
    ({ id: uid(), workspace_id: W, thread_type, thread_id, client_id: client.id, visibility, author_type: who ? "member" : "client", author_member_id: who ? who.id : null,
      author_name: who ? who.name : client.contact_name, body, attachments: [], mentions: [], classification, created_at: ago(0, hours) });
  const messages: Message[] = [
    M("client", nile.id, nile, "client", mona, "صباح الخير يا عمر 👋 بوستات الأسبوع ده كلها في البوابة.", 30),
    M("client", nile.id, nile, "client", null, "تمام، هبص عليهم النهارده. ممكن كمان نعمل بوست للفرع الجديد في التجمع؟", 26, "new_request"),
    M("client", nile.id, nile, "internal", karim, "@Mona ده طلب جديد، مش في الـ 12 بوست. هعمله extra work.", 25),
    M("deliverable", deliverables[7].id, atlas, "internal", karim, "Faisal wants a shorter intro. I'll cut the drone shot to 4s.", 20),
    M("deliverable", deliverables[7].id, atlas, "client", karim, "Hi Faisal, v2 with the shorter intro and new music will be ready tomorrow.", 19),
    M("project", pGlow.id, glow, "internal", salma, "Landing page copy is waiting on Nour's product list. Reminded her on Slack.", 8)
  ];
  return { workspaces: [ws], members: team, invites: [], clients, projects, scope_items: scope, deliverables, versions, feedback, change_orders: changeOrders, tasks, comments: [], activity, messages, webhooks: [], connections: [], external_links: [],
    invoices: [
      { id: uid(), workspace_id: W, client_id: atlas.id, project_id: pAtlas.id, change_order_id: changeOrders[1].id, number: "INV-0001", title: changeOrders[1].title,
        lines: [{ description: changeOrders[1].title, qty: 1, unit_price: 12000 }], amount: 12000, currency: "EGP", status: "paid", provider: "manual", payment_url: "", provider_ref: "",
        token: token(), due_date: null, sent_at: ago(8), paid_at: ago(4), created_at: ago(8) },
      { id: uid(), workspace_id: W, client_id: glow.id, project_id: pGlow.id, change_order_id: changeOrders[2].id, number: "INV-0002", title: changeOrders[2].title,
        lines: [{ description: changeOrders[2].title, qty: 1, unit_price: 4800 }], amount: 4800, currency: "EGP", status: "sent", provider: "", payment_url: "", provider_ref: "",
        token: token(), due_date: ahead(7), sent_at: ago(2), paid_at: null, created_at: ago(2) }
    ] };
}
