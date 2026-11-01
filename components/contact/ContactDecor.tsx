// ---- Contact page decorations ----------------------------------------------
// Hand-drawn ink doodles scattered around the form, in the same sketchbook
// style as the Home board. Every piece is:
//   - static (no animation) and low contrast,
//   - aria-hidden + pointer-events-none, so it never gets in the way,
//   - parked in the margins or above/below the sheet, so it never covers the
//     form itself.
//
// They are grouped by screen size (see the comments inside the JSX): a few tiny
// corner doodles on phones, more in the side margins from md, and the full set
// (plus the detective-board strings) on lg where there is room for them.

import CssPin from "../CssPin";

// Small helper so the SVG doodles all share the same hand-drawn ink settings.
const INK = {
  stroke: "#15130f",
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// Sancreek for any text drawn inside a doodle (SVG does not inherit the page font).
const SAN = { fontFamily: "var(--font-sancreek), cursive" } as const;

// The next three are exported so other pages (e.g. /tools) can reuse the exact
// same doodles without redrawing them.
export function CoffeeRing() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" aria-hidden>
      <ellipse cx="50" cy="52" rx="40" ry="36" stroke="#4a3a28" strokeWidth="4" opacity="0.45" />
      <ellipse cx="50" cy="52" rx="35" ry="31" stroke="#4a3a28" strokeWidth="1.6" opacity="0.3" />
    </svg>
  );
}

export function Splatter() {
  // Fixed dot positions instead of Math.random, so the shape never changes.
  const dots = [
    [50, 50, 9],
    [34, 42, 4],
    [66, 40, 3.5],
    [58, 66, 5],
    [40, 64, 3],
    [70, 58, 2.5],
    [30, 56, 2.5],
    [50, 28, 2],
    [50, 72, 2],
    [24, 48, 2],
  ] as const;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      {dots.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#15130f" opacity="0.26" />
      ))}
    </svg>
  );
}

export function Tape() {
  return (
    <svg viewBox="0 0 120 40" className="h-full w-full" aria-hidden>
      <path
        d="M2 9 L118 5 L116 34 L4 31 Z"
        fill="rgba(196,184,150,0.5)"
        stroke="rgba(120,110,86,0.35)"
        strokeWidth="1"
      />
      <path d="M12 8 L15 32 M104 6 L107 31" stroke="rgba(120,110,86,0.3)" strokeWidth="1" />
    </svg>
  );
}

function PaperClip() {
  return (
    <svg viewBox="0 0 40 80" className="h-full w-full" fill="none" aria-hidden>
      <path
        d="M13 70 V22 a7 7 0 0 1 14 0 V58 a7 7 0 0 1 -14 0 V28"
        stroke="rgba(110,112,116,0.85)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 28 V57" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function WireCube() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <g {...INK} strokeWidth="2.4">
        <path d="M26 36 L48 14 L84 14 L62 36 Z" />
        <path d="M62 36 L84 14 L84 50 L62 72" />
        <rect x="26" y="36" width="36" height="36" />
        {/* little chain of rings, like the Home polaroid */}
        <ellipse cx="60" cy="82" rx="5" ry="8" transform="rotate(-20 60 82)" />
        <ellipse cx="74" cy="84" rx="5" ry="8" transform="rotate(20 74 84)" />
      </g>
    </svg>
  );
}

function Polaroid() {
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full" aria-hidden>
      <rect x="4" y="4" width="92" height="112" fill="#f7f4ec" stroke="#ddd7c8" strokeWidth="1" />
      <rect x="12" y="12" width="76" height="76" fill="#e7e3d8" stroke="#15130f" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="16" {...INK} strokeWidth="2" />
      <path d="M34 50 h32 M50 34 v32" {...INK} strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

function Envelope() {
  return (
    <svg viewBox="0 0 100 72" className="h-full w-full" aria-hidden>
      <rect x="6" y="12" width="88" height="52" rx="3" {...INK} strokeWidth="2.5" />
      <path d="M8 15 L50 44 L92 15" {...INK} strokeWidth="2" />
    </svg>
  );
}

function Postmark() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <circle cx="50" cy="50" r="42" {...INK} strokeWidth="3" opacity="0.85" />
      <circle cx="50" cy="50" r="33" {...INK} strokeWidth="1.4" opacity="0.75" />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="17"
        fill="#2b2925"
        opacity="0.85"
        style={SAN}
      >
        SENT
      </text>
    </svg>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 100 60" className="h-full w-full" aria-hidden>
      <path d="M8 50 C 34 54, 66 46, 90 18" {...INK} strokeWidth="2.2" />
      <path d="M78 16 L92 15 L86 29" {...INK} strokeWidth="2.2" />
    </svg>
  );
}

function SayHiArrow() {
  // Points at the form (which sits to the left of this doodle).
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
      <path d="M112 16 C 96 34, 68 48, 20 50" {...INK} strokeWidth="2.2" />
      <path d="M32 42 L20 50 L33 58" {...INK} strokeWidth="2.2" />
      <text x="66" y="22" textAnchor="middle" fontSize="17" fill="#4a453c" style={SAN}>
        say hi
      </text>
    </svg>
  );
}

function StickyNote() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <path d="M6 6 H94 V86 L86 94 H6 Z" fill="#eee7d4" stroke="#cfc6ad" strokeWidth="1" />
      <path d="M86 94 L94 86 L86 86 Z" fill="#ddd4bb" />
      <text x="50" y="44" textAnchor="middle" fontSize="15" fill="#24211c" style={SAN}>
        Let&apos;s build
      </text>
      <text x="50" y="62" textAnchor="middle" fontSize="15" fill="#24211c" style={SAN}>
        something
      </text>
    </svg>
  );
}

export default function ContactDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 select-none">
      {/* ---------- Phones: three small doodles in the corners ----------
          They sit above and below the sheet, so the form stays completely clear. */}
      <span className="absolute -top-14 left-0 h-12 w-12 opacity-60 md:hidden">
        <Postmark />
      </span>
      <span className="absolute -top-12 right-0 h-11 w-11 opacity-60 md:hidden">
        <Envelope />
      </span>
      <span className="absolute -bottom-14 right-2 h-12 w-12 opacity-50 md:hidden">
        <Splatter />
      </span>

      {/* ---------- md and up: doodles in the side margins ----------
          Sized so they fit neatly beside the sheet without touching it. */}
      <span className="absolute -left-16 top-16 hidden h-16 w-16 opacity-30 md:block">
        <CoffeeRing />
      </span>
      <span className="absolute -right-16 top-8 hidden h-16 w-8 opacity-45 md:block">
        <PaperClip />
      </span>
      <span className="absolute -right-16 bottom-28 hidden h-8 w-16 rotate-6 opacity-50 md:block">
        <Tape />
      </span>
      <span className="absolute -left-16 bottom-24 hidden h-16 w-16 opacity-35 md:block">
        <WireCube />
      </span>

      {/* ---------- lg only: the wider margins get the full set ---------- */}
      <span className="absolute -left-40 top-10 hidden h-12 w-20 -rotate-12 opacity-40 lg:block">
        <HandArrow />
      </span>
      <span className="absolute -left-36 top-44 hidden h-24 w-20 opacity-70 lg:block">
        <Polaroid />
      </span>
      <span className="absolute -right-40 top-28 hidden h-16 w-24 opacity-45 lg:block">
        <SayHiArrow />
      </span>
      <span className="absolute -right-40 bottom-28 hidden h-24 w-24 opacity-80 lg:block">
        <StickyNote />
      </span>

      {/* ---------- lg only: ink strings from the doodle pins to the form pin ----------
          One stretched SVG, so the two curves always meet the sheet's top-centre
          pin no matter how wide the form is. `vector-effect` keeps the lines a
          constant weight even though the SVG is stretched. */}
      <svg
        className="absolute -top-16 left-0 hidden h-16 w-full overflow-visible lg:block"
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M6 2 Q 28 11 50 16"
          stroke="#15130f"
          strokeOpacity="0.3"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M94 2 Q 72 11 50 16"
          stroke="#15130f"
          strokeOpacity="0.3"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* The two outer ends of those strings get a small pin each. */}
      <span className="absolute -top-14 left-[6%] hidden lg:block">
        <CssPin seed={2} size={12} />
      </span>
      <span className="absolute -top-14 right-[6%] hidden lg:block">
        <CssPin seed={9} size={12} />
      </span>
    </div>
  );
}
