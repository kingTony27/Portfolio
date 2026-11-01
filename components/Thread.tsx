"use client";

import { use, useMemo } from "react";
import { QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import Pin, { type PinColor } from "./Pin";
import { NOTES, notePinPosition, portraitWorld, type NoteId } from "./Scene";
import { loadPortraitData, type AnchorId } from "@/lib/portrait";
import { useLayout } from "./Scene";

// ---- The detective-board strings --------------------------------------------
// Four anchor pins live on the portrait: both shoulders and the two lower edges.
// Their exact places come from the artwork's alpha mask (lib/portrait.ts), read
// ONCE at load — the left-most / right-most opaque pixel in two horizontal
// bands, pushed out onto the white paper border. That way a pin always sits on
// the border edge and never lands on the face.

// Which note each anchor reaches.
const ANCHOR_NOTE: Record<AnchorId, NoteId> = {
  "l-shoulder": "about",
  "r-shoulder": "projects",
  "l-lower": "tools",
  "r-lower": "contact",
};

const ANCHOR_COLOR: Record<AnchorId, PinColor> = {
  "l-shoulder": "darkGrey",
  "r-shoulder": "darkGrey",
  "l-lower": "silver",
  "r-lower": "silver",
};

const PIN_Z = 0.02; // where a pin's base sits (just above the paper)
const THREAD_Z = 0.07; // strings float slightly in front of the paper
const SAG = 0.22; // how far each string droops in the middle

// Shared geometry/material for the little thread rings.
const RING_GEO = new THREE.TorusGeometry(0.032, 0.006, 8, 20);
const RING_MAT = new THREE.MeshBasicMaterial({ color: "#1b1a17", toneMapped: false });

function ThreadRing({ position }: { position: [number, number, number] }) {
  // `raycast` is disabled so decorations never steal the notes' clicks.
  return <mesh geometry={RING_GEO} material={RING_MAT} position={position} raycast={() => null} />;
}

export default function Thread() {
  // The same cached promise PortraitBacking reads — the mask is built once.
  const { anchors } = use(loadPortraitData());
  const layout = useLayout()

  // Work out both ends of every string once (nothing here animates).
  const strings = useMemo(
    () =>
      anchors.map((anchor) => {
        const note = layout.notes.find((n) => n.id === ANCHOR_NOTE[anchor.id])!;
        const [px, py] = notePinPosition(note, layout.noteScale);
        // The anchor is in the portrait's own space, so map it to world space
        // with the same shift + scale the portrait group uses.
        const [ax, ay] = portraitWorld(anchor.x, anchor.y, layout.portraitScale, layout.portraitY);
        return {
          id: anchor.id,
          anchorId: anchor.id,
          color: ANCHOR_COLOR[anchor.id],
          start: new THREE.Vector3(ax, ay, THREAD_Z),
          // The middle control point is dropped to make the thread sag.
          mid: new THREE.Vector3((ax + px) / 2, (ay + py) / 2 - SAG, THREAD_Z + 0.03),
          end: new THREE.Vector3(px, py, THREAD_Z),
        };
      }),
    [anchors],
  );

  return (
    <group>
      {/* Anchor pins on the portrait's border. */}
      {strings.map((s, i) => (
        <group key={s.anchorId} position={[s.start.x, s.start.y, PIN_Z]}>
          <Pin color={s.color} seed={40 + i} scale={0.9} />
        </group>
      ))}

      {/* One sagging string from each anchor to its note's pin. */}
      {strings.map((s) => (
        <group key={`thread-${s.id}`}>
          <QuadraticBezierLine
            start={s.start}
            end={s.end}
            mid={s.mid}
            color="#1b1a17"
            lineWidth={1.5}
            raycast={() => null}
          />
          {/* Tiny ring of thread wrapped round each collar the string touches. */}
          <ThreadRing position={[s.start.x, s.start.y, PIN_Z + 0.03]} />
          <ThreadRing position={[s.end.x, s.end.y, PIN_Z + 0.03]} />
        </group>
      ))}
    </group>
  );
}
