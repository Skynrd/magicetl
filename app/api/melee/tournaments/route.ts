import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  try {
    const username = process.env.MELEE_USERNAME!;
    const password = process.env.MELEE_PASSWORD!;
    const token = Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch("https://api.melee.gg/v1/tournaments", {
      headers: {
        Authorization: `Basic ${token}`,
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Upstream error: ${res.status} ${res.statusText}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    return Response.json(data);

  } catch (err: any) {
    return Response.json(
      { error: `Server error: ${err.message}` },
      { status: 500 }
    );
  }
}
