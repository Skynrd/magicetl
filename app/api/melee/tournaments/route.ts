import { NextResponse } from "next/server";

export async function GET() {
  try {
    const username = process.env.MELEE_USERNAME;
    const password = process.env.MELEE_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Missing MELEE_USERNAME or MELEE_PASSWORD" },
        { status: 500 }
      );
    }

    const token = Buffer.from(`${username}:${password}`).toString("base64");

    const url =
      "https://melee.gg/api/tournament/list?page=1&pageSize=5000&ignoreCache=true";

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${token}`,
        "User-Agent": "magic-etl/1.0",
        Accept: "application/json",
      },
      cache: "no-store", // Prevents Vercel/Next.js caching
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Melee API error: ${res.status}`, body: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Ensure Content exists and is an array
    if (!data || !Array.isArray(data.Content)) {
      return NextResponse.json(
        { error: "Unexpected API response shape", data },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API /melee/tournaments error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err?.message },
      { status: 500 }
    );
  }
}
