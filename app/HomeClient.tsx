"use client";

import { useEffect, useState } from "react";

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);

  // Load tournaments on page load
  useEffect(() => {
    async function loadTournaments() {
      const res = await fetch("/api/melee/tournaments");
      const data = await res.json();
      setTournaments(data);
    }
    loadTournaments();
  }, []);

  // Load events when a tournament is selected
  useEffect(() => {
    if (!selectedTournament) return;

    async function loadEvents() {
      const res = await fetch(`/api/melee/tournaments/${selectedTournament}/events`);
      const data = await res.json();
      setEvents(data);
    }

    loadEvents();
  }, [selectedTournament]);

  return (
    <div style={{ padding: "40px", color: "var(--foreground)" }}>
      <h1 style={{ marginBottom: "20px" }}>Melee.gg Tournament Browser</h1>

      {/* Tournament Dropdown */}
      <select
        value={selectedTournament}
        onChange={(e) => setSelectedTournament(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "6px",
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid rgba(255,255,255,0.2)",
          marginBottom: "20px",
        }}
      >
        <option value="">Select a tournament...</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Events List */}
      {events.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Events</h2>
          <ul>
            {events.map((ev) => (
              <li key={ev.id}>
                <strong>{ev.name}</strong> — {ev.format} — {ev.numPlayers} players
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
