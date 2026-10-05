/**
 * Logotip belgisi: qorong‘i yumaloq kvadrat. «Z» uchun maxsus chizilgan belgi (yuqori va pastki
 * chiziq krem, diagonal bronza); boshqa harf bo‘lsa — o‘sha harf (do‘kon nomi o‘zgartirilganda).
 */
export function LogoMark({ size = 40, letter = "Z", className }: { size?: number; letter?: string; className?: string }) {
  const char = (letter.trim()[0] ?? "Z").toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill="#1b1917" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      {char === "Z" ? (
        <>
          <path d="M12 12.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M27.4 13.6 12.6 26.4" stroke="#c99a6b" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M12 27.5h16" stroke="#f3ece3" strokeWidth="3.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <text
            x="20"
            y="21"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f3ece3"
            fontFamily="var(--font-inter), ui-sans-serif, system-ui, sans-serif"
            fontSize="22"
            fontWeight="700"
          >
            {char}
          </text>
          <path d="M13 31.5h14" stroke="#c99a6b" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
