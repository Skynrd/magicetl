import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params; // works whether it's a Promise or not

  const res = await fetch(`https://api.melee.gg/v1/tournaments/${id}/events`);
  const data = await res.json();

  return Response.json(data);
}
