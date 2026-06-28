import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/utils";

const supabaseServer = createServerClient();

export async function POST(req: NextRequest) {
  try {
    const { playerName } = await req.json();

    if (!playerName?.trim()) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    // Generate unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseServer
        .from("rooms")
        .select("id")
        .eq("code", code)
        .single();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    // Create room
    const { data: room, error: roomError } = await supabaseServer
      .from("rooms")
      .insert({ code, status: "waiting" })
      .select()
      .single();

    if (roomError) throw roomError;

    // Create player
    const { data: player, error: playerError } = await supabaseServer
      .from("players")
      .insert({ room_id: room.id, name: playerName.trim() })
      .select()
      .single();

    if (playerError) throw playerError;

    return NextResponse.json({ room, player }, { status: 201 });
  } catch (err) {
    console.error("create room error:", err);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
