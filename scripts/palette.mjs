// Brand palettes (UI fix spec 11.1): one hue per brand, a same-hue second colour, AA-checked light shades.
// Prints every pair with its contrast ratio. Usage: node scripts/palette.mjs  (or import { PALETTES }).
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = c => "#" + c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const lin = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = h => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function rgb2hsl([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb([h, s, l]) {
  if (!s) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
const hsl = h => rgb2hsl(hex2rgb(h));
const mk = (h, s, l) => rgb2hex(hsl2rgb([h, s, l]));
/** Lighten a colour (same hue) until it reaches `min` contrast against `bg`. */
function lightenTo(hex, bg, min = 4.5) {
  const [h, s, l0] = hsl(hex);
  for (let l = l0; l < 1; l += 0.005) { const c = mk(h, s, l); if (ratio(c, bg) >= min) return c; }
  return "#FFFFFF";
}
/** Darken a colour (same hue) until it reaches `min` contrast against every colour in `against`. */
function darkenTo(hex, against, min = 4.5) {
  const [h, s, l0] = hsl(hex);
  for (let l = l0; l > 0; l -= 0.005) { const c = mk(h, s, l); if (against.every(a => ratio(c, a) >= min)) return c; }
  return "#000000";
}
const BRANDS = [
  // key, dark accent, idea, default theme
  ["bv", "#00CFFF", "Signal cyan", "dark"],
  ["frames", "#F5A524", "Tungsten light", "dark"],
  ["web", "#3D63FF", "Cobalt", "dark"],
  ["stage", "#E8344A", "Stage crimson", "dark"],
  ["go", "#2EE6A6", "Green light", "light"],
  ["crew", "#7C4DFF", "Deep violet", "light"],
  ["jobs", "#C6F432", "Chartreuse", "light"]
];
export const PALETTES = Object.fromEntries(BRANDS.map(([key, accent, idea, theme]) => {
  const [h, s] = hsl(accent);
  const tint = Math.min(s, 0.35);
  const dark = {
    bg: mk(h, tint * 0.9, 0.045), "bg-2": mk(h, tint * 0.8, 0.065), surface: mk(h, tint * 0.6, 0.09), "surface-2": mk(h, tint * 0.5, 0.115),
    text: mk(h, 0.25, 0.95), "text-2": mk(h, 0.1, 0.72), "text-3": mk(h, 0.08, 0.64), bl: mk(h, 0.3, 0.9),
    accent, "accent-2": mk(h, s, Math.min(0.86, hsl(accent)[2] + 0.16))
  };
  // accent used as text (links, kickers) on the dark page: the same hue, lifted to 4.5:1 when the spec colour is darker
  dark["accent-text"] = lightenTo(accent, dark.surface);
  dark["accent-ink"] = ratio(accent, "#FFFFFF") >= 4.5 ? "#FFFFFF" : mk(h, 0.6, 0.06);
  const lightBg = mk(h, tint * 0.6, 0.975);
  const light = {
    bg: lightBg, "bg-2": mk(h, tint * 0.5, 0.945), surface: "#FFFFFF", "surface-2": mk(h, tint * 0.5, 0.955),
    text: mk(h, 0.3, 0.08), "text-2": mk(h, 0.1, 0.34), "text-3": mk(h, 0.08, 0.38), bl: mk(h, 0.3, 0.08)
  };
  // buttons and links in the light theme: same hue, dark enough for text on the page and for white ink on the button
  light.accent = darkenTo(accent, [lightBg, "#FFFFFF", light["bg-2"]]);
  light["accent-2"] = darkenTo(mk(h, s, hsl(light.accent)[2] - 0.08), [lightBg, "#FFFFFF"]);
  light["accent-ink"] = "#FFFFFF";
  light["accent-text"] = light.accent;
  return [key, { idea, theme, dark, light }];
}));

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  for (const [k, p] of Object.entries(PALETTES)) {
    console.log(`${k.padEnd(6)} ${p.idea.padEnd(14)} default ${p.theme}`);
    console.log(`   dark : accent ${p.dark.accent} on bg ${ratio(p.dark.accent, p.dark.bg).toFixed(2)} · as text ${p.dark["accent-text"]} ${ratio(p.dark["accent-text"], p.dark.surface).toFixed(2)} · ink ${p.dark["accent-ink"]} ${ratio(p.dark.accent, p.dark["accent-ink"]).toFixed(2)} · accent-2 ${p.dark["accent-2"]} · text-2 ${ratio(p.dark["text-2"], p.dark.bg).toFixed(2)} · text-3 ${ratio(p.dark["text-3"], p.dark.surface).toFixed(2)}`);
    console.log(`   light: accent ${p.light.accent} on bg ${ratio(p.light.accent, p.light.bg).toFixed(2)} / on white ${ratio(p.light.accent, "#FFFFFF").toFixed(2)} · accent-2 ${p.light["accent-2"]} ${ratio(p.light["accent-2"], p.light.bg).toFixed(2)} · text-2 ${ratio(p.light["text-2"], p.light.bg).toFixed(2)} · text-3 ${ratio(p.light["text-3"], p.light["bg-2"]).toFixed(2)}`);
  }
}
