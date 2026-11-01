"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getCurrentYear } from "@/lib/year";

// ---- Detective-board clutter ------------------------------------------------
// Everything here is drawn by hand on a 2D canvas (no image files) or written
// with Drei's <Text> so it uses the real Sancreek font. Each piece is a small
// plane sitting just above the paper, near the edges so it never covers the
// portrait or the four main notes.

const FONT = "/fonts/Sancreek-Regular.ttf";
const Z = 0.015;

/** Helper: draw on a canvas and hand back a ready-to-use three.js texture. */
function makeTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Rough "ink pen" stroke style used by most of the sketches. */
function ink(ctx: CanvasRenderingContext2D, w = 2.5, color = "rgba(28,26,22,0.8)") {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

// Deterministic pseudo-random — React forbids Math.random during render, and a
// fixed seed also keeps the splatter identical between reloads.
function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** A flat, unlit, non-clickable plane holding one of the drawn textures. */
function Detail({
  texture,
  position,
  size,
  rotation = 0,
  opacity = 1,
}: {
  texture: THREE.Texture;
  position: [number, number];
  size: [number, number];
  rotation?: number;
  opacity?: number;
}) {
  return (
    <mesh
      position={[position[0], position[1], Z]}
      rotation={[0, 0, THREE.MathUtils.degToRad(rotation)]}
      raycast={() => null}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} />
    </mesh>
  );
}

export default function BoardDetails() {
  // --- 1) Polaroid with a hand-drawn cube-and-chain sketch --------------------
  const polaroid = useMemo(
    () =>
      makeTex(320, 380, (ctx) => {
        ctx.fillStyle = "#f7f4ec";
        ctx.fillRect(0, 0, 320, 380); // white frame
        ctx.fillStyle = "#e7e3d8";
        ctx.fillRect(24, 24, 272, 272); // photo area
        ink(ctx, 2);
        ctx.strokeRect(24, 24, 272, 272);

        // isometric cube
        const cx = 150;
        const cy = 170;
        const s = 58;
        ink(ctx, 3);
        ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
        ctx.beginPath();
        ctx.moveTo(cx - s / 2, cy - s / 2);
        ctx.lineTo(cx - s / 2 + 32, cy - s / 2 - 32);
        ctx.lineTo(cx + s / 2 + 32, cy - s / 2 - 32);
        ctx.lineTo(cx + s / 2, cy - s / 2);
        ctx.moveTo(cx + s / 2, cy - s / 2);
        ctx.lineTo(cx + s / 2 + 32, cy - s / 2 - 32);
        ctx.lineTo(cx + s / 2 + 32, cy + s / 2 - 32);
        ctx.lineTo(cx + s / 2, cy + s / 2);
        ctx.stroke();

        // chain of little rings
        ink(ctx, 2.5);
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(cx + 52 + i * 20, cy + 74, 8, 13, i % 2 ? 0.4 : -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }),
    [],
  );

  // --- 2) Index card (ruled paper; the words are real <Text> below) -----------
  const card = useMemo(
    () =>
      makeTex(360, 220, (ctx) => {
        ctx.fillStyle = "#f6f2e6";
        ctx.fillRect(6, 6, 348, 208);
        ink(ctx, 3, "rgba(28,26,22,0.5)");
        ctx.strokeRect(6, 6, 348, 208);
        ink(ctx, 2, "rgba(140,60,50,0.45)"); // red margin rule
        ctx.beginPath();
        ctx.moveTo(58, 8);
        ctx.lineTo(58, 212);
        ctx.stroke();
        ink(ctx, 1.5, "rgba(60,60,90,0.3)"); // faint ruled lines
        for (let y = 78; y < 208; y += 34) {
          ctx.beginPath();
          ctx.moveTo(18, y);
          ctx.lineTo(342, y);
          ctx.stroke();
        }
      }),
    [],
  );

  // --- 3) Sticky note with a hand-drawn circle round "WEB3?" ------------------
  const sticky = useMemo(
    () =>
      makeTex(240, 240, (ctx) => {
        ctx.fillStyle = "#e9e5d9";
        ctx.fillRect(0, 0, 240, 240);
        const g = ctx.createLinearGradient(0, 150, 0, 240);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.09)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 150, 240, 90);
        ink(ctx, 4, "rgba(28,26,22,0.75)");
        ctx.beginPath();
        ctx.ellipse(120, 120, 76, 50, -0.06, 0, Math.PI * 2); // the circle
        ctx.stroke();
      }),
    [],
  );

  // --- 4) Rough ink stamp box (the words are real <Text>) ---------------------
  const stamp = useMemo(
    () =>
      makeTex(320, 140, (ctx) => {
        ink(ctx, 6, "rgba(40,37,32,0.7)");
        ctx.strokeRect(14, 14, 292, 112);
        ink(ctx, 2.5, "rgba(40,37,32,0.55)");
        ctx.strokeRect(26, 26, 268, 88);
      }),
    [],
  );

  // --- 5) Masking tape (semi-transparent, ragged ends) ------------------------
  const tape = useMemo(
    () =>
      makeTex(240, 80, (ctx) => {
        ctx.fillStyle = "rgba(226,222,208,0.45)";
        ctx.beginPath();
        ctx.moveTo(6, 8);
        ctx.lineTo(234, 4);
        ctx.lineTo(236, 72);
        ctx.lineTo(4, 76);
        ctx.closePath();
        ctx.fill();
        ink(ctx, 8, "rgba(255,255,255,0.25)"); // sheen
        ctx.beginPath();
        ctx.moveTo(22, 26);
        ctx.lineTo(218, 22);
        ctx.stroke();
        ink(ctx, 1, "rgba(120,116,104,0.4)");
        ctx.beginPath();
        ctx.moveTo(6, 8);
        ctx.lineTo(234, 4);
        ctx.moveTo(4, 76);
        ctx.lineTo(236, 72);
        ctx.stroke();
      }),
    [],
  );

  // --- 6) Faint coffee ring (slightly irregular, grey-brown) ------------------
  const coffee = useMemo(
    () =>
      makeTex(260, 260, (ctx) => {
        for (let ring = 0; ring < 2; ring++) {
          const r = 100 - ring * 9;
          ctx.strokeStyle = `rgba(96,78,58,${0.15 - ring * 0.04})`;
          ctx.lineWidth = ring === 0 ? 7 : 3;
          ctx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const a = (i / 48) * Math.PI * 2;
            const wob = 1 + Math.sin(a * 3 + ring) * 0.035 + Math.cos(a * 5) * 0.03;
            const x = 130 + Math.cos(a) * r * wob;
            const y = 130 + Math.sin(a) * r * wob;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }),
    [],
  );

  // --- 7) Ink splatter / smudge ----------------------------------------------
  const splatter = useMemo(
    () =>
      makeTex(200, 200, (ctx) => {
        for (let i = 0; i < 44; i++) {
          const x = 100 + (rand(i + 1) - 0.5) * 130;
          const y = 100 + (rand(i + 55) - 0.5) * 130;
          const r = rand(i + 111) * 4 + 0.5;
          ctx.fillStyle = `rgba(25,23,20,${0.14 + rand(i + 200) * 0.34})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }),
    [],
  );

  // --- 8) Fingerprint smudge --------------------------------------------------
  const fingerprint = useMemo(
    () =>
      makeTex(200, 200, (ctx) => {
        ctx.translate(100, 100);
        for (let i = 0; i < 9; i++) {
          ctx.strokeStyle = `rgba(30,28,24,${0.09 + i * 0.012})`;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          const rx = 8 + i * 7;
          ctx.ellipse(0, 0, rx, rx * 1.28, 0.2, -0.25, Math.PI * 1.75);
          ctx.stroke();
        }
      }),
    [],
  );

  // --- 9) Hand-drawn arrow + circle ------------------------------------------
  const arrow = useMemo(
    () =>
      makeTex(200, 120, (ctx) => {
        ink(ctx, 5, "rgba(28,26,22,0.6)");
        ctx.beginPath();
        ctx.moveTo(16, 92);
        ctx.quadraticCurveTo(92, 18, 176, 54);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(176, 54);
        ctx.lineTo(150, 34);
        ctx.moveTo(176, 54);
        ctx.lineTo(154, 72);
        ctx.stroke();
      }),
    [],
  );
  const circle = useMemo(
    () =>
      makeTex(200, 200, (ctx) => {
        ink(ctx, 5, "rgba(28,26,22,0.55)");
        ctx.beginPath();
        ctx.ellipse(100, 100, 82, 62, 0.15, 0.2, Math.PI * 2.15);
        ctx.stroke();
      }),
    [],
  );

  // --- 10) Paper clip ---------------------------------------------------------
  const clip = useMemo(
    () =>
      makeTex(90, 170, (ctx) => {
        ink(ctx, 6, "rgba(118,122,128,0.7)");
        ctx.beginPath();
        ctx.moveTo(28, 152);
        ctx.lineTo(28, 42);
        ctx.arc(45, 42, 17, Math.PI, 0);
        ctx.lineTo(62, 130);
        ctx.arc(45, 130, 17, 0, Math.PI);
        ctx.lineTo(28, 62);
        ctx.stroke();
        ink(ctx, 2, "rgba(255,255,255,0.45)"); // highlight
        ctx.beginPath();
        ctx.moveTo(37, 62);
        ctx.lineTo(37, 128);
        ctx.stroke();
      }),
    [],
  );

  return (
    <group>
      {/* Paper extras */}
      <Detail texture={polaroid} position={[-3.85, -2.0]} size={[0.6, 0.7]} rotation={7} />
      <Detail texture={card} position={[3.95, 2.15]} size={[0.8, 0.48]} rotation={-6} />
      <Detail texture={sticky} position={[3.95, -2.0]} size={[0.5, 0.5]} rotation={5} />

      {/* Words on the card and sticky note (real Sancreek via <Text>) */}
      <Text font={FONT} position={[3.95, 2.27, Z + 0.01]} fontSize={0.105} color="#26231d" anchorX="center" anchorY="middle" raycast={() => null}>
        {`CASE FILE ${getCurrentYear()}`}
      </Text>
      <Text font={FONT} position={[3.95, 2.07, Z + 0.01]} fontSize={0.062} color="#3a372f" anchorX="center" anchorY="middle" raycast={() => null}>
        STATUS: OPEN TO WORK
      </Text>
      <Text font={FONT} position={[3.95, -2.0, Z + 0.01]} fontSize={0.15} color="#24211c" anchorX="center" anchorY="middle" raycast={() => null}>
        WEB3?
      </Text>

      {/* Tilted ink stamp */}
      <Detail texture={stamp} position={[-3.9, 2.12]} size={[0.66, 0.29]} rotation={-13} />
      <Text
        font={FONT}
        position={[-3.9, 2.12, Z + 0.01]}
        rotation={[0, 0, THREE.MathUtils.degToRad(-13)]}
        fontSize={0.088}
        color="#2b2925"
        fillOpacity={0.8}
        anchorX="center"
        anchorY="middle"
        raycast={() => null}
      >
        OPEN TO WORK
      </Text>

      {/* Masking tape strips */}
      <Detail texture={tape} position={[-1.95, 2.3]} size={[0.56, 0.19]} rotation={12} opacity={0.9} />
      <Detail texture={tape} position={[1.6, -2.32]} size={[0.56, 0.19]} rotation={-9} opacity={0.9} />
      <Detail texture={tape} position={[0.25, -2.4]} size={[0.44, 0.16]} rotation={4} opacity={0.8} />

      {/* Paper clip */}
      <Detail texture={clip} position={[2.45, -2.28]} size={[0.16, 0.3]} rotation={18} />

      {/* Stains + smudges */}
      <Detail texture={coffee} position={[2.55, 2.38]} size={[0.52, 0.52]} opacity={0.85} />
      <Detail texture={coffee} position={[-0.35, -2.45]} size={[0.46, 0.46]} opacity={0.8} />
      <Detail texture={splatter} position={[-2.25, 2.42]} size={[0.4, 0.4]} />
      <Detail texture={splatter} position={[3.4, 0.35]} size={[0.34, 0.34]} opacity={0.85} />
      <Detail texture={fingerprint} position={[4.05, 1.3]} size={[0.3, 0.3]} opacity={0.7} />

      {/* Hand-drawn arrows + circle pointing at the notes */}
      <Detail texture={arrow} position={[-3.4, 0.6]} size={[0.5, 0.3]} rotation={150} opacity={0.8} />
      <Detail texture={arrow} position={[3.4, -0.6]} size={[0.5, 0.3]} rotation={30} opacity={0.8} />
      <Detail texture={circle} position={[-1.35, -2.15]} size={[0.42, 0.42]} rotation={-8} opacity={0.75} />
    </group>
  );
}
