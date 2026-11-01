"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTexture } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { useInkTrail } from "@/lib/useInkTrail";
import { inkFragmentShader, inkVertexShader } from "@/components/ink/inkShader";

// ---- Ink portrait -----------------------------------------------------------
// The portrait plane is still completely static (same size, position, texture,
// transparency and draw order as before). The only difference is that a custom
// shader can drag the ink pixels around near the cursor; the plane itself never
// moves, scales or rotates. See components/ink/inkShader.ts for how.

// ---- Tuning constants -------------------------------------------------------
// Feel free to change these numbers — they are the whole "feel" of the effect.

// STRENGTH — how far the ink is pushed, in uv units (1.0 = the whole width).
// 0 = effect off. Raise for a wilder, more liquid smear; lower for a subtle nudge.
const STRENGTH = 0.035;

// BRUSH_RADIUS — size of the area the cursor affects, as a fraction of the
// portrait's WIDTH (0.12 ≈ one eighth). Raise to drag a bigger patch of ink;
// lower to make the effect a thin pen nib.
const BRUSH_RADIUS = 0.12;

// FADE — how much of the neutral colour is painted over the trail every frame
// (0..1). Higher = the ink snaps back almost instantly; lower = a long, syrupy
// trail that lingers. 0 would never settle.
const FADE = 0.05;

// VELOCITY_SMOOTHING — 0..1. How much of each new movement sample is mixed in.
// Higher = smoother and steadier but laggier; lower = twitchy, reacts instantly.
const VELOCITY_SMOOTHING = 0.35;

// INK_DARKEN — extra darkening where the trail is strongest (0..1).
// Raise for heavy ink pooling under the cursor; 0 to switch it off completely.
const INK_DARKEN = 0.1;

// TRAIL_RES — width in px of the offscreen motion canvas. Bigger = finer trail
// detail but more work per frame; smaller = cheaper and blurrier. It is only ever
// uploaded to the GPU while the pointer is moving, so it stays cheap.
const TRAIL_RES = 256;
const TRAIL_RES_PHONE = 128; // phones get a smaller map (see the brief)

// Velocity is measured in uv units per pointer event, which is a very small
// number, so we scale it up before using it as a colour.
const VELOCITY_GAIN = 14;

// The portrait keeps exactly the geometry it had before.
const PORTRAIT_HEIGHT = 3.6;
const PORTRAIT_ASPECT = 0.72; // width / height of the source image

// Below this canvas width we treat the device as a phone.
const PHONE_WIDTH = 768;

// ---- prefers-reduced-motion -------------------------------------------------
// Declared at module scope so the subscribe function never changes identity.
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
const getReducedMotionServer = () => false;

export default function InkPortrait({ enabled = true }: { enabled?: boolean }) {
  // Same transparent ink artwork as before. sRGB keeps the greys true.
  const portrait = useTexture("/images/tman_portrait_ink.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  const viewWidth = useThree((s) => s.size.width);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  // The effect runs only on the full board, and never when motion is unwelcome.
  const active = enabled && !reducedMotion;

  const { texture: trailTexture, move, out } = useInkTrail({
    enabled: active,
    resWidth: viewWidth < PHONE_WIDTH ? TRAIL_RES_PHONE : TRAIL_RES,
    resAspect: PORTRAIT_ASPECT,
    fade: FADE,
    brushRadius: BRUSH_RADIUS,
    velocityGain: VELOCITY_GAIN,
    velocitySmoothing: VELOCITY_SMOOTHING,
  });

  // The uniform objects are created once and then mutated in place: three keeps
  // the object it saw at compile time, so replacing the whole object would not be
  // picked up. Both textures are stable for the component's lifetime.
  const uniforms = useMemo(
    () => ({
      uTexture: { value: portrait },
      uTrail: { value: trailTexture },
      uStrength: { value: STRENGTH },
      uInkDarken: { value: INK_DARKEN },
    }),
    [portrait, trailTexture],
  );

  // R3F gives us the pointer position as `uv` (0..1 across the plane). We just
  // hand it to the trail; we never stopPropagation, so the notes keep working.
  const handleMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!event.uv) return;
      move(event.uv.x, event.uv.y);
    },
    [move],
  );

  const planeWidth = PORTRAIT_HEIGHT * PORTRAIT_ASPECT;

  return (
    // Same flat plane at the centre of the scene. Nothing moves it — the cursor
    // only changes which pixel of the texture each pixel shows.
    <mesh
      position={[0, 0, 0]}
      onPointerMove={active ? handleMove : undefined}
      onPointerOut={active ? out : undefined}
    >
      <planeGeometry args={[planeWidth, PORTRAIT_HEIGHT]} />
      {/* transparent keeps the PNG's alpha; toneMapped={false} and the shader's
          own colour-space step keep the idle colours identical to before. */}
      <shaderMaterial
        vertexShader={inkVertexShader}
        fragmentShader={inkFragmentShader}
        uniforms={uniforms}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}
