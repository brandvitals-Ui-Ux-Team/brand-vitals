// Tiny change bus: any mutation emits, and data hooks re-query.
type Fn = () => void;
const subs = new Set<Fn>();
export const onChange = (fn: Fn) => { subs.add(fn); return () => { subs.delete(fn); }; };
let queued = false;
export const emitChange = () => {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; subs.forEach(f => f()); });
};
