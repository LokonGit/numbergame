"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import type { Player, Room } from "@/lib/types";

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [myName, setMyName] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setRoom(data.room);
    setPlayers(data.players);
    if (data.room.status === "selecting") {
      router.push(`/room/${code}/select`);
    }
  }, [code, router]);

  useEffect(() => {
    const name = sessionStorage.getItem("playerName");
    if (!name) { router.push("/"); return; }
    setMyName(name);
    fetchState();

    // Realtime — watch for second player joining (players table insert) or room status change
    const channel = supabaseBrowser
      .channel(`room-waiting-${code}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "players" }, fetchState)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms" }, fetchState)
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [code, router, fetchState]);

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page">
      <div className="card stack stack-lg">
        <div style={{ textAlign: "center" }}>
          <p className="label" style={{ marginBottom: 12 }}>Room code</p>
          <div className="room-code">{code}</div>
          <button className="btn-ghost" style={{ marginTop: 10 }} onClick={copyCode}>
            {copied ? "✓ Copied!" : "Copy code"}
          </button>
        </div>

        <div className="stack stack-sm">
          <p className="label">Players</p>
          {players.map((p) => (
            <div key={p.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border)",
            }}>
              <span className="dot dot-ready" />
              <span style={{ fontSize: 15, color: "var(--text-primary)" }}>{p.name}</span>
              {p.name === myName && (
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>you</span>
              )}
            </div>
          ))}

          {players.length < 2 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--r-md)",
              border: "1px dashed var(--border-strong)",
            }}>
              <span className="dot dot-pulse" />
              <span style={{ fontSize: 15, color: "var(--text-muted)" }}>Waiting for partner…</span>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Share the room code with your partner to start
        </p>
      </div>
    </div>
  );
}
