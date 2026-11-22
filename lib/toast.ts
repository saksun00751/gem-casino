// Tiny toast store usable from anywhere (components, providers, plain functions). Rendered by <Toaster />.
export type ToastKind = "success" | "error" | "info" | "warning";
export type ToastItem = { id: number; kind: ToastKind; message: string; title?: string; duration: number };
type Opts = { title?: string; duration?: number };

const MAX_VISIBLE = 4;
const DEFAULT_MS: Record<ToastKind, number> = { success: 4000, info: 5000, warning: 6000, error: 6500 };

const EMPTY: ToastItem[] = []; // stable reference (useSyncExternalStore requires cached snapshots)
let items: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const toastStore = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  getSnapshot: () => items,
  getServerSnapshot: (): ToastItem[] => EMPTY,
};

function show(kind: ToastKind, message: string, opts: Opts = {}): number {
  const text = (message || "").trim();
  if (!text) return -1;
  // same message already on screen: do not stack duplicates
  const dup = items.find((t) => t.kind === kind && t.message === text && t.title === opts.title);
  if (dup) return dup.id;
  const t: ToastItem = { id: nextId++, kind, message: text, title: opts.title, duration: opts.duration ?? DEFAULT_MS[kind] };
  items = [...items, t].slice(-MAX_VISIBLE);
  emit();
  return t.id;
}

export function dismissToast(id: number) {
  if (!items.some((t) => t.id === id)) return;
  items = items.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (m: string, o?: Opts) => show("success", m, o),
  error: (m: string, o?: Opts) => show("error", m, o),
  info: (m: string, o?: Opts) => show("info", m, o),
  warning: (m: string, o?: Opts) => show("warning", m, o),
  dismiss: dismissToast,
  /** Turn an API answer ({ success, message }) into a toast. */
  fromApi(ok: boolean, message: string | undefined, fallbackOk: string, fallbackErr: string, o?: Opts) {
    return ok ? show("success", message || fallbackOk, o) : show("error", message || fallbackErr, o);
  },
};
