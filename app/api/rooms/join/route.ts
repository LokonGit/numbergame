import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";


const supabaseServer = createServerClient();
export async function POST(req: NextRequest) {
  try {
    const { playerName, code } = await req.json();

    if (!playerName?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Name and room code are required" }, { status: 400 });
    }

    // Find room
    const { data: room, error: roomError } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Game already started" }, { status: 400 });
    }

    // Check player count
    const { data: existing } = await supabaseServer
      .from("players")
      .select("id")
      .eq("room_id", room.id);

    if (existing && existing.length >= 2) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Create player
    const { data: player, error: playerError } = await supabaseServer
      .from("players")
      .insert({ room_id: room.id, name: playerName.trim() })
      .select()
      .single();

    if (playerError) throw playerError;

    // Update room status to selecting — both players are in
    await supabaseServer
      .from("rooms")
      .update({ status: "selecting" })
      .eq("id", room.id);

    return NextResponse.json({ room, player }, { status: 200 });
  } catch (err) {
    console.error("join room error:", err);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
