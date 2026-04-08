export async function extractFromSource() {
  const res = await fetch("https://source-api.com/data", {
    headers: { Authorization: `Bearer ${process.env.SOURCE_TOKEN}` },
  });

  if (!res.ok) throw new Error("Failed to pull source data");
  return res.json();
}

export function transformData(raw: string[][]) {
  return raw.map((row: string[]) => ({
    id: row[0],
    amount: Number(row[1]),
    date: new Date(row[2]),
  }));
}

export async function loadToDestination(transformed: any) {
  const res = await fetch("https://destination-api.com/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEST_TOKEN}`,
    },
    body: JSON.stringify(transformed),
  });

  if (!res.ok) throw new Error("Failed to push transformed data");
  return res.json();
}
