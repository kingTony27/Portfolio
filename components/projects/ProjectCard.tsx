"use client";

import { useEffect, useId, useRef, useState } from "react";
import CssPin from "@/components/CssPin";
import type { Project } from "@/data/projects";
import LivePreview from "./LivePreview";
import VideoPreview from "./VideoPreview";

type Tab = "live" | "video";

/** One paper tab button. Arrow-key handling lives on the parent tablist. */
function TabButton({
  id,
  panelId,
  selected,
  onSelect,
  onKeyDown,
  buttonRef,
  children,
}: {
  id: string;
  panelId: string;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={id}
      aria-selected={selected}
      aria-controls={panelId}
      // Only the selected tab is in the tab order (standard tablist behaviour).
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`min-h-11 border px-4 text-sm transition-colors md:text-base ${
        selected
          ? "border-[#15130f]/30 bg-[#fbf8f0] text-[#15130f]"
          : "border-[#15130f]/20 bg-[#eae3d4] text-[#6a655a] hover:text-[#15130f]"
      }`}
    >
      {children}
    </button>
  );
}

type ProjectCardProps = {
  project: Project;
  index: number; // used for the "01" numbering and the alternating tilt
};

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [tab, setTab] = useState<Tab>("live"); // Live demo is selected by default
  const [videoOpened, setVideoOpened] = useState(false); // flips on the first Video tab open
  const [revealed, setRevealed] = useState(false); // drives the slide-up animation
  const cardRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId(); // unique ids so aria-controls / aria-labelledby match up

  // Slide the card up the first time it scrolls into view.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // With "reduce motion" the CSS already keeps the card visible, so skip this.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect(); // only animate once
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Selecting a tab. Opening the video tab marks the video as "safe to mount".
  const selectTab = (next: Tab) => {
    setTab(next);
    if (next === "video") setVideoOpened(true);
  };

  // Left / Right arrow keys move and select — required for an accessible tablist.
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next: Tab = tab === "live" ? "video" : "live";
    selectTab(next);
    tabRefs.current[next === "live" ? 0 : 1]?.focus();
  };

  // Alternate the tilt left / right; keep it very small on phones.
  const tilt =
    index % 2 === 0
      ? "-rotate-[0.6deg] md:-rotate-[1.3deg]"
      : "rotate-[0.6deg] md:rotate-[1.3deg]";

  const liveTabId = `${uid}-tab-live`;
  const videoTabId = `${uid}-tab-video`;
  const livePanelId = `${uid}-panel-live`;
  const videoPanelId = `${uid}-panel-video`;

  return (
    // Outer wrapper: the reveal animation (opacity + translateY).
    <div
      ref={cardRef}
      className={`reveal w-[92vw] max-w-full md:w-[600px] lg:w-[720px] ${
        revealed ? "is-visible" : ""
      }`}
    >
      {/* Inner card: the paper look, shadow and tilt. */}
      <article
        className={`relative ${tilt} border border-[#15130f]/15 bg-[#f7f4ec] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] md:p-6`}
      >
        {/* the CSS push pin holding the card to the paper */}
        <CssPin
          seed={index * 5 + 3}
          size={24}
          className="absolute -top-2 left-1/2 -translate-x-1/2"
        />

        {/* number + title */}
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-[#8a8478] md:text-base">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h2 className="text-xl text-[#15130f] md:text-2xl">{project.title}</h2>
        </div>

        {/* 1–2 line description */}
        <p className="mt-2 text-sm text-[#4a453c] md:text-base">{project.description}</p>

        {/* tag chips */}
        <ul className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-[#15130f]/25 px-2.5 py-1 text-[11px] text-[#4a453c] md:text-xs"
            >
              {tag}
            </li>
          ))}
        </ul>

        {/* ---- tabs ---- */}
        <div role="tablist" aria-label={`${project.title} demo views`} className="mt-5 flex gap-1.5">
          <TabButton
            id={liveTabId}
            panelId={livePanelId}
            selected={tab === "live"}
            onSelect={() => selectTab("live")}
            onKeyDown={onTabKeyDown}
            buttonRef={(el) => {
              tabRefs.current[0] = el;
            }}
          >
            Live demo
          </TabButton>
          <TabButton
            id={videoTabId}
            panelId={videoPanelId}
            selected={tab === "video"}
            onSelect={() => selectTab("video")}
            onKeyDown={onTabKeyDown}
            buttonRef={(el) => {
              tabRefs.current[1] = el;
            }}
          >
            Video demo
          </TabButton>
        </div>

        {/* ---- panels ----
            `hidden` (not conditional rendering) so the video element stays
            mounted and can simply be paused when the other tab is shown. */}
        <div role="tabpanel" id={livePanelId} aria-labelledby={liveTabId} hidden={tab !== "live"} className="mt-3">
          <LivePreview project={project} />
        </div>
        <div role="tabpanel" id={videoPanelId} aria-labelledby={videoTabId} hidden={tab !== "video"} className="mt-3">
          <VideoPreview project={project} active={tab === "video"} mounted={videoOpened} />
        </div>
      </article>
    </div>
  );
}
