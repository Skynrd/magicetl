"use client";

import { useEffect, useState } from "react";

export default function ValidatePage() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("validationResults");
    if (raw) {
      setResults(JSON.parse(raw));
    }
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Validation Results</h1>

      {results.map((r) => (
        <div
          key={r.id}
          style={{
            marginTop: 20,
            padding: 12,
            border: "1px solid #444",
            borderRadius: 6,
          }}
        >
          <h2>{r.metadata?.Name || `Tournament ${r.id}`}</h2>

          <p><strong>Format:</strong> {r.metadata?.FormatName}</p>
          <p><strong>Start:</strong> {r.metadata?.StartDate}</p>
          <p><strong>Players Found:</strong> {r.playerEmails.length}</p>

          <h3>Player Emails</h3>
          <ul>
            {r.playerEmails.map((email: string, idx: number) => (
              <li key={idx}>{email}</li>
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
            {JSON.stringify(r.metadata, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
