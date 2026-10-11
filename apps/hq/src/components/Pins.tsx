// Pin comments on an image: clients tap a spot and type a note.
// Coordinates are stored as percentages so they survive any screen size.
import { X } from "lucide-react";
import { useState } from "react";
import { useFileUrl } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import type { Pin, Version } from "../lib/types";

export const isImage = (v?: Pick<Version, "file_type" | "file_url"> | null) => !!v && /^image\//.test(v.file_type) && !!v.file_url;

export function PinImage({ v, pins, onAdd, onChange, editable, color = "var(--accent)" }: {
  v: Version; pins: Pin[]; editable?: boolean; color?: string;
  onAdd?: (p: Pin) => void; onChange?: (pins: Pin[]) => void;
}) {
  const { L } = useI18n();
  const url = useFileUrl(v.file_url);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState("");
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || (e.target as HTMLElement).closest(".pin, .pin-pop")) return;
    const r = e.currentTarget.getBoundingClientRect();
    setDraft({ x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10 });
    setText("");
  };
  const save = () => { if (draft && text.trim()) onAdd?.({ ...draft, text: text.trim() }); setDraft(null); };
  return <div className="pinwrap">
    <div className={"pinimg" + (editable ? " pinimg--edit" : "")} onClick={place}>
      {url && <img src={url} alt={v.file_name} draggable={false} />}
      {pins.map((p, i) => <span key={i} className="pin" style={{ left: p.x + "%", top: p.y + "%", background: color }} title={p.text}>{i + 1}
        {editable && <button className="pin__x" onClick={e => { e.stopPropagation(); onChange?.(pins.filter((_, j) => j !== i)); }} aria-label={L("Remove", "حذف")}><X size={10} /></button>}
      </span>)}
      {draft && <div className="pin-pop" style={{ left: Math.min(draft.x, 70) + "%", top: draft.y + "%" }} onClick={e => e.stopPropagation()}>
        <span className="pin pin--draft" style={{ left: 0, top: 0, background: color }}>{pins.length + 1}</span>
        <textarea className="txt" autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={L("What should change here?", "إيه اللي يتغيّر هنا؟")}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") setDraft(null); }} />
        <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn btn--sm" onClick={() => setDraft(null)}>{L("Cancel", "إلغاء")}</button><button className="btn btn--sm btn--primary" onClick={save} disabled={!text.trim()}>{L("Add note", "أضف الملاحظة")}</button></div>
      </div>}
    </div>
    {pins.length > 0 && <ol className="pinlist">{pins.map((p, i) => <li key={i}><span className="pin pin--static" style={{ background: color }}>{i + 1}</span><span>{p.text}</span></li>)}</ol>}
  </div>;
}
