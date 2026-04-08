export async function GET(_, { params }) {
  const { id } = params;
  const res = await fetch(`https://api.melee.gg/v1/tournaments/${id}/events`);
  const data = await res.json();
  return Response.json(data);
}
