"use client";

import type { NoteId } from "./Scene";

// ---- Hand-drawn note artwork -------------------------------------------------
// Small ink doodles + the ring around each note's number, as SVG source. Three
// rasterises them once through lib/svgTexture, so each one costs a single tiny
// texture. Stroke colour is baked in so no material tinting is needed.

const INK = "#15130f";

/** Wraps a doodle body in the shared SVG shell (64x64, ink stroke, round caps). */
function doodle(body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// A person: head + shoulders (About me).
const PERSON = doodle(`<circle cx="32" cy="20" r="9"/><path d="M14 52c2.5-11 9-17 18-17s15.5 6 18 17"/>`);

// A folder (Projects).
const FOLDER = doodle(
  `<path d="M8 22a3 3 0 0 1 3-3h13l5 6h24a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z"/><path d="M8 28h48"/>`,
);

// A spanner (Tools).
const WRENCH = doodle(
  `<path d="M45 11a11 11 0 0 0-13.5 13.5L13 43a5.6 5.6 0 0 0 8 8l18.5-18.5A11 11 0 0 0 53 19l-6.5 6.5-6-2-2-6z"/>`,
);

// An envelope (Contact me).
const ENVELOPE = doodle(`<rect x="8" y="16" width="48" height="32" rx="3"/><path d="M9 19l23 17 23-17"/>`);

/** One doodle per note, keyed by the note id. */
export const NOTE_DOODLE_SVG: Record<NoteId, string> = {
  about: PERSON,
  projects: FOLDER,
  tools: WRENCH,
  contact: ENVELOPE,
};

/**
 * The ring drawn around each note's number: two slightly different circles, so
 * it reads as drawn by hand rather than printed. The digits themselves are real
 * text (Drei <Text> with the Sancreek .ttf) so they keep the site font.
 */
export const NOTE_NUMBER_RING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="${INK}" stroke-linecap="round"><circle cx="32" cy="32" r="25" stroke-width="2.4"/><path d="M32 6.5c14 1 25.5 11 25 25.5" stroke-width="1.8" opacity="0.75"/></svg>`;
