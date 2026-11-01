import CurrentYear from "./CurrentYear";

// Site footer — same look as the Home board footer:
// a thin ink line with "Tony@" + the current year in the middle and lines on
// both sides. The year comes from <CurrentYear /> so it never goes stale.
export default function SiteFooter() {
  return (
    <footer className="px-4 pb-8 pt-14 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-3 md:gap-5">
        <span className="h-px flex-1 bg-[#15130f]/45" />
        <span className="text-[11px] tracking-[0.3em] text-[#15130f]/80 md:text-sm">
          Tony@
          <CurrentYear />
        </span>
        <span className="h-px flex-1 bg-[#15130f]/45" />
      </div>
    </footer>
  );
}
