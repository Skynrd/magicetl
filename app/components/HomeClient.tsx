"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// -----------------------------
// Types
// -----------------------------
export type Tournament = {
  ID: number;
  Name: string;
  LastPairDateTime?: string;
  FormatName?: string;
  StartDate?: string;
};

export type Player = {
  WizardsAccountEmail?: string | null;
  Email?: string | null;
};

export type ValidationResult = {
  id: number;
  metadata: Tournament | null;
  playerEmails: string[];
};

// -----------------------------
// Component
// -----------------------------
export default function HomeClient() {
  const router = useRouter();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [startDateInput, setStartDateInput] = useState<string>("");
  const [endDateInput, setEndDateInput] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Load full list on mount
  useEffect(() => {
    fetchTournaments();
  }, []);

  // -----------------------------
  // Fetch tournaments
  // -----------------------------
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

      const data: { Content: Tournament[] } = await res.json();

      if (!Array.isArray(data.Content)) {
        throw new Error("Unexpected API response shape");
      }

      // Filter out malformed tournaments
      const cleaned: Tournament[] = data.Content.filter(
        (t: Tournament) => typeof t.ID === "number" && t.ID > 0
      );

      setTournaments(cleaned);

      // Clean up selected IDs
      setSelectedIds((prev) =>
        prev.filter((id) => cleaned.some((t) => t.ID === id))
      );
    } catch (err: any) {
      console.error("Tournament fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Apply date filter
  // -----------------------------
  const applyFilter = () => {
    const start = startDateInput ? `${startDateInput}T00:00:00Z` : undefined;
    const end = endDateInput ? `${endDateInput}T00:00:00Z` : undefined;
    fetchTournaments(start, end);
  };

  // -----------------------------
  // Selection logic
  // -----------------------------
  const toggleTournament = (id: number) => {
    if (typeof id !== "number") return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = tournaments.map((t) => t.ID);
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // -----------------------------
  // Validation logic
  // -----------------------------
  const validateSelected = async () => {
    if (selectedIds.length === 0) return;

    setLoading(true);

    try {
      const results: ValidationResult[] = [];

      for (const id of selectedIds) {
        if (typeof id !== "number") continue;

        // Tournament metadata
        const metaRes = await fetch(`/api/melee/tournament/${id}`, {
          headers: { Accept: "application/json" },
        });
        const metadata: Tournament | null = await metaRes.json();

        // Player list
        const playersRes = await fetch(`/api/melee/player-list/${id}`, {
          headers: { Accept: "application/json" },
        });
        const playersJson: { Content?: Player[] } = await playersRes.json();

        const playerEmails: string[] = (playersJson.Content || [])
          .map((p: Player) => p.WizardsAccountEmail || p.Email || null)
          .filter((email): email is string => Boolean(email));

        results.push({
          id,
          metadata,
          playerEmails,
        });
      }

      sessionStorage.setItem("validationResults", JSON.stringify(results));
      router.push("/validate");
    } catch (err) {
      console.error("Validation error:", err);
      alert("Error validating tournaments. Check console.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
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

      {loading && <p style={{ marginTop: 20 }}>Loading…</p>}
      {error && (
        <p style={{ marginTop: 20, color: "red" }}>
          Error loading tournaments: {error}
        </p>
      )}

      {/* Search + Select All / Deselect All */}
      <label style={{ marginTop: 20, display: "block", fontWeight: "bold" }}>
        Select Tournaments
      </label>

      <input
        type="text"
        placeholder="Search tournaments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginTop: "8px",
          marginBottom: "12px",
          borderRadius: "4px",
          border: "1px solid #444",
          background: "#1e1e1e",
          color: "#eee",
        }}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={selectAll}
          style={{
            padding: "6px 10px",
            background: "#333",
            color: "#eee",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Select All
        </button>

        <button
          onClick={deselectAll}
          style={{
            padding: "6px 10px",
            background: "#333",
            color: "#eee",
            border: "1px solid #555",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Deselect All
        </button>
      </div>

      {/* Checkbox list */}
      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          border: "1px solid #444",
          padding: "10px",
          borderRadius: "6px",
          marginTop: "8px",
        }}
      >
        {tournaments
          .filter((t) =>
            t.Name.toLowerCase().includes(search.toLowerCase())
          )
          .map((t) => {
            const checked = selectedIds.includes(t.ID);

            return (
              <div key={t.ID} style={{ marginBottom: "6px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTournament(t.ID)}
                  />
                  {t.Name}
                </label>
              </div>
            );
          })}
      </div>

      {/* Validate Button */}
      <button
        onClick={validateSelected}
        disabled={selectedIds.length === 0}
        style={{
          marginTop: 20,
          padding: "10px 14px",
          background: selectedIds.length === 0 ? "#555" : "#0066ff",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Validate Selected Tournaments
      </button>
    </div>
  );
}
