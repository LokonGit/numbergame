// Generates a random 6-char alphanumeric room code e.g. "AB3X9K"
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — visually confusing
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Determines hint for a guess
export function getHint(guess: number, secret: number): "higher" | "lower" | "correct" {
  if (guess === secret) return "correct";
  if (guess < secret) return "higher";
  return "lower";
}
