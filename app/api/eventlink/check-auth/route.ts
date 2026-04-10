import { NextResponse } from "next/server";

const TOPDECK_API = "https://topdeck.gg/api";
const API_KEY = process.env.TOPDECK_API_KEY;

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Missing TOPDECK_API_KEY environment variable" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${TOPDECK_API}/v2/eventlink/check-auth`, {
      method: "GET",
      headers: {
        Authorization: API_KEY, // no Bearer prefix
      },
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(json, { status: res.status });
    }

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("check-auth error:", err);
    return NextResponse.json(
      { error: "Failed to reach TopDeck API" },
      { status: 500 }
    );
  }
}
