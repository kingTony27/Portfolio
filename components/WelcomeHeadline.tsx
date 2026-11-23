"use client";

import { Fragment, useEffect, useId, useRef } from "react";

// ---- WelcomeHeadline ------------------------------------------------------------
// The big spray-painted "Welcome / to my portfolio" plus the hand-written hint.
// Plain HTML on top of the Canvas, so it can use CSS clamp() and the Sancreek
// font that is already set in the stylesheet (no font-family needed here).
//
// HOW THE SPRAY EFFECT WORKS
//  1. Every letter is its own <span>, hidden at first (opacity-0).
//  2. The Web Animations API (el.animate) brings each letter in one by one:
//     blurry + big + invisible -> sharp + normal size + solid, like paint landing.
//  3. Each letter carries a few tiny dots (overspray). They stay forever.
//  4. An SVG filter roughens the edges so the text looks sprayed, not printed.
//  5. When the last letter lands: onSprayDone() fires, a few drips run down,
//     and the hint fades in.
// Everything lives in ONE effect with a cleanup. With Next's <Activity> (Home is
// hidden, not unmounted, when you leave it) the cleanup cancels the animations and
// the effect runs again when Home is shown, so the spray replays on return.

// ---- Tuning knobs (change these) --------------------------------------------------
const HEADLINE_TOP = "clamp(3.5rem, 7vh, 5rem)"; // space under the header strip
const ROUGH_EDGES = true; // false = no SVG filter (use it if the page feels slow)
const START_DELAY_MS = 400; // wait before the first letter
const LETTER_MS = 450; // how long one letter takes to land
const STEP_MS = [70, 45]; // gap between letters: [line 1, line 2]
const DOTS_PER_LETTER = 3; // overspray dots around each letter

// The two lines. font sizes: line 2 is 40% of line 1.
const LINES = [
  { text: "Welcome", fontSize: "clamp(2.2rem, 7vw, 6.5rem)" },
//   { text: "to my portfolio", fontSize: "clamp(0.9rem, 2.8vw, 2.6rem)" },
];

// Drips: line = which line, letter = character position in that line (spaces
// count), length = how long in em, delay = ms after the spray finishes.
const DRIPS = [
  { line: 0, letter: 2, length: 0.5, delay: 0 },
  { line: 0, letter: 5, length: 0.8, delay: 350 },
  { line: 1, letter: 11, length: 0.7, delay: 700 },
];

// ---- Build the letters once -------------------------------------------------------
// A seeded random generator, so the dots are the same on the server and in the
// browser (no hydration mismatch).
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dot = { left: number; top: number; size: number; opacity: number };
type Drip = { left: number; length: number; delay: number; duration: number };
type Letter = { char: string; dots: Dot[]; drips: Drip[] };

const BUILT = LINES.map((line, lineIndex) => {
  const rand = seeded(1000 + lineIndex * 77);
  const words: Letter[][] = [];
  let current: Letter[] = [];

  [...line.text].forEach((char, charIndex) => {
    if (char === " ") {
      words.push(current);
      current = [];
      return;
    }
    const dots: Dot[] = Array.from({ length: DOTS_PER_LETTER }, () => ({
      left: Math.round(rand() * 140 - 20),
      top: Math.round(rand() * 140 - 20),
      size: +(0.025 + rand() * 0.04).toFixed(3),
      opacity: +(0.45 + rand() * 0.45).toFixed(2),
    }));
    const drips: Drip[] = DRIPS.filter(
      (d) => d.line === lineIndex && d.letter === charIndex,
    ).map((d) => ({
      left: 30 + Math.round(rand() * 30),
      length: d.length,
      delay: d.delay,
      duration: Math.round(1100 + d.length * 1000),
    }));
    current.push({ char, dots, drips });
  });
  words.push(current);

  return { ...line, words };
});

// ---- Component --------------------------------------------------------------------
type WelcomeHeadlineProps = {
  hintVisible: boolean; // false after the first note click -> the hint fades out
  onSprayDone: () => void; // called once the last letter has landed
  // "overlay" hangs the headline over the 3D board (desktop). "inline" drops the
  // same headline into the normal page flow (mobile zigzag layout).
  variant?: "overlay" | "inline";
};

export default function WelcomeHeadline({
  hintVisible,
  onSprayDone,
  variant = "overlay",
}: WelcomeHeadlineProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGPathElement>(null);

  // Award each instance its own filter id. The desktop board and the mobile
  // layout can both be mounted at once, so a fixed id would collide.
  const filterId = `spray-rough-${useId().replace(/[:]/g, "")}`;

  // Always call the newest onSprayDone without restarting the animation.
  const doneRef = useRef(onSprayDone);
  useEffect(() => {
    doneRef.current = onSprayDone;
  });

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    // Reduced motion: no animation. CSS (motion-reduce:) already shows the text.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) doneRef.current();
      });
      return () => {
        cancelled = true;
      };
    }

    const running: Animation[] = [];

    // 1) Letters land one by one.
    let time = START_DELAY_MS;
    let last: Animation | null = null;
    for (const el of Array.from(title.querySelectorAll<HTMLElement>("[data-letter]"))) {
      const anim = el.animate(
        [
          { opacity: 0, filter: "blur(10px)", transform: "scale(1.35) translateY(-0.08em)" },
          { opacity: 0.85, filter: "blur(3px)", transform: "scale(1.1)", offset: 0.45 },
          { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
        ],
        { duration: LETTER_MS, delay: time, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "both" },
      );
      running.push(anim);
      last = anim;
      time += STEP_MS[Number(el.dataset.line)] ?? 45;
    }

    // 2) When the last letter lands: tell Home, run the drips, show the hint.
    if (last) {
      last.onfinish = () => {
        doneRef.current();

        for (const el of Array.from(title.querySelectorAll<HTMLElement>("[data-drip]"))) {
          running.push(
            el.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
              duration: Number(el.dataset.duration),
              delay: Number(el.dataset.delay),
              easing: "cubic-bezier(0.45, 0, 0.35, 1)",
              fill: "both",
            }),
          );
        }

        if (hintRef.current) {
          running.push(
            hintRef.current.animate(
              [
                { opacity: 0, transform: "translateY(6px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 600, delay: 400, easing: "ease-out", fill: "both" },
            ),
          );
        }
        if (arrowRef.current) {
          // draws the arrow like a pen stroke (pathLength is 1, so 1 -> 0)
          running.push(
            arrowRef.current.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
              duration: 700,
              delay: 900,
              easing: "ease-out",
              fill: "both",
            }),
          );
        }
      };
    }

    // Cleanup: cancel everything (cancel puts the elements back to their hidden start).
    return () => running.forEach((a) => a.cancel());
  }, []);

  return (
    <div
      className={
        variant === "overlay"
          ? "pointer-events-none absolute inset-x-0 z-10 flex select-none flex-col items-center px-4 text-center"
          : "pointer-events-none relative z-10 flex w-full select-none flex-col items-center px-4 text-center"
      }
      style={variant === "overlay" ? { top: HEADLINE_TOP } : undefined}
    >
      {/* The rough "spray" edge filter. The region is tall so the drips are not clipped. */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <filter
            id={filterId}
            x="-10%"
            y="-20%"
            width="120%"
            height="190%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={3} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.6} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <h1
        ref={titleRef}
        aria-label="Welcome to my portfolio"
        className="leading-[1.05] text-[#15130f]"
        style={ROUGH_EDGES ? { filter: `url(#${filterId})` } : undefined}
      >
        {BUILT.map((line, lineIndex) => (
          <span key={line.text} aria-hidden="true" className="block" style={{ fontSize: line.fontSize }}>
            {line.words.map((word, wordIndex) => (
              <Fragment key={wordIndex}>
                {wordIndex > 0 ? " " : null}
                <span className="inline-block whitespace-nowrap">
                  {word.map((letter, letterIndex) => (
                    <span
                      key={letterIndex}
                      data-letter
                      data-line={lineIndex}
                      className="relative inline-block opacity-0 motion-reduce:opacity-100"
                    >
                      {letter.char}

                      {/* overspray dots */}
                      {letter.dots.map((dot, dotIndex) => (
                        <span
                          key={dotIndex}
                          className="absolute rounded-full bg-[#15130f]"
                          style={{
                            left: `${dot.left}%`,
                            top: `${dot.top}%`,
                            width: `${dot.size}em`,
                            height: `${dot.size}em`,
                            opacity: dot.opacity,
                          }}
                        />
                      ))}

                      {/* drips (grow downward after the spray finishes) */}
                      {letter.drips.map((drip, dripIndex) => (
                        <span
                          key={dripIndex}
                          data-drip
                          data-delay={drip.delay}
                          data-duration={drip.duration}
                          className="absolute rounded-b-full bg-[#15130f] [transform-origin:top] [transform:scaleY(0)] motion-reduce:hidden"
                          style={{
                            left: `${drip.left}%`,
                            top: "78%",
                            width: "0.05em",
                            height: `${drip.length}em`,
                          }}
                        />
                      ))}
                    </span>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        ))}
      </h1>

      {/* The hint. Outer box: tilt + fade out after the first click.
          Inner box: fades in once, after the spray finishes. */}
      <div
        aria-hidden={!hintVisible}
        className={`mt-2 -rotate-2 transition-opacity duration-500 md:mt-3 ${
          hintVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          ref={hintRef}
          className="flex items-start gap-2 text-[#3d3a33] opacity-0 motion-reduce:opacity-100"
          style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.35rem)" }}
        >
          <span>pick a note </span>
          <svg
            viewBox="0 0 46 42"
            aria-hidden="true"
            className="h-[1.9em] w-[2em]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              ref={arrowRef}
              pathLength={1}
              className="[stroke-dasharray:1] [stroke-dashoffset:1] motion-reduce:[stroke-dashoffset:0]"
              d="M4 6 C 30 4, 42 18, 35 35 M28 28 L35 36 L42 27"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}