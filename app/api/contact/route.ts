import { NextResponse } from "next/server";
import { validateContact } from "@/lib/validateContact";
import { deliverMessage } from "@/lib/deliverMessage";

// ---- Light in-memory rate limit ---------------------------------------------
// Max 5 requests per 10 minutes per IP. This lives in the server process
// memory, so it resets on restart and is NOT shared between instances — it is
// just a cheap guard against casual spam. For production, move this to Redis.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Keep only the timestamps inside the current window.
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  // Identify the caller. Behind a proxy the real IP arrives in the
  // `x-forwarded-for` header; otherwise fall back to a shared bucket.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  // Parse the body defensively — a malformed request should not crash the route.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a real person never fills this hidden field. If a bot does,
  // pretend everything worked and drop the message.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Same validation rules the browser used — the server never trusts the client.
  const { data, errors } = validateContact(payload);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  // Hand off to the (currently stubbed) delivery layer.
  try{
    await deliverMessage(data);
    return NextResponse.json({ ok: true });
  }catch(err){
    console.error("Error sending email:",err);
    return NextResponse.json({ ok: false }, { status: 500 })
  }
 
}
