"use client";

import { useEffect, useState } from "react";

export default function HomeClient() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: modal + progress state
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    { id: number; name: string; status: "pending" | "success" | "failed" }[]
  >([]);

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

    const organizationId = authJson.organizations[0].id;

    // Initialize modal + progress
    const initialProgress = selectedIds.map((id) => {
      const t = tournaments.find((x) => x.ID === id);
      return {
        id,
        name: t?.Name || `Tournament ${id}`,
        status: "pending" as const,
      };
    });

    setUploadProgress(initialProgress);
    setShowModal(true);

    // Upload one-by-one so progress updates cleanly
    for (const id of selectedIds) {
      const r = results.find((x: any) => x.id === id);
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

      try {
        const res = await fetch("/api/eventlink/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        setUploadProgress((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: res.ok ? "success" : "failed" }
              : p
          )
        );
      } catch (err) {
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
  const filtered = tournaments.filter((t) =>
    t.Name.toLowerCase().includes(search.toLowerCase())
  );

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <h1>Melee Tournament Browser</h1>

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

      {/* Scrollable tournament list */}
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
        {filtered.map((t) => (
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

      {/* -----------------------------
          Upload Progress Modal
      ------------------------------ */}
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
