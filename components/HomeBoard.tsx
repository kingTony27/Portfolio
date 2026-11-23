"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene, { type NoteId } from "@/components/Scene";
import HeaderFooter from "@/components/HeaderFooter";
import WelcomeHeadline from "@/components/WelcomeHeadline";

// ---- The desktop 3D board ------------------------------------------------------
// Everything that needs three.js lives here, in its own module, so the Home page
// can load it with next/dynamic({ ssr: false }) and mount it ONLY on desktop.
// Phones therefore never download (or run) the 3D code at all — they get the
// plain-HTML MobileHome instead.

type HomeBoardProps = {
  openNote: NoteId | null;
  onSelectNote: (id: NoteId) => void;
  onZoomComplete: () => void;
  hintVisible: boolean;
  onSprayDone: () => void;
  wiggle: boolean;
};

export default function HomeBoard({
  openNote,
  onSelectNote,
  onZoomComplete,
  hintVisible,
  onSprayDone,
  wiggle,
}: HomeBoardProps) {
  return (
    <div className="fixed inset-0 z-20">
      {/* One Canvas for the whole home section. `flat` keeps colours un-tonemapped.
          `frameloop="demand"` only draws a frame when something asks for one
          (GSAP tweens, the ink trail, pointer moves, a resize), which keeps the
          board idle-quiet. dpr is capped at 1.5 so retina screens stay cheap. */}
      <Canvas flat camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} frameloop="demand">
        {/* Suspense covers the texture / font loading that happens inside the scene. */}
        <Suspense fallback={null}>
          <Scene
            openNote={openNote}
            onSelectNote={onSelectNote}
            onZoomComplete={onZoomComplete}
            wiggle={wiggle}
          />
        </Suspense>
      </Canvas>

      {/* Spray-painted headline + the hand-written hint. Plain HTML, so it can use
          a real CSS clamp and keeps the Sancreek font from the stylesheet. */}
      <WelcomeHeadline hintVisible={hintVisible} onSprayDone={onSprayDone} />

      {/* Screen-space strips. They dim as soon as a note starts zooming in. */}
      <HeaderFooter dimmed={openNote !== null} />
    </div>
  );
}
