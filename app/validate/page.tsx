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
          <h2>Tournament {r.id}</h2>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#111",
              padding: 10,
              borderRadius: 4,
            }}
          >
            {JSON.stringify(r.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
