export async function GET() {
  return Response.json({
    username: process.env.MELEE_USERNAME,
    password: process.env.MELEE_PASSWORD ? "set" : "missing"
  });
}
