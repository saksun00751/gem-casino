"use client";

/** Last resort: the root layout itself failed, so this page must bring its own <html>/<body> and plain styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#111", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500 }}>เกิดข้อผิดพลาดบางอย่าง</h1>
          <p style={{ opacity: 0.7 }}>กรุณาลองใหม่อีกครั้ง</p>
          <button onClick={reset} style={{ marginTop: 12, height: 44, padding: "0 32px", borderRadius: 30, border: 0, background: "#f2ab39", color: "#2a1f00", fontSize: 15, cursor: "pointer" }}>ลองใหม่</button>
        </div>
      </body>
    </html>
  );
}
