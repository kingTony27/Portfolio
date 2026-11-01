"use client";

import * as THREE from "three";
import { SHARED_PLANE } from "@/lib/svgTexture";

// ---- Masking tape ------------------------------------------------------------
// One torn tape texture, built once and shared by every piece of tape on the
// board (the notes, the portrait backing and the name tag). The canvas is
// transparent outside the strip, so the tape sits on top of whatever is behind it.

const TAPE_W = 512;
const TAPE_H = 100;
const EDGE = 12; // how far the torn edges wander inwards

let cache: THREE.CanvasTexture | null = null;

function buildTapeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TAPE_W;
  canvas.height = TAPE_H;
  const ctx = canvas.getContext("2d")!;

  // Walk the two long edges, jittering every point so the strip looks torn.
  const jag = () => (Math.random() - 0.5) * EDGE;
  const steps = 44;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * TAPE_W;
    const y = EDGE + jag();
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const x = (i / steps) * TAPE_W;
    ctx.lineTo(x, TAPE_H - EDGE + jag());
  }
  ctx.closePath();

  // Semi-transparent masking-tape colour, so the paper shows through.
  ctx.fillStyle = "rgba(233, 226, 206, 0.74)";
  ctx.fill();

  // A few faint fibres, clipped to the strip.
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * TAPE_W;
    const y = Math.random() * TAPE_H;
    ctx.fillStyle = `rgba(120,110,90,${Math.random() * 0.06})`;
    ctx.fillRect(x, y, 2.2, 1);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function getTapeTexture() {
  if (!cache) cache = buildTapeTexture();
  return cache;
}

type TapeProps = {
  width: number; // world units
  height: number; // world units
  rotation?: number; // radians, around Z
  opacity?: number;
};

/** A strip of torn masking tape. Decoration only — it never catches clicks. */
export default function Tape({ width, height, rotation = 0, opacity = 1 }: TapeProps) {
  return (
    <mesh
      geometry={SHARED_PLANE}
      scale={[width, height, 1]}
      rotation={[0, 0, rotation]}
      raycast={() => null}
    >
      <meshBasicMaterial
        map={getTapeTexture()}
        transparent
        opacity={opacity}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
