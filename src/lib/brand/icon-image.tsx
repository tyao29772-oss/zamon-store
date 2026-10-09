import { ImageResponse } from "next/og";

/**
 * Brauzer tabidagi belgi (favicon) va telefon ekranidagi ikonka: `LogoMark` bilan bir xil —
 * qorong‘i yumaloq kvadrat va do‘kon logotip yozuvining birinchi harfi («Z» uchun maxsus belgi).
 * Do‘kon nomi admin «Sozlamalar»ida o‘zgarsa, belgi ham o‘zgaradi.
 */
export function renderBrandIcon(letter: string, px: number, rounded = true): ImageResponse {
  const char = (letter.trim()[0] ?? "Z").toUpperCase();
  const s = px / 40;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b1917",
          borderRadius: rounded ? 12 * s : 0,
        }}
      >
        {char === "Z" ? (
          <svg width={px} height={px} viewBox="0 0 40 40">
            <path d="M12 12.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M27.4 13.6 12.6 26.4" stroke="#c99a6b" strokeWidth="3.6" strokeLinecap="round" />
            <path d="M12 27.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
          </svg>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#f3ece3", fontSize: 24 * s, fontWeight: 700, lineHeight: 1 }}>{char}</div>
            <div style={{ marginTop: 2 * s, width: 14 * s, height: 2.4 * s, borderRadius: 2 * s, background: "#c99a6b" }} />
          </div>
        )}
      </div>
    ),
    { width: px, height: px },
  );
}
