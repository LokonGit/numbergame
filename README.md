# Guessy 🎯

A real-time multiplayer number guessing game for couples and friends.  
Built with **Next.js 15**, **Supabase** (Postgres + Realtime), deployed on **Vercel**.

---

## How it works

1. Player A creates a room → gets a 6-letter code
2. Player B joins with the code
3. Both pick a secret number (1–100)
4. Take turns guessing each other's number — get **Higher / Lower** hints
5. First to guess correctly wins

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd numbergame
npm install
```

### 2. Create Supabase project

- Go to [supabase.com](https://supabase.com) → New project
- Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → Run

### 3. Set environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your keys from Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same 3 environment variables in Vercel → Project Settings → Environment Variables.

---

## Project Structure

```
app/
  page.tsx                    # Home — create or join
  room/[code]/
    page.tsx                  # Waiting room
    select/page.tsx           # Number selection
    game/page.tsx             # Main game
    result/page.tsx           # Winner screen
  api/
    rooms/create/route.ts     # POST create room
    rooms/join/route.ts       # POST join room
    rooms/[code]/route.ts     # GET room state
    players/ready/route.ts    # POST lock in number
    guesses/submit/route.ts   # POST submit guess
lib/
  supabase.ts                 # Browser + server clients
  types.ts                    # TypeScript interfaces
  utils.ts                    # Room code generator, hint logic
```
