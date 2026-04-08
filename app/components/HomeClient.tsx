"use client";

import { useEffect, useState } from "react";

type Tournament = {
  ID: number;
  Name: string;
  StartDate?: string;
  EndDate?: string;
};

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/melee/tournaments")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `Request failed: ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.Content)) {
          throw new Error("API returned unexpected shape");
        }
        setTournaments(data.Content);
      })
      .catch((err) => {
        console.error("Tournament fetch error:", err);
        setError(err.message);
      });
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    );
    setSelectedIds(values);
  };

  const filtered = tournaments.filter((t) => {
    const sd = startDate ? new Date(startDate) : null;
    const ed = endDate ? new Date(endDate) : null;

    const tStart = t.StartDate ? new Date(t.StartDate) : null;
    const tEnd = t.EndDate ? new Date(t.EndDate) : null;

    if (sd && tEnd && tEnd < sd) return false;
    if (ed && tStart && tStart > ed) return false;

    return true;
  });

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Error loading tournaments</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h1>Melee.gg Tournament Browser</h1>

      <div style={{ marginTop: 20 }}>
        <label>Start Date (optional)</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ display: "block", marginTop: 4, marginBottom: 12 }}
        />

        <label>End Date (optional)</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ display: "block", marginTop: 4, marginBottom: 12 }}
        />
      </div>

      <label>Select Tournaments (multi‑select)</label>
      <select
        multiple
        size={12}
        value={selectedIds.map(String)}
        onChange={handleSelect}
        style={{
          width: "100%",
          marginTop: 4,
          marginBottom: 20,
          padding: 8,
        }}
      >
        {filtered.map((t) => (
          <option key={t.ID} value={t.ID}>
            {t.Name}
          </option>
        ))}
      </select>

      {selectedIds.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2>Selected Tournaments</h2>
          <ul>
            {selectedIds.map((id) => {
              const t = tournaments.find((x) => x.ID === id);
              return <li key={id}>{t?.Name}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
