"use client";

/** Root layout'ning o‘zida xato bo‘lsa ishlaydi. Shuning uchun o‘zining <html> va <body> i bor, stil inline. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f3ece3",
          color: "#1e1a17",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Nimadir noto‘g‘ri ketdi</h1>
          <p style={{ color: "#6a5f57", marginTop: 12 }}>Sayt vaqtincha ishlamayapti. Birozdan so‘ng qayta urinib ko‘ring.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              height: 48,
              padding: "0 24px",
              border: 0,
              borderRadius: 999,
              background: "#1e1a17",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
