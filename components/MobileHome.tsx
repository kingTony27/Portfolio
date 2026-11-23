"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/data/site";
import CurrentYear from "./CurrentYear";
import CssPin from "./CssPin";
import WelcomeHeadline from "./WelcomeHeadline";
import { Tape } from "./contact/ContactDecor";
import { NOTE_DOODLE_SVG } from "./noteArt";
import type { NoteId } from "./Scene";

// ---- Mobile Home -------------------------------------------------------------
// The whole phone layout (everything BELOW the md breakpoint). The 3D board is
// hidden on phones and this scrolls instead: header strip -> "Welcome" ->
// cropped portrait -> four notes zigzagging down an ink string -> footer.
//
// It is plain HTML + CSS (no 3D scene on phones). Tapping a note plays a simple
// CSS zoom and then opens that note's page.

// ---- THE FOUR NOTES ----------------------------------------------------------
// HOW TO CHANGE A NOTE:
//   * tilt    -> the small rotation in degrees (-4 … +4 is the intended range)
//   * side    -> "left" or "right": which way the note leans in the zigzag
//   * label / subline -> the two lines of text
const MOBILE_NOTES: {
  id: NoteId;
  label: string;
  subline: string;
  side: "left" | "right";
  tilt: number;
}[] = [
  { id: "about", label: "About me", subline: "Who I am", side: "left", tilt: 3 },
  { id: "projects", label: "Projects", subline: "What I built", side: "right", tilt: -3 },
  { id: "tools", label: "Tools", subline: "What I use", side: "left", tilt: -4 },
  { id: "contact", label: "Contact me", subline: "Say hello", side: "right", tilt: 4 },
];

// ---- THE TAP-TO-OPEN CSS ZOOM ------------------------------------------------
// When a note is tapped it grows and fades while the other notes fade out;
// a moment later the page for that note opens.
// HOW TO CHANGE IT:
//   * ZOOM_SCALE -> how big the tapped note grows (1.5 = 150%)
//   * ZOOM_MS    -> how long the grow/fade lasts before the page opens
const ZOOM_SCALE = 1.5;
const ZOOM_MS = 400;

// Temporary timing logs (toggle off to silence them). Every line is measured
// from the TAP (see handleTap below), not from page load. The last line — "page
// ready" — is printed by components/SiteHeader.tsx on the page we land on, using
// the tap time shared through sessionStorage.
const NAV_DEBUG = true;
// The sessionStorage key that carries the tap timestamp to the next page.
const NAV_T0_KEY = "nav:t0";
const navLog = (message: string) => {
  if (NAV_DEBUG) console.log(`[nav] ${message}`);
};

// Which page each note opens.
const NOTE_PATHS: Record<NoteId, string> = {
  about: "/about",
  projects: "/projects",
  tools: "/tools",
  contact: "/contact",
};

// Small ink accents along the header rule, matching the desktop header.
const TICKS = [8, 18, 28, 38, 62, 72, 82, 92];

/** Turn one of the shared doodle SVGs into a CSS background image. */
function svgUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ---- Decoration: one long ink string ----------------------------------------
// ONE hand-drawn path that starts under the portrait and winds from pin to pin,
// down through all four notes. The viewBox is 0..100 on both axes and is
// stretched to the notes block (preserveAspectRatio="none"); non-scaling-stroke
// keeps the line the same thickness however it stretches.
//
// HOW TO CHANGE THE STRING PATH: the four waypoints are the notes' pins —
//   (33,10) About, (67,33) Projects, (33,60) Tools, (67,83) Contact.
// Move those numbers to push the string around; the C commands in between are
// just the curve handles between them.
function InkString() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d="M50 0 C46 3 38 6 33 10 C24 18 55 24 67 33 C76 42 24 50 33 60 C42 70 60 74 67 83 C72 90 60 96 48 99"
        fill="none"
        stroke="#15130f"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A faint coffee cup ring, tucked into a gap so the page does not look bare. */
function CoffeeRing({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <g fill="none" stroke="#6b5a44">
        <circle cx="50" cy="50" r="40" strokeWidth="5" opacity="0.13" />
        <circle cx="50" cy="50" r="31" strokeWidth="2" opacity="0.1" />
      </g>
    </svg>
  );
}

/** A little ink splatter, same idea. */
function Splatter({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className}>
      <g fill="#15130f">
        <circle cx="30" cy="34" r="4" opacity="0.28" />
        <circle cx="52" cy="24" r="2.4" opacity="0.22" />
        <circle cx="64" cy="46" r="5.5" opacity="0.2" />
        <circle cx="44" cy="58" r="3" opacity="0.26" />
        <circle cx="70" cy="66" r="2" opacity="0.2" />
        <circle cx="26" cy="62" r="2.6" opacity="0.18" />
      </g>
    </svg>
  );
}

type MobileHomeProps = {
  hintVisible: boolean;
  onSprayDone: () => void;
};

export default function MobileHome({ hintVisible, onSprayDone }: MobileHomeProps) {
  const router = useRouter();

  // The note currently zooming out of the page (null = nothing tapped yet).
  const [leaving, setLeaving] = useState<NoteId | null>(null);
  const timer = useRef<number | null>(null);

  // Load the four destination pages into the background the moment Home opens,
  // so a tap has nothing left to fetch (this is the fix for the long wait after
  // a tap — the routes used to be downloaded only when you tapped).
  useEffect(() => {
    for (const path of Object.values(NOTE_PATHS)) router.prefetch(path);
  }, [router]);

  // Pause the page scroll for the length of the zoom, so a swipe cannot drag the
  // page out from under the animation.
  useEffect(() => {
    if (leaving === null) return;
    const root = document.documentElement;
    const body = document.body;
    const rootPrev = root.style.overflow;
    const bodyPrev = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = rootPrev;
      body.style.overflow = bodyPrev;
    };
  }, [leaving]);

  // Next's <Activity> hides this layout instead of unmounting it, so the fade
  // state would survive a visit and leave every note invisible on the way back.
  // Clearing it in the cleanup (which runs on unmount AND on hide) fixes that.
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      setLeaving(null);
    },
    [],
  );

  // Browsers can also restore the page from the back/forward cache without
  // running any React code — reset the fade there too.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLeaving(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Tap a note: start the CSS zoom right away, then open the page the moment the
  // zoom lands. The page is already prefetched (see above), so the push has
  // nothing left to load and the only wait is the animation itself.
  const handleTap = (id: NoteId, t0: number) => {
    if (leaving !== null) return; // ignore extra taps while one is playing

    // Every timing log below is measured from THIS moment (the tap), not from
    // page load: `t0` is the click's own timestamp (read at the tap site), and
    // each step reports its offset from it. The same value is stashed in
    // sessionStorage so the destination page can print its own "page ready" line
    // on the same scale.
    if (NAV_DEBUG) sessionStorage.setItem(NAV_T0_KEY, String(t0));
    const at = () => Math.round(performance.now() - t0);

    navLog(`tap ${id} (t=0ms)`);

    // Respect reduced motion: skip the animation and go straight to the page.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navLog(`reduced-motion -> push now, no zoom (t=${at()}ms)`);
      router.push(NOTE_PATHS[id]);
      return;
    }

    // 1) Start the zoom now — same click handler, nothing awaited before it.
    setLeaving(id);
    navLog(`zoom start (t=${at()}ms)`);

    // 2) Open the page when the zoom finishes. The timeout equals the animation
    //    (never longer); the route is prefetched, so it shows at once.
    timer.current = window.setTimeout(() => {
      navLog(`router.push ${NOTE_PATHS[id]} (t=${at()}ms)`);
      router.push(NOTE_PATHS[id]);
    }, ZOOM_MS);
  };

  return (
    <div className="relative z-10 min-h-dvh w-full overflow-x-hidden pb-4 md:hidden">
      {/* Full-screen paper background (the desktop board gets its paper from the
          3D scene; here it is a plain CSS layer fixed behind the content). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/paper_bg.webp')" }}
      />

      <div className="relative z-10">
        {/* ---- Header strip (same as the desktop board) ---------------------- */}
        <header className="px-5 pt-4">
          <div className="relative h-px w-full bg-[#15130f]/45">
            <span className="absolute -left-px -top-2 h-3 w-3 border-l border-t border-[#15130f]/60" />
            <span className="absolute -right-px -top-2 h-3 w-3 border-r border-t border-[#15130f]/60" />
            {TICKS.map((p) => (
              <span key={p} className="absolute top-0 h-2 w-px bg-[#15130f]/35" style={{ left: `${p}%` }} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] tracking-[0.3em] text-[#15130f]/80">
            <span>DEVELOPER</span>
            <span>
              <CurrentYear /> SELECTED WORKS
            </span>
            <span>01 / HOME</span>
          </div>
        </header>

        {/* ---- The "Welcome" headline (letter-by-letter spray) --------------- */}
        <div className="mt-10">
          <WelcomeHeadline variant="inline" hintVisible={hintVisible} onSprayDone={onSprayDone} />
        </div>

        {/* ---- Portrait: a paper frame holding a headshot crop --------------- */}
        {/* HOW TO CHANGE THE CROP:
              * the frame shape is aspect-[4/5] below
              * the zoom into the face is scale-[2] on the <img> (bigger = tighter)
              * the part of the photo that stays in frame is objectPosition "center top"
            Change those three and the headshot re-frames. */}
        <div className="mt-8 px-5">
          {/* mx-auto centres the frame on the phone. The backing and the two
              pins are positioned off THIS frame (-inset-3 / -left-3 / -right-3),
              so they stay centred with it automatically. */}
          <div className="relative mx-auto w-[68vw] max-w-[320px]">
            {/* Slight paper backing with a soft shadow, a touch larger than the
                photo so it reads as a print laid on the board. */}
            <div className="absolute -inset-3 -rotate-1 rounded-[10px] bg-[#f7f4ec] shadow-[0_16px_30px_rgba(0,0,0,0.28)]" />
            {/* The photo itself, cropped to face + a little shoulder.
                object-cover + object-position "center top" keeps the face in the
                middle of the crop horizontally and pins the top of the head. */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-[#efeadd]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/tman_portrait_ink.webp"
                alt={`Ink portrait of ${site.name}`}
                className="absolute inset-0 h-full w-full origin-top scale-[2] object-cover"
                style={{ objectPosition: "center top" }}
              />
            </div>
            {/* Two board pins on the top corners of the frame. */}
            <CssPin size={26} seed={1} className="absolute -left-3 -top-3" />
            <CssPin size={26} seed={7} className="absolute -right-3 -top-3" />
          </div>
        </div>

        {/* ---- The four notes, zigzagging down the ink string ---------------- */}
        <div className="relative mt-12 px-6">
          {/* One string behind everything; the notes are drawn over it. */}
          <InkString />

          {/* Ink accents in the empty gaps between the notes. */}
          <CoffeeRing className="pointer-events-none absolute right-2 top-[4%] h-20 w-20 opacity-80" />
          <Splatter className="pointer-events-none absolute left-3 top-[44%] h-16 w-16 opacity-70" />
          <CoffeeRing className="pointer-events-none absolute bottom-[6%] left-4 h-16 w-16 opacity-60" />

          <div className="relative z-10 flex flex-col gap-12">
            {MOBILE_NOTES.map((note, index) => {
              const tapped = leaving === note.id;
              const zooming = leaving !== null; // any zoom -> every note fades
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleTap(note.id, performance.now())}
                  disabled={zooming}
                  aria-label={`Open ${note.label}`}
                  // The whole card is the tap target (comfortably over 44px tall).
                  // Every note fades out while one zooms in.
                  className={`relative block min-h-11 w-[64%] text-center active:scale-[0.98] ${
                    note.side === "left" ? "self-start" : "self-end"
                  } ${zooming ? "opacity-0" : ""}`}
                  style={
                    {
                      // The note's resting tilt — change it in MOBILE_NOTES above.
                      rotate: `${note.tilt}deg`,
                      // The zoom: the tapped note grows (scale) while every note
                      // fades (opacity). ONLY transform + opacity are animated, so
                      // it stays on the compositor.
                      //   * ZOOM_SCALE = how big it grows. * ZOOM_MS = the speed.
                      // The transition is declared at ALL times (not only while
                      // zooming): if it were added in the same frame as the new
                      // scale, some browsers skip the animation and jump.
                      transition: `scale ${ZOOM_MS}ms ease-in-out, opacity ${ZOOM_MS}ms ease-in-out`,
                      willChange: "transform, opacity",
                      scale: tapped ? `${ZOOM_SCALE}` : undefined,
                      // The paper (globals.css .letter-sheet) reads its padding
                      // from these two, so we can shrink it for a note card.
                      "--letter-pad-y": "1rem",
                      "--letter-pad-x": "0.85rem",
                    } as CSSProperties
                  }
                >
                  {/* The paper. This is the SAME torn-edge + paper-texture +
                      shadow styling the desktop board's notes use (see the "About
                      page" paper in app/globals.css).
                      The shadow is a `filter`, which is costly to re-draw while an
                      element is being scaled — so we switch it off only for the
                      length of the zoom (the resting look is unchanged). */}
                  <span className="letter-shadow block" style={{ filter: zooming ? "none" : undefined }}>
                    <span className="letter-sheet block">
                      {/* The little ink doodle (reuses the shared desktop artwork). */}
                      <span
                        aria-hidden
                        className="mx-auto mb-1.5 block h-9 w-9"
                        style={{
                          backgroundImage: `url("${svgUrl(NOTE_DOODLE_SVG[note.id])}")`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                      />

                      {/* Title + the quiet line under it. Both use Sancreek
                          (inherited) with a little letter-spacing so they stay
                          readable when small. */}
                      <span className="block text-[1.05rem] leading-tight tracking-[0.04em] text-[#15130f]">
                        {note.label}
                      </span>
                      <span className="mt-1 block text-[14px] leading-snug tracking-[0.06em] text-[#4a453c]">
                        {note.subline}
                      </span>
                    </span>
                  </span>

                  {/* Pin on top, a strip of tape on a corner — the same HTML pin
                      and tape components the other pages use. They sit OUTSIDE the
                      clipped paper layer so the rough edge never cuts them off. */}
                  <CssPin size={20} seed={index + 1} className="absolute -top-2.5 left-1/2 -translate-x-1/2" />
                  <span className="letter-tape" aria-hidden>
                    <Tape />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Footer strip; the year comes from the real date -------------- */}
        <footer className="relative mt-14 px-6">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#15130f]/45" />
            <span className="text-[12px] tracking-[0.3em] text-[#15130f]/80">
              {site.name}@
              <CurrentYear />
            </span>
            <span className="h-px flex-1 bg-[#15130f]/45" />
          </div>
        </footer>
      </div>
    </div>
  );
}
