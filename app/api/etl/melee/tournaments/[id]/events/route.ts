export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const res = await fetch(`https://api.melee.gg/v1/tournaments/${id}/events`);
  const data = await res.json();

  return Response.json(data);
}
