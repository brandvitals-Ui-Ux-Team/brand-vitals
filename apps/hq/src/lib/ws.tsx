// Session + current workspace for the signed-in part of the app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { onChange } from "./bus";
import type { Member, SessionUser, Workspace } from "./types";

interface WsCtx {
  user: SessionUser | null;
  ready: boolean;
  workspaces: Workspace[];
  ws: Workspace | null;
  me: Member | null;
  members: Member[];
  select: (id: string) => void;
  refresh: () => Promise<void>;
}
const Ctx = createContext<WsCtx | null>(null);
const PICK = "hq-workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [wsId, setWsId] = useState<string | null>(() => localStorage.getItem(PICK));
  const [members, setMembers] = useState<Member[]>([]);

  const refresh = useCallback(async () => {
    const u = await api.session();
    setUser(u);
    if (!u) { setWorkspaces([]); setReady(true); return; }
    const list = await api.myWorkspaces();
    setWorkspaces(list);
    setReady(true);
  }, []);

  useEffect(() => { refresh(); const off = api.onAuth(() => { refresh(); }); return off; }, [refresh]);
  useEffect(() => onChange(() => { if (user) api.myWorkspaces().then(setWorkspaces); }), [user]);

  const ws = useMemo(() => workspaces.find(w => w.id === wsId) || workspaces[0] || null, [workspaces, wsId]);
  useEffect(() => {
    if (!ws) { setMembers([]); return; }
    const load = () => api.list("members", { workspace_id: ws.id }).then(setMembers);
    load();
    return onChange(load);
  }, [ws]);

  const me = useMemo(() => members.find(m => user && m.user_id === user.id) || null, [members, user]);
  const select = (id: string) => { localStorage.setItem(PICK, id); setWsId(id); };

  return <Ctx.Provider value={{ user, ready, workspaces, ws, me, members, select, refresh }}>{children}</Ctx.Provider>;
}

export function useWs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWs outside WorkspaceProvider");
  return c;
}
// For screens that only render inside a loaded workspace.
export function useWorkspace() {
  const c = useWs();
  if (!c.ws) throw new Error("No workspace");
  return { ...c, ws: c.ws, me: c.me as Member };
}
