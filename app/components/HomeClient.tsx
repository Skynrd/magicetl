"use client";

import { useEffect, useState } from "react";

type Tournament = {
  ID: number;
  Name: string;
  LastPairDateTime?: string;
};

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const [error, setError] = useState<string | null>(null);

  // Load full list on first render
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (start) params.set("startDateFrom", start);
      if (end) params.set("startDateTo", end);

      const url = `/api/melee/tournaments?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API error: ${res.status} — ${body}`);
      }

      const data = await res.json();

      if (!Array.isArray(data.Content)) {
        throw new Error("Unexpected API response shape");
      }

      setTournaments(data.Content);

      // Remove selected IDs that no longer exist
      setSelectedIds((prev) =>
        prev.filter((id) => data.Content.some((t: Tournament) => t.ID === id))
      );
    } catch (err: any) {
      console.error("Tournament fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const start = startDateInput ? `${startDateInput}T00:00:00Z` : undefined;
    const end = endDateInput ? `${endDateInput}T00:00:00Z` : undefined;

    fetchTournaments(start, end);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      Number(o.value)
    );
    setSelectedIds(values);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h1>Melee.gg Tournament Browser</h1>

      {/* Date Range */}
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

      {loading && <p style={{ marginTop: 20 }}>Loading tournaments…</p>}
      {error && (
        <p style={{ marginTop: 20, color: "red" }}>
          Error loading tournaments: {error}
        </p>
      )}

      {/* Multi-select */}
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
        {tournaments.map((t) => (
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
