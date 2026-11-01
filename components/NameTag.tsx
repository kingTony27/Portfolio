"use client";

import { use } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import Tape from "./Tape";
import { SHARED_PLANE } from "@/lib/svgTexture";
import { PORTRAIT_HEIGHT } from "@/lib/portrait";
import { loadStrokeTexture } from "@/lib/brushArt";
import { site } from "@/data/site";

// ---- Name tag ----------------------------------------------------------------
// A torn strip of masking tape stretched across the bottom edge of the portrait,
// with the name in big Sancreek lettering and the role on a quiet line under it.
// The text comes from data/site.ts so there is one place to edit it.

const TAG_WIDTH = 2.5;
const TAG_HEIGHT = 0.72;
// Straddles the bottom of the portrait (which is PORTRAIT_HEIGHT tall, centred).
const TAG_Y = -PORTRAIT_HEIGHT * 0.45;

const STROKE_WIDTH = 1.7;
const STROKE_HEIGHT = 0.53; // keeps the baked texture's 512x160 aspect
const STROKE_Y = -0.5;

export default function NameTag() {
  const stroke = use(loadStrokeTexture());

  return (
    <group position={[0, TAG_Y, 0.02]} rotation={[0, 0, THREE.MathUtils.degToRad(-2)]}>
      {/* The tape the writing sits on. */}
      <Tape width={TAG_WIDTH} height={TAG_HEIGHT} />


      <Text
        font="/fonts/Sancreek-Regular.ttf"
        fontSize={0.195}
        color="#15130f"
        anchorX="center"
        anchorY="middle"
        position={[0, -0.16, 0.01]}
      >
        {site.role}
      </Text>

      {/* Short thick brush stroke under the tag — baked once, never filtered live. */}
      <mesh
        geometry={SHARED_PLANE}
        position={[0, STROKE_Y, -0.005]}
        scale={[STROKE_WIDTH, STROKE_HEIGHT, 1]}
        raycast={() => null}
      >
        <meshBasicMaterial map={stroke} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
