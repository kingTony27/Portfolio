import type { CSSProperties } from "react";

// ---- CustomIcon --------------------------------------------------------------
// Shows an SVG file from /public/icons as a single-colour icon.
//
// HOW IT WORKS
//   Instead of an <img>, the SVG is used as a CSS *mask*. A mask keeps only the
//   shape (its alpha) and throws away the file's own colours. Whatever we paint
//   with `background-color` then shows through the shape. We paint with
//   `currentColor`, so the icon always matches the text colour around it.
//
// WHY THIS IS HANDY
//   Drop ANY logo into /public/icons and it instantly becomes the same ash grey
//   as every other icon — even if the file is colourful. No editing needed.
//
// USAGE
//   <CustomIcon src="/icons/hardhat.svg" className="h-6 w-6" />
//   (the className sets the size; the colour comes from the parent element)

type CustomIconProps = {
  src: string; // path inside /public, e.g. "/icons/hardhat.svg"
  className?: string; // use this to set the width / height
};

export default function CustomIcon({ src, className = "" }: CustomIconProps) {
  // The older -webkit- spellings are still needed by Safari.
  const mask: CSSProperties = {
    backgroundColor: "currentColor",
    WebkitMaskImage: `url('${src}')`,
    maskImage: `url('${src}')`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  };

  return <span aria-hidden className={`block ${className}`} style={mask} />;
}
