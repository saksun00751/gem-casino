import * as React from "react";

/** Hand-drawn line icons for the mobile navigation (24×24, stroke = currentColor). */
const PATHS: Record<string, React.ReactNode> = {
  game: (
    <>
      <path d="M7.2 8.6h9.6a4.2 4.2 0 0 1 4.1 3.4l.6 3.3a2.9 2.9 0 0 1-5 2.4l-1.9-2.1H9.4l-1.9 2.1a2.9 2.9 0 0 1-5-2.4l.6-3.3a4.2 4.2 0 0 1 4.1-3.4z" />
      <path d="M8 10.7v3M6.5 12.2h3" />
      <circle cx="15.4" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.7" cy="13.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  promo: (
    <>
      <rect x="3" y="8.5" width="18" height="4" rx="1.2" />
      <path d="M5 12.5V19a1.2 1.2 0 0 0 1.2 1.2h11.6A1.2 1.2 0 0 0 19 19v-6.5M12 8.5v11.7" />
      <path d="M12 8.5C10.6 5 7 5 7 7.2s3.6 1.3 5 1.3zM12 8.5c1.4-3.5 5-3.5 5-1.3s-3.6 1.3-5 1.3z" />
    </>
  ),
  event: <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.3-4.1 5.9-.8z" />,
  deposit: (
    <>
      <path d="M4 8.5h13.2A2.8 2.8 0 0 1 20 11.3V17a3 3 0 0 1-3 3H6a2 2 0 0 1-2-2V8.5z" />
      <path d="M4 8.5l10.8-3.3a1.2 1.2 0 0 1 1.5 1.1v2.2" />
      <circle cx="15.8" cy="14.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  withdraw: (
    <>
      <path d="M12 14.5V3.8M8 7.6l4-4 4 4" />
      <path d="M4 13.5v4.2A2.3 2.3 0 0 0 6.3 20h11.4a2.3 2.3 0 0 0 2.3-2.3v-4.2" />
    </>
  ),
  contact: (
    <>
      <path d="M20.5 11.6a8 8 0 0 1-11.7 7.1L3.8 20l1.2-4.3a8 8 0 1 1 15.5-4.1z" />
      <circle cx="8.6" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12.2" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

export function NavGlyph({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {PATHS[name]}
    </svg>
  );
}
