"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CssPin from "./CssPin";

// Temporary timing log: this header mounts on each inner page, so it marks the
// exact moment the destination page is actually on screen. The tap timestamp is
// shared from the Home note tap through sessionStorage (key `nav:t0`), so the ms
// below is measured FROM THE TAP — matching the `[nav]` logs in
// components/MobileHome.tsx. Set to false to silence it.
const NAV_DEBUG = true;
// Must match NAV_T0_KEY in components/MobileHome.tsx.
const NAV_T0_KEY = "nav:t0";

// ---- Site header -------------------------------------------------------------
// Sticky bar with a paper background, an ink rule underneath, small tick marks
// and blueprint corner brackets. Navigation is drawn as little pinned paper
// notes so it matches the Home board.
//
// Wide screens (lg and up): one note per page + a Home note on the far left.
// Small screens: only two notes — Home, and a "next page" note with an arrow.

// The site's page order. The small-screen note walks this list and wraps around
// (About me -> Projects -> Tools -> Contact me -> About me -> ...).
const ORDER = [
  { href: "/about", label: "About me" },
  { href: "/projects", label: "Projects" },
  { href: "/tools", label: "Tools" },
  { href: "/contact", label: "Contact me" },
];

// Order the notes are shown in on wide screens (after the Home note on the left)
// — the same order as ORDER above, so the two navigations never disagree.
const DESKTOP_ORDER = ["/about", "/projects", "/tools", "/contact"];

// Ragged "torn paper" edge, drawn with CSS only (percentages so it scales).
const TORN =
  "polygon(0% 7%, 5% 2%, 13% 6%, 23% 1%, 34% 5%, 46% 0%, 58% 4%, 70% 0%, 82% 5%, 92% 2%, 100% 6%, 98% 24%, 100% 42%, 97% 60%, 100% 78%, 98% 95%, 89% 99%, 77% 96%, 64% 100%, 50% 97%, 36% 100%, 22% 96%, 10% 100%, 2% 95%, 4% 78%, 1% 60%, 3% 42%, 0% 24%)";

// Small tick marks along the bottom rule (like the Home header).
const TICKS = [8, 18, 28, 38, 62, 72, 82, 92];

const NOTE_SHADOW = "drop-shadow(1px 2px 3px rgba(0,0,0,0.32))";

function HouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11.2 12 4l8 7.2M6 10v9h12v-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h15m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A pinned paper note that acts as a link (used on wide screens). */
function NoteLink({
  href,
  label,
  active,
  seed,
  tilt,
}: {
  href: string;
  label: string;
  active: boolean;
  seed: number;
  tilt: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group relative flex min-h-11 items-center"
    >
      <span
        className="relative block transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{ filter: NOTE_SHADOW, rotate: `${tilt}deg` }}
      >
        <span
          className="flex items-center justify-center px-4 py-2"
          style={{
            clipPath: TORN,
            // The current page uses darker ink and is slightly bigger.
            background: active ? "#fbf8f0" : "#f2ecdf",
            color: active ? "#15130f" : "#6a655a",
          }}
        >
          <span className={active ? "text-base md:text-lg" : "text-sm md:text-base"}>
            {label}
          </span>
        </span>
      </span>
      <CssPin
        seed={seed}
        size={active ? 20 : 17}
        className="absolute -top-1 left-1/2 -translate-x-1/2"
      />
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();

  // Marks the moment this page is on screen, measured from the note tap on Home
  // (the tap time travelled here through sessionStorage). If there is no tap
  // time (e.g. a direct visit), fall back to 0 so the line still prints.
  useEffect(() => {
    if (!NAV_DEBUG) return;
    const t0 = Number(sessionStorage.getItem(NAV_T0_KEY) ?? 0);
    const ms = t0 > 0 ? Math.round(performance.now() - t0) : 0;
    console.log(`[nav] page ready ${pathname} (t=${ms}ms)`);
  }, [pathname]);

  // Find the next page in the order. If the path is unknown, -1 + 1 wraps to 0.
  const index = ORDER.findIndex((p) => p.href === pathname);
  const next = ORDER[(index + 1) % ORDER.length];
  const labelFor = (href: string) => ORDER.find((p) => p.href === href)!.label;

  return (
    <header className="sticky top-0 z-30">
      <div className="relative border-b border-[#15130f]/45 bg-[#f1ece0]">
        {/* bottom tick marks */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          {TICKS.map((t) => (
            <span
              key={t}
              className="absolute -bottom-px h-2 w-px bg-[#15130f]/35"
              style={{ left: `${t}%` }}
            />
          ))}
        </div>
        {/* corner brackets. NOTE: `-right-px` / `-left-px` used to stick 1px
            past the edge of this full-width bar, which is enough to give the
            whole page a sideways scrollbar — so they sit on the edge instead. */}
        <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-[#15130f]/60" />
        <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-[#15130f]/60" />

        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 md:gap-4 md:px-8">
          {/* Home note — always present, far left, so there is always a way back. */}
          <Link
            href="/"
            aria-label="Back to home"
            className="group relative flex min-h-11 items-center"
          >
            <span
              className="relative block transition-transform duration-200 group-hover:-translate-y-0.5"
              style={{ filter: NOTE_SHADOW, rotate: "-2deg" }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center bg-[#fbf8f0] text-[#15130f] transition-colors group-hover:bg-[#15130f] group-hover:text-[#fbf8f0]"
                style={{ clipPath: TORN }}
              >
                <HouseIcon />
              </span>
            </span>
            <CssPin seed={7} size={16} className="absolute -top-1.5 left-1/2 -translate-x-1/2" />
          </Link>

          {/* Wide screens: a note for each page, current one stands out. */}
          <nav className="hidden items-center gap-3 lg:flex" aria-label="Pages">
            {DESKTOP_ORDER.map((href, i) => (
              <NoteLink
                key={href}
                href={href}
                label={labelFor(href)}
                active={pathname === href}
                seed={21 + i * 3}
                tilt={i % 2 === 0 ? -1.5 : 1.5}
              />
            ))}
          </nav>

          {/* Small screens: exactly two notes — Home (above) + the next page. */}
          <nav className="ml-auto lg:hidden" aria-label="Next page">
            <Link href={next.href} className="group relative flex min-h-11 items-center">
              <span
                className="relative block transition-transform duration-200 group-hover:-translate-y-0.5"
                style={{ filter: NOTE_SHADOW, rotate: "-1.5deg" }}
              >
                <span
                  className="flex items-center gap-1.5 bg-[#fbf8f0] px-3.5 py-2 text-sm text-[#15130f]"
                  style={{ clipPath: TORN }}
                >
                  <span>{next.label}</span>
                  <ArrowIcon />
                </span>
              </span>
              <CssPin seed={13} size={16} className="absolute -top-1 left-1/2 -translate-x-1/2" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
