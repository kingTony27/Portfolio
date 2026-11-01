"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";
import Note from "./Note";
import InkPortrait from "./InkPortrait";
import PortraitBacking from "./PortraitBacking";
import NameTag from "./NameTag";
import Thread from "./Thread";
import BoardDetails from "./BoardDetails";
import { PORTRAIT_HEIGHT } from "@/lib/portrait";

// ---- Shared scene data -------------------------------------------------------

export type NoteId = "about" | "projects" | "tools" | "contact";

/** The four bulletin-board notes, with their label, world position and tilt. */
export const NOTES: {
  id: NoteId;
  label: string;
  subline: string; // the quiet line under the label ("Who I am", ...)
  position: [number, number];
  rotation: number; // degrees
}[] = [
  { id: "about", label: "About me", subline: "Who I am", position: [-2.6, 1.5], rotation: 5 },
  { id: "projects", label: "Projects", subline: "What I built", position: [2.6, 1.5], rotation: -4 },
  { id: "tools", label: "Tools", subline: "What I use", position: [-2.6, -1.5], rotation: -6 },
  { id: "contact", label: "Contact me", subline: "Say hello", position: [2.6, -1.5], rotation: 4 },
];

// Note size in world units — shared with Note.tsx so everything lines up.
export const NOTE_WIDTH = 1.75;
export const NOTE_HEIGHT = 1.2;

// ---- THE THREE NUMBERS THAT PLACE THE HEADLINE AND THE PORTRAIT --------------
// The screen-space "Welcome" headline sits at HEADLINE_TOP (a fraction of the
// viewport height, applied in WelcomeHeadline.tsx). The portrait — and the
// backing, the dark ring and the name tag that travel with it — is pushed down
// by PORTRAIT_SHIFT_Y × its height, then shrunk to PORTRAIT_SCALE.
// Together they keep the headline clear of the notes, the header and the head at
// both 1024px and 1440px wide. Nothing else needs to change to move things.
export const HEADLINE_TOP = 0.055;
export const PORTRAIT_SHIFT_Y = 0.1;
export const PORTRAIT_SCALE = 0.94;

/** How far the whole portrait assembly is moved off centre, in world units. */
export const PORTRAIT_Y = -PORTRAIT_SHIFT_Y * PORTRAIT_HEIGHT;


// ---- Where each note's pin, tape and circled number sit ----------------------
// Each entry is a pair of ±1 "corner signs". The pin always points at the note's
// corner NEAREST the portrait, so the string leaves that corner and never runs
// across the label. The tape goes on the pin's opposite corner and the circled
// number takes the free top corner.
export const NOTE_DECOR: Record<
  NoteId,
  { pin: [number, number]; tape: [number, number]; number: [number, number] }
> = {
  // About me is top-left on the board: the portrait is down-right of it.
  about: { pin: [1, -1], tape: [-1, 1], number: [1, 1] },
  projects: { pin: [-1, -1], tape: [1, 1], number: [-1, 1] },
  tools: { pin: [1, 1], tape: [-1, -1], number: [-1, 1] },
  contact: { pin: [-1, 1], tape: [1, -1], number: [1, 1] },
};

/** How far a note's corner decorations sit in from its edges. */
export const NOTE_CORNER_X = NOTE_WIDTH * 0.5 - 0.2;
export const NOTE_CORNER_Y = NOTE_HEIGHT * 0.5 - 0.18;

/** A note's pin offset in the note's own (unrotated) space. */
export function notePinLocal(id: NoteId): [number, number] {
  const [sx, sy] = NOTE_DECOR[id].pin;
  return [sx * NOTE_CORNER_X, sy * NOTE_CORNER_Y];
}

/** How long the camera takes to fly to (or back from) a note, in seconds. */
const ZOOM_DURATION = 1.2;

// World-space box that must stay visible on every screen (portrait + 4 notes).
const LAYOUT_W = 7.8;
const LAYOUT_H = 4.7;

// ---- Tall-screen layout (phones and tablets in portrait) ----
const TALL_ASPECT = 1.1;             // below this width/height we use the tall layout
const TALL_TOP = 0.23;               // board area starts here (fraction of screen height)
const TALL_BOTTOM = 0.94;            // and ends here
const PORTRAIT_ASPECT = 1515 / 2100; // width / height of the portrait image

export type Layout = {
  isTall: boolean;
  notes: typeof NOTES;
  noteScale: number;
  portraitScale: number;
  portraitY: number;
  zoomZ: number | null; // null = keep the old homeZ * 0.45
};

export function portraitWorld(x: number, y: number, scale = PORTRAIT_SCALE, offsetY = PORTRAIT_Y): [number, number] {
  return [x * scale, y * scale + offsetY];
}

export function notePinPosition(note: (typeof NOTES)[number], scale = 1): [number, number] {
  const [lx, ly] = notePinLocal(note.id);
  const r = THREE.MathUtils.degToRad(note.rotation);
  const sx = lx * scale, sy = ly * scale;
  return [
    note.position[0] + sx * Math.cos(r) - sy * Math.sin(r),
    note.position[1] + sx * Math.sin(r) + sy * Math.cos(r),
  ];
}

/**
 * How far the camera must sit from z = 0 so the whole layout fits the screen.
 * Wide screens are limited by height, tall phones by width — so we take the max.
 */
function homeDistance(aspect: number, fovDeg: number) {
  const halfFov = THREE.MathUtils.degToRad(fovDeg) / 2;
  const forHeight = LAYOUT_H / 2 / Math.tan(halfFov);
  const forWidth = LAYOUT_W / 2 / (Math.tan(halfFov) * aspect);
  return Math.max(forHeight, forWidth) * 1.15; // a little breathing room
}

export function getLayout(width: number, height: number, fovDeg: number): Layout {
  const aspect = width / height;
  if (aspect >= TALL_ASPECT) {
    return { isTall: false, notes: NOTES, noteScale: 1,
             portraitScale: PORTRAIT_SCALE, portraitY: PORTRAIT_Y, zoomZ: null };
  }
  const halfFov = THREE.MathUtils.degToRad(fovDeg) / 2;
  const visH = 2 * homeDistance(aspect, fovDeg) * Math.tan(halfFov); // visible world height at z = 0
  const visW = visH * aspect;
  const A = visH * (TALL_BOTTOM - TALL_TOP);                         // height of the board area
  const yAt = (f: number) => visH / 2 - visH * TALL_TOP - f * A;     // world y at fraction f of it

  const noteScale = ((width < 600 ? 0.43 : 0.36) * visW) / NOTE_WIDTH;
  const portraitH = Math.min(0.52 * A, (0.62 * visW) / PORTRAIT_ASPECT);

  const notes = NOTES.map((n) => ({
    ...n,
    position: [
      n.position[0] < 0 ? -0.25 * visW : 0.25 * visW,
      n.position[1] > 0 ? yAt(0.13) : yAt(0.87),
    ] as [number, number],
  }));

  return {
    isTall: true,
    notes,
    noteScale,
    portraitScale: portraitH / PORTRAIT_HEIGHT,
    portraitY: yAt(0.5),
    // zoom until the note fills about 80% of the screen width
    zoomZ: (NOTE_WIDTH * noteScale / 0.8) / (2 * Math.tan(halfFov) * aspect),
  };
}

/** One place that gives every component the same layout. Use it inside the Canvas. */
export function useLayout() {
  const size = useThree((s) => s.size);
  const fov = useThree((s) => (s.camera as THREE.PerspectiveCamera).fov);
  return useMemo(() => getLayout(size.width, size.height, fov), [size.width, size.height, fov]);
}



// ---- Pieces -----------------------------------------------------------------

/**
 * Full-screen paper texture. It is sized to cover the widest (home) view, so it
 * keeps filling the screen even while the camera zooms in on a single note.
 */
function PaperBackground() {
  const texture = useTexture("/images/paper_bg.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  // Size the plane to exactly fill the view at its own depth (behind everything).
  const planeZ = -4;
  const distance = homeDistance(size.width / size.height, camera.fov) - planeZ;
  const height = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const width = height * (size.width / size.height);

  return (
    <mesh position={[0, 0, planeZ]} raycast={() => null}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/**
 * Moves the camera between the "home" view and a zoomed-in note using GSAP.
 * Only the camera moves — the portrait and the notes themselves never do.
 *
 * The canvas runs with `frameloop="demand"`, so every tween asks for a frame via
 * `invalidate()`; without that the move would never be drawn.
 */
function CameraRig({
  openNote,
  onZoomComplete,
}: {
  openNote: NoteId | null;
  onZoomComplete: () => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const layout = useLayout();

  // Recompute the resting distance whenever the viewport changes (responsive).
  const homeZ = useMemo(
    () => homeDistance(size.width / size.height, camera.fov),
    [size.width, size.height, camera.fov],
  );

  // GSAP animates plain objects; we apply them to the camera every frame.
  useFrame(() => camera.lookAt(look.current));

  useEffect(() => {
    const lookVec = look.current; // capture for the cleanup below
    const note = layout.notes.find((n) => n.id === openNote);

    // ---- Full board (no note open) ------------------------------------------
    // SNAP straight to the resting view instead of easing. This is what makes a
    // returning Home page show the whole board at once: after a trip to another
    // page the camera was still parked on a note, and we must not replay the
    // fly-out. It also covers the very first mount and any resize while the
    // board is at rest.
    if (!note) {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookVec);
      camera.position.set(0, 0, homeZ);
      lookVec.set(0, 0, 0);
      invalidate();
      return;
    }

    // ---- Zoom in on one note -------------------------------------------------
    gsap.to(camera.position, {
      x: note.position[0],
      y: note.position[1],
      z: layout.zoomZ ?? homeZ * 0.45,
      duration: ZOOM_DURATION,
      ease: "power3.inOut",
      onUpdate: invalidate, // demand rendering: ask for each moving frame
      // Tell the page when the fly-in has finished so it can navigate.
      onComplete: onZoomComplete,
    });
    gsap.to(lookVec, {
      x: note.position[0],
      y: note.position[1],
      z: 0,
      duration: ZOOM_DURATION,
      ease: "power3.inOut",
      onUpdate: invalidate,
    });

    return () => {
      // Interrupt any in-flight move when the target changes, when Next.js hides
      // Home (<Activity> runs cleanups), or on a real unmount. Killing the
      // tweens here is what stops a half-finished zoom from owning the camera.
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookVec);
    };
  }, [openNote, homeZ, camera, invalidate, onZoomComplete, layout]);

  return null;
}

// ---- Scene ------------------------------------------------------------------

type SceneProps = {
  openNote: NoteId | null;
  onSelectNote: (id: NoteId) => void;
  onZoomComplete: () => void;
  /** True once the headline spray has settled — the notes then wiggle once. */
  wiggle: boolean;
};

export default function Scene({ openNote, onSelectNote, onZoomComplete, wiggle }: SceneProps) {
  // A narrow canvas means a phone: we then drop the small board clutter and the
  // note sublines, and tighten the dark ring.
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const layout = useLayout();

  // The canvas only draws on demand, so make sure the very first frame lands
  // even if nothing else asks for one.
  useEffect(() => invalidate(), [invalidate]);

  return (
    <>
      {/* Base colour in case the paper plane ever falls short of an edge. */}
      <color attach="background" args={["#e8e1d1"]} />

      {/* These lights only affect MeshStandardMaterial — i.e. the pins. They are
          shared by every pin (nothing here is per-pin). Everything else uses
          MeshBasicMaterial, so the paper stays flat and unlit. */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[-5, 6, 7]} intensity={2.6} />

      <CameraRig openNote={openNote} onZoomComplete={onZoomComplete} />
      <PaperBackground />

      {/* The whole portrait assembly — dark ring, white paper backing, the
          portrait itself and the tape name tag — moves as one unit. Everything
          in here is placed in LOCAL portrait space; PORTRAIT_Y / PORTRAIT_SCALE
          above are the only knobs. */}
      <group position={[0, layout.portraitY, 0]} scale={layout.portraitScale}>
        <PortraitBacking />
        {/* The portrait smears its ink under the cursor; it pauses while a note
            is zoomed in so the effect never competes with the zoom. */}
        <InkPortrait enabled={openNote === null} />
        <NameTag />
      </group>

      {/* Detective-board clutter and strings. Both sit in front of the portrait
          and are hidden (clutter) or kept (strings) on phones. */}
      {!layout.isTall && <BoardDetails />}
      <Thread />

      {/* All 4 notes are disabled while one of them is zoomed in. */}
    {layout.notes.map((note, index) => (
        <group key={note.id} position={[note.position[0], note.position[1], 0]} scale={layout.noteScale}>
          <Note
            id={note.id} label={note.label} subline={note.subline}
            position={[0, 0]} tilt={note.rotation} index={index}
            disabled={openNote !== null} wiggle={wiggle}
            showSubline
            onSelect={onSelectNote}
          />
        </group>
    ))}
    </>
  );
}
