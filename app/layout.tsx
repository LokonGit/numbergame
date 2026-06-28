import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guessy — Number Guessing Game",
  description: "A fun couples number guessing game. Pick a number, guess your partner's — higher or lower until someone wins.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
