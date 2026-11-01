"use client";

import * as THREE from "three";

// ---- SVG -> texture helpers --------------------------------------------------

/**
 * Turn an SVG string into a data URL.
 *
 * A browser rasterises an SVG handed to an <img>, and three's TextureLoader is
 * an <img> underneath — so this is all a doodle needs to become a texture. The
 * SVG root MUST declare width and height, otherwise the texture comes out 0x0.
 */
export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Draw an SVG string into an offscreen canvas. Used at load for the marks that
 * need a real SVG filter (the dry-brush ring and stroke) — we bake them once so
 * nothing filtered ever runs per frame.
 */
export async function svgToCanvas(svg: string, width: number, height: number) {
  const image = new Image();
  image.src = svgDataUrl(svg);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

/**
 * ONE 1x1 plane shared by every flat decal on the board (doodles, circled
 * numbers, tape, the portrait backing and the brush ring). Each decal just
 * scales its mesh, so we never build a second geometry.
 */
export const SHARED_PLANE = new THREE.PlaneGeometry(1, 1);
