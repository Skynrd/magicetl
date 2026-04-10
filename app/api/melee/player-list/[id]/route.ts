import { NextResponse } from "next/server";

const MELEE_API = "https://melee.gg/api";
const MELEE_USERNAME = process.env.MELEE_USERNAME;
const MELEE_PASSWORD = process.env.MELEE_PASSWORD;

export async function GET(req: Request) {
  // Derive ID from URL path instead of relying on context.params
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 1]; // last segment after /player-list/

  if (!id) {
    return NextResponse.json(
      { error: "Missing tournament ID in route params" },
      { status: 400 }
    );
  }

  if (!MELEE_USERNAME || !MELEE_PASSWORD) {
    return NextResponse.json(
      { error: "Missing MELEE_USERNAME or MELEE_PASSWORD" },
      { status: 500 }
    );
  }

  const token = Buffer.from(`${MELEE_USERNAME}:${MELEE_PASSWORD}`).toString(
    "base64"
  );

  try {
    const res = await fetch(`${MELEE_API}/player/list/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error("melee player list error:", err);
    return NextResponse.json(
      { error: "Failed to reach melee player list endpoint" },
      { status: 500 }
    );
  }
}
