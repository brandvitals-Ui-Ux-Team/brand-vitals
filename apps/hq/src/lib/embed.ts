// Turns a pasted link (Figma, Google Drive/Docs, YouTube, Vimeo, Loom) into an
// embeddable preview URL, so reviewers see the work without leaving the page.
export function embedUrl(link: string): { url: string; provider: string } | null {
  let u: URL;
  try { u = new URL(link); } catch { return null; }
  const h = u.hostname.replace(/^www\./, "");
  if (h === "figma.com" && /^\/(file|design|proto|board)\//.test(u.pathname))
    return { provider: "Figma", url: `https://www.figma.com/embed?embed_host=vitals-approve&url=${encodeURIComponent(link)}` };
  if (h === "drive.google.com") {
    const id = u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || u.searchParams.get("id");
    if (id) return { provider: "Google Drive", url: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (h === "docs.google.com") {
    const m = u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([^/]+)/);
    if (m) return { provider: "Google Docs", url: `https://docs.google.com/${m[1]}/d/${m[2]}/preview` };
  }
  if (h === "youtube.com" || h === "m.youtube.com" || h === "youtu.be") {
    const id = h === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.match(/\/(shorts|embed)\/([^/]+)/)?.[2];
    if (id) return { provider: "YouTube", url: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (h === "vimeo.com") { const id = u.pathname.match(/^\/(\d+)/)?.[1]; if (id) return { provider: "Vimeo", url: `https://player.vimeo.com/video/${id}` }; }
  if (h === "loom.com") { const id = u.pathname.match(/\/share\/([^/?]+)/)?.[1]; if (id) return { provider: "Loom", url: `https://www.loom.com/embed/${id}` }; }
  return null;
}
