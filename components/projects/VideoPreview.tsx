"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Project } from "@/data/projects";

// ---- Video demo --------------------------------------------------------------
// Uses exactly the same media size as LivePreview (see `.demo-media` / `.demo-strip`
// in globals.css) so the card never jumps when the user switches tabs.

// Module-level pointer to whichever video is currently playing. A module value
// is shared by every card, which is how we enforce "only one video at a time".
let playingVideo: HTMLVideoElement | null = null;

/** Paper tile shown when the .mp4 is missing or fails to load. */
function ComingSoon() {
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-[#f3eee2]"
      style={{
        backgroundImage: "url('/images/paper_bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <p className="text-lg text-[#4a453c] md:text-xl">Video coming soon</p>
    </div>
  );
}

type VideoPreviewProps = {
  project: Project;
  active: boolean; // the Video demo tab is selected
  mounted: boolean; // the tab has been opened at least once
};

export default function VideoPreview({ project, active, mounted }: VideoPreviewProps) {
  const [failed, setFailed] = useState(false); // the file could not be loaded
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Pause as soon as the user switches back to the Live demo tab.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || active) return;
    video.pause();
  }, [active]);

  // Pause when the card scrolls out of view.
  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap || !mounted) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <div ref={wrapRef} className="overflow-hidden border border-[#15130f]/20 bg-[#f7f4ec]">
      <div className="demo-media relative w-full overflow-hidden bg-[#e7e1d3]">
        {!mounted ? (
          // The tab has not been opened yet — only the poster is loaded.
          <Image
            src={project.videoPoster}
            alt=""
            fill
            sizes="(min-width: 1024px) 720px, (min-width: 768px) 600px, 92vw"
            className="object-cover"
          />
        ) : failed ? (
          <ComingSoon />
        ) : (
          <video
            ref={videoRef}
            src={project.videoSrc}
            poster={project.videoPoster}
            controls
            muted
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
            onPlay={(event) => {
              // Starting one video pauses any other one that was playing.
              const video = event.currentTarget;
              if (playingVideo && playingVideo !== video) playingVideo.pause();
              playingVideo = video;
            }}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* same height as the live strip */}
      <div className="demo-strip flex items-center justify-between px-3 py-2 md:px-4">
        <span className="text-sm font-bold text-[#15130f] md:text-base">Video demo</span>
        <span className="text-[11px] text-[#8a8478] md:text-xs">{project.videoLength}</span>
      </div>
    </div>
  );
}
