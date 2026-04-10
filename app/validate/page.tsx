"use client";

import { useEffect, useState } from "react";

export default function ValidatePage() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("validationResults");
    if (raw) {
      try {
        setResults(JSON.parse(raw));
      } catch {
        console.error("Invalid validationResults JSON");
      }
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Validation Results</h1>

      {results.map((r) => {
        const metadata = r.metadata || {};

        // Format: first entry in Formats[] or "Other"
        const format =
          Array.isArray(metadata.Formats) && metadata.Formats.length > 0
            ? metadata.Formats[0]
            : "Other";

        // Start date formatting
        const startDate = metadata.StartDate
          ? new Date(metadata.StartDate).toLocaleString()
          : "";

        return (
          <div
            key={r.id}
            style={{
              marginTop: 20,
              padding: 12,
              border: "1px solid #444",
              borderRadius: 6,
            }}
          >
            <h2>{metadata.Name || `Tournament ${r.id}`}</h2>

            <p>
              <strong>Format:</strong> {format}
            </p>
            <p>
              <strong>Start:</strong> {startDate}
            </p>
            <p>
              <strong>Players Found:</strong> {r.playerEmails.length}
            </p>

            <h3>Player Emails</h3>
            <ul>
              {r.playerEmails.map((email: string) => (
                <li key={email}>{email}</li>
              ))}
            </ul>

            <h3>Raw Metadata</h3>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#111",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
