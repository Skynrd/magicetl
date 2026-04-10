"use client";

import { useEffect, useState } from "react";

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Load tournaments from API
  // -----------------------------
  async function loadTournaments() {
    setLoading(true);

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/melee/list?${params.toString()}`);
    const json = await res.json();

    setTournaments(json || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  // -----------------------------
  // Selection logic
  // -----------------------------
  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedIds(tournaments.map((t) => t.ID));
  }

  function deselectAll() {
    setSelectedIds([]);
  }

  // -----------------------------
  // Validate Selected
  // -----------------------------
  async function validateSelected() {
    if (selectedIds.length === 0) {
      alert("No tournaments selected.");
      return;
    }

    setLoading(true);

    const results = [];

    for (const id of selectedIds) {
      const res = await fetch(`/api/melee/tournament/${id}`);
      const metadata = await res.json();

      const playersRes = await fetch(`/api/melee/player-list/${id}`);
      const playersJson = await playersRes.json();

      const playerEmails =
        playersJson?.Players?.map((p: any) => p.EmailAddress).filter(Boolean) ||
        [];

      results.push({
        id,
        metadata,
        playerEmails,
      });
    }

    sessionStorage.setItem("validationResults", JSON.stringify(results));
    setLoading(false);

    alert("Validation complete. Go to /validate to view results.");
  }

  // -----------------------------
  // Upload Selected to EventLink
  // -----------------------------
  async function uploadSelected() {
    if (selectedIds.length === 0) {
      alert("No tournaments selected.");
      return;
    }

    const raw = sessionStorage.getItem("validationResults");
    if (!raw) {
      alert("Please validate tournaments first.");
      return;
    }

    const results = JSON.parse(raw);

    // Load EventLink auth info
    const authRes = await fetch("/api/eventlink/check-auth");
    const authJson = await authRes.json();

    if (!authJson.authenticated) {
      alert("Not authenticated with EventLink.");
      return;
    }

    // For now, auto-select the first org
    const organizationId = authJson.organizations[0].id;

    const uploads = [];

    for (const id of selectedIds) {
      const r = results.find((x: any) => x.id === id);
      if (!r) continue;

      // Determine Melee format
      const meleeFormat =
        Array.isArray(r.metadata?.Formats) && r.metadata.Formats.length > 0
          ? r.metadata.Formats[0]
          : "Other";

      // Match EventLink format
      const eventFormat =
        authJson.eventFormats.find(
          (f: any) =>
            f.name.toLowerCase() === meleeFormat.toLowerCase()
        ) ||
        authJson.eventFormats.find((f: any) => f.name === "Other");

      const eventFormatId = eventFormat?.id;

      const payload = {
        organizationId,
        eventFormatId,
        metadata: r.metadata,
        players: r.playerEmails.map((email: string) => ({
          email,
          firstName: "",
          lastName: "",
        })),
        timeZone: "America/Chicago",
      };

      uploads.push(
        fetch("/api/eventlink/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((res) => res.json())
      );
    }

    const resultsJson = await Promise.all(uploads);

    console.log("Import results:", resultsJson);
    alert("Upload complete. Check console for details.");
  }

  // -----------------------------
  // Filtered list
  // -----------------------------
  const filtered = tournaments.filter((t) =>
    t.Name.toLowerCase().includes(search.toLowerCase())
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 20 }}>
      <h1>Melee Tournament Browser</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Search tournaments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 6,
            width: 250,
            marginRight: 10,
            border: "1px solid #444",
            borderRadius: 4,
            background: "#222",
            color: "white",
          }}
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            padding: 6,
            marginRight: 10,
            border: "1px solid #444",
            borderRadius: 4,
            background: "#222",
            color: "white",
          }}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            padding: 6,
            marginRight: 10,
            border: "1px solid #444",
            borderRadius: 4,
            background: "#222",
            color: "white",
          }}
        />

        <button onClick={loadTournaments}>Update List</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={selectAll} style={{ marginRight: 10 }}>
          Select All
        </button>
        <button onClick={deselectAll}>Deselect All</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button onClick={validateSelected}>
          Validate Selected Tournaments
        </button>

        <button onClick={uploadSelected}>
          Upload Selected Tournaments to EventLink
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {filtered.map((t) => (
        <div
          key={t.ID}
          style={{
            padding: 10,
            border: "1px solid #444",
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={selectedIds.includes(t.ID)}
              onChange={() => toggleSelect(t.ID)}
              style={{ marginRight: 8 }}
            />
            {t.Name}
          </label>
        </div>
      ))}
    </div>
  );
} //force redeploy
