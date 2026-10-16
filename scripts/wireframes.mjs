// Section 6 of the UI fix spec: proof sections built as wireframes, hidden unless the URL has ?wireframe=1.
// Brackets only, never invented names, numbers or results. Re-runnable: skips pages that already have a block.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const t = (en, ar, tag = "span", cls = "") => `<${tag}${cls ? ` class="${cls}"` : ""} data-en="${en}" data-ar="${ar}">${en}</${tag}>`;
const chip = `<span class="wf-chip">WIREFRAME</span>`;
const slot = (ratio, en, ar) => `<figure class="wf-media" style="aspect-ratio:${ratio}">${chip}${t(en, ar, "figcaption")}</figure>`;
const section = (id, eyebrowEn, eyebrowAr, h2En, h2Ar, body) => `
    <!-- WIREFRAME: ${id} (shown only with ?wireframe=1) -->
    <section class="section wf-section" id="${id}" hidden data-wireframe>
      <div class="container">
        <div class="section-head">${chip}
          ${t(eyebrowEn, eyebrowAr, "p", "eyebrow")}
          ${t(h2En, h2Ar, "h2")}
        </div>
${body}
      </div>
    </section>
`;
const ctx = `<div class="wf-ctx" hidden data-wireframe>${chip}${t("[Period] · [Monthly spend range] · [What changed]", "[الفترة] · [نطاق الصرف الشهري] · [إيه اللي اتغيّر]")}</div>`;

function after(s, marker, html) { const i = s.indexOf(marker); if (i < 0) throw new Error("marker " + marker); const j = s.indexOf("</section>", i) + "</section>".length; return s.slice(0, j) + "\n" + html + s.slice(j); }
function before(s, marker, html) { const i = s.indexOf(marker); if (i < 0) throw new Error("marker " + marker); const j = s.lastIndexOf("<section", i); const k = s.lastIndexOf("\n", j); return s.slice(0, k) + "\n" + html + s.slice(k); }

const tiles = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("\n");
const JOBS = {
  "frames.html": s => after(s, 'data-en="01 · What we produce"', section("wf-frames-work", "Selected work", "من شغلنا", "[Selected work headline]", "[عنوان الأعمال المختارة]",
    `        <div class="wf-grid wf-grid--3">\n${tiles(6, i => `          <article class="wf-card">${slot(["9 / 16", "1 / 1", "16 / 9", "4 / 5", "9 / 16", "1 / 1"][i], "[Thumbnail · " + ["9:16", "1:1", "16:9", "4:5", "9:16", "1:1"][i] + "]", "[صورة مصغّرة · " + ["9:16", "1:1", "16:9", "4:5", "9:16", "1:1"][i] + "]")}${t("[Brand]", "[البراند]", "b")}${t("[Format]", "[الصيغة]", "span", "wf-line")}${t("[What it did]", "[إيه اللي عمله]", "span", "wf-line")}${i === 5 ? t("Frames Lab · concept", "Frames Lab · فكرة", "span", "wf-tag") : ""}</article>`)}\n        </div>`)),
  "stage.html": s => after(s, 'data-en="02 · Events we run"', section("wf-stage-events", "Events we've run", "إيفنتات عملناها", "[Events headline]", "[عنوان الإيفنتات]",
    `        <div class="wf-grid wf-grid--3">\n${tiles(3, () => `          <article class="wf-card">${slot("16 / 9", "[Event photo]", "[صورة الإيفنت]")}${t("[Event type]", "[نوع الإيفنت]", "b")}${t("[Guests] · [City]", "[الضيوف] · [المدينة]", "span", "wf-line")}${t("[Our scope]", "[دورنا]", "span", "wf-line")}${t("[One line on the outcome]", "[سطر عن النتيجة]", "span", "wf-line")}</article>`)}\n        </div>`)),
  "web.html": s => after(s, 'data-en="01 · Selected work"', section("wf-web-bv", "Selected work", "من شغلنا", "brandvitals.io", "brandvitals.io",
    `        <article class="wf-card wf-card--wide">${slot("16 / 9", "[Screens]", "[الشاشات]")}${t("[Pages · languages · apps]", "[الصفحات · اللغات · التطبيقات]", "b")}${t("[Timeline]", "[المدة]", "span", "wf-line")}</article>`)),
  "crew.html": s => after(s, 'data-en="02 · How it works"', section("wf-crew-members", "Member spotlights", "أعضاء متراجعين", "[Member spotlight headline]", "[عنوان الأعضاء]",
    `        <div class="wf-grid wf-grid--3">\n${tiles(3, () => `          <article class="wf-card">${slot("1 / 1", "[Photo]", "[صورة]")}${t("[Name]", "[الاسم]", "b")}${t("[Craft]", "[التخصص]", "span", "wf-line")}${t("Passed: portfolio · test · interview", "عدّى: البورتفوليو · الاختبار · المقابلة", "span", "wf-line")}</article>`)}\n        </div>`)),
  "go.html": s => before(s, 'data-en="03 · Get started"', section("wf-go-quote", "From an agency", "من وكالة", "[Agency quote]", "[رأي وكالة]",
    `        <blockquote class="wf-card wf-card--wide wf-quote">${t("[Quote]", "[الاقتباس]", "p")}${t("[Agency name] · [Role]", "[اسم الوكالة] · [الدور]", "b")}${t("[Approvals sent]", "[عدد الموافقات المرسلة]", "span", "wf-line")}</blockquote>`))
};

let n = 0;
for (const [f, fn] of Object.entries(JOBS)) {
  const p = path.join(ROOT, f); let s = fs.readFileSync(p, "utf8");
  if (s.includes("data-wireframe")) continue;
  s = fn(s); fs.writeFileSync(p, s); n++;
}
// context under every result number: home and work cards, and the metrics on each case page
for (const f of fs.readdirSync(ROOT).filter(x => x === "index.html" || x === "work.html" || /^case-.*\.html$/.test(x))) {
  const p = path.join(ROOT, f); let s = fs.readFileSync(p, "utf8");
  if (s.includes('class="wf-ctx"')) continue;
  s = s.replace(/(<p class="result-card__client"[^>]*>[^<]*<\/p>)/g, `$1\n            ${ctx}`);
  s = s.replace(/(<div class="case-card__body">)/g, `$1\n              ${ctx}`);
  s = s.replace(/(<div class="case-metrics"[^>]*>[\s\S]*?\n(\s*)<\/div>)/, `$1\n$2${ctx}`);
  fs.writeFileSync(p, s); n++;
}
console.log("pages with wireframes:", n);
