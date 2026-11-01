import type { ComponentType } from "react";
import {
  SiBootstrap,
  SiExpress,
  SiFigma,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPostman,
  SiPostgresql,
  SiReact,
  SiSolidity,
  SiSupabase,
  SiTailwindcss,
} from "react-icons/si";
import CustomIcon from "./CustomIcon";

// =============================================================================
// TOOL ICONS — turns the short icon key used in data/tools.ts into a real icon.
// =============================================================================
// Every tool in data/tools.ts has an `icon` key, e.g. "react". This file says
// which picture that key means. There are two kinds of value:
//
//   1. a react-icons component     react: SiReact
//   2. a custom SVG in /public     hardhat: { src: "/icons/hardhat.svg" }
//
// (a) HOW TO ADD A NEW TOOL — step by step
// ----------------------------------------
// 1. Find the icon (see (b) below) and note the component name, e.g. SiVercel.
// 2. Add it to the import list at the top of this file:
//        import { SiVercel } from "react-icons/si";
// 3. Add one line to the `toolIcons` map below, with a short lowercase key:
//        vercel: SiVercel,
// 4. Open data/tools.ts and add one line to the department's `tools` array:
//        { name: "Vercel", icon: "vercel" },
// Done — the row under that department draws whatever is in the array.
//
// (b) HOW TO FIND AN ICON
// -----------------------
// * Go to https://react-icons.github.io/react-icons
// * Open the "Simple Icons" tab (that is the `si` set used here).
// * Search the tool name and copy the component name, e.g. SiReact.
// * The same drawings can be browsed at https://simpleicons.org.
// * If the icon does NOT exist there: download the SVG from the tool's official
//   brand / press page (or from the devicon repo on GitHub:
//   https://github.com/devicons/devicon/tree/master/icons), save it as
//   /public/icons/<name>.svg and use the custom option:
//        mytool: { src: "/icons/mytool.svg" },
//   CustomIcon draws it with a CSS mask, so the file's own colours are ignored
//   and it automatically takes on the ash grey.
//
// (c) HOW BIG THE ICONS ARE, AND THEIR COLOUR
// -------------------------------------------
// Nothing in this file decides the look — the icon simply fills the box it is
// given. Size and colour come from CSS, in the "Tools page" block of
// app/globals.css:
// * --tool-icon-size   the size of this picture   (48px phones / 60px md / 72px lg)
// * --tool-item-width  the width of one tool column (104px / 120px / 136px)
// * gap on `.tool-row` the space between two tools (28px between rows; 12px
//                      between columns on phones, 16px from md up)
// * --tool-ash         the grey every icon uses   (starts at #8c8c86)
// * --tool-name        the colour of the name     (starts at #3d3d3a)
// Because CustomIcon paints with `currentColor`, changing --tool-ash is all it
// takes to re-colour every icon, react-icons ones and custom SVGs alike.
//
// (d) PLACEHOLDERS
// ----------------
// Hardhat and Tact are NOT in the Simple Icons set shipped with react-icons@5,
// so both point at hand-drawn stand-ins. Look for the
// "PLACEHOLDER - replace with the official logo" comments below and in the two
// SVG files themselves.

/** Props we pass down to every icon (the size/colour come from the parent). */
type IconProps = { className?: string };

/** Either a react-icons component, or a custom SVG file in /public/icons. */
export type IconRef = ComponentType<IconProps> | { src: string };

export const toolIcons: Record<string, IconRef> = {
  // ---- Frontend ----
  nextjs: SiNextdotjs,
  react: SiReact,
  figma: SiFigma,
  tailwind: SiTailwindcss,
  bootstrap: SiBootstrap,

  // ---- Backend ----
  nodejs: SiNodedotjs,
  express: SiExpress,
  php: SiPhp,
  postman: SiPostman,

  // ---- Database ----
  supabase: SiSupabase,
  mongodb: SiMongodb,
  mysql: SiMysql,
  postgresql: SiPostgresql,

  // ---- Blockchain ----
  solidity: SiSolidity,
  // PLACEHOLDER - replace with the official logo
  hardhat: { src: "/icons/hardhat.svg" },
  // PLACEHOLDER - replace with the official logo
  tact: { src: "/icons/tact.svg" },
};

/** Draws one icon by key. Unknown keys render nothing, so a typo cannot crash. */
export function ToolIcon({ icon, className }: { icon: string; className?: string }) {
  const ref = toolIcons[icon];
  if (!ref) return null;

  // A custom SVG file: draw it with the mask-based CustomIcon.
  if (typeof ref !== "function") {
    return <CustomIcon src={ref.src} className={className} />;
  }

  // A react-icons component.
  const Icon = ref;
  return <Icon className={className} />;
}
