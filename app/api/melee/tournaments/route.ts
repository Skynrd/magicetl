import { NextResponse } from "next/server";

export async function GET(req: Request) {
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

    // Read query params from the request
    const { searchParams } = new URL(req.url);

    const startDateFrom = searchParams.get("startDateFrom");
    const startDateTo = searchParams.get("startDateTo");

    // Build the URL exactly like Swagger
    const base = "https://melee.gg/api/tournament/list";

    const params = new URLSearchParams();

    if (startDateFrom) params.set("startDateFrom", startDateFrom);
    if (startDateTo) params.set("startDateTo", startDateTo);

    // Swagger-style nested variables
    params.set("variables.pageSize", "250");
    params.set("variables.ignoreCache", "true");

    const url = `${base}?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${token}`,
        Accept: "application/json",
        "User-Agent": "magic-etl/1.0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Melee API error: ${res.status}`, body: text },
        { status: res.status }
      );
    }

    const data = await res.json();

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
