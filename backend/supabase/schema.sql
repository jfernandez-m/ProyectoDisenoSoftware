-- Entre Platos: database schema (Supabase / Postgres).
-- Run it once in Supabase → SQL Editor. It can be run again: it doesn't duplicate anything.
--
-- Every table uses Row Level Security: a logged-in user can only read and write their own
-- rows ((select auth.uid()) = user_id). The backend talks to Supabase as that user.

-- 1. "Want to go" (pending) and "Been there" (visited) lists.
--    One row per user and restaurant; moving it to the other list changes `status`.
--    The restaurant data is copied so the lists page doesn't call Google again.
create table if not exists public.list_items (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  place_id text not null,
  status text not null check (status in ('visited', 'pending')),
  name text not null,
  address text,
  cuisine text,
  rating real,
  price_level text,
  photo text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.list_items enable row level security;

drop policy if exists "Users manage their own list items" on public.list_items;
create policy "Users manage their own list items"
  on public.list_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.list_items to authenticated;

-- 2. Share links: one per user and list. The random uuid is the id in /share/<id>.
create table if not exists public.shared_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  status text not null check (status in ('visited', 'pending')),
  owner_name text,
  created_at timestamptz not null default now(),
  unique (user_id, status)
);

alter table public.shared_lists enable row level security;

drop policy if exists "Users manage their own shared lists" on public.shared_lists;
create policy "Users manage their own shared lists"
  on public.shared_lists for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.shared_lists to authenticated;

-- The public share page has no session: /api/share uses the secret key (service_role),
-- which skips RLS, to read only the list of that link. It only needs to read.
grant select on public.list_items, public.shared_lists to service_role;

-- 3. The user's rating (1 to 5 stars) for each restaurant. Feeds the recommender.
create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  place_id text not null,
  stars smallint not null check (stars between 1 and 5),
  name text not null,
  cuisine text,
  price_level text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.ratings enable row level security;

drop policy if exists "Users manage their own ratings" on public.ratings;
create policy "Users manage their own ratings"
  on public.ratings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.ratings to authenticated;

-- 4. Restaurants whose page the user opened ("what you searched"). Feeds the recommender.
create table if not exists public.views (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  place_id text not null,
  cuisine text,
  price_level text,
  viewed_at timestamptz not null default now(),
  unique (user_id, place_id)
);

alter table public.views enable row level security;

drop policy if exists "Users manage their own views" on public.views;
create policy "Users manage their own views"
  on public.views for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.views to authenticated;

-- Tell the Data API to reload the list of tables.
notify pgrst, 'reload schema';
