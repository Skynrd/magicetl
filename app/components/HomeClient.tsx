"use client";

import { useEffect, useState } from "react";

type Tournament = {
  ID: number;
  Name: string;
  LastPairDateTime?: string;
};

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filtered, setFiltered] = useState<Tournament[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

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

        console.log("Sample tournament:", data.Content[0]);

        setTournaments(data.Content);
        setFiltered(data.Content);
      })
      .catch((err) => {
        console.error("Tournament fetch error:", err);
        setError(err.message);
      });
  }, []);

  const applyFilter = () => {
    const sd = startDateInput ? new Date(startDateInput) : null;
    const ed = endDateInput ? new Date(endDateInput) : null;

    const next = tournaments.filter((t) => {
      const tDate = t.LastPairDateTime ? new Date(t.LastPairDateTime) : null;
      if (!tDate) return false;

      if (sd && tDate < sd) return false;
      if (ed && tDate > ed) return false;

      return true;
    });

    setFiltered(next);

    // Remove selected IDs that no longer exist in filtered list
    setSelectedIds((prev) => prev.filter((id) => next.some((t) => t.ID === id)));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    );
    setSelectedIds(values);
  };

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
          value={startDateInput}
          onChange={(e) => setStartDateInput(e.target.value)}
          style={{ display: "block", marginTop: 4, marginBottom: 12 }}
        />

        <label>End Date (optional)</label>
        <input
          type="date"
          value={endDateInput}
          onChange={(e) => setEndDateInput(e.target.value)}
          style={{ display: "block", marginTop: 4, marginBottom: 12 }}
        />

        <button
          onClick={applyFilter}
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "#333",
            color: "#eee",
            border: "1px solid #555",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Update List
        </button>
      </div>

      <label style={{ marginTop: 20, display: "block" }}>
        Select Tournaments (multi-select)
      </label>

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
