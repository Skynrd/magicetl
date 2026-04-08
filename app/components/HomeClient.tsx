"use client";

import { useEffect, useState } from "react";

type Tournament = {
  ID: number;
  Name: string;
};

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Error loading tournaments</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Melee.gg Tournament Browser</h1>

      <select>
        <option value="">Select a tournament...</option>
        {tournaments.map((t) => (
          <option key={t.ID} value={t.ID}>
            {t.Name}
          </option>
        ))}
      </select>
    </div>
  );
}
