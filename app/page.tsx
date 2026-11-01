"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import Scene, { type NoteId } from "@/components/Scene";
import HeaderFooter from "@/components/HeaderFooter";
import WelcomeHeadline from "@/components/WelcomeHeadline";

// ---- Home ---------------------------------------------------------------------
// One <Canvas> owns the whole board, and ALL of the zoom state lives right here.
// There is no context, no store and no module-level variable anywhere else in
// the app (app/layout.tsx only loads the font), so this component is the one and
// only source of truth for "which note is open".
//
// WHY THIS FILE HAS TO RESET EXPLICITLY
// -------------------------------------
// The app runs with `cacheComponents: true`, so navigating away from Home does
// NOT unmount this component. Next.js hides the route with React's <Activity>
// instead, and <Activity> keeps `useState` values alive. On top of that the GSAP
// zoom had already parked the camera on the note. Coming back therefore used to
// show a half-zoomed board. The fix is to reset on the way out AND on the way
// back in — the effect below does both.
export default function Home() {
  const router = useRouter();

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

  // Clicking a note starts the zoom; nothing else happens until it lands.
  // It also retires the "pick a note to start" hint for good.
  const handleSelect = useCallback((id: NoteId) => {
    setHintVisible(false);
    openNoteRef.current = id;
    setOpenNote(id);
  }, []);

  // Fired once the spray headline has settled — stable so the headline's timer
  // is never restarted by a re-render.
  const handleSprayDone = useCallback(() => setSprayDone(true), []);

  // Every note now leads to its own page: when the fly-in finishes we simply
  // navigate. (There is no "Coming soon" panel any more.)
  const handleZoomComplete = useCallback(() => {
    const id = openNoteRef.current;
    if (id === "about") router.push("/about");
    else if (id === "projects") router.push("/projects");
    else if (id === "tools") router.push("/tools");
    else if (id === "contact") router.push("/contact");
  }, [router]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-background">
      {/* One Canvas for the whole home section. `flat` keeps colours un-tonemapped.
          `frameloop="demand"` only draws a frame when something asks for one
          (GSAP tweens, the ink trail, pointer moves, a resize), which keeps the
          board idle-quiet. dpr is capped at 1.5 so retina phones stay cheap. */}
      <Canvas flat camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} frameloop="demand">
        {/* Suspense covers the texture / font loading that happens inside the scene. */}
        <Suspense fallback={null}>
          <Scene
            openNote={openNote}
            onSelectNote={handleSelect}
            onZoomComplete={handleZoomComplete}
            wiggle={sprayDone}
          />
        </Suspense>
      </Canvas>

      {/* Spray-painted headline + the hand-written hint. Plain HTML, so it can use
          a real CSS clamp and keeps the Sancreek font from the stylesheet. */}
      <WelcomeHeadline hintVisible={hintVisible} onSprayDone={handleSprayDone} />

      {/* Screen-space strips. They dim as soon as a note starts zooming in. */}
      <HeaderFooter dimmed={openNote !== null} />
    </main>
  );
}
