// ---- Current year -----------------------------------------------------------
// Not every place can render a React component: SVG text built from strings,
// canvas textures and Drei's 3D <Text> all need a plain value. Those spots
// import this function instead of <CurrentYear />.
//
// It is deliberately a function (not a constant) so it is evaluated when the
// module runs rather than frozen at build time.
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
