"use client";

import * as THREE from "three";
import { svgToCanvas } from "./svgTexture";

// ---- Dry-brush marks ---------------------------------------------------------
// The dark anchor ring behind the portrait and the short stroke under the name
// tag both need a torn, gritty edge. That is an SVG feTurbulence +
// feDisplacementMap filter — far too expensive to run every frame, so each mark
// is rasterised into an offscreen canvas ONCE at load and then handed to
// three.js as a plain texture. Nothing filtered runs at runtime.

const INK = "#15130f";

// Reference size for both marks: at 1440x900 the portrait is drawn 577 px tall,
// so "32 px" of stroke is 32 / 577 of the portrait's height.
const TEX = 1024; // ring texture is square
const STROKE_W = 47; // 32 px of real stroke, converted into texture pixels
const OUTER = TEX * 0.94; // the ring's outer edge, leaving a margin in the texture
const RING_R = (OUTER - STROKE_W) / 2; // 458
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
const GAP = CIRCUMFERENCE * 0.1; // one small gap in the ring

// A single circle stroke, dashed so it has a gap, pushed through a turbulence
// filter so the edges break up like a dry brush dragged across paper.
const RING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${TEX}" height="${TEX}" viewBox="0 0 ${TEX} ${TEX}">
  <defs>
    <filter id="dry" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.013 0.019" numOctaves="4" seed="9" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="42" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <circle cx="${TEX / 2}" cy="${TEX / 2}" r="${RING_R}" fill="none" stroke="${INK}"
          stroke-width="${STROKE_W}" stroke-linecap="round"
          stroke-dasharray="${(CIRCUMFERENCE - GAP).toFixed(1)} ${GAP.toFixed(1)}"
          stroke-dashoffset="1150" filter="url(#dry)"/>
</svg>`;

const STROKE_TEX_W = 512;
const STROKE_TEX_H = 160;

// A short, thick, gently curved mark — the underline under the name tag.
const STROKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${STROKE_TEX_W}" height="${STROKE_TEX_H}" viewBox="0 0 ${STROKE_TEX_W} ${STROKE_TEX_H}">
  <defs>
    <filter id="dry" x="-15%" y="-45%" width="130%" height="190%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="3" seed="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <path d="M56 96 Q 256 46 456 92" fill="none" stroke="${INK}" stroke-width="30"
        stroke-linecap="round" filter="url(#dry)"/>
</svg>`;

function textureFrom(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

let ringCache: Promise<THREE.CanvasTexture> | null = null;
let strokeCache: Promise<THREE.CanvasTexture> | null = null;

/** The dry-brush ring, baked once. */
export function loadRingTexture() {
  if (!ringCache) {
    ringCache = svgToCanvas(RING_SVG, TEX, TEX).then(textureFrom);
  }
  return ringCache;
}

/** The short brush stroke under the name tag, baked once. */
export function loadStrokeTexture() {
  if (!strokeCache) {
    strokeCache = svgToCanvas(STROKE_SVG, STROKE_TEX_W, STROKE_TEX_H).then(textureFrom);
  }
  return strokeCache;
}
