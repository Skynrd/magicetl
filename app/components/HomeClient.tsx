"use client";

import { useEffect, useState } from "react";

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    { id: number; name: string; status: "pending" | "success" | "failed" }[]
  >([]);

  // -----------------------------
  // Helpers for startDate logic
  // -----------------------------

  function extractEventTimeFromName(name: string): string | null {
    if (!name) return null;

    const timeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
    const match = name.match(timeRegex);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3].toLowerCase();

    if (ampm === "pm" && hour !== 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  }

  function buildStartDate(metadata: any, eventName: string): string {
    const lastPair = metadata?.LastPairDateTime;
    const extracted = extractEventTimeFromName(eventName);

    const date = lastPair ? new Date(lastPair) : new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    const time = extracted || "07:00";

    return `${yyyy}-${mm}-${dd}T${time}:00`;
  }

  // -----------------------------
  // Load tournaments
  // -----------------------------
  async function loadTournaments() {
    setLoading(true);

    const params = new URLSearchParams();
    if (startDate) params.set("startDateFrom", `${startDate}T00:00:00Z`);
    if (endDate) params.set("startDateTo", `${endDate}T00:00:00Z`);

    const res = await fetch(`/api/melee/tournaments?${params.toString()}`);
    const json = await res.json();

    const list = Array.isArray(json?.Content) ? json.Content : [];
    setTournaments(list);
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
    setSelectedIds(tournaments.map((t: any) => t.ID));
  }

  function deselectAll() {
    setSelectedIds([]);
  }

  // -----------------------------
  // Validate Selected (fills right panel)
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
        (playersJson?.Content || [])
          .map((p: any) => p.WizardsAccountEmail || p.Email || null)
          .filter((email: string | null): email is string => Boolean(email));

      results.push({
        id,
        metadata,
        playerEmails,
      });
    }

    setValidationResults(results);
    setLoading(false);
  }

  // -----------------------------
  // Upload Selected
  // -----------------------------
  async function uploadSelected() {
    if (selectedIds.length === 0) {
      alert("No tournaments selected.");
      return;
    }

    if (validationResults.length === 0) {
      alert("Please validate tournaments first.");
      return;
    }

    const authRes = await fetch("/api/eventlink/check-auth");
    const authJson = await authRes.json();

    if (!authJson.authenticated) {
      alert("Not authenticated with EventLink.");
      return;
    }

    const organizationId = authJson.organizations[0].id;

    const initialProgress = selectedIds.map((id) => {
      const t = tournaments.find((x: any) => x.ID === id);
      return {
        id,
        name: t?.Name || `Tournament ${id}`,
        status: "pending" as const,
      };
    });

    setUploadProgress(initialProgress);
    setShowModal(true);

    for (const id of selectedIds) {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const r = validationResults.find((x: any) => x.id === id);
      if (!r) continue;

      const meleeFormat =
        Array.isArray(r.metadata?.Formats) && r.metadata.Formats.length > 0
          ? r.metadata.Formats[0]
          : "Other";

      const eventFormat =
        authJson.eventFormats.find(
          (f: any) =>
            f.name.toLowerCase() === meleeFormat.toLowerCase()
        ) ||
        authJson.eventFormats.find((f: any) => f.name === "Other");

      const eventFormatId = eventFormat?.id;
      const eventTitle: string = r.metadata?.Name || "Melee Event";

      const startDateIso = buildStartDate(r.metadata, eventTitle);

      if (!eventFormatId || !organizationId || !r.playerEmails?.length) {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "failed" } : p
          )
        );
        continue;
      }

      const players = r.playerEmails.map((email: string) => ({
        email,
        firstName: "",
        lastName: "",
      }));

      const payload = {
        organizationId,
        eventFormatId,
        eventTitle,
        eventDescription: eventTitle,
        startDate: startDateIso,
        timeZone: "America/Chicago",
        players,
      };

      try {
        const res = await fetch("/api/eventlink/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        await res.json().catch(() => null);

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: res.ok ? "success" : "failed" }
              : p
          )
        );
      } catch {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: "failed" } : p
          )
        );
      }
    }
  }

  // -----------------------------
  // Filtered list
  // -----------------------------
  const filtered = tournaments.filter((t: any) =>
    t.Name.toLowerCase().includes(search.toLowerCase())
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 20 }}>
      <h1>Melee Tournament Browser</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {/* LEFT SIDE */}
        <div style={{ flex: 1 }}>
          {/* Search + Date Range */}
          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: 6,
                width: "100%",
                marginBottom: 10,
                border: "1px solid #444",
                borderRadius: 4,
                background: "#222",
                color: "white",
              }}
            />

            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: 6,
                width: "100%",
                marginBottom: 10,
                border: "1px solid #444",
                borderRadius: 4,
                background: "#222",
                color: "white",
              }}
            />

            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: 6,
                width: "100%",
                marginBottom: 10,
                border: "1px solid #444",
                borderRadius: 4,
                background: "#222",
                color: "white",
              }}
            />

            <button
              onClick={loadTournaments}
              style={{
                padding: "8px 12px",
                background: "#333",
                color: "#eee",
                border: "1px solid #555",
                borderRadius: 4,
                cursor: "pointer",
                marginTop: 5,
              }}
            >
              Update List
            </button>
          </div>

          {/* Select All / Deselect All */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={selectAll}
              style={{
                padding: "6px 10px",
                background: "#333",
                color: "#eee",
                border: "1px solid #555",
                borderRadius: 4,
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
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Deselect All
            </button>
          </div>

          {/* Tournament List */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #444",
              padding: 10,
              borderRadius: 6,
              marginBottom: 20,
            }}
          >
            {filtered.map((t: any) => (
              <div key={t.ID} style={{ marginBottom: 6 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(t.ID)}
                    onChange={() => toggleSelect(t.ID)}
                  />
                  {t.Name}
                </label>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button
            onClick={validateSelected}
            disabled={selectedIds.length === 0}
            style={{
              padding: "10px 14px",
              background: selectedIds.length === 0 ? "#555" : "#0066ff",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
              marginBottom: 10,
              width: "100%",
            }}
          >
            Validate Selected Tournaments
          </button>

          <button
            onClick={uploadSelected}
            disabled={selectedIds.length === 0}
            style={{
              padding: "10px 14px",
              background: selectedIds.length === 0 ? "#555" : "#00aa55",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            Upload Selected Tournaments to EventLink
          </button>

          {loading && <p style={{ marginTop: 20 }}>Loading...</p>}
        </div>

        {/* RIGHT SIDE — Validation Panel */}
        <div
          style={{
            flex: 1,
            border: "1px solid #444",
            padding: 16,
            borderRadius: 8,
            background: "#1a1a1a",
            color: "white",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2>Validation Results</h2>

          {validationResults.length === 0 && (
            <p style={{ opacity: 0.6 }}>No tournaments validated yet.</p>
          )}

          {validationResults.map((r) => (
            <div key={r.id} style={{ marginBottom: 20 }}>
              <h3>{r.metadata?.Name}</h3>

              <div style={{ fontSize: 14, opacity: 0.8 }}>
                <div><strong>ID:</strong> {r.id}</div>
                <div><strong>Format:</strong> {r.metadata?.Formats?.join(", ")}</div>
                <div><strong>Last Pair:</strong> {r.metadata?.LastPairDateTime}</div>
              </div>

              <div style={{ marginTop: 10 }}>
                <strong>Players ({r.playerEmails.length}):</strong>
                <ul style={{ marginTop: 4 }}>
                  {r.playerEmails.map((email: string) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>

              <hr style={{ borderColor: "#333", marginTop: 16 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Upload Progress Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#222",
              padding: 20,
              borderRadius: 8,
              width: "90%",
              maxWidth: 500,
              color: "white",
            }}
          >
            <h2>Uploading to EventLink…</h2>

            {uploadProgress.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #444",
                }}
              >
                <span>{p.name}</span>
                <span
                  style={{
                    color:
                      p.status === "pending"
                        ? "#ccc"
                        : p.status === "success"
                        ? "#00ff88"
                        : "#ff4444",
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}

            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: 20,
                padding: "8px 12px",
                background: "#444",
                color: "white",
                border: "1px solid #666",
                borderRadius: 4,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
