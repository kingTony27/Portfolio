"use client";

// ---- Portrait facts, measured once ------------------------------------------
// The portrait plane, the white paper backing behind it and the dark brush ring
// behind that all key off the numbers in this file.

export const PORTRAIT_SRC = "/images/tman_portrait_ink.webp";
export const PORTRAIT_HEIGHT = 3.6; // the plane's height, in world units
export const PORTRAIT_ASPECT = 0.72; // width / height of the artwork
export const PORTRAIT_WIDTH = PORTRAIT_HEIGHT * PORTRAIT_ASPECT;

// How far the white outline sticks out past the silhouette, as a fraction of the
// portrait's height. 0.035 works out at ~20 px on a 577 px-tall portrait (the
// size it is drawn at on a 1440x900 board). Change this ONE number to make the
// paper border thicker or thinner.
export const BORDER_RADIUS_RATIO = 0.035;
export const BORDER_RADIUS = PORTRAIT_HEIGHT * BORDER_RADIUS_RATIO;

// Resolution of the small canvas the silhouette is read off. It only feeds the
// border and the string anchors, so it does not need the artwork's full size.
const ANALYSIS_WIDTH = 600;

export type AnchorId = "l-shoulder" | "r-shoulder" | "l-lower" | "r-lower";

/** A string anchor on the portrait's outline, in the portrait's LOCAL space. */
export type PortraitAnchor = { id: AnchorId; x: number; y: number };

export type PortraitData = {
  anchors: PortraitAnchor[];
  /** The silhouette, solid white on transparent. */
  mask: HTMLCanvasElement;
};

// The two horizontal bands the anchors are read from, as fractions down the
// artwork: the flared shoulders, then where the arms end / the lower body starts.
const BANDS = [
  { key: "shoulder", from: 0.38, to: 0.42 },
  { key: "lower", from: 0.75, to: 0.8 },
] as const;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * Reads the artwork's alpha mask once at load and returns:
 *   - the silhouette as a white-on-transparent canvas (the backing draws with it)
 *   - the four outermost opaque points in the two bands, pushed out onto the
 *     white border so a pin sits ON the edge and never on the face.
 */
async function build(): Promise<PortraitData> {
  const image = await loadImage(PORTRAIT_SRC);
  const width = ANALYSIS_WIDTH;
  const height = Math.round(ANALYSIS_WIDTH / PORTRAIT_ASPECT);

  // Paint the artwork, then keep only its alpha (source-in) as solid white.
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const ctx = mask.getContext("2d")!;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Canvas x/y -> world x/y (the plane is centred on the origin).
  const toWorldX = (x: number) => (x / width - 0.5) * PORTRAIT_WIDTH;
  const toWorldY = (y: number) => (0.5 - y / height) * PORTRAIT_HEIGHT;

  // One pass over the alpha: nothing here runs again after load.
  const alpha = ctx.getImageData(0, 0, width, height).data;
  const opaque = (x: number, y: number) => alpha[(y * width + x) * 4 + 3] > 24;

  const anchors: PortraitAnchor[] = [];
  for (const band of BANDS) {
    const rowFrom = Math.max(0, Math.round(band.from * height));
    const rowTo = Math.min(height - 1, Math.round(band.to * height));

    let leftX = -1;
    let leftY = 0;
    let rightX = -1;
    let rightY = 0;

    for (let y = rowFrom; y <= rowTo; y++) {
      // Left-most opaque pixel of this row.
      for (let x = 0; x < width; x++) {
        if (!opaque(x, y)) continue;
        if (leftX < 0 || x < leftX) {
          leftX = x;
          leftY = y;
        }
        break;
      }
      // Right-most opaque pixel of this row.
      for (let x = width - 1; x >= 0; x--) {
        if (!opaque(x, y)) continue;
        if (rightX < 0 || x > rightX) {
          rightX = x;
          rightY = y;
        }
        break;
      }
    }

    if (leftX < 0 || rightX < 0) continue;

    // Shift each point outward by the border width so the pin lands on the edge.
    anchors.push(
      {
        id: band.key === "shoulder" ? "l-shoulder" : "l-lower",
        x: toWorldX(leftX) - BORDER_RADIUS,
        y: toWorldY(leftY),
      },
      {
        id: band.key === "shoulder" ? "r-shoulder" : "r-lower",
        x: toWorldX(rightX) + BORDER_RADIUS,
        y: toWorldY(rightY),
      },
    );
  }

  return { anchors, mask };
}

// One promise for the whole app: the artwork is read (and the mask built) once.
let cache: Promise<PortraitData> | null = null;

export function loadPortraitData(): Promise<PortraitData> {
  if (!cache) cache = build();
  return cache;
}
