"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { NoteId } from "@/components/Scene";
import MobileHome from "@/components/MobileHome";

// ---- The desktop 3D board, loaded on the client and ONLY on desktop ------------
// `ssr: false` + next/dynamic means this module (and everything it pulls in:
// three.js, @react-three/fiber, the whole Scene) is never rendered on the server
// and is only fetched when Home actually mounts it — i.e. on a wide screen. On a
// phone the import is never triggered, so the 3D code is never downloaded.
const HomeBoard = dynamic(() => import("@/components/HomeBoard"), { ssr: false });

// Desktop = exactly the same breakpoint the CSS uses for `md`.
const DESKTOP_QUERY = "(min-width: 768px)";

// Subscribed to the media query; a module-scope function so its identity is stable.
const subscribeDesktop = (onChange: () => void) => {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};
// Client value: are we on a desktop-width screen?
const getDesktopSnapshot = (): boolean | null => window.matchMedia(DESKTOP_QUERY).matches;
// Server + first hydration paint: we do NOT know yet -> null. That makes the
// server output and the first client output identical (paper only), so no wrong
// layout ever mounts and there is no hydration mismatch. React switches to the
// real value straight after hydration.
const getDesktopServerSnapshot = (): boolean | null => null;

/** true on desktop, false on phones, null until the browser has told us. */
function useIsDesktop(): boolean | null {
  return useSyncExternalStore(subscribeDesktop, getDesktopSnapshot, getDesktopServerSnapshot);
}

// ---- Home ---------------------------------------------------------------------
// The page is now a thin switch:
//   * screen size unknown  -> the paper background only (no layout flash)
//   * desktop              -> the 3D board (HomeBoard), loaded on demand
//   * phone                -> the plain-HTML zigzag (MobileHome) with its CSS zoom
//
// ONLY ONE of the two layouts is mounted at a time, so the 3D scene can no longer
// steal the tap on a phone.
//
// WHY THIS FILE STILL RESETS THE BOARD EXPLICITLY
// -----------------------------------------------
// The app runs with `cacheComponents: true`, so navigating away from Home does
// NOT unmount this component — Next.js hides the route with React's <Activity>
// and keeps `useState` values alive. The GSAP zoom had already parked the camera
// on a note, so coming back used to show a half-zoomed board. The effect below
// resets on the way out AND on the way back in.
export default function Home() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // SINGLE SOURCE OF TRUTH for the whole section:
  //   openNote    -> which note the camera is flying to (null = the full board)
  //   openNoteRef -> the same value, readable inside the zoom-complete callback
  //                  WITHOUT adding it to that callback's dependencies. A stable
  //                  callback identity means the GSAP tween never restarts
  //                  mid-flight.
  const [openNote, setOpenNote] = useState<NoteId | null>(null);
  const openNoteRef = useRef<NoteId | null>(null);

  // Two one-shot flags for the headline block:
  //   hintVisible -> the "pick a note to start" line is showing (until the first click)
  //   sprayDone   -> the spray paint has finished, so the notes may wiggle once
  const [hintVisible, setHintVisible] = useState(true);
  const [sprayDone, setSprayDone] = useState(false);

  // Put the board back to rest. Setting openNote to null also re-enables all four
  // notes, because Scene derives the "clicks disabled while zoomed" flag from it.
  const resetBoard = useCallback(() => {
    openNoteRef.current = null;
    setOpenNote(null);
    setHintVisible(true);
    setSprayDone(false);
  }, []);

  // Reset on the way OUT of Home — which is also what makes the way back in
  // correct:
  //  - With <Activity> (used whenever cacheComponents is on) navigating away
  //    does NOT unmount this component, it HIDES it and runs this cleanup. So by
  //    the time Home is shown again (header Home icon, browser Back, browser
  //    Forward) the board already reads "no note open".
  //  - A real unmount runs the same cleanup.
  // The effect BODY deliberately does nothing: on a fresh mount the state is
  // already the full view, so there is nothing to correct. (Running the setter
  // from a cleanup keeps the board in step without a render-cascading effect.)
  useEffect(() => resetBoard, [resetBoard]);

  // Browsers can also restore the whole page from the back/forward cache without
  // running any React code at all. `event.persisted` tells us that happened, so
  // we reset then too. (Back and Forward inside the app are already covered by
  // the cleanup above.)
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetBoard();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetBoard]);

  // Clicking a note (desktop) starts the zoom; nothing else happens until it lands.
  // It also retires the "pick a note to start" hint for good.
  const handleSelect = useCallback((id: NoteId) => {
    setHintVisible(false);
    openNoteRef.current = id;
    setOpenNote(id);
  }, []);

  // Fired once the spray headline has settled — stable so the headline's timer
  // is never restarted by a re-render.
  const handleSprayDone = useCallback(() => setSprayDone(true), []);

  // Desktop only: when the fly-in finishes we navigate to that note's page. (The
  // phone layout in MobileHome.tsx does its own navigation; this never runs there
  // because HomeBoard is not mounted.)
  const handleZoomComplete = useCallback(() => {
    const id = openNoteRef.current;
    if (id === "about") router.push("/about");
    else if (id === "projects") router.push("/projects");
    else if (id === "tools") router.push("/tools");
    else if (id === "contact") router.push("/contact");
  }, [router]);

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background md:h-dvh md:overflow-hidden">
      {isDesktop === null ? (
        // Screen size not known yet (server render + the first client paint). Show
        // only the paper so neither layout mounts for a moment by mistake.
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-[#f5f2ea] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/paper_bg.webp')" }}
        />
      ) : isDesktop ? (
        <HomeBoard
          openNote={openNote}
          onSelectNote={handleSelect}
          onZoomComplete={handleZoomComplete}
          hintVisible={hintVisible}
          onSprayDone={handleSprayDone}
          wiggle={sprayDone}
        />
      ) : (
        <MobileHome hintVisible={hintVisible} onSprayDone={handleSprayDone} />
      )}
    </main>
  );
}
