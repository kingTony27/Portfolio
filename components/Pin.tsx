"use client";

import { useMemo } from "react";
import * as THREE from "three";

// ---- Shared 3D resources -----------------------------------------------------
// One geometry set + one material per colour, built once and reused by every pin
// on the board. This is what keeps 8+ pins cheap.

// The domed head is a sphere that we squash along its own axis (see `scale` below).
const HEAD_GEO = new THREE.SphereGeometry(0.05, 24, 16);
// The little neck between the head and the paper.
const COLLAR_GEO = new THREE.CylinderGeometry(0.028, 0.033, 0.045, 20);
// The flat disc that rests against the paper.
const RIM_GEO = new THREE.CylinderGeometry(0.042, 0.042, 0.012, 24);

export type PinColor = "black" | "darkGrey" | "white" | "silver";

// One glossy material per colour. roughness 0.25 gives a tight, specular
// highlight so the pin "catches the light". Silver gets high metalness.
const MATERIALS: Record<PinColor, THREE.MeshStandardMaterial> = {
  black: new THREE.MeshStandardMaterial({ color: "#17150f", roughness: 0.25, metalness: 0.35 }),
  darkGrey: new THREE.MeshStandardMaterial({ color: "#3c3a36", roughness: 0.28, metalness: 0.3 }),
  white: new THREE.MeshStandardMaterial({ color: "#ece9df", roughness: 0.22, metalness: 0.05 }),
  silver: new THREE.MeshStandardMaterial({ color: "#c4c7cd", roughness: 0.16, metalness: 0.9 }),
};

// Tiny deterministic pseudo-random so a pin's tilt never changes between renders.
function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Soft, blurry round shadow drawn on a canvas (no external image). */
function createShadowTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.6, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Lazily built (needs the DOM) and then shared by every pin.
let shadowTexture: THREE.CanvasTexture | null = null;
function getShadowTexture() {
  if (!shadowTexture) shadowTexture = createShadowTexture();
  return shadowTexture;
}

type PinProps = {
  color?: PinColor;
  seed?: number; // drives the random "pushed in by hand" tilt
  scale?: number;
};

/**
 * A reusable 3D push pin. It stands with its axis along +Z (the board faces the
 * camera), so a parent only has to place it at the right X/Y on a note.
 */
export default function Pin({ color = "black", seed = 0, scale = 1 }: PinProps) {
  const shadow = getShadowTexture();
  const material = MATERIALS[color];

  // Two small leans (5–12°, each in a random direction) so no two pins match.
  const tilt = useMemo(() => {
    const a = THREE.MathUtils.degToRad(5 + rand(seed + 1) * 7);
    const b = THREE.MathUtils.degToRad(5 + rand(seed + 2) * 7);
    return [rand(seed + 3) > 0.5 ? a : -a, rand(seed + 4) > 0.5 ? b : -b] as [number, number];
  }, [seed]);

  return (
    <group scale={scale}>
      {/* Flat blurred shadow on the paper, nudged down-right. Kept outside the
          tilt group so the shadow always stays flat on the board. */}
      <mesh position={[0.03, -0.03, -0.012]} raycast={() => null}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.35}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* The body leans a little, as if pushed in by hand. `raycast` is off on
          every part so clicks fall straight through to the note underneath. */}
      <group rotation={[tilt[0], tilt[1], 0]}>
        {/* rim: flat disc against the paper (rotated so its axis is +Z) */}
        <mesh
          geometry={RIM_GEO}
          material={material}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.006]}
          raycast={() => null}
        />
        {/* collar: the neck under the head */}
        <mesh
          geometry={COLLAR_GEO}
          material={material}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.026]}
          raycast={() => null}
        />
        {/* head: sphere squashed on Z so it reads as a domed pin cap */}
        <mesh
          geometry={HEAD_GEO}
          material={material}
          position={[0, 0, 0.076]}
          scale={[1, 1, 0.62]}
          raycast={() => null}
        />
      </group>
    </group>
  );
}
