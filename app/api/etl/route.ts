import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  const rows = text.split("\n").map(r => r.split(","));

  const transformed = rows.map(r => r.map(col => col.trim()));

  return NextResponse.json({ transformed });
}
