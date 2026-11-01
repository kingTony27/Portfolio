"use client";

import { useSyncExternalStore } from "react";

// Renders the current year as text, e.g. inside the "Tony@" footer line.
//
// Why not just `new Date().getFullYear()` in the JSX? This app has Cache
// Components enabled, so Next.js prerenders client components too. Reading the
// clock during that prerender would freeze the year into the static HTML at
// build time — exactly what we are trying to avoid. `useSyncExternalStore`
// lets us use a different value on the server and switch to the live one in
// the browser.
//
// The year cannot change while the page is open, so there is nothing to
// subscribe to — hence the no-op unsubscribe function.
const subscribe = () => () => {};

// Client snapshot: read in the browser, so it is always the real current year.
const getSnapshot = () => new Date().getFullYear();

// Server snapshot: null during the prerender. The span starts empty and React
// fills in the year right after hydration — no rebuild ever needed.
const getServerSnapshot = () => null;

export default function CurrentYear() {
  const year = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <span suppressHydrationWarning>{year}</span>;
}
