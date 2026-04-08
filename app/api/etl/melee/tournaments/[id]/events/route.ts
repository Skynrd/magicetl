import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const params = await context.params; // works for both cases
  const { id } = params;

  const res = await fetch(`https://api.melee.gg/v1/tournaments/${id}/events`);
  const data = await res.json();

  return Response.json(data);
}
