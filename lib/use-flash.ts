import * as React from "react";

/** "up" / "down" for ~1.2 s after `value` changes (used to highlight live balance updates). */
export function useFlash(value: number | undefined): "up" | "down" | null {
  const prev = React.useRef(value);
  const [dir, setDir] = React.useState<"up" | "down" | null>(null);
  React.useEffect(() => {
    if (value === undefined) { prev.current = value; return; }
    const was = prev.current;
    prev.current = value;
    if (was === undefined || was === value) return;
    setDir(value > was ? "up" : "down");
    const t = setTimeout(() => setDir(null), 1200);
    return () => clearTimeout(t);
  }, [value]);
  return dir;
}
