"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    setError("");

    const res = await fetch("/api/rooms/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: name }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    // Store player info in sessionStorage so we know who we are
    sessionStorage.setItem("playerId", data.player.id);
    sessionStorage.setItem("playerName", data.player.name);
    sessionStorage.setItem("roomId", data.room.id);

    router.push(`/room/${data.room.code}`);
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Enter your name first");
    if (!code.trim()) return setError("Enter the room code");
    setLoading(true);
    setError("");

    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: name, code }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    sessionStorage.setItem("playerId", data.player.id);
    sessionStorage.setItem("playerName", data.player.name);
    sessionStorage.setItem("roomId", data.room.id);

    router.push(`/room/${data.room.code}`);
  }

  return (
    <div className="page">
      <div className="card stack stack-lg">
        {/* Header */}
        <div className="stack stack-sm" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🎯</div>
          <h1 style={{ fontSize: 36, fontWeight: 800 }}>
            <span className="grad-text">Guessy</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.5 }}>
            Pick a secret number. Take turns guessing each other's.<br />
            First to guess right wins.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "var(--bg-elevated)",
          borderRadius: "var(--r-md)",
          padding: 4,
          gap: 4,
        }}>
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              style={{
                padding: "10px",
                borderRadius: "calc(var(--r-md) - 2px)",
                border: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t ? "var(--bg-surface)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {t === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="stack stack-md">
          <div className="stack stack-sm">
            <label className="label">Your name</label>
            <input
              className="input"
              placeholder="e.g. Priya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
            />
          </div>

          {tab === "join" && (
            <div className="stack stack-sm">
              <label className="label">Room code</label>
              <input
                className="input"
                placeholder="e.g. AB3X9K"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.12em", fontSize: 18 }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button
            className="btn-primary"
            onClick={tab === "create" ? handleCreate : handleJoin}
            disabled={loading}
          >
            {loading ? "..." : tab === "create" ? "Create Room →" : "Join Room →"}
          </button>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Share the 6-letter code with your partner
        </p>
      </div>
    </div>
  );
}
