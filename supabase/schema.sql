-- ==============================================================================
-- CDC SUPPORT LEADERBOARD — SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- Safe to re-run: tables use "if not exists", functions "create or replace".
-- (Column/constraint changes on existing tables need a separate migration.)

-- 3. Members Table
create table if not exists members (
  id text primary key,
  name text not null,
  avatar_url text default '',
  role text not null check (role in ('viewer', 'admin')) default 'viewer',
  auth_user_id uuid unique references auth.users(id) on delete set null, -- links an admin to their Supabase Auth login
  created_at timestamptz default now()
);

-- 4. Weeks Table
create table if not exists weeks (
  id text primary key, -- e.g. 'w-1', 'w-7'
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('open', 'closed')) default 'open',
  closed_at timestamptz
);

-- 5. Point Entries Table (Append-Only Ledger)
create table if not exists point_entries (
  id text primary key default ('pe-' || replace(uuid_generate_v4()::text, '-', '')),
  member_id text not null references members(id) on delete cascade,
  week_id text not null references weeks(id) on delete cascade,
  delta integer not null check (delta != 0),
  reason_category text not null,
  note text,
  link text,
  created_by text not null references members(id),
  created_at timestamptz default now(),
  reverts_id text references point_entries(id),

  -- Server-side rule: Admins cannot award points to themselves
  constraint check_cannot_self_award check (member_id != created_by)
);

-- Indexes for lightning fast leaderboard queries
create index if not exists idx_point_entries_week_member on point_entries(week_id, member_id);
create index if not exists idx_point_entries_created_at on point_entries(created_at desc);
create index if not exists idx_point_entries_reverts on point_entries(reverts_id);

-- Per-member-per-week aggregate so clients never download the whole ledger.
-- reached_at = last entry time (the tie-break "reached this score first").
create or replace view member_week_totals with (security_invoker = true) as
  select member_id, week_id, sum(delta)::int as total, max(created_at) as reached_at
  from point_entries
  group by member_id, week_id;
grant select on member_week_totals to anon, authenticated;

-- 6. Weekly Results (Snapshot for closed weeks)
create table if not exists weekly_results (
  id uuid primary key default uuid_generate_v4(),
  week_id text not null references weeks(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  rank integer not null,
  total_points integer not null,
  created_at timestamptz default now(),
  unique(week_id, member_id)
);

-- 7. Rewards Table
create table if not exists rewards (
  id text primary key default ('rew-' || replace(uuid_generate_v4()::text, '-', '')),
  week_id text not null references weeks(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  place integer not null check (place in (1, 2, 3)),
  reward_type text not null,
  status text not null check (status in ('pending', 'delivered')) default 'pending',
  delivered_at timestamptz,
  delivered_by text references members(id),
  unique(week_id, member_id) -- Idempotency: one reward per member per week (ties share a place)
);

-- 8. Week Events (audit trail of close / reopen)
create table if not exists week_events (
  id uuid primary key default uuid_generate_v4(),
  week_id text not null references weeks(id) on delete cascade,
  action text not null check (action in ('closed', 'reopened')),
  by_member_id text references members(id), -- null when closed by a scheduler
  reason text,
  created_at timestamptz default now()
);

-- 9. Reward Tiers (single source of truth for reward text per place)
create table if not exists reward_tiers (
  place integer primary key check (place in (1, 2, 3)),
  label text not null
);

-- ==============================================================================
-- UPGRADE OLDER INSTALLS (no-ops on a fresh database)
-- "create table if not exists" skips tables from the original schema, so bring them up to date.
-- ==============================================================================
alter table members add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- Original rewards table allowed one row per place; ties now share a place, so it is one per member.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'rewards_week_id_place_key') then
    alter table rewards drop constraint rewards_week_id_place_key;
    alter table rewards add constraint rewards_week_id_member_id_key unique (week_id, member_id);
  end if;
end $$;

-- Original direct-write policies are replaced by the admin-only RPCs below.
drop policy if exists "Allow admin insert on point_entries" on point_entries;
drop policy if exists "Allow admin update on rewards" on rewards;
drop function if exists is_admin(text);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table members enable row level security;
alter table weeks enable row level security;
alter table point_entries enable row level security;
alter table weekly_results enable row level security;
alter table rewards enable row level security;
alter table week_events enable row level security;
alter table reward_tiers enable row level security;

-- Public read access: Anyone (authenticated or anonymous) can view the scoreboard
drop policy if exists "Allow public read on members" on members;
create policy "Allow public read on members" on members for select using (true);
drop policy if exists "Allow public read on weeks" on weeks;
create policy "Allow public read on weeks" on weeks for select using (true);
drop policy if exists "Allow public read on point_entries" on point_entries;
create policy "Allow public read on point_entries" on point_entries for select using (true);
drop policy if exists "Allow public read on weekly_results" on weekly_results;
create policy "Allow public read on weekly_results" on weekly_results for select using (true);
drop policy if exists "Allow public read on rewards" on rewards;
create policy "Allow public read on rewards" on rewards for select using (true);
drop policy if exists "Allow public read on reward_tiers" on reward_tiers;
create policy "Allow public read on reward_tiers" on reward_tiers for select using (true);
drop policy if exists "Allow public read on week_events" on week_events;
create policy "Allow public read on week_events" on week_events for select using (true);

-- ==============================================================================
-- WRITE ACCESS: ADMIN-ONLY RPCs
-- No direct INSERT/UPDATE/DELETE from the browser. Every write goes through a
-- SECURITY DEFINER function that checks auth.uid() -> members.auth_user_id.
-- The acting admin is derived on the server; the client never supplies it.
-- ==============================================================================

-- Browser roles keep read-only access; auth_user_id is hidden from public reads.
revoke insert, update, delete on members, weeks, point_entries, weekly_results, rewards, week_events, reward_tiers from anon, authenticated;
revoke select on members from anon, authenticated;
grant select (id, name, avatar_url, role, created_at) on members to anon, authenticated;

-- Returns the members.id of the signed-in admin, or null.
create or replace function current_admin_id() returns text
language sql stable security definer set search_path = public as $$
  select id from members where auth_user_id = auth.uid() and role = 'admin';
$$;

create or replace function require_admin() returns text
language plpgsql stable security definer set search_path = public as $$
declare v_admin text := current_admin_id();
begin
  if v_admin is null then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return v_admin;
end;
$$;

-- Profile of the signed-in admin (empty for anyone else).
create or replace function current_admin()
returns table (id text, name text, avatar_url text, role text)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.avatar_url, m.role
  from members m where m.auth_user_id = auth.uid() and m.role = 'admin';
$$;

create or replace function award_points(
  p_member_id text, p_delta integer, p_reason text,
  p_note text default null, p_link text default null
) returns point_entries
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_week text;
  v_row point_entries;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'Points must be a non-zero integer';
  end if;
  if p_member_id = v_admin then
    raise exception 'Admins are not permitted to award points to themselves';
  end if;
  select id into v_week from weeks where status = 'open' order by start_at desc limit 1;
  if v_week is null then
    raise exception 'No open week. Reopen a week first.';
  end if;
  if (select end_at from weeks where id = v_week) <= now() then
    raise exception 'This week has ended and is closing. Try again in a minute.';
  end if;
  insert into point_entries (member_id, week_id, delta, reason_category, note, link, created_by)
  values (p_member_id, v_week, p_delta, p_reason, nullif(trim(p_note), ''), nullif(trim(p_link), ''), v_admin)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function bulk_award_points(
  p_member_ids text[], p_delta integer, p_reason text,
  p_note text default null, p_link text default null
) returns setof point_entries
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_week text;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'Points must be a non-zero integer';
  end if;
  if coalesce(array_length(p_member_ids, 1), 0) = 0 then
    raise exception 'At least one member must be selected';
  end if;
  if v_admin = any (p_member_ids) then
    raise exception 'Admins are not permitted to award points to themselves';
  end if;
  select id into v_week from weeks where status = 'open' order by start_at desc limit 1;
  if v_week is null then
    raise exception 'No open week. Reopen a week first.';
  end if;
  if (select end_at from weeks where id = v_week) <= now() then
    raise exception 'This week has ended and is closing. Try again in a minute.';
  end if;
  return query
    insert into point_entries (member_id, week_id, delta, reason_category, note, link, created_by)
    select distinct m, v_week, p_delta, p_reason, nullif(trim(p_note), ''), nullif(trim(p_link), ''), v_admin
    from unnest(p_member_ids) as m
    returning *;
end;
$$;

create or replace function revert_entry(p_entry_id text) returns point_entries
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_orig point_entries;
  v_row point_entries;
begin
  select * into v_orig from point_entries where id = p_entry_id for update;
  if not found then
    raise exception 'Entry % not found', p_entry_id;
  end if;
  if v_orig.reverts_id is not null then
    raise exception 'Cannot revert a compensating revert entry';
  end if;
  if exists (select 1 from point_entries where reverts_id = p_entry_id) then
    raise exception 'This point entry has already been reverted';
  end if;
  if v_orig.member_id = v_admin then
    raise exception 'Admins are not permitted to change their own points';
  end if;
  insert into point_entries (member_id, week_id, delta, reason_category, note, created_by, reverts_id)
  values (v_orig.member_id, v_orig.week_id, -v_orig.delta, 'Other',
          'Compensating revert for entry ' || v_orig.id, v_admin, v_orig.id)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function mark_reward_delivered(p_reward_id text) returns rewards
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_row rewards;
begin
  update rewards
     set status = 'delivered', delivered_at = now(), delivered_by = v_admin
   where id = p_reward_id
  returning * into v_row;
  if not found then
    raise exception 'Reward % not found', p_reward_id;
  end if;
  return v_row;
end;
$$;

create or replace function reopen_week(p_week_id text, p_reason text) returns weeks
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_row weeks;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required to reopen a closed week';
  end if;
  select * into v_row from weeks where id = p_week_id for update;
  if not found then
    raise exception 'Week % not found', p_week_id;
  end if;
  if v_row.status = 'open' then
    raise exception 'Week % is already open', p_week_id;
  end if;
  update weeks set status = 'open', closed_at = null where id = p_week_id returning * into v_row;
  insert into week_events (week_id, action, by_member_id, reason)
  values (p_week_id, 'reopened', v_admin, trim(p_reason));
  return v_row;
end;
$$;

-- ==============================================================================
-- IDEMPOTENT WEEK CLOSING (admin only)
-- ==============================================================================
create or replace function do_close_week(p_week_id text, p_by text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_week weeks;
  v_next text;
begin
  select * into v_week from weeks where id = p_week_id for update;
  if not found then
    raise exception 'Week % not found', p_week_id;
  end if;

  -- Idempotency: already closed -> nothing to do
  if v_week.status = 'closed' then
    return jsonb_build_object('success', true, 'message', 'Week is already closed');
  end if;

  -- Re-snapshot (a reopened week may have changed). Delivered rewards are kept.
  delete from weekly_results where week_id = p_week_id;
  delete from rewards where week_id = p_week_id and status = 'pending';

  -- Standings: all members, ties share a rank (1,1,3) exactly like the UI.
  insert into weekly_results (week_id, member_id, rank, total_points)
  select p_week_id, m.id,
         (rank() over (order by coalesce(s.total, 0) desc))::int,
         coalesce(s.total, 0)
  from members m
  left join (
    select member_id, sum(delta)::int as total
    from point_entries where week_id = p_week_id group by member_id
  ) s on s.member_id = m.id;

  -- Rewards: every member ranked 1-3 with positive points (tied members share the place).
  insert into rewards (id, week_id, member_id, place, reward_type)
  select 'rew-' || p_week_id || '-' || r.member_id, p_week_id, r.member_id, r.rank, t.label
  from weekly_results r
  join reward_tiers t on t.place = r.rank
  where r.week_id = p_week_id and r.rank <= 3 and r.total_points > 0
  on conflict (week_id, member_id) do nothing;

  update weeks set status = 'closed', closed_at = now() where id = p_week_id;
  insert into week_events (week_id, action, by_member_id) values (p_week_id, 'closed', p_by);

  -- Open the next week if this was the latest one.
  if not exists (select 1 from weeks where start_at >= v_week.end_at) then
    v_next := 'w-' || ((select count(*) from weeks) + 1);
    insert into weeks (id, start_at, end_at)
    values (v_next, v_week.end_at, v_week.end_at + interval '7 days')
    on conflict (id) do nothing;
  end if;

  return jsonb_build_object('success', true, 'closed_week', p_week_id, 'next_week', v_next);
end;
$$;

-- Admin entry point.
create or replace function close_week(p_week_id text)
returns jsonb
language sql security definer set search_path = public as $$
  select do_close_week(p_week_id, require_admin());
$$;

-- Scheduler entry point: closes every expired open week that is the latest week.
-- (A reopened older week is left alone; the latest-week rule keeps reopen usable.)
create or replace function close_expired_weeks() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_id text;
  v_n integer := 0;
begin
  for v_id in
    select w.id from weeks w
    where w.status = 'open' and w.end_at <= now()
      and not exists (select 1 from weeks n where n.start_at > w.start_at)
    order by w.start_at
  loop
    perform do_close_week(v_id, null);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- Authoritative clock for the countdown.
create or replace function server_now() returns timestamptz
language sql stable as $$ select now(); $$;

-- Adds a viewer. Admins are made manually (Auth user + auth_user_id), never from the UI.
create or replace function add_member(p_name text) returns members
language plpgsql security definer set search_path = public as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_row members;
begin
  perform require_admin();
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Name must be 1-80 characters';
  end if;
  if exists (select 1 from members where lower(name) = lower(v_name)) then
    raise exception 'A member named "%" already exists', v_name;
  end if;
  insert into members (id, name, role)
  values ('m-' || replace(gen_random_uuid()::text, '-', ''), v_name, 'viewer')
  returning * into v_row;
  return v_row;
end;
$$;

-- Edit the reward text for a podium place (affects rewards created from now on).
create or replace function set_reward_tier(p_place integer, p_label text) returns reward_tiers
language plpgsql security definer set search_path = public as $$
declare
  v_label text := trim(coalesce(p_label, ''));
  v_row reward_tiers;
begin
  perform require_admin();
  if p_place is null or p_place not in (1, 2, 3) then
    raise exception 'Place must be 1, 2 or 3';
  end if;
  if v_label = '' or length(v_label) > 120 then
    raise exception 'Reward text must be 1-120 characters';
  end if;
  insert into reward_tiers (place, label) values (p_place, v_label)
  on conflict (place) do update set label = excluded.label
  returning * into v_row;
  return v_row;
end;
$$;

-- Only signed-in admins may call write RPCs; helpers are internal-only.
revoke execute on function
  current_admin_id(), require_admin(), current_admin(),
  do_close_week(text, text), close_expired_weeks(), server_now(),
  award_points(text, integer, text, text, text),
  bulk_award_points(text[], integer, text, text, text),
  revert_entry(text), mark_reward_delivered(text),
  reopen_week(text, text), close_week(text), add_member(text),
  set_reward_tier(integer, text)
from public, anon, authenticated;
grant execute on function server_now() to anon, authenticated;
grant execute on function
  current_admin(),
  award_points(text, integer, text, text, text),
  bulk_award_points(text[], integer, text, text, text),
  revert_entry(text), mark_reward_delivered(text),
  reopen_week(text, text), close_week(text), add_member(text),
  set_reward_tier(integer, text)
to authenticated;

-- ==============================================================================
-- INITIAL ADMINS (everyone else is added from the app with the Add Member button)
-- ==============================================================================
insert into members (id, name, avatar_url, role) values
  ('m-1', 'Shaurya Dwivedi', '', 'admin'),
  ('m-2', 'Sanchit Garg', '', 'admin'),
  ('m-3', 'Krish Patel', '', 'admin')
on conflict (id) do update set name = excluded.name, avatar_url = excluded.avatar_url, role = excluded.role;

-- ==============================================================================
-- REWARD TIERS (edit labels here; close_week and the UI both read this table)
-- ==============================================================================
insert into reward_tiers (place, label) values
  (1, '₹500 Amazon Voucher + Gold Badge'),
  (2, '₹300 Amazon Voucher + Silver Badge'),
  (3, '₹200 Amazon Voucher + Bronze Badge')
on conflict (place) do nothing;

-- ==============================================================================
-- AUTO-CLOSE SCHEDULER (pg_cron, every minute; re-running updates the same job)
-- ==============================================================================
create extension if not exists pg_cron;
select cron.schedule('close-expired-weeks', '* * * * *', 'select close_expired_weeks()');

-- ==============================================================================
-- SEED FIRST WEEK (Monday 00:00 IST of the current week; skipped if any week exists)
-- ==============================================================================
insert into weeks (id, start_at, end_at)
select 'w-1',
       date_trunc('week', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata',
       (date_trunc('week', now() at time zone 'Asia/Kolkata') + interval '7 days') at time zone 'Asia/Kolkata'
where not exists (select 1 from weeks);

-- ==============================================================================
-- LINK ADMINS TO LOGINS (run once per admin after creating them under
-- Supabase Dashboard -> Authentication -> Users; copy the user's UUID)
-- ==============================================================================
-- update members set auth_user_id = '<uuid>' where id = 'm-1'; -- Shaurya Dwivedi
-- update members set auth_user_id = '<uuid>' where id = 'm-2'; -- Sanchit Garg
-- update members set auth_user_id = '<uuid>' where id = 'm-3'; -- Krish Patel
