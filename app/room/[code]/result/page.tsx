"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Player, Guess, Room } from "@/lib/types";

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const myId = typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null;

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setRoom(data.room);
    setPlayers(data.players);
    setGuesses(data.guesses);
  }, [code, router]);

  useEffect(() => {
    if (!myId) { router.push("/"); return; }
    fetchState();
  }, [myId, fetchState, router]);

  if (!room || players.length < 2) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    );
  }

  const winner = players.find((p) => p.id === room.winner_id);
  const loser = players.find((p) => p.id !== room.winner_id);
  const iWon = room.winner_id === myId;

  const myGuessCount = guesses.filter((g) => g.guesser_id === myId).length;
  const theirGuessCount = guesses.filter((g) => g.guesser_id !== myId).length;

  return (
    <div className="page">
      <div className="card stack stack-lg" style={{ textAlign: "center" }}>
        {/* Winner announcement */}
        <div className={iWon ? "winner-glow" : ""} style={{
          padding: "28px 20px",
          borderRadius: "var(--r-lg)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>
            {iWon ? "🏆" : "💙"}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>
            {iWon
              ? <><span className="grad-text">You won!</span></>
              : <>{winner?.name} won!</>
            }
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            {iWon
              ? `You guessed ${loser?.name}'s number first 🎯`
              : `Better luck next time — you'll get them next round!`
            }
          </p>
        </div>

        {/* Reveal secrets */}
        <div className="stack stack-sm">
          <p className="label">The secret numbers</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {players.map((p) => (
              <div key={p.id} style={{
                padding: "16px",
                background: "var(--bg-elevated)",
                borderRadius: "var(--r-md)",
                border: `1px solid ${p.id === room.winner_id ? "rgba(247,119,94,0.3)" : "var(--border)"}`,
              }}>
                <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 6, fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {p.name} {p.id === myId ? "(you)" : ""}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 500 }}
                   className={p.id === room.winner_id ? "grad-text" : ""}>
                  {p.secret_number}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <p className="label" style={{ marginBottom: 4 }}>Your guesses</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--text-primary)" }}>{myGuessCount}</p>
          </div>
          <div style={{ padding: "14px", background: "var(--bg-elevated)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
            <p className="label" style={{ marginBottom: 4 }}>Their guesses</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, color: "var(--text-primary)" }}>{theirGuessCount}</p>
          </div>
        </div>

        {/* Play again */}
        <button className="btn-primary" onClick={() => router.push("/")}>
          Play again →
        </button>
      </div>
    </div>
  );
}
