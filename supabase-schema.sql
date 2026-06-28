-- Run this entire file in Supabase → SQL Editor

-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) unique not null,
  status text not null default 'waiting' check (status in ('waiting','selecting','playing','finished')),
  winner_id uuid,
  created_at timestamp with time zone default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name varchar(50) not null,
  secret_number int check (secret_number between 1 and 100),
  is_ready boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Guesses
create table guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  guesser_id uuid not null references players(id) on delete cascade,
  target_id uuid not null references players(id) on delete cascade,
  value int not null check (value between 1 and 100),
  hint text not null check (hint in ('higher','lower','correct')),
  created_at timestamp with time zone default now()
);

-- Enable Realtime on all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table guesses;

-- RLS: enable but allow all for now (simple game, no auth)
alter table rooms enable row level security;
alter table players enable row level security;
alter table guesses enable row level security;

create policy "allow all rooms" on rooms for all using (true) with check (true);
create policy "allow all players" on players for all using (true) with check (true);
create policy "allow all guesses" on guesses for all using (true) with check (true);
