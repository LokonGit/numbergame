"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

export default function SelectPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [number, setNumber] = useState(50);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkIfBothReady = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    const data = await res.json();
    if (data.room?.status === "playing") {
      router.push(`/room/${code}/game`);
    }
  }, [code, router]);

  useEffect(() => {
    const playerId = sessionStorage.getItem("playerId");
    if (!playerId) { router.push("/"); return; }

    checkIfBothReady();

    const channel = supabaseBrowser
      .channel(`room-select-${code}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms" }, checkIfBothReady)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "players" }, checkIfBothReady)
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [code, router, checkIfBothReady]);

  async function handleReady() {
    const playerId = sessionStorage.getItem("playerId");
    const roomId = sessionStorage.getItem("roomId");
    if (!playerId || !roomId) { router.push("/"); return; }

    setLoading(true);
    setError("");

    const res = await fetch("/api/players/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, secretNumber: number, roomId }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    setConfirmed(true);
    setLoading(false);

    if (data.allReady) {
      router.push(`/room/${code}/game`);
    }
  }

  return (
    <div className="page">
      <div className="card stack stack-lg">
        <div style={{ textAlign: "center" }}>
          <p className="label" style={{ marginBottom: 8 }}>Choose your secret number</p>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            Pick a number between <span className="grad-text">1 – 100</span>
          </h2>
        </div>

        <div className="stack stack-md" style={{ textAlign: "center" }}>
          <div className="number-display">{confirmed ? "🔒" : number}</div>
          {!confirmed && (
            <input
              type="range"
              min={1}
              max={100}
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="slider"
            />
          )}
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: 13 }}>
            <span>1</span><span>100</span>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {!confirmed ? (
          <button className="btn-primary" onClick={handleReady} disabled={loading}>
            {loading ? "Locking in…" : `Lock in ${number} 🔒`}
          </button>
        ) : (
          <div style={{ textAlign: "center", padding: "16px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>✓ Locked in!</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
              <span className="dot dot-pulse" />
              Waiting for your partner to pick their number…
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Your partner won't see your number until the game ends
        </p>
      </div>
    </div>
  );
}
