import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";


const supabaseServer = createServerClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const { data: room, error: roomError } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { data: players } = await supabaseServer
      .from("players")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    const { data: guesses } = await supabaseServer
      .from("guesses")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ room, players: players ?? [], guesses: guesses ?? [] });
  } catch (err) {
    console.error("get room error:", err);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}
