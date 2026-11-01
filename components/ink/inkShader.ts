// ---- Ink shader -------------------------------------------------------------
// The portrait is drawn by this small custom shader instead of MeshBasicMaterial,
// so the ink can be "dragged" by the cursor.
//
// How the drag works, in one line: the trail texture stores, for every pixel, how
// fast the pointer was moving over it (red = x speed, green = y speed, blue =
// strength). The shader reads the trail here and samples the portrait from a
// slightly different spot — the one "behind" the movement — so the ink looks
// smeared after the cursor.
//
// When nothing has moved the trail is exactly neutral (r = g = 0.5, b = 0), so
// the offset is zero and the image is passed straight through. That is what
// makes the idle portrait match the old MeshBasicMaterial version exactly.

export const inkVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const inkFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;   // the ink portrait (sRGB)
  uniform sampler2D uTrail;     // motion trail: r/g = velocity, b = strength
  uniform float uStrength;      // how far the ink is pushed
  uniform float uInkDarken;     // how much the ink pools where the trail is strong

  varying vec2 vUv;

  // How far from the border the effect starts fading out. Without this the smear
  // would drag pixels in from outside the image and leave a bright frame at the
  // edges of the plane.
  const float EDGE_FADE = 0.12;

  void main() {
    vec2 uv = clamp(vUv, 0.0, 1.0);

    // r/g are centred on 0.5 and b (strength) is 0 when nothing moved.
    vec4 trail = texture2D(uTrail, uv);

    // 1 in the middle of the plane, 0 at the border.
    vec2 edge = smoothstep(0.0, EDGE_FADE, uv) * smoothstep(0.0, EDGE_FADE, 1.0 - uv);
    float edgeFade = edge.x * edge.y;

    // (rg - 0.5) * 2.0 is a signed velocity in -1..1; b scales it by strength.
    vec2 offset = (trail.rg - 0.5) * 2.0 * trail.b * uStrength * edgeFade;

    // Sampling "behind" the movement is what drags the ink along with the cursor.
    vec4 texel = texture2D(uTexture, clamp(uv - offset, 0.0, 1.0));

    // A very light ink-pooling touch: darken where the cursor has just passed.
    float pool = 1.0 - uInkDarken * trail.b * edgeFade;

    gl_FragColor = vec4(texel.rgb * pool, texel.a);

    // Linear -> output colour space. This is the same final step
    // MeshBasicMaterial does, so idle colours come out identical to before.
    #include <colorspace_fragment>
  }
`;
