// All the project data lives here so it is easy to edit by hand.
// The Projects page simply loops over `projects` and renders one card each.

export type Project = {
  id: string; // stable React key (never shown)
  title: string; // bold title on the card and in the live link card
  description: string; // 1–2 lines, also used as the truncating line on the link card
  tags: string[]; // small chips, e.g. "Next.js", "Solidity"
  liveUrl: string; // the whole live card is a link to this (opens in a new tab)
  previewImage: string; // image shown in the Live demo media area
  videoSrc: string; // video file — may not exist yet, the fallback tile covers that
  videoPoster: string; // image shown before / instead of the video frame
  videoLength: string; // human readable length, e.g. "1:24"
};

// NOTE: the /videos/*.mp4 files are intentionally NOT created yet.
// VideoPreview shows a "Video coming soon" paper tile when they are missing.
export const projects: Project[] = [

  {
    id: "project-two",
    title: "NFT Marketplace",
    description: "A web3 marketplace where you can buy and sell NFT's. Create NFT's on platform. List NFT's for sale. Make sales.",
    tags: ["Solidity", "Hardhat", "Next.js", "Supabase"],
    liveUrl: "https://marketplace-frontend-ivory-six.vercel.app/",
    previewImage: "/previews/Preview2.png",
    videoSrc: "/live_demo/buying_video.mp4",
    videoPoster: "/previews/poster-1.svg",
    videoLength: "2:07",
  },

    {
    id: "project-one",
    title: "Turtle Meta Tribe",
    description: "A web3 ecosystem where you can claim daily airdrops, mint NFT's and grind the leaderboard.",
    tags: ["Next.js", "TypeScript", "Solidity", "Supabase"],
    liveUrl: "https://turtle-meta-tribe.vercel.app/",
    previewImage: "/previews/Preview1.png",
    videoSrc: "/live_demo/TMT live demo(fiverr).mp4",
    videoPoster: "/previews/poster-2.svg",
    videoLength: "1:24",
  },
];
