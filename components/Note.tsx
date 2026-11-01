"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Text, useTexture } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import Pin, { type PinColor } from "./Pin";
import Tape from "./Tape";
import { SHARED_PLANE, svgDataUrl } from "@/lib/svgTexture";
import { NOTE_DOODLE_SVG, NOTE_NUMBER_RING_SVG } from "./noteArt";
import {
  NOTE_CORNER_X,
  NOTE_CORNER_Y,
  NOTE_DECOR,
  NOTE_HEIGHT,
  NOTE_WIDTH,
  type NoteId,
} from "./Scene";

// Mix of pin-head colours around the board: black, silver, dark grey and white.
const NOTE_PIN_COLOR: Record<NoteId, PinColor> = {
  about: "black",
  projects: "silver",
  tools: "darkGrey",
  contact: "white",
};
// A stable "random" seed per note so each pin tilts differently but never jitters.
const NOTE_PIN_SEED: Record<NoteId, number> = { about: 1, projects: 2, tools: 3, contact: 4 };

// ---- Note internals, in the note's own units ---------------------------------
const DOODLE_SIZE = 0.32; // the little ink drawing above the label
const DOODLE_Y = 0.2;
const LABEL_Y = -0.06;
const SUBLINE_Y = -0.28;
const SUBLINE_SIZE = 0.072;
const NUMBER_SIZE = 0.3; // the circled 01–04 in the top corner
const NUMBER_FONT = 0.12;
const TAPE_W = 0.56;
const TAPE_H = 0.19;
const HOVER_Z = 0.3; // how far a note lifts toward the camera
const HOVER_SCALE = 1.05;
const WIGGLE_DEGREES = 1.5; // the one-time "look at me" tilt after the spray
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Draws a torn paper note on a 2D canvas and returns it as a three.js texture.
 * Canvas gives us the "hand made" look (jagged edges + soft drop shadow) without
 * needing an extra image asset. The canvas is transparent outside the paper.
 *
 * Built ONCE and shared by all four notes (see getPaperTexture below).
 */
function createTornPaperTexture() {
  const w = 512;
  const h = 352;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Build a jagged outline by walking all four edges and jittering every point.
  const inset = 30;
  const steps = 16;
  const jag = (v: number) => v + (Math.random() - 0.5) * 18;
  const points: [number, number][] = [];

  for (let i = 0; i <= steps; i++) points.push([inset + (i / steps) * (w - inset * 2), jag(inset)]);
  for (let i = 1; i <= steps; i++) points.push([jag(w - inset), inset + (i / steps) * (h - inset * 2)]);
  for (let i = 1; i <= steps; i++) points.push([w - inset - (i / steps) * (w - inset * 2), jag(h - inset)]);
  for (let i = 1; i < steps; i++) points.push([jag(inset), h - inset - (i / steps) * (h - inset * 2)]);

  const tracePath = () => {
    ctx.beginPath();
    points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };

  // 1) Soft drop shadow behind the note.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 9;
  ctx.fillStyle = "#000";
  tracePath();
  ctx.fill();
  ctx.restore();

  // 2) The paper itself.
  ctx.fillStyle = "#f3eee2";
  tracePath();
  ctx.fill();

  // 3) Faint paper grain, clipped so it never leaks past the torn edge.
  ctx.save();
  tracePath();
  ctx.clip();
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillStyle = `rgba(90,80,60,${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; // sRGB so colours stay true
  texture.anisotropy = 4;
  return texture;
}

// One paper texture for the whole board — never rebuilt per note or per render.
let paperTexture: THREE.CanvasTexture | null = null;
function getPaperTexture() {
  if (!paperTexture) paperTexture = createTornPaperTexture();
  return paperTexture;
}

/** Rasterised SVGs must be told they are sRGB, or the ink reads too light. */
function srgb(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type NoteProps = {
  id: NoteId;
  label: string;
  subline: string;
  position: [number, number]; // x / y in world units
  tilt: number; // degrees of rotation so it looks hand-pinned
  index: number; // 0..3 — drives the number and the wiggle stagger
  disabled: boolean; // true while another note is zoomed in
  wiggle: boolean; // true once the headline spray has settled
  showSubline: boolean; // false on phones, where space is tight
  onSelect: (id: NoteId) => void;
};

export default function Note({
  id,
  label,
  subline,
  position,
  tilt,
  index,
  disabled,
  wiggle,
  showSubline,
  onSelect,
}: NoteProps) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  // The note's resting tilt, in radians — every tween returns here.
  const baseRotation = useMemo(() => THREE.MathUtils.degToRad(tilt), [tilt]);

  const paper = getPaperTexture();
  // Each doodle and the number ring are tiny SVGs; drei caches them by URL, so
  // every note builds its texture exactly once for the lifetime of the page.
  const doodle = useTexture(svgDataUrl(NOTE_DOODLE_SVG[id]), srgb);
  const numberRing = useTexture(svgDataUrl(NOTE_NUMBER_RING_SVG), srgb);

  // Corner positions from the shared table in Scene.tsx.
  const decor = NOTE_DECOR[id];
  const pinX = decor.pin[0] * NOTE_CORNER_X;
  const pinY = decor.pin[1] * NOTE_CORNER_Y;
  const tapeX = decor.tape[0] * (NOTE_WIDTH * 0.5 - 0.3);
  const tapeY = decor.tape[1] * (NOTE_HEIGHT * 0.5 - 0.26);
  const numX = decor.number[0] * (NOTE_WIDTH * 0.5 - 0.26);
  const numY = decor.number[1] * (NOTE_HEIGHT * 0.5 - 0.26);

  // ---- Hover -----------------------------------------------------------------
  // Plain GSAP on refs: lifting a note never re-renders React (or the scene).
  const hoverIn = useCallback(() => {
    const g = group.current;
    if (!g || disabled) return;
    document.body.style.cursor = "pointer";
    gsap.to(g.position, { z: HOVER_Z, duration: 0.3, ease: "power2.out", onUpdate: invalidate });
    gsap.to(g.scale, {
      x: HOVER_SCALE,
      y: HOVER_SCALE,
      duration: 0.3,
      ease: "power2.out",
      onUpdate: invalidate,
    });
  }, [disabled, invalidate]);

  const hoverOut = useCallback(() => {
    const g = group.current;
    if (!g) return;
    document.body.style.cursor = "auto";
    gsap.to(g.position, { z: 0, duration: 0.3, ease: "power2.out", onUpdate: invalidate });
    gsap.to(g.scale, { x: 1, y: 1, duration: 0.3, ease: "power2.out", onUpdate: invalidate });
  }, [invalidate]);

  // Only react to the pointer when this note is allowed to be clicked.
  const handleOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      if (!disabled) hoverIn();
    },
    [disabled, hoverIn],
  );

  const handleOut = useCallback(() => hoverOut(), [hoverOut]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (disabled) return;
      hoverOut(); // settle the note while the camera zooms in
      onSelect(id);
    },
    [disabled, hoverOut, onSelect, id],
  );

  // ---- The one-time wiggle ----------------------------------------------------
  // Runs a single 0.6s wobble once the spray headline has finished, staggered
  // 0.1s per note. Skipped entirely for reduced motion.
  useEffect(() => {
    const g = group.current;
    if (!g || !wiggle) return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    const rad = THREE.MathUtils.degToRad(WIGGLE_DEGREES);
    const timeline = gsap
      .timeline({ delay: index * 0.1 })
      .to(g.rotation, {
        z: baseRotation + rad,
        duration: 0.15,
        ease: "sine.inOut",
        onUpdate: invalidate,
      })
      .to(g.rotation, {
        z: baseRotation - rad,
        duration: 0.3,
        ease: "sine.inOut",
        onUpdate: invalidate,
      })
      .to(g.rotation, {
        z: baseRotation,
        duration: 0.15,
        ease: "sine.inOut",
        onUpdate: invalidate,
      });

    return () => {
      timeline.kill();
      g.rotation.z = baseRotation;
    };
  }, [wiggle, index, baseRotation, invalidate]);

  // Restore the cursor and stop any tweens when the board is torn down.
  useEffect(() => {
    const g = group.current;
    return () => {
      document.body.style.cursor = "auto";
      if (!g) return;
      gsap.killTweensOf(g.position);
      gsap.killTweensOf(g.scale);
      gsap.killTweensOf(g.rotation);
    };
  }, []);

  return (
    // The group is positioned/rotated once; GSAP only tweens its z, scale and
    // rotation — React state is never involved.
    <group ref={group} position={[position[0], position[1], 0]} rotation={[0, 0, baseRotation]}>
      {/* Torn paper surface — this is also the clickable hit area. */}
      <mesh onPointerOver={handleOver} onPointerOut={handleOut} onClick={handleClick}>
        <planeGeometry args={[NOTE_WIDTH, NOTE_HEIGHT]} />
        <meshBasicMaterial map={paper} transparent toneMapped={false} />
      </mesh>

      {/* Doodle, label and subline, centred as one little stack. All of them are
          decorations, so the pointer passes straight through to the paper. */}
      <mesh
        geometry={SHARED_PLANE}
        position={[0, DOODLE_Y, 0.012]}
        scale={[DOODLE_SIZE, DOODLE_SIZE, 1]}
        raycast={() => null}
      >
        <meshBasicMaterial map={doodle} transparent toneMapped={false} depthWrite={false} />
      </mesh>

      <Text
        font="/fonts/Sancreek-Regular.ttf"
        fontSize={0.16}
        color="#15130f"
        anchorX="center"
        anchorY="middle"
        maxWidth={NOTE_WIDTH * 0.72}
        textAlign="center"
        position={[0, LABEL_Y, 0.02]}
      >
        {label}
      </Text>

      {showSubline && (
        <Text
          font="/fonts/Sancreek-Regular.ttf"
          fontSize={SUBLINE_SIZE}
          color="#4a453c"
          anchorX="center"
          anchorY="middle"
          maxWidth={NOTE_WIDTH * 0.72}
          textAlign="center"
          position={[0, SUBLINE_Y, 0.02]}
        >
          {subline}
        </Text>
      )}


      {/* Masking tape on the corner opposite the pin. */}
      <group position={[tapeX, tapeY, 0.014]}>
        <Tape width={TAPE_W} height={TAPE_H} rotation={decor.tape[0] * 0.42} opacity={0.9} />
      </group>

      {/* Real 3D push pin, on the corner nearest the portrait — which is where
          the string from the board starts, so it never crosses the label. */}
      <group position={[pinX, pinY, 0.02]}>
        <Pin color={NOTE_PIN_COLOR[id]} seed={NOTE_PIN_SEED[id]} />
      </group>
    </group>
  );
}
