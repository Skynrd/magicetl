import { NextResponse } from "next/server";

const TOPDECK_API = "https://api.topdeck.gg/v2/eventlink/import";
const TOPDECK_API_KEY = process.env.TOPDECK_API_KEY;

// -----------------------------
// Route Handler
// -----------------------------
export async function POST(req: Request) {
  if (!TOPDECK_API_KEY) {
    return NextResponse.json(
      { error: "Missing TOPDECK_API_KEY" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    existingEventId,
    organizationId,
    eventFormatId,
    eventTitle,
    eventDescription,
    startDate,
    timeZone = "America/Chicago",
    maxPlayers,
    entryFeeAmount,
    address,
    latitude,
    longitude,
    isOnline,
    players,
  } = body;

  // -----------------------------
  // Validation
  // -----------------------------

  // Existing event path
  if (existingEventId) {
    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "players array is required and must be non-empty" },
        { status: 400 }
      );
    }

    const payload = {
      existingEventId,
      players: players.map((p: any) => ({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        email: p.email || "",
        wizardsEmail: p.wizardsEmail || undefined,
      })),
    };

    return forwardToTopDeck(payload);
  }

  // New event path
  if (!organizationId || !eventFormatId || !eventTitle || !startDate) {
    return NextResponse.json(
      {
        error:
          "organizationId, eventFormatId, eventTitle, and startDate are required when creating a new event",
      },
      { status: 400 }
    );
  }

  if (!players || !Array.isArray(players) || players.length === 0) {
    return NextResponse.json(
      { error: "players array is required and must be non-empty" },
      { status: 400 }
    );
  }

  // -----------------------------
  // Build final payload for TopDeck
  // -----------------------------
  const payload = {
    organizationId,
    eventFormatId,
    eventTitle,
    eventDescription: eventDescription || eventTitle,
    startDate,
    timeZone,
    maxPlayers,
    entryFeeAmount,
    address,
    latitude,
    longitude,
    isOnline,
    players: players.map((p: any) => ({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      email: p.email || "",
      wizardsEmail: p.wizardsEmail || undefined,
    })),
  };

  return forwardToTopDeck(payload);
}

// -----------------------------
// Helper: Forward to TopDeck
// -----------------------------
async function forwardToTopDeck(payload: any) {
  try {
    const res = await fetch(TOPDECK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": TOPDECK_API_KEY!,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err) {
    console.error("EventLink import error:", err);
    return NextResponse.json(
      { error: "Failed to reach TopDeck EventLink import endpoint" },
      { status: 500 }
    );
  }
}
