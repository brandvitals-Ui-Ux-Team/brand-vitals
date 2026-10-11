// Demo artwork for the sample workspace: finished-looking social posts, stories and
// key visuals for the three sample clients, drawn as SVG so the demo needs no image files.
// Each design takes the version number, so v2/v3 really differ from v1.

const SANS = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const AR = "'Segoe UI', Tahoma, Arial, sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
interface TOpts { font?: string; weight?: number | string; anchor?: "start" | "middle" | "end"; ls?: number; italic?: boolean; rtl?: boolean; opacity?: number }
function t(x: number, y: number, size: number, fill: string, text: string, o: TOpts = {}) {
  return `<text x="${x}" y="${y}" font-family="${o.font || SANS}" font-size="${size}" font-weight="${o.weight || 400}" fill="${fill}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.ls ? ` letter-spacing="${o.ls}"` : ""}${o.italic ? ' font-style="italic"' : ""}${o.rtl ? ' direction="rtl"' : ""}${o.opacity != null ? ` opacity="${o.opacity}"` : ""}>${esc(text)}</text>`;
}
const svg = (w: number, h: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
const bean = (x: number, y: number, r: number, c: string) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="22" ry="15" fill="${c}"/><path d="M-18 0 Q0 -6 18 0" stroke="#1A0F0A" stroke-width="3" fill="none" opacity=".55"/></g>`;
const leaf = (x: number, y: number, r: number, c: string, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C 30 -40, 90 -40, 120 0 C 90 40, 30 40, 0 0 Z" fill="${c}"/><path d="M0 0 L118 0" stroke="#00000033" stroke-width="3"/></g>`;

// ── Nile Roastery ──────────────────────────────────────────────
const NILE = { brown: "#2B1A12", cream: "#F4E8D6", terra: "#C8623A", gold: "#E2B04A", milk: "#F7EFE4" };
const nileLogo = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><circle r="26" fill="none" stroke="${c}" stroke-width="4"/><path d="M-12 8 Q0 -22 12 8" stroke="${c}" stroke-width="4" fill="none"/>${t(42, 10, 28, c, "NILE ROASTERY", { weight: 700, ls: 6 })}</g>`;
const latteTop = (cx: number, cy: number, r: number, art: "heart" | "rosetta" | "tulip") => {
  const crema = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#B9773F"/><circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="#C98A50"/>`;
  const s = r / 200;
  const draw = art === "heart"
    ? `<path transform="translate(${cx} ${cy}) scale(${s})" d="M0 120 C -160 10, -120 -120, 0 -50 C 120 -120, 160 10, 0 120 Z" fill="${NILE.milk}"/>`
    : art === "tulip"
      ? `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${NILE.milk}"><path d="M0 -120 C 70 -120, 90 -60, 0 -40 C -90 -60, -70 -120, 0 -120Z"/><path d="M0 -40 C 100 -40, 110 30, 0 40 C -110 30, -100 -40, 0 -40Z"/><path d="M0 40 C 120 40, 130 120, 0 125 C -130 120, -120 40, 0 40Z"/><rect x="-5" y="-140" width="10" height="280" rx="5"/></g>`
      : `<g transform="translate(${cx} ${cy}) scale(${s})" fill="${NILE.milk}">${[-110, -70, -30, 10, 50, 90].map((y, i) => `<path d="M0 ${y} C ${130 - i * 12} ${y - 30}, ${130 - i * 12} ${y + 40}, 0 ${y + 28} C ${-130 + i * 12} ${y + 40}, ${-130 + i * 12} ${y - 30}, 0 ${y}Z"/>`).join("")}<rect x="-5" y="-150" width="10" height="300" rx="5"/></g>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r * 1.45}" fill="#FFFFFF"/><circle cx="${cx}" cy="${cy}" r="${r * 1.45}" fill="none" stroke="#00000014" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${r * 1.12}" fill="#FFFFFF" stroke="#0000001A" stroke-width="6"/>${crema}${draw}`;
};

function seasonalMenu(v: number) {
  const bg = v > 1 ? "#EFDCC2" : NILE.cream;
  const items: [string, string, string][] = [["Pumpkin Spice Latte", "لاتيه اليقطين", "85"], ["Date & Tahini Cold Brew", "كولد برو بالتمر والطحينة", "95"], ["Cardamom Cortado", "كورتادو بالهيل", "70"]];
  return svg(1080, 1080, `<rect width="1080" height="1080" fill="${bg}"/>
  ${leaf(860, 120, 30, "#C8623A", 1.1)}${leaf(930, 260, 120, "#E2B04A", 0.9)}${leaf(80, 980, -40, "#C8623A", 0.9)}${bean(760, 520, 30, NILE.brown)}${bean(980, 600, -20, NILE.brown)}${bean(700, 980, 70, NILE.brown)}
  ${latteTop(800, 760, 150, "heart")}
  ${nileLogo(96, 110, NILE.brown)}
  ${t(90, 300, 120, NILE.brown, "Autumn", { font: SERIF, weight: 700 })}${t(90, 420, 120, NILE.terra, "Menu", { font: SERIF, weight: 700, italic: true })}
  ${t(560, 420, 56, NILE.brown, "منيو الخريف", { font: AR, weight: 700, anchor: "end", rtl: true, opacity: 0.0 })}
  ${t(90, 490, 46, NILE.brown, "منيو الخريف وصل", { font: AR, weight: 700 })}
  ${items.map(([en, ar, p], i) => `<g transform="translate(90 ${590 + i * 120})"><rect width="470" height="96" rx="20" fill="#FFFFFF" opacity=".75"/>${t(28, 44, 30, NILE.brown, en, { weight: 700 })}${t(28, 80, 24, "#6B4A36", ar, { font: AR })}${t(446, 62, 34, NILE.terra, p, { weight: 800, anchor: "end" })}</g>`).join("")}
  ${t(90, 1000, 24, "#6B4A36", "Prices in EGP · Available all season", { ls: 1 })}`);
}

function coldBrew(v: number) {
  const glass = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 L240 0 L215 520 Q213 560 175 560 L65 560 Q27 560 25 520 Z" fill="#FFFFFF22" stroke="#FFFFFF66" stroke-width="5"/><path d="M14 150 L226 150 L213 520 Q211 550 175 550 L65 550 Q29 550 27 520 Z" fill="url(#cb)"/><rect x="40" y="170" width="70" height="70" rx="14" fill="#FFFFFF55" transform="rotate(-12 75 205)"/><rect x="120" y="230" width="66" height="66" rx="14" fill="#FFFFFF44" transform="rotate(14 153 263)"/><rect x="70" y="300" width="62" height="62" rx="14" fill="#FFFFFF33" transform="rotate(6 101 331)"/><rect x="150" y="-90" width="16" height="420" rx="8" fill="${NILE.terra}" transform="rotate(10 158 120)"/></g>`;
  return svg(1080, 1080, `<defs><linearGradient id="cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4A2B"/><stop offset="1" stop-color="#2B1A12"/></linearGradient><radialGradient id="glow" cx=".7" cy=".55" r=".6"><stop offset="0" stop-color="#5A3622"/><stop offset="1" stop-color="${NILE.brown}"/></radialGradient></defs>
  <rect width="1080" height="1080" fill="url(#glow)"/>
  ${glass(640, 360, 1.05)}${bean(560, 960, 20, "#4A2E1F")}${bean(980, 300, -30, "#4A2E1F")}
  ${nileLogo(96, 110, NILE.cream)}
  ${t(90, 330, 110, NILE.cream, "Cold Brew", { font: SERIF, weight: 700 })}${t(90, 450, 110, NILE.gold, v > 1 ? "is here." : "is back.", { font: SERIF, weight: 700, italic: true })}
  ${t(90, 530, 48, NILE.cream, "الكولد برو رجع", { font: AR, weight: 700 })}
  ${t(90, 620, 30, "#E8D5C0", "Steeped slow for 18 hours.", {})}${t(90, 662, 30, "#E8D5C0", "Smooth, bold, never bitter.", {})}
  ${v > 1 ? `<g transform="translate(90 720)"><rect width="190" height="64" rx="32" fill="${NILE.gold}"/>${t(95, 43, 30, NILE.brown, "NEW · 75", { weight: 800, anchor: "middle" })}</g>` : ""}
  <g transform="translate(90 980)">${[0, 1, 2, 3, 4].map(i => `<circle cx="${i * 30}" cy="0" r="8" fill="${i === 0 ? NILE.gold : "#FFFFFF55"}"/>`).join("")}</g>${t(990, 990, 26, "#E8D5C0", "1 / 5  →", { anchor: "end" })}`);
}

function baristaStory() {
  return svg(1080, 1350, `<rect width="1080" height="1350" fill="${NILE.terra}"/><circle cx="540" cy="700" r="380" fill="#B4532E"/>
  <g transform="translate(540 760)"><path d="M-260 420 Q-250 120 0 100 Q250 120 260 420 Z" fill="${NILE.brown}"/><path d="M-120 140 L-90 420 L90 420 L120 140 Q0 180 -120 140Z" fill="${NILE.cream}"/><rect x="-60" y="220" width="120" height="70" rx="10" fill="${NILE.terra}"/>${t(0, 266, 26, NILE.cream, "NILE", { weight: 800, anchor: "middle", ls: 4 })}<circle cx="0" cy="-60" r="125" fill="#8A5A3C"/><path d="M-125 -80 Q-110 -200 0 -195 Q120 -200 128 -70 Q60 -130 -125 -80Z" fill="#1A0F0A"/></g>
  ${nileLogo(96, 120, NILE.cream)}
  ${t(90, 270, 40, NILE.gold, "MEET THE BARISTA", { weight: 800, ls: 8 })}
  ${t(90, 360, 76, NILE.cream, "“Every cup starts", { font: SERIF, weight: 700 })}${t(90, 450, 76, NILE.cream, "with a story.”", { font: SERIF, weight: 700, italic: true })}
  ${t(990, 530, 44, NILE.cream, "كل فنجان وراه حكاية", { font: AR, weight: 700, anchor: "end", rtl: true })}
  <rect x="90" y="1210" width="900" height="80" rx="40" fill="${NILE.brown}"/>${t(540, 1262, 30, NILE.cream, "Youssef · Head barista · 8 years on the bar", { anchor: "middle" })}`);
}

function latteReel(v: number) {
  const art = v >= 3 ? "rosetta" : v === 2 ? "tulip" : "heart";
  const accent = v >= 2 ? NILE.gold : NILE.cream;
  return svg(1080, 1350, `<rect width="1080" height="1350" fill="#1F130D"/><rect x="0" y="0" width="1080" height="1350" fill="url(#vg)"/><defs><radialGradient id="vg" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#4A2E1F"/><stop offset="1" stop-color="#1F130D"/></radialGradient></defs>
  ${latteTop(540, 760, 230, art)}
  ${bean(140, 1180, 30, "#5A3622")}${bean(940, 1220, -40, "#5A3622")}${bean(900, 420, 60, "#5A3622")}
  ${nileLogo(96, 120, NILE.cream)}
  <g transform="translate(900 110)"><rect x="-60" y="-34" width="150" height="56" rx="28" fill="#FFFFFF22"/>${t(15, 4, 26, NILE.cream, "▶ REEL", { weight: 700, anchor: "middle" })}</g>
  ${t(90, 290, 104, accent, "Latte Art 101", { font: SERIF, weight: 700 })}
  ${t(90, 370, 46, NILE.cream, art === "heart" ? "The heart, in 30 seconds" : art === "tulip" ? "The tulip, step by step" : "The rosetta, step by step", {})}
  ${t(990, 440, 42, "#E8D5C0", "فن اللاتيه في ٣٠ ثانية", { font: AR, weight: 700, anchor: "end", rtl: true })}
  <circle cx="540" cy="760" r="70" fill="#00000055"/><path d="M520 725 L575 760 L520 795Z" fill="#FFFFFF"/>`);
}

function weekendOffer(v: number) {
  const time = v >= 3 ? "Fri – Sat · 8 AM to 12 PM" : "Every Friday & Saturday";
  const cup = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><path d="M0 0 L180 0 L160 230 Q158 250 138 250 L42 250 Q22 250 20 230Z" fill="${c}"/><rect x="-10" y="-30" width="200" height="40" rx="12" fill="${NILE.brown}"/><rect x="20" y="80" width="140" height="70" rx="8" fill="#FFFFFF"/>${t(90, 128, 30, NILE.brown, "NILE", { weight: 800, anchor: "middle", ls: 4 })}</g>`;
  return svg(1080, 1350, `<rect width="1080" height="1350" fill="${NILE.gold}"/><circle cx="900" cy="250" r="260" fill="#EDC067"/><circle cx="120" cy="1200" r="220" fill="#D9A23A"/>
  ${nileLogo(96, 120, NILE.brown)}
  ${t(90, 300, 44, NILE.brown, "WEEKEND OFFER", { weight: 800, ls: 8 })}
  ${t(70, 600, 300, NILE.brown, "2", { font: SERIF, weight: 700 })}${t(270, 600, 120, NILE.brown, "for", { font: SERIF, weight: 700, italic: true })}${t(490, 600, 300, NILE.terra, "1", { font: SERIF, weight: 700 })}
  ${t(990, 700, 64, NILE.brown, "اشتري واحد والتاني علينا", { font: AR, weight: 700, anchor: "end", rtl: true })}
  ${cup(330, 860, NILE.cream)}${cup(570, 860, NILE.terra)}
  <rect x="90" y="1210" width="900" height="80" rx="40" fill="${NILE.brown}"/>${t(540, 1262, 32, NILE.gold, time, { weight: 700, anchor: "middle" })}`);
}

// ── Atlas Residences ───────────────────────────────────────────
const ATLAS = { navy: "#0E2233", sand: "#E9DCC6", gold: "#C9A45C" };
const atlasLogo = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><path d="M0 30 L22 -12 L44 30" fill="none" stroke="${c}" stroke-width="5"/><path d="M11 12 L33 12" stroke="${c}" stroke-width="5"/>${t(62, 26, 30, c, "ATLAS RESIDENCES", { font: SERIF, weight: 400, ls: 8 })}</g>`;
const palm = (x: number, y: number, s: number, c: string) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-6 0 Q-14 -160 4 -300 L12 -300 Q0 -160 8 0Z"/>${[-70, -35, 0, 35, 70, 110, -110].map(r => `<path transform="translate(8 -300) rotate(${r})" d="M0 0 Q60 -30 130 10 Q60 -5 0 0Z"/>`).join("")}</g>`;

function sunsetTerrace(v: number) {
  const sky = v > 1 ? ["#2C2350", "#C2546B", "#F4A261"] : ["#1E2A4A", "#B8566A", "#F2A65A"];
  const towers = [[180, 360, 220], [440, 250, 260], [740, 420, 200], [980, 300, 240], [1260, 380, 220]];
  return svg(1600, 1000, `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient></defs>
  <rect width="1600" height="1000" fill="url(#sky)"/><circle cx="1180" cy="560" r="150" fill="#FFD9A0" opacity=".9"/>
  ${towers.map(([x, top, w], i) => `<g><rect x="${x}" y="${top}" width="${w}" height="${1000 - top}" fill="${i % 2 ? "#13293B" : "#0E2233"}"/>${Array.from({ length: Math.floor((1000 - top) / 70) }, (_, r) => `<rect x="${x - 14}" y="${top + 40 + r * 70}" width="${w + 28}" height="8" fill="${ATLAS.gold}" opacity=".7"/>${Array.from({ length: Math.floor(w / 50) }, (_, c) => `<rect x="${x + 14 + c * 50}" y="${top + 56 + r * 70}" width="28" height="30" fill="${(r + c + i) % 3 === 0 ? "#FFD27A" : "#24425A"}"/>`).join("")}`).join("")}</g>`).join("")}
  ${palm(110, 1000, 1.3, "#081521")}${palm(1500, 1000, 1.5, "#081521")}
  <rect width="1600" height="1000" fill="url(#sky)" opacity="0"/>
  <rect x="0" y="0" width="760" height="1000" fill="#0E2233" opacity=".55"/>
  ${atlasLogo(80, 100, ATLAS.sand)}
  ${t(80, 330, 96, "#FFFFFF", "Live above", { font: SERIF, weight: 400 })}${t(80, 440, 96, ATLAS.gold, "the city.", { font: SERIF, weight: 400, italic: true })}
  ${t(680, 530, 52, "#FFFFFF", "عِش فوق المدينة", { font: AR, weight: 700, anchor: "end", rtl: true })}
  ${t(80, 640, 30, ATLAS.sand, "Sunset terraces · 2 & 3 bedroom residences", {})}
  <g transform="translate(80 720)"><rect width="${v > 1 ? 420 : 380}" height="80" rx="4" fill="${ATLAS.gold}"/>${t(30, 52, 30, ATLAS.navy, v > 1 ? "Register your interest  →" : "Book a private visit  →", { weight: 700 })}</g>
  ${t(80, 920, 24, ATLAS.sand, "New Cairo · Delivery 2028", { ls: 2, opacity: 0.8 })}`);
}

function familyCourtyard(v: number) {
  const arch = (x: number) => `<path d="M${x} 1000 L${x} 560 Q${x} 470 ${x + 70} 470 Q${x + 140} 470 ${x + 140} 560 L${x + 140} 1000Z" fill="#F7EEDC"/>`;
  return svg(1600, 1000, `<rect width="1600" height="1000" fill="#BFE0EE"/><rect y="420" width="1600" height="580" fill="${ATLAS.sand}"/>
  <rect x="760" y="300" width="840" height="700" fill="#E2D0B2"/>${[800, 980, 1160, 1340].map(arch).join("")}
  ${[820, 1000, 1180, 1360].map(x => `<rect x="${x}" y="340" width="100" height="90" fill="#9DB9C6"/>`).join("")}
  <ellipse cx="1100" cy="930" rx="420" ry="50" fill="#CDB892"/><rect x="980" y="800" width="240" height="90" rx="45" fill="#7FB8C9"/>
  <g><rect x="1440" y="700" width="18" height="240" fill="#6B4E31"/><circle cx="1450" cy="660" r="110" fill="#5E8C4A"/><circle cx="1390" cy="720" r="70" fill="#6FA055"/><circle cx="1510" cy="720" r="70" fill="#4F7B3E"/></g>
  <g fill="${ATLAS.navy}"><circle cx="900" cy="800" r="22"/><rect x="882" y="822" width="36" height="90" rx="14"/><circle cx="960" cy="830" r="16"/><rect x="947" y="846" width="26" height="62" rx="10"/></g>
  <rect width="${v > 1 ? 720 : 700}" height="1000" fill="${ATLAS.navy}"/>
  ${atlasLogo(80, 100, ATLAS.sand)}
  ${t(80, 330, 96, "#FFFFFF", "Room to", { font: SERIF })}${t(80, 440, 96, ATLAS.gold, "grow.", { font: SERIF, italic: true })}
  ${t(620, 530, 50, "#FFFFFF", "مساحة تكبر فيها العيلة", { font: AR, weight: 700, anchor: "end", rtl: true })}
  ${t(80, 630, 30, ATLAS.sand, v > 1 ? "Private courtyards · schools 5 min away" : "Private courtyards for every family", {})}
  <g transform="translate(80 710)"><rect width="380" height="80" rx="4" fill="${ATLAS.gold}"/>${t(30, 52, 30, ATLAS.navy, "Book a private visit  →", { weight: 700 })}</g>
  ${t(80, 920, 24, ATLAS.sand, "New Cairo · Delivery 2028", { ls: 2, opacity: 0.8 })}`);
}

function launchFilm() {
  return svg(1600, 1000, `<defs><linearGradient id="fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1A2A"/><stop offset="1" stop-color="#3A2A3E"/></linearGradient></defs>
  <rect width="1600" height="1000" fill="#000"/><rect y="110" width="1600" height="780" fill="url(#fs)"/>
  ${[[200, 420, 160], [420, 330, 190], [680, 460, 150], [900, 300, 210], [1180, 400, 170]].map(([x, top, w]) => `<rect x="${x}" y="${top}" width="${w}" height="${890 - top}" fill="#0A1622"/>${Array.from({ length: 6 }, (_, r) => `<rect x="${x + 20}" y="${top + 30 + r * 70}" width="${w - 40}" height="10" fill="#FFD27A" opacity="${0.25 + (r % 3) * 0.2}"/>`).join("")}`).join("")}
  <circle cx="1350" cy="250" r="60" fill="#F6E7C8" opacity=".85"/>
  ${t(800, 560, 64, "#FFFFFF", "A T L A S", { font: SERIF, anchor: "middle", ls: 18, opacity: 0.9 })}
  <circle cx="800" cy="470" r="0" fill="#fff"/>
  <rect x="60" y="930" width="1480" height="8" rx="4" fill="#FFFFFF33"/><rect x="60" y="930" width="690" height="8" rx="4" fill="${ATLAS.gold}"/><circle cx="750" cy="934" r="14" fill="#FFFFFF"/>
  ${t(60, 70, 28, "#FFFFFF", "ROUGH CUT · v1", { weight: 700, ls: 4 })}${t(1540, 70, 28, "#FFFFFF", "00:42 / 01:30", { anchor: "end", font: "monospace" })}
  ${t(800, 850, 30, "#FFFFFF", "“Some homes you visit. This one you come back to.”", { anchor: "middle", italic: true, font: SERIF })}`);
}

// ── Glow Lab Skincare ──────────────────────────────────────────
const GLOW = { peach: "#FBE3D3", orange: "#F28C28", plum: "#3B1F2B", cream: "#FFF6EE" };
const glowLogo = (x: number, y: number, c: string) => `<g transform="translate(${x} ${y})"><circle r="20" fill="${GLOW.orange}"/><circle r="9" fill="${c === "#FFFFFF" ? GLOW.plum : GLOW.peach}"/>${t(36, 11, 30, c, "glow lab", { weight: 700, ls: 2 })}</g>`;
const orange = (x: number, y: number, r: number) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${GLOW.orange}"/><circle r="${r * 0.86}" fill="#FFB25B"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${(r * 0.8 * Math.cos((i * Math.PI) / 4)).toFixed(1)} ${(r * 0.8 * Math.sin((i * Math.PI) / 4)).toFixed(1)}" stroke="#FFE2B8" stroke-width="${r * 0.06}"/>`).join("")}<circle r="${r * 0.12}" fill="#FFE2B8"/></g>`;
const bottle = (x: number, y: number, s: number, body: string, label: string) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-26" y="-210" width="52" height="90" rx="22" fill="#2B2B2B"/><rect x="-36" y="-130" width="72" height="40" rx="8" fill="#C9C9C9"/><rect x="-110" y="-95" width="220" height="330" rx="40" fill="${body}"/><rect x="-110" y="-95" width="40" height="330" rx="20" fill="#FFFFFF" opacity=".25"/><rect x="-80" y="10" width="160" height="130" rx="10" fill="${GLOW.cream}"/>${t(0, 60, 28, GLOW.plum, label, { weight: 800, anchor: "middle" })}${t(0, 100, 20, GLOW.plum, "SERUM · 30 ml", { anchor: "middle", ls: 2 })}</g>`;

function serumUgc() {
  return svg(1080, 1350, `<rect width="1080" height="1350" fill="${GLOW.peach}"/><circle cx="820" cy="720" r="330" fill="#F9D2B8"/>
  ${orange(250, 1120, 130)}${orange(900, 1180, 95)}${orange(980, 420, 70)}
  ${bottle(640, 720, 1.5, "#F59B3A", "VITAMIN C")}
  ${glowLogo(96, 120, GLOW.plum)}
  <g transform="translate(90 220)"><rect width="560" height="120" rx="60" fill="#FFFFFF"/><circle cx="60" cy="60" r="40" fill="${GLOW.orange}"/>${t(118, 52, 26, GLOW.plum, "@nour.skin", { weight: 700 })}${t(118, 88, 26, "#7A5A66", "“14 days in. honestly obsessed.”", {})}</g>
  ${t(90, 470, 100, GLOW.plum, "Glow in", { font: SERIF, weight: 700 })}${t(90, 580, 100, GLOW.orange, "14 days.", { font: SERIF, weight: 700, italic: true })}
  ${t(90, 660, 46, GLOW.plum, "إشراقة في ١٤ يوم", { font: AR, weight: 700 })}
  <g transform="translate(90 1230)"><rect width="330" height="74" rx="37" fill="${GLOW.plum}"/>${t(165, 48, 28, "#FFFFFF", "Shop now  →", { weight: 700, anchor: "middle" })}</g>`);
}

function ramadanBundle() {
  const lantern = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -140 L0 -100" stroke="${GLOW.orange}" stroke-width="4"/><path d="M-40 -100 L40 -100 L60 -40 L40 60 L-40 60 L-60 -40Z" fill="#F2B544"/><path d="M-25 -80 L25 -80 L38 -40 L25 40 L-25 40 L-38 -40Z" fill="#FFE7A8"/><rect x="-46" y="60" width="92" height="16" rx="6" fill="${GLOW.orange}"/></g>`;
  return svg(1080, 1080, `<defs><radialGradient id="rb" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#5A2E40"/><stop offset="1" stop-color="${GLOW.plum}"/></radialGradient></defs>
  <rect width="1080" height="1080" fill="url(#rb)"/>
  <path d="M860 180 A110 110 0 1 0 960 330 A90 90 0 1 1 860 180Z" fill="#F2D18B"/>
  ${[[120, 40], [980, 80], [240, 160], [700, 60], [560, 200]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#F2D18B"/>`).join("")}
  ${lantern(150, 180, 0.9)}${lantern(330, 120, 0.6)}
  <ellipse cx="540" cy="960" rx="420" ry="40" fill="#00000040"/>
  ${bottle(360, 760, 0.95, "#F59B3A", "VITAMIN C")}${bottle(560, 730, 1.1, "#E9C9D6", "HYALURONIC")}${bottle(760, 770, 0.9, "#F7E1C2", "NIACINAMIDE")}
  ${glowLogo(96, 110, "#FFFFFF")}
  ${t(90, 330, 92, "#FFFFFF", "Ramadan", { font: SERIF, weight: 700 })}${t(90, 425, 92, "#F2D18B", "Glow Set", { font: SERIF, weight: 700, italic: true })}
  ${t(90, 500, 44, "#FFFFFF", "مجموعة رمضان للإشراقة", { font: AR, weight: 700 })}
  <g transform="translate(800 470)"><circle r="90" fill="${GLOW.orange}"/>${t(0, 4, 54, "#FFFFFF", "-20%", { weight: 800, anchor: "middle" })}${t(0, 44, 22, "#FFFFFF", "UNTIL EID", { anchor: "middle", ls: 2 })}</g>`);
}

const DESIGNS: Record<string, (v: number) => string> = {
  "New seasonal menu post": seasonalMenu,
  "Cold brew launch carousel": coldBrew,
  "Barista story post": baristaStory,
  "Latte art reel": latteReel,
  "Weekend offer story": weekendOffer,
  "Key visual · Sunset terrace": sunsetTerrace,
  "Key visual · Family courtyard": familyCourtyard,
  "Launch film · rough cut": launchFilm,
  "Vitamin C serum ad · UGC": serumUgc,
  "Ramadan bundle static": ramadanBundle
};

/** A data: URL with finished-looking artwork for a sample deliverable, or "" if there is none. */
export function demoDesign(title: string, version: number): string {
  const f = DESIGNS[title];
  return f ? "data:image/svg+xml;utf8," + encodeURIComponent(f(version)) : "";
}
