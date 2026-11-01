"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// The portrait plane is completely static: no animation, no mouse reaction.
const PORTRAIT_HEIGHT = 3.6;
const PORTRAIT_ASPECT = 0.72; // width / height of the source image

export default function Portrait() {
  // Load the transparent ink portrait as a texture. sRGB keeps the greys true.
  const texture = useTexture("/images/tman_portrait_ink.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  const width = PORTRAIT_HEIGHT * PORTRAIT_ASPECT;

  return (
    // A flat plane sitting at the centre of the scene (z = 0). Nothing moves it.
    // `raycast` is off so clicks always fall through to the notes.
    <mesh position={[0, 0, 0]} raycast={() => null}>
      <planeGeometry args={[width, PORTRAIT_HEIGHT]} />
      {/* MeshBasicMaterial = unlit, so we see the flat ink artwork exactly as drawn.
          `transparent` keeps the PNG's alpha (the paper shows through around the head). */}
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}
