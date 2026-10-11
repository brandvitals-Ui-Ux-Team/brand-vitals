import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { Filter, Row } from "./backend";
import { onChange } from "./bus";
import { idbGet } from "./local";
import type { TableName } from "./types";

// Loads rows and reloads whenever anything changes (own edits, other tabs, other users after refresh).
export function useRows<T extends TableName>(table: T, filter: Filter<T> | null) {
  const [rows, setRows] = useState<Row<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filter);
  const alive = useRef(true);
  const load = useCallback(() => {
    if (filter === null) { setRows([]); setLoading(false); return; }
    api.list(table, filter).then(r => { if (alive.current) { setRows(r); setLoading(false); setError(null); } })
      .catch(e => { if (alive.current) { setError(String(e.message || e)); setLoading(false); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, key]);
  useEffect(() => { alive.current = true; load(); const off = onChange(load); return () => { alive.current = false; off(); }; }, [load]);
  return { rows, loading, error, reload: load };
}

// Resolves demo-mode file references (idb:<id>) to object URLs.
export function useFileUrl(url: string | null | undefined) {
  const [out, setOut] = useState<string>("");
  useEffect(() => {
    if (!url) { setOut(""); return; }
    if (!url.startsWith("idb:")) { setOut(url); return; }
    let obj = "";
    idbGet(url.slice(4)).then(b => { if (b) { obj = URL.createObjectURL(b); setOut(obj); } });
    return () => { if (obj) URL.revokeObjectURL(obj); };
  }, [url]);
  return out;
}

export function useLocalState<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV] as const;
}
