export type RoomStatus = "waiting" | "selecting" | "playing" | "finished";

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  winner_id: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  secret_number: number | null;
  is_ready: boolean;
  created_at: string;
}

export interface Guess {
  id: string;
  room_id: string;
  guesser_id: string;
  target_id: string;
  value: number;
  hint: "higher" | "lower" | "correct";
  created_at: string;
}

export interface GameState {
  room: Room;
  players: Player[];
  guesses: Guess[];
}
