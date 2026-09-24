import { useId, type ReactNode } from "react";

/**
 * Mahsulot illyustratsiyalari (SVG). Haqiqiy foto bo‘lmaganda ProductImage shularni ko‘rsatadi.
 * Tashqi rasm ishlatilmaydi — mualliflik huquqi xavfi yo‘q, yuklanish tezligi yuqori.
 */

export type Wallpaper = readonly [string, string, string];

export interface ArtProps {
  color?: string;
  wall?: Wallpaper;
  className?: string;
}

export const DEFAULT_WALLPAPER: Wallpaper = ["#16303a", "#2fb49a", "#0b1622"];
const DEFAULT_COLOR = "#b7afa5";

function toRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value) || full.length !== 6) return [183, 175, 165];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** `hex` rangini `target` tomon `t` (0–1) qadar aralashtiradi. */
export function mix(hex: string, target: string, t: number): string {
  const a = toRgb(hex);
  const b = toRgb(target);
  const channel = (i: number) => Math.round(a[i]! + (b[i]! - a[i]!) * t);
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, "0")).join("")}`;
}

function useUid(): string {
  return `a${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

function Svg({
  viewBox,
  className,
  children,
}: {
  viewBox: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- Telefon */

function Lens({ x, y, r = 21, id }: { x: number; y: number; r?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r + 2} fill="#000000" opacity="0.35" />
      <circle r={r} fill={`url(#${id}ring)`} />
      <circle r={r - 3.2} fill="#0a0b0e" />
      <circle r={r * 0.66} fill={`url(#${id}lens)`} />
      <circle r={r * 0.36} fill="#05060a" stroke="#22283a" strokeWidth="1.2" />
      <path
        d={`M${-r * 0.5} ${-r * 0.1}A${r * 0.52} ${r * 0.52} 0 0 1 ${r * 0.1} ${-r * 0.5}`}
        fill="none"
        stroke="#9fb0ff"
        strokeOpacity="0.28"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Linza halqasi va shishasi uchun gradientlar (orqa tomon va chexol uchun umumiy). */
function LensDefs({ id }: { id: string }) {
  return (
    <>
      <linearGradient id={`${id}ring`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e6e6ea" />
        <stop offset="0.5" stopColor="#7c7d84" />
        <stop offset="1" stopColor="#c4c5ca" />
      </linearGradient>
      <radialGradient id={`${id}lens`} cx="0.38" cy="0.32" r="0.85">
        <stop offset="0" stopColor="#3a3f63" />
        <stop offset="0.55" stopColor="#141727" />
        <stop offset="1" stopColor="#05060a" />
      </radialGradient>
    </>
  );
}

function PhoneFrontG({ id, color, wall }: { id: string; color: string; wall: Wallpaper }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.45)} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.4)} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor={wall[0]} />
          <stop offset="1" stopColor={mix(wall[0], "#000000", 0.55)} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.28" cy="0.2" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id={`${id}c`}>
          <rect x="13" y="13" width="194" height="414" rx="32" />
        </clipPath>
      </defs>
      <rect x="0" y="118" width="4" height="38" rx="2" fill={mix(color, "#000000", 0.25)} />
      <rect x="216" y="150" width="4" height="60" rx="2" fill={mix(color, "#000000", 0.25)} />
      <rect x="3" y="3" width="214" height="434" rx="42" fill={`url(#${id}f)`} />
      <rect x="9" y="9" width="202" height="422" rx="36" fill="#08080a" />
      <rect x="13" y="13" width="194" height="414" rx="32" fill={`url(#${id}w)`} />
      <g clipPath={`url(#${id}c)`}>
        <ellipse cx="60" cy="330" rx="90" ry="120" fill={wall[1]} opacity="0.55" filter={`url(#${id}b)`} />
        <ellipse cx="170" cy="400" rx="80" ry="90" fill={wall[2]} opacity="0.6" filter={`url(#${id}b)`} />
        <rect x="13" y="13" width="194" height="414" fill={`url(#${id}g)`} />
        <path d="M13 13h110L48 427H13Z" fill="#ffffff" opacity="0.04" />
        <text
          x="110"
          y="92"
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fill="#ffffff"
          fillOpacity="0.8"
          fontFamily="Inter, system-ui, sans-serif"
        >
          Dushanba, 21 sentabr
        </text>
        <text
          x="110"
          y="146"
          textAnchor="middle"
          fontSize="58"
          fontWeight="600"
          fill="#ffffff"
          fillOpacity="0.92"
          fontFamily="Inter, system-ui, sans-serif"
        >
          9:41
        </text>
        <circle cx="48" cy="384" r="16" fill="#ffffff" fillOpacity="0.16" />
        <circle cx="172" cy="384" r="16" fill="#ffffff" fillOpacity="0.16" />
      </g>
      <rect x="82" y="24" width="56" height="17" rx="8.5" fill="#050506" />
      <rect x="86" y="414" width="48" height="4" rx="2" fill="#ffffff" opacity="0.6" />
    </g>
  );
}

function PhoneBackG({ id, color }: { id: string; color: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.3)} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.32)} />
        </linearGradient>
        <LensDefs id={id} />
      </defs>
      <rect x="0" y="118" width="4" height="38" rx="2" fill={mix(color, "#000000", 0.25)} />
      <rect x="216" y="150" width="4" height="60" rx="2" fill={mix(color, "#000000", 0.25)} />
      <rect x="3" y="3" width="214" height="434" rx="42" fill={`url(#${id}f)`} />
      <rect
        x="3"
        y="3"
        width="214"
        height="434"
        rx="42"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <rect
        x="17"
        y="17"
        width="112"
        height="112"
        rx="30"
        fill={mix(color, "#000000", 0.14)}
        stroke={mix(color, "#ffffff", 0.35)}
        strokeWidth="2"
      />
      <Lens x={46} y={46} id={id} />
      <Lens x={46} y={100} id={id} />
      <Lens x={100} y={73} id={id} />
      <circle cx="104" cy="35" r="6" fill="#f6efe2" opacity="0.9" />
      <circle cx="110" cy="290" r="46" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="2" />
    </g>
  );
}

export function PhoneFront({ color = DEFAULT_COLOR, wall = DEFAULT_WALLPAPER, className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 220 440" className={className}>
      <PhoneFrontG id={id} color={color} wall={wall} />
    </Svg>
  );
}

export function PhoneBack({ color = DEFAULT_COLOR, className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 220 440" className={className}>
      <PhoneBackG id={id} color={color} />
    </Svg>
  );
}

/** Ikki telefon: orqasi (kamera) va old tomoni (ekran) — birga ustma-ust. */
export function PhonePair({ color = DEFAULT_COLOR, wall = DEFAULT_WALLPAPER, className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="-18 0 408 470" className={className}>
      <g transform="translate(0 30) rotate(-3 110 220)">
        <PhoneBackG id={`${id}b`} color={color} />
      </g>
      <g transform="translate(160 0) rotate(2 110 220)">
        <PhoneFrontG id={`${id}a`} color={color} wall={wall} />
      </g>
    </Svg>
  );
}

/* ---------------------------------------------------------------- Noutbuk */

export function LaptopArt({ color = "#c9cbd0", wall = DEFAULT_WALLPAPER, className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 440 290" className={className}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={wall[0]} />
          <stop offset="0.55" stopColor={wall[1]} />
          <stop offset="1" stopColor={wall[2]} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.35)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.28)} />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="62" y="14" width="316" height="208" rx="18" fill={mix(color, "#000000", 0.55)} />
      <rect x="70" y="22" width="300" height="192" rx="11" fill="#08080a" />
      <rect x="74" y="26" width="292" height="184" rx="8" fill={`url(#${id}s)`} />
      <path d="M74 26h170L150 210H74Z" fill={`url(#${id}r)`} />
      <rect x="200" y="26" width="40" height="7" rx="3.5" fill="#050506" />
      <path d="M22 226h396l-14 22a12 12 0 0 1-10 6H46a12 12 0 0 1-10-6Z" fill={`url(#${id}b)`} />
      <rect x="182" y="226" width="76" height="6" rx="3" fill="#000000" opacity="0.2" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Chexol */

export function CaseArt({ color = "#e6d3bd", className }: ArtProps) {
  const id = useUid();
  const light = mix(color, "#ffffff", 0.5);
  return (
    <Svg viewBox="0 0 220 440" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.22)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.16)} />
        </linearGradient>
        <LensDefs id={id} />
      </defs>
      <rect x="3" y="3" width="214" height="434" rx="44" fill={`url(#${id}f)`} />
      <rect x="3" y="3" width="214" height="434" rx="44" fill="none" stroke="#ffffff" strokeOpacity="0.4" />
      <rect x="16" y="16" width="116" height="116" rx="32" fill="#e9e4dc" opacity="0.92" />
      <rect x="16" y="16" width="116" height="116" rx="32" fill="none" stroke={mix(color, "#000000", 0.18)} strokeWidth="3" />
      <Lens x={48} y={48} r={19} id={id} />
      <Lens x={48} y={100} r={19} id={id} />
      <Lens x={100} y={74} r={19} id={id} />
      <circle cx="110" cy="272" r="52" fill="none" stroke={light} strokeWidth="6" strokeOpacity="0.95" />
      <circle cx="110" cy="272" r="52" fill="none" stroke={mix(color, "#000000", 0.14)} strokeWidth="1.5" strokeOpacity="0.5" />
      <rect x="99" y="346" width="22" height="46" rx="11" fill={light} opacity="0.95" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Himoya oynasi */

export function GlassArt({ className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 220 440" className={className}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#dfe8ee" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="200" height="420" rx="34" fill={`url(#${id}g)`} stroke="#ffffff" strokeWidth="3" />
      <rect x="22" y="22" width="176" height="396" rx="26" fill="none" stroke="#9aa6ad" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M22 22h96L46 418H22Z" fill="#ffffff" opacity="0.45" />
      <rect x="84" y="34" width="52" height="15" rx="7.5" fill="#9aa6ad" opacity="0.6" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Kabel */

export function CableArt({ color = "#d8c4a8", className }: ArtProps) {
  const dark = mix(color, "#000000", 0.22);
  const light = mix(color, "#ffffff", 0.45);
  return (
    <Svg viewBox="0 0 340 260" className={className}>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx={150 + i * 4} cy={140 - i * 2} rx={112 - i * 15} ry={82 - i * 13} fill="none" stroke={dark} strokeWidth="16" />
          <ellipse cx={150 + i * 4} cy={140 - i * 2} rx={112 - i * 15} ry={82 - i * 13} fill="none" stroke={color} strokeWidth="13" />
          <ellipse
            cx={150 + i * 4}
            cy={138 - i * 2}
            rx={112 - i * 15}
            ry={82 - i * 13}
            fill="none"
            stroke={light}
            strokeWidth="3"
            strokeDasharray="6 9"
            strokeOpacity="0.8"
          />
        </g>
      ))}
      <rect x="34" y="112" width="26" height="60" rx="9" fill={dark} />
      <rect x="236" y="106" width="26" height="60" rx="9" fill={dark} />
      <path d="M232 92C262 60 292 62 300 40" fill="none" stroke={dark} strokeWidth="14" strokeLinecap="round" />
      <path d="M232 92C262 60 292 62 300 40" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
      <g transform="rotate(-24 312 26)">
        <rect x="296" y="4" width="34" height="40" rx="8" fill={color} stroke={dark} strokeWidth="2" />
        <rect x="302" y="-14" width="22" height="22" rx="4" fill="#d6d8dc" stroke="#9a9da3" strokeWidth="2" />
        <rect x="308" y="-8" width="10" height="10" rx="2" fill="#2a2b2e" />
      </g>
    </Svg>
  );
}

/* ---------------------------------------------------------------- Adapter */

export function AdapterArt({ color = "#f6f3ee", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 220 240" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.7)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.14)} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <rect x="72" y="8" width="13" height="34" rx="3" fill="#c9ccd1" />
      <rect x="128" y="8" width="13" height="34" rx="3" fill="#c9ccd1" />
      <rect x="30" y="34" width="156" height="180" rx="38" fill="#000000" opacity="0.12" transform="translate(6 6)" />
      <rect x="30" y="34" width="156" height="180" rx="38" fill={`url(#${id}f)`} />
      <rect x="30" y="34" width="156" height="180" rx="38" fill={`url(#${id}s)`} />
      <rect x="30" y="34" width="156" height="180" rx="38" fill="none" stroke="#ffffff" strokeOpacity="0.7" />
      <rect x="86" y="146" width="44" height="15" rx="7.5" fill="#d3d3d6" />
      <rect x="92" y="150" width="32" height="7" rx="3.5" fill="#8f9096" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Powerbank */

export function PowerbankArt({ color = "#26282c", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 170 270" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.32)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.35)} />
        </linearGradient>
      </defs>
      <rect x="24" y="12" width="124" height="248" rx="30" fill="#000000" opacity="0.14" transform="translate(5 5)" />
      <rect x="24" y="12" width="124" height="248" rx="30" fill={`url(#${id}f)`} />
      <rect x="24" y="12" width="124" height="248" rx="30" fill="none" stroke="#ffffff" strokeOpacity="0.3" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={60 + i * 17} cy="44" r="4.5" fill={i < 3 ? "#7ee2a8" : "#ffffff"} opacity={i < 3 ? 1 : 0.35} />
      ))}
      <rect x="56" y="112" width="60" height="6" rx="3" fill="#ffffff" opacity="0.55" />
      <rect x="66" y="128" width="40" height="5" rx="2.5" fill="#ffffff" opacity="0.28" />
      <rect x="64" y="228" width="44" height="12" rx="6" fill="#0b0b0d" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Quloqchin */

export function EarbudsArt({ color = "#faf8f4", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 280 260" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.7)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.13)} />
        </linearGradient>
      </defs>
      {[70, 210].map((x, i) => (
        <g key={x} transform={`rotate(${i === 0 ? -8 : 8} ${x} 120)`}>
          <rect x={x - 8} y="84" width="16" height="74" rx="8" fill={`url(#${id}f)`} stroke="#000000" strokeOpacity="0.08" />
          <ellipse cx={x} cy="76" rx="25" ry="29" fill={`url(#${id}f)`} stroke="#000000" strokeOpacity="0.08" />
          <ellipse cx={x + (i === 0 ? -6 : 6)} cy="66" rx="7" ry="10" fill="#ffffff" opacity="0.8" />
        </g>
      ))}
      <rect x="24" y="132" width="232" height="108" rx="44" fill="#000000" opacity="0.12" transform="translate(4 6)" />
      <rect x="24" y="132" width="232" height="108" rx="44" fill={`url(#${id}f)`} />
      <rect x="24" y="132" width="232" height="108" rx="44" fill="none" stroke="#ffffff" strokeOpacity="0.8" />
      <path d="M28 168h224" stroke="#000000" strokeOpacity="0.1" strokeWidth="2" />
      <circle cx="140" cy="212" r="4.5" fill="#4ade80" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Soat */

export function WatchArt({ color = "#2b2c30", className }: ArtProps) {
  const id = useUid();
  const strap = mix(color, "#000000", 0.05);
  return (
    <Svg viewBox="0 0 200 350" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.35)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#2c3b52" />
          <stop offset="1" stopColor="#06070b" />
        </radialGradient>
      </defs>
      <rect x="58" y="4" width="84" height="130" rx="24" fill={strap} />
      <rect x="58" y="216" width="84" height="130" rx="24" fill={strap} />
      {[28, 44, 60].map((y) => (
        <rect key={y} x="70" y={y + 260} width="60" height="4" rx="2" fill="#ffffff" opacity="0.1" />
      ))}
      <rect x="170" y="140" width="9" height="34" rx="4.5" fill={mix(color, "#000000", 0.3)} />
      <rect x="28" y="96" width="144" height="158" rx="44" fill={`url(#${id}f)`} />
      <rect x="37" y="105" width="126" height="140" rx="36" fill={`url(#${id}d)`} />
      <circle cx="100" cy="175" r="44" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="6" />
      <path d="M100 175V148M100 175l18 10" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="175" r="4" fill="#f0b86e" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Stend */

export function StandArt({ color = "#c9cbd0", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 250 260" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.5)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.3)} />
        </linearGradient>
      </defs>
      <ellipse cx="125" cy="212" rx="96" ry="26" fill="#000000" opacity="0.14" />
      <ellipse cx="125" cy="200" rx="92" ry="26" fill={mix(color, "#000000", 0.25)} />
      <ellipse cx="125" cy="192" rx="92" ry="26" fill={`url(#${id}f)`} />
      <rect x="112" y="118" width="26" height="72" rx="10" fill={`url(#${id}f)`} />
      <ellipse cx="125" cy="92" rx="60" ry="70" fill="none" stroke={mix(color, "#000000", 0.28)} strokeWidth="16" />
      <ellipse cx="125" cy="92" rx="60" ry="70" fill="none" stroke={`url(#${id}f)`} strokeWidth="12" />
      <ellipse cx="125" cy="90" rx="60" ry="70" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" strokeDasharray="30 200" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- MagSafe disk */

export function PuckArt({ color = "#f6f3ee", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 260 240" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.7)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.16)} />
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="188" rx="82" ry="14" fill="#000000" opacity="0.14" />
      <circle cx="120" cy="100" r="82" fill="#000000" opacity="0.1" transform="translate(5 7)" />
      <circle cx="120" cy="100" r="82" fill={`url(#${id}f)`} stroke="#ffffff" strokeOpacity="0.8" />
      <circle cx="120" cy="100" r="46" fill="none" stroke={mix(color, "#000000", 0.22)} strokeWidth="3" />
      <circle cx="120" cy="100" r="8" fill={mix(color, "#000000", 0.2)} />
      <path d="M196 132c34 12 40 52 52 70" fill="none" stroke={mix(color, "#000000", 0.1)} strokeWidth="9" strokeLinecap="round" />
      <path d="M196 132c34 12 40 52 52 70" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.8" />
    </Svg>
  );
}

/* ---------------------------------------------------------------- Kolonka */

export function SpeakerArt({ color = "#2a2c31", className }: ArtProps) {
  const id = useUid();
  return (
    <Svg viewBox="0 0 280 220" className={className}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(color, "#ffffff", 0.3)} />
          <stop offset="1" stopColor={mix(color, "#000000", 0.35)} />
        </linearGradient>
        <pattern id={`${id}p`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="2" fill="#ffffff" opacity="0.22" />
        </pattern>
      </defs>
      <rect x="24" y="46" width="232" height="138" rx="58" fill="#000000" opacity="0.14" transform="translate(4 6)" />
      <rect x="24" y="46" width="232" height="138" rx="58" fill={`url(#${id}f)`} />
      <rect x="40" y="60" width="200" height="110" rx="46" fill={`url(#${id}p)`} />
      <rect x="24" y="46" width="232" height="138" rx="58" fill="none" stroke="#ffffff" strokeOpacity="0.28" />
      <path d="M94 50c0-30 92-30 92 0" fill="none" stroke={mix(color, "#000000", 0.2)} strokeWidth="9" strokeLinecap="round" />
      <rect x="112" y="148" width="56" height="8" rx="4" fill="#ffffff" opacity="0.5" />
    </Svg>
  );
}
