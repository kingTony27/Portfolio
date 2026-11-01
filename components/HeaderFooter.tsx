"use client";

import CurrentYear from "./CurrentYear";

// ---- Screen-space header + footer strips ------------------------------------
// These are plain HTML (not part of the 3D scene) so the text stays crisp and
// keeps using Sancreek from the global stylesheet. When a note is zoomed in we
// fade the whole overlay back so it does not fight with the note.

const TICKS = [8, 18, 28, 38, 62, 72, 82, 92]; // tick marks along the header rule

type HeaderFooterProps = { dimmed: boolean };

export default function HeaderFooter({ dimmed }: HeaderFooterProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ${
        dimmed ? "opacity-30" : "opacity-100"
      }`}
    >
      {/* ---- Header ------------------------------------------------------- */}
      <div className="absolute inset-x-0 top-0 px-4 pt-3 md:px-8 md:pt-5">
        <div className="relative h-px w-full bg-[#15130f]/45">
          {/* blueprint corner brackets at each end of the rule */}
          <span className="absolute -left-px -top-2 h-3 w-3 border-l border-t border-[#15130f]/60" />
          <span className="absolute -right-px -top-2 h-3 w-3 border-r border-t border-[#15130f]/60" />
          {/* little tick marks */}
          {TICKS.map((p) => (
            <span
              key={p}
              className="absolute top-0 h-2 w-px bg-[#15130f]/35"
              style={{ left: `${p}%` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] tracking-[0.3em] text-[#15130f]/80 md:text-xs">
          <span>DEVELOPER</span>
          <span>
            <CurrentYear /> SELECTED WORKS
          </span>
          <span>01 / HOME</span>
        </div>
      </div>

      {/* ---- Footer ------------------------------------------------------- */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 md:px-8 md:pb-6">
        <div className="flex items-center gap-3 md:gap-5">
          <span className="h-px flex-1 bg-[#15130f]/45" />
          <span className="text-[11px] tracking-[0.3em] text-[#15130f]/80 md:text-sm">
            Tony@
            <CurrentYear />
          </span>
          <span className="h-px flex-1 bg-[#15130f]/45" />
        </div>
      </div>
    </div>
  );
}
