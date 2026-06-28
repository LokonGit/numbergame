"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import type { Player, Guess, Room } from "@/lib/types";

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [guess, setGuess] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const guessListRef = useRef<HTMLDivElement>(null);

  const myId = typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null;

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setRoom(data.room);
    setPlayers(data.players);
    setGuesses(data.guesses);

    if (data.room.status === "finished") {
      router.push(`/room/${code}/result`);
    }
  }, [code, router]);

  useEffect(() => {
    if (!myId) { router.push("/"); return; }
    fetchState();

    const channel = supabaseBrowser
      .channel(`room-game-${code}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guesses" }, fetchState)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms" }, fetchState)
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [code, router, myId, fetchState]);

  // Auto-scroll guess list
  useEffect(() => {
    if (guessListRef.current) {
      guessListRef.current.scrollTop = guessListRef.current.scrollHeight;
    }
  }, [guesses]);

  const me = players.find((p) => p.id === myId);
  const opponent = players.find((p) => p.id !== myId);

  // Whose turn is it?
  // Rule: turns alternate. First guess ever → Player 1 (room creator) goes first.
  // After that: each guess flips the turn.
  const lastGuess = guesses[guesses.length - 1];
  const isMyTurn = !lastGuess
    ? players[0]?.id === myId          // first turn: creator goes first
    : lastGuess.guesser_id !== myId;   // otherwise: alternate

  async function handleGuess() {
    const val = parseInt(guess);
    if (isNaN(val) || val < 1 || val > 100) {
      setError("Enter a number between 1 and 100");
      return;
    }
    if (!me || !opponent || !room) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/guesses/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guesserId: me.id,
        targetId: opponent.id,
        roomId: room.id,
        value: val,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setGuess("");
    setLoading(false);
  }

  if (!room || !me || !opponent) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    );
  }

  // Split guesses by who made them
  const myGuesses = guesses.filter((g) => g.guesser_id === myId);
  const theirGuesses = guesses.filter((g) => g.guesser_id !== myId);

  return (
    <div className="page" style={{ padding: "24px 16px" }}>
      <div className="card card-wide stack stack-lg">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              <span className="grad-text">{me.name}</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> vs </span>
              <span>{opponent.name}</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
              Room <span style={{ fontFamily: "var(--font-mono)" }}>{code}</span>
            </p>
          </div>
          <span className={`turn-pill ${isMyTurn ? "turn-pill-yours" : "turn-pill-theirs"}`}>
            {isMyTurn ? "Your turn" : `${opponent.name}'s turn`}
          </span>
        </div>

        {/* Two column guesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* My guesses column */}
          <div className="stack stack-sm">
            <p className="label">Your guesses at {opponent.name}</p>
            <div className="guess-list" ref={myGuesses.length > 0 ? guessListRef : null}>
              {myGuesses.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>No guesses yet</p>
              )}
              {myGuesses.map((g) => (
                <div key={g.id} className="guess-item">
                  <span className="guess-value">{g.value}</span>
                  <span className={`badge badge-${g.hint}`}>
                    {g.hint === "higher" ? "↑ Higher" : g.hint === "lower" ? "↓ Lower" : "✓ Correct!"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Their guesses column */}
          <div className="stack stack-sm">
            <p className="label">{opponent.name}'s guesses at you</p>
            <div className="guess-list">
              {theirGuesses.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>No guesses yet</p>
              )}
              {theirGuesses.map((g) => (
                <div key={g.id} className="guess-item">
                  <span className="guess-value">{g.value}</span>
                  <span className={`badge badge-${g.hint}`}>
                    {g.hint === "higher" ? "↑ Higher" : g.hint === "lower" ? "↓ Lower" : "✓ Correct!"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guess input */}
        {isMyTurn ? (
          <div className="stack stack-sm">
            <p className="label">Guess {opponent.name}'s number</p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                type="number"
                min={1}
                max={100}
                placeholder="1 – 100"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                style={{ fontFamily: "var(--font-mono)", fontSize: 18, flex: 1 }}
                autoFocus
              />
              <button
                className="btn-primary"
                onClick={handleGuess}
                disabled={loading}
                style={{ width: "auto", padding: "13px 24px", flexShrink: 0 }}
              >
                {loading ? "…" : "Guess →"}
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "20px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", fontSize: 15 }}>
              <span className="dot dot-pulse" />
              Waiting for {opponent.name} to guess…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
