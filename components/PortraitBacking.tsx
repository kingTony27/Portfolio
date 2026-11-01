"use client";

import { use, useMemo } from "react";
import * as THREE from "three";
import Tape from "./Tape";
import { SHARED_PLANE } from "@/lib/svgTexture";
import {
  BORDER_RADIUS_RATIO,
  PORTRAIT_ASPECT,
  PORTRAIT_HEIGHT,
  PORTRAIT_WIDTH,
  loadPortraitData,
} from "@/lib/portrait";

// ---- White paper backing -----------------------------------------------------
// The portrait is a cut-out, so it has no edge of its own. We paint its
// silhouette in paper white 24 times around a small circle to build a slightly
// uneven, hand-cut border, plus a soft shadow that falls down and to the right.
// Everything is drawn ONCE into an offscreen canvas at load and used as a
// texture on one plane that sits right behind the portrait.

const CANVAS_W = 640; // the border is soft, so it does not need the full artwork size
const OFFSETS = 24; // stamps around the circle that build the border
const PAPER = "#f7f4ec"; // the artwork's ivory tone — tints the white mask

function buildBackingTexture(mask: HTMLCanvasElement) {
  const width = CANVAS_W;
  const height = Math.round(CANVAS_W / PORTRAIT_ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const radius = BORDER_RADIUS_RATIO * height; // ~20 px at full size, in canvas px

  // 1) A solid copy of the silhouette, to be used as the shadow's source.
  const solid = document.createElement("canvas");
  solid.width = width;
  solid.height = height;
  const sctx = solid.getContext("2d")!;
  sctx.drawImage(mask, 0, 0, width, height);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "rgba(0,0,0,0.5)";
  sctx.fillRect(0, 0, width, height);

  // 2) The soft shadow: the same shape, blurred and nudged down and to the right.
  ctx.save();
  ctx.filter = `blur(${Math.round(radius * 0.55)}px)`;
  ctx.drawImage(solid, radius * 0.45, radius * 0.7, width, height);
  ctx.restore();

  // 3) The border itself: the silhouette stamped all around a small circle. The
  //    radius wobbles a little so the paper edge is not a perfect outline.
  for (let i = 0; i < OFFSETS; i++) {
    const angle = (i / OFFSETS) * Math.PI * 2;
    const wobble = 0.78 + Math.random() * 0.44;
    ctx.drawImage(mask, Math.cos(angle) * radius * wobble, Math.sin(angle) * radius * wobble, width, height);
  }

  // 4) Cut the portrait back out, so the white only remains as a border ring.
  ctx.globalCompositeOperation = "destination-out";
  ctx.drawImage(mask, 0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function PortraitBacking() {
  // The silhouette is read from the artwork's alpha once, for the whole app.
  const { mask } = use(loadPortraitData());

  // Built a single time per portrait — the canvas work above never runs again.
  const texture = useMemo(() => buildBackingTexture(mask), [mask]);

  return (
    <group position={[0, 0, -0.03]}>
      {/* The paper border + shadow. Decoration only, so it never takes a click. */}
      <mesh geometry={SHARED_PLANE} scale={[PORTRAIT_WIDTH, PORTRAIT_HEIGHT, 1]} raycast={() => null}>
        <meshBasicMaterial
          map={texture}
          color={PAPER}
          transparent
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* One piece of tape holding the backing to the board, top-left corner. */}
      <group position={[-PORTRAIT_WIDTH * 0.5 + 0.42, PORTRAIT_HEIGHT * 0.5 - 0.55, 0.005]}>
        <Tape width={0.62} height={0.2} rotation={-0.55} />
      </group>
    </group>
  );
}
