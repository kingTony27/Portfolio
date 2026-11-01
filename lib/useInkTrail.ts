"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---- Ink trail --------------------------------------------------------------
// Owns the small offscreen canvas that records pointer motion, plus the
// THREE.CanvasTexture the shader reads. Nothing here touches the portrait mesh —
// it only produces the motion map.
//
// The canvas stores MOTION, not colour:
//   red   = horizontal velocity, centred on 128 (128 = not moving)
//   green = vertical velocity,   centred on 128 (128 = not moving)
//   blue  = strength, 0 = no motion ... 255 = just moved fast
// Every frame we paint the whole canvas in the neutral colour rgb(128,128,0) at a
// low alpha, which lets the motion decay back to "nothing is happening".

const NEUTRAL = "rgb(128, 128, 0)";

// How long we keep fading/uploading after the last pointer movement, in ms.
// Once this has passed the trail is fully neutral and we stop all work (no CPU,
// no texture upload) until the pointer moves again — this is the battery saving.
const IDLE_MS = 1500;

export type InkTrailOptions = {
  enabled: boolean;
  resWidth: number; // trail canvas width in px (128 on phones, 256 elsewhere)
  resAspect: number; // width / height of the portrait, so the map lines up
  fade: number; // 0..1 painted per frame — how quickly the motion decays
  brushRadius: number; // 0..1 of the canvas width — size of the painted blob
  velocityGain: number; // how strongly raw pointer movement becomes velocity
  velocitySmoothing: number; // 0..1 — higher = smoother (and laggier) velocity
};

export type InkTrailHandle = {
  texture: THREE.CanvasTexture;
  move: (u: number, v: number) => void; // record a pointer position (uv, 0..1)
  out: () => void; // pointer left the portrait — end the stroke
};

// The three things the pointer handlers and the frame loop keep writing to: the
// canvas, its 2D context, and the GPU texture that mirrors it.
type InkSurface = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
};

// ---- the only code that ever touches the canvas -----------------------------
// The canvas is imperative by nature: it is painted many times per second and
// must NOT trigger a React re-render. So every write lives in these plain
// functions at module scope, and the component only ever calls them.

function createInkSurface(): InkSurface {
  const canvas = document.createElement("canvas");
  // alpha:false keeps the stored bytes exactly as written, with no
  // premultiplication for the shader to undo.
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const texture = new THREE.CanvasTexture(canvas);
  // NoColorSpace + LinearFilter + no mipmaps: the shader must read the exact
  // numbers we painted — no sRGB conversion, no blurring, no downscaling.
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { canvas, ctx, texture };
}

// Resizing the canvas also clears it (and its context state), so repaint after.
function resizeInkSurface(surface: InkSurface, width: number, height: number) {
  surface.canvas.width = Math.max(2, Math.round(width));
  surface.canvas.height = Math.max(2, Math.round(height));
}

// Flood the whole map with one colour and hand it to the GPU.
function fillInkSurface(surface: InkSurface, color: string) {
  const { canvas, ctx, texture } = surface;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  texture.needsUpdate = true;
}

// Stamp one soft blob of "motion" under the pointer.
function stampInkBrush(
  surface: InkSurface,
  x: number,
  y: number,
  radius: number,
  red: number,
  green: number,
) {
  const { ctx, texture } = surface;
  // A radial gradient so the motion fades out at the edge of the brush.
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${red}, ${green}, 255, 1)`); // full strength
  gradient.addColorStop(1, `rgba(${red}, ${green}, 255, 0)`); // nothing
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  texture.needsUpdate = true;
}

export function useInkTrail(options: InkTrailOptions): InkTrailHandle {
  const { enabled, resWidth, resAspect, fade, brushRadius, velocityGain, velocitySmoothing } =
    options;

  // One canvas + context + texture for the lifetime of the component. We resize
  // the canvas in place instead of replacing it, so the shader uniform never has
  // to be swapped. Created on the client only (this runs inside <Canvas>).
  const surface = useMemo(() => createInkSurface(), []);

  // The canvas runs with `frameloop="demand"`, so anything that changes what is
  // on screen has to ask for a frame. Every write below ends with invalidate().
  const invalidate = useThree((s) => s.invalidate);

  // ---- values the frame loop reads ------------------------------------------
  // Refs, not state: these change every frame and must not trigger re-renders.
  const lastUv = useRef<{ u: number; v: number } | null>(null);
  const velocity = useRef({ x: 0, y: 0 });
  const activeUntil = useRef(0); // ms timestamp; in the past = nothing to do
  const dirty = useRef(false); // true while the canvas is not perfectly neutral

  // Free the GPU texture when the portrait really goes away.
  useEffect(() => () => surface.texture.dispose(), [surface]);

  // Wipe the canvas back to "nothing is moving" and forget the stroke.
  const reset = useCallback(() => {
    fillInkSurface(surface, NEUTRAL);
    lastUv.current = null;
    velocity.current = { x: 0, y: 0 };
    dirty.current = false;
    activeUntil.current = 0;
  }, [surface]);

  // (Re)size the canvas to the requested resolution, then repaint it neutral.
  useEffect(() => {
    resizeInkSurface(surface, resWidth, resWidth / resAspect);
    reset();
  }, [surface, resWidth, resAspect, reset]);

  // Whenever the effect is off (a note is zoomed in, or reduced motion is on) go
  // back to a neutral trail, so the shader behaves as a plain pass-through.
  useEffect(() => {
    if (enabled) return;
    reset();
  }, [enabled, reset]);

  // Record one pointer position and paint a soft blob of "motion" there.
  const move = useCallback(
    (u: number, v: number) => {
      if (!enabled) return;

      const previous = lastUv.current;
      lastUv.current = { u, v };

      // Velocity = how far the pointer moved since the last event. The first
      // event of a stroke has nothing to compare with, so velocity stays 0.
      if (previous) {
        const dx = (u - previous.u) * velocityGain;
        const dy = (v - previous.v) * velocityGain;
        // Smoothing blends the new sample into the old one, damping jitter.
        velocity.current.x += (dx - velocity.current.x) * velocitySmoothing;
        velocity.current.y += (dy - velocity.current.y) * velocitySmoothing;
      }

      // Clamp to 1 so the colour channel stays inside 0..255.
      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      if (speed > 1) {
        velocity.current.x /= speed;
        velocity.current.y /= speed;
      }

      const { width, height } = surface.canvas;
      const radius = Math.max(2, brushRadius * width);
      const x = u * width;
      const y = (1 - v) * height; // uv.y counts up, canvas y counts down

      const red = Math.round(128 + velocity.current.x * 127);
      const green = Math.round(128 + velocity.current.y * 127);

      stampInkBrush(surface, x, y, radius, red, green);

      dirty.current = true;
      activeUntil.current = performance.now() + IDLE_MS;
      invalidate(); // draw the newly stamped trail
    },
    [enabled, surface, brushRadius, velocityGain, velocitySmoothing, invalidate],
  );

  // Pointer left the portrait: end the stroke so the next one starts fresh.
  const out = useCallback(() => {
    lastUv.current = null;
    velocity.current = { x: 0, y: 0 };
  }, []);

  // The per-frame work: fade the trail, upload it, and stop once it is neutral.
  // While the trail is not neutral we ask for the next frame; the moment it is,
  // `dirty` goes false and the loop parks until the pointer moves again.
  useFrame(() => {
    if (!enabled || !dirty.current) return;

    if (performance.now() < activeUntil.current) {
      // Paint the neutral colour at a low alpha — the motion decays smoothly.
      fillInkSurface(surface, `rgba(128, 128, 0, ${fade})`);
    } else {
      // Idle long enough: snap the last few percent to exactly neutral and stop.
      reset();
    }

    invalidate(); // keep drawing until the trail has fully settled
  });

  return { texture: surface.texture, move, out };
}
