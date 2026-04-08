"use client";
import { useState } from "react";

export default function Home() {
  const [rows, setRows] = useState<string[][] | null>(null);

  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/etl", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setRows(data.transformed || []);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "60px",
        background: "#f7f7f7",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "600px",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "20px", fontSize: "24px" }}>
          CSV ETL Tool
        </h1>

        <label
          style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#0070f3",
            color: "white",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Upload CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>

        {!rows && (
          <p style={{ color: "#666" }}>
            Upload a CSV file to preview and transform it.
          </p>
        )}

        {rows && rows.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid #ddd",
              borderRadius: "8px",
              marginTop: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((col, j) => (
                      <td
                        key={j}
                        style={{
                          border: "1px solid #eee",
                          padding: "8px 10px",
                        }}
                      >
                        {col}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
