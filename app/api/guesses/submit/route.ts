import { NextRequest, NextResponse } from "next/server";
import { getHint } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase";

const supabaseServer = createServerClient();
export async function POST(req: NextRequest) {
  try {
    const { guesserId, targetId, roomId, value } = await req.json();

    if (!guesserId || !targetId || !roomId || value == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (value < 1 || value > 100) {
      return NextResponse.json({ error: "Guess must be between 1 and 100" }, { status: 400 });
    }

    // Validate room is in playing state
    const { data: room } = await supabaseServer
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (!room || room.status !== "playing") {
      return NextResponse.json({ error: "Game is not active" }, { status: 400 });
    }

    // Get target player's secret number
    const { data: target } = await supabaseServer
      .from("players")
      .select("secret_number")
      .eq("id", targetId)
      .single();

    if (!target?.secret_number) {
      return NextResponse.json({ error: "Target player not ready" }, { status: 400 });
    }

    const hint = getHint(value, target.secret_number);

    // Insert guess
    const { data: guess, error: guessError } = await supabaseServer
      .from("guesses")
      .insert({ room_id: roomId, guesser_id: guesserId, target_id: targetId, value, hint })
      .select()
      .single();

    if (guessError) throw guessError;

    // If correct — update room to finished
    if (hint === "correct") {
      await supabaseServer
        .from("rooms")
        .update({ status: "finished", winner_id: guesserId })
        .eq("id", roomId);
    }

    return NextResponse.json({ guess, hint });
  } catch (err) {
    console.error("guess error:", err);
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}
