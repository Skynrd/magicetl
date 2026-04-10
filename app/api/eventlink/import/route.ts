import { NextResponse } from "next/server";

const TOPDECK_API = "https://api.topdeck.gg/v2/eventlink/import";
const TOPDECK_API_KEY = process.env.TOPDECK_API_KEY;

// -----------------------------
// Helpers
// -----------------------------

// Extracts "9:30 AM", "7pm", "12:15 pm", etc. from event name
function extractEventTimeFromName(name: string): string | null {
  if (!name) return null;

  const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const match = name.match(timeRegex);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3].toLowerCase();

  if (ampm === "pm" && hour !== 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

// Builds the EventLink startDate from LastPairDateTime + parsed time
function buildEventStartDate(metadata: any): string {
  const name = metadata?.Name || "";
  const lastPair = metadata?.LastPairDateTime;

  if (!lastPair) {
    // fallback: today at 7am
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T07:00:00`;
  }

  const date = new Date(lastPair);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const extracted = extractEventTimeFromName(name);
  const time = extracted || "07:00";

  return `${yyyy}-${mm}-${dd}T${time}:00`;
}

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
    organizationId,
    eventFormatId,
    metadata,
    players,
    timeZone = "America/Chicago",
  } = body;

  if (!organizationId || !eventFormatId || !metadata || !players) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const startDate = buildEventStartDate(metadata);

  const payload = {
    organizationId,
    eventFormatId,
    eventTitle: metadata.Name || "Imported Event",
    startDate,
    timeZone,
    players: players.map((p: any) => ({
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      email: p.email || p.wizardsEmail || "",
    })),
  };

  try {
    const res = await fetch(TOPDECK_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": TOPDECK_API_KEY,
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
