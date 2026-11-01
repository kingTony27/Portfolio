import Image from "next/image";
import type { Project } from "@/data/projects";

// ---- Live demo ---------------------------------------------------------------
// Looks like a link card on X / Twitter: a big preview image, then a strip with
// the domain, the title and a single truncating line. The WHOLE thing is one
// link that opens the live site in a new tab.

/** "https://www.example.com/x" -> "example.com" */
function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ArrowUpRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LivePreview({ project }: { project: Project }) {
  return (
    <a
      href={project.liveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden border border-[#15130f]/20 bg-[#f7f4ec]"
    >
      {/* media area — `.demo-media` gives it the shared 1.91 / 1 ratio */}
      <div className="demo-media relative w-full overflow-hidden bg-[#e7e1d3]">
        {/* Next.js serves .svg sources as-is (no optimizer), and loading is lazy. */}
        <Image
          src={project.previewImage}
          alt={`${project.title} preview`}
          fill
          sizes="(min-width: 1024px) 720px, (min-width: 768px) 600px, 92vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* little arrow-up-right badge, only on hover */}
        <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#fbf8f0]/90 text-[#15130f] opacity-0 shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-opacity duration-200 group-hover:opacity-100">
          <ArrowUpRight />
        </span>
      </div>

      {/* bottom strip — `.demo-strip` keeps this the same height as the video one */}
      <div className="demo-strip flex flex-col justify-center gap-0.5 px-3 py-2 md:px-4">
        <p className="text-[11px] text-[#8a8478] md:text-xs">{hostname(project.liveUrl)}</p>
        <p className="text-sm font-bold text-[#15130f] md:text-base">{project.title}</p>
        <p className="truncate text-[11px] text-[#5f5a4f] md:text-xs">{project.description}</p>
      </div>
    </a>
  );
}
