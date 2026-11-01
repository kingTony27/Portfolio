import { Tape } from "@/components/contact/ContactDecor";
import type { Department } from "@/data/tools";
import ToolRow from "./ToolRow";

// ---- DepartmentSection -------------------------------------------------------
// One "newspaper section": a tiny DEPT. label, a big Sancreek headline with a
// double ink rule above AND below it, a strip of masking tape on a headline
// corner, and a plain row of tools underneath.
export default function DepartmentSection({
  department,
  index,
}: {
  department: Department;
  index: number; // 0-based; used to alternate which corner gets the tape
}) {
  const { id, title, label, tools } = department;
  const tapeRight = index % 2 === 1; // alternate the tape corner section by section

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0">
      <div className="relative">
        {/* double ink rule ABOVE the headline (a thick line + a thin one) */}
        <div className="border-t-2 border-[#15130f]" />
        <div className="mt-[3px] border-t border-[#15130f]/45" />

        {/* strip of masking tape, stuck over the headline corner */}
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-3 h-4 w-16 opacity-55 md:h-5 md:w-24 ${
            tapeRight ? "-right-2 rotate-[8deg]" : "-left-2 -rotate-[8deg]"
          }`}
        >
          <Tape />
        </span>

        {/* DEPT. label on the right, big headline on the left */}
        <div className="flex items-baseline justify-between gap-3 pt-3">
          <h2
            id={`${id}-title`}
            className="text-2xl leading-none text-[#15130f] md:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          <span className="shrink-0 text-[10px] tracking-[0.32em] text-[#8a8478] md:text-xs">
            {label}
          </span>
        </div>

        {/* double ink rule BELOW the headline */}
        <div className="mt-2.5 border-t border-[#15130f]/45" />
        <div className="mt-[3px] border-t-2 border-[#15130f]" />
      </div>

      {/* the row of tools. The ink rules on the box frame it; inside, the tools
          simply wrap onto as many lines as the screen needs. No side padding
          here on purpose — the row gets the full width of the column so 3 tools
          still fit side by side at 375px. */}
      <div className="mt-5 border-y border-[#15130f]/35 py-5 md:mt-6 md:py-6">
        <ToolRow tools={tools} />
      </div>
    </section>
  );
}
