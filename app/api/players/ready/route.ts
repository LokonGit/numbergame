import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";


const supabaseServer = createServerClient();

export async function POST(req: NextRequest) {
  try {
    const { playerId, secretNumber, roomId } = await req.json();

    if (!playerId || !roomId || secretNumber == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (secretNumber < 1 || secretNumber > 100) {
      return NextResponse.json({ error: "Number must be between 1 and 100" }, { status: 400 });
    }

    // Mark player ready
    const { error: playerError } = await supabaseServer
      .from("players")
      .update({ secret_number: secretNumber, is_ready: true })
      .eq("id", playerId);

    if (playerError) throw playerError;

    // Check if both players are ready
    const { data: players } = await supabaseServer
      .from("players")
      .select("*")
      .eq("room_id", roomId);

    const allReady = players?.every((p) => p.is_ready) && players.length === 2;

    if (allReady) {
      await supabaseServer
        .from("rooms")
        .update({ status: "playing" })
        .eq("id", roomId);
    }

    return NextResponse.json({ success: true, allReady });
  } catch (err) {
    console.error("ready error:", err);
    return NextResponse.json({ error: "Failed to mark ready" }, { status: 500 });
  }
}
