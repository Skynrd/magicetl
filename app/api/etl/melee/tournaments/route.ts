export async function GET() {
  const res = await fetch("https://api.melee.gg/v1/tournaments");
  const data = await res.json();
  return Response.json(data);
}
