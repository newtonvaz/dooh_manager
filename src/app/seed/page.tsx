"use client"

import { useState } from "react"

export default function SeedPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [result, setResult] = useState<any>(null)

  async function runSeed() {
    setStatus("loading")
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      })
      const json = await res.json()
      setResult(json)
      setStatus(json.error ? "error" : "done")
    } catch (e) {
      setResult(String(e))
      setStatus("error")
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Seed Database</h1>
      <button
        onClick={runSeed}
        disabled={status === "loading"}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: 16,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Executando..." : "Executar Seed"}
      </button>

      {status === "loading" && <p style={{ marginTop: "1rem", color: "#666" }}>Populando banco de dados...</p>}

      {result && (
        <pre style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: 4,
          overflow: "auto",
          fontSize: 14,
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}
