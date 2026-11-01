// =============================================================================
// TOOLS DATA — the single place where the Tools page content lives.
// =============================================================================
//
// HOW TO ADD A NEW TOOL (step by step)
// ------------------------------------
// 1. Find the icon (see "HOW TO FIND AN ICON" below) and note its component
//    name, e.g. SiVercel.
// 2. Open components/tools/toolIcons.tsx and:
//      a. add it to the import list from "react-icons/si":
//           import { SiVercel } from "react-icons/si";
//      b. add one line to the `toolIcons` map with a short lowercase key:
//           vercel: SiVercel,
// 3. Come back here and add one line to the department's `tools` array using
//    that same key:
//           { name: "Vercel", icon: "vercel" },
// That is all — the row under that department renders whatever is in the array.
//
// COPY & PASTE EXAMPLE (then edit the names)
// ------------------------------------------
//   // 1) components/tools/toolIcons.tsx
//   import { SiVercel } from "react-icons/si";
//   export const toolIcons: Record<string, IconRef> = {
//     ...,                       // keep the existing lines
//     vercel: SiVercel,          // <- the new icon
//   };
//
//   // 2) data/tools.ts, inside one department's `tools` array
//   { name: "Vercel", icon: "vercel" },
//
// HOW TO FIND AN ICON
// -------------------
// * Go to https://react-icons.github.io/react-icons
// * Open the "Simple Icons" tab (that is the `si` set used here).
// * Search the tool name and copy the component name, e.g. SiReact.
// * The same icon set can be browsed at https://simpleicons.org.
// * If the icon does NOT exist there: download the SVG from the tool's official
//   brand / press page (or from the devicon repo on GitHub:
//   https://github.com/devicons/devicon/tree/master/icons), save it as
//   /public/icons/<name>.svg, and use the custom option:
//       // components/tools/toolIcons.tsx
//       mytool: { src: "/icons/mytool.svg" },
//   CustomIcon draws it with a CSS mask, so the file's own colours are ignored
//   and it automatically takes on the ash grey.
//
// HOW TO CHANGE HOW IT LOOKS
// --------------------------
// This file only holds the words. Every visual knob is CSS, and they all sit
// together in the "Tools page" block of app/globals.css (on `.tool-row`):
// * Icon size:      --tool-icon-size   (48px phones / 60px md / 72px lg)
// * Name size:      --tool-name-size   (14px / 15px / 16px)
// * Item width:     --tool-item-width  (104px / 120px / 136px)
//                   The fixed width is what lets a row of 5 fit on one line on
//                   a wide screen (the page column is max-w-4xl).
// * Gap between items: the `gap` on `.tool-row` — 28px between two rows, and
//                   the column gap between two tools: 12px on phones (so 3 fit
//                   at 375px) widening to 16px from md up.
// * Ash grey icons: --tool-ash (starts at #8c8c86).
// * Name colour:    --tool-name (starts at #3d3d3a).
// * Add / remove / reorder departments: just edit the `departments` array below.
//   The "DEPT. 01" text is written by hand in `label`, so renumber it too.
// * Rename a department: change `title` (the big headline) and `label` (the
//   small "DEPT. 0x" line).
// * A long tool name is allowed to wrap onto a second line — nothing is cut off.
//
// WHICH ICONS ARE PLACEHOLDERS
// ----------------------------
// Hardhat and Tact are NOT in the Simple Icons set shipped with react-icons@5.
// Both are drawn as simple grey SVGs in /public/icons (hardhat.svg, tact.svg).
// Look for the "PLACEHOLDER - replace with the official logo" comments in
// components/tools/toolIcons.tsx and inside the two SVG files.

export type Tool = {
  name: string; // shown under the icon
  icon: string; // key into the map in components/tools/toolIcons.tsx
};

export type Department = {
  id: string; // stable React key (never shown)
  title: string; // the big newspaper headline, e.g. "FRONTEND"
  label: string; // the tiny line above it, e.g. "DEPT. 01"
  tools: Tool[];
};

export const departments: Department[] = [
  {
    id: "frontend",
    title: "FRONTEND",
    label: "DEPT. 01",
    tools: [
      { name: "Next.js", icon: "nextjs" },
      { name: "React.js", icon: "react" },
      { name: "Figma", icon: "figma" },
      { name: "Tailwind CSS", icon: "tailwind" },
      { name: "Bootstrap", icon: "bootstrap" },
    ],
  },
  {
    id: "backend",
    title: "BACKEND",
    label: "DEPT. 02",
    tools: [
      { name: "Node.js", icon: "nodejs" },
      { name: "Express.js", icon: "express" },
      { name: "PHP", icon: "php" },
      { name: "Postman", icon: "postman" },
    ],
  },
  {
    id: "database",
    title: "DATABASE",
    label: "DEPT. 03",
    tools: [
      { name: "Supabase", icon: "supabase" },
      { name: "MongoDB", icon: "mongodb" },
      { name: "MySQL", icon: "mysql" },
      { name: "PostgreSQL", icon: "postgresql" },
    ],
  },
  {
    id: "blockchain",
    title: "BLOCKCHAIN",
    label: "DEPT. 04",
    tools: [
      { name: "Solidity", icon: "solidity" },
      { name: "Hardhat", icon: "hardhat" },
      { name: "Tact", icon: "tact" },
    ],
  },
];
