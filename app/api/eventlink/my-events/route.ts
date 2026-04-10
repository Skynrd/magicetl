import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.TOPDECK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing TOPDECK_API_KEY" },
        { status: 500 }
      );
    }

    const res = await fetch("https://topdeck.gg/api/v2/eventlink/my-events", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `TopDeck error: ${text}` },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
