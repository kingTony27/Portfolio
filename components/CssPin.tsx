// A small push pin made entirely with CSS — no images, no 3D.
// It is built from three layers stacked on top of each other:
//   1. a soft shadow cast onto the paper (offset down-right)
//   2. the domed head (a radial gradient so it looks glossy)
//   3. a tiny white specular highlight on the top-left
//
// The `seed` prop only changes the tilt so a row of pins does not look cloned.
// The maths is deterministic (no Math.random) which keeps React happy and means
// a pin always looks the same on every reload.

type CssPinProps = {
  seed?: number; // any number; different values tilt the pin differently
  size?: number; // head diameter in px
  className?: string;
};

export default function CssPin({ seed = 0, size = 22, className = "" }: CssPinProps) {
  // Spread seeds over a small range: -6deg … +6deg.
  const tilt = ((seed * 47) % 13) - 6;

  // Some callers place the pin themselves, e.g.
  //   className="absolute -top-1 left-1/2 -translate-x-1/2"
  // `relative` and `absolute` are both `position` utilities with the same
  // specificity, so whichever Tailwind writes last wins — and it writes
  // `.absolute` before `.relative`. That means our own `relative` would beat the
  // caller's `absolute` and the pin would drop back into the normal flow (which
  // is why a pin used to sit NEXT TO its note instead of on top of it). So the
  // fallback `relative` is only added when the caller has not positioned it.
  const callerPositions = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className);

  return (
    <span
      aria-hidden
      className={`pointer-events-none inline-block ${callerPositions ? "" : "relative"} ${className}`}
      // `rotate` is its own CSS property (not the `transform` shorthand), so it
      // can never wipe out a translate utility the caller added, like
      // `-translate-x-1/2` — that one lives in the `translate` property.
      style={{ width: size, height: size, rotate: `${tilt}deg` }}
    >
      {/* 1. shadow under the head */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          transform: "translate(1.5px, 2.5px)",
          background: "radial-gradient(circle, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 68%)",
          filter: "blur(1px)",
        }}
      />

      {/* 2. the domed head: dark rim fading to a lighter face */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 30%, #8b8578 0%, #3a352d 36%, #17150f 74%, #050505 100%)",
          boxShadow:
            "inset -1px -2px 2px rgba(0,0,0,0.55), inset 1px 1px 1px rgba(255,255,255,0.22)",
        }}
      />

      {/* 3. small white highlight so it reads as shiny metal/plastic */}
      <span
        className="absolute rounded-full bg-white/85"
        style={{
          width: size * 0.26,
          height: size * 0.26,
          left: size * 0.23,
          top: size * 0.19,
          filter: "blur(0.5px)",
        }}
      />
    </span>
  );
}
