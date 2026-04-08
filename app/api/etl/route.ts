import { extractFromSource, transformData, loadToDestination } from "@/app/lib/etl";

export async function POST(req: Request) {
  try {
    // 1. Extract
    const raw = await extractFromSource();

    // 2. Transform
    const transformed = transformData(raw);

    // 3. Load
    const result = await loadToDestination(transformed);

    return Response.json({ ok: true, transformed, result });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
