-- ==============================================================================
-- CDC SUPPORT LEADERBOARD — SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Clean slate (optional, for fresh setup)
drop table if exists rewards cascade;
drop table if exists weekly_results cascade;
drop table if exists point_entries cascade;
drop table if exists weeks cascade;
drop table if exists members cascade;

-- 3. Members Table
create table members (
  id text primary key,
  name text not null,
  avatar_url text default '',
  role text not null check (role in ('viewer', 'admin')) default 'viewer',
  auth_user_id uuid unique references auth.users(id) on delete set null, -- links an admin to their Supabase Auth login
  created_at timestamptz default now()
);

-- 4. Weeks Table
create table weeks (
  id text primary key, -- e.g. 'w-1', 'w-7'
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('open', 'closed')) default 'open',
  closed_at timestamptz
);

-- 5. Point Entries Table (Append-Only Ledger)
create table point_entries (
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
create index idx_point_entries_week_member on point_entries(week_id, member_id);
create index idx_point_entries_created_at on point_entries(created_at desc);
create index idx_point_entries_reverts on point_entries(reverts_id);

-- 6. Weekly Results (Snapshot for closed weeks)
create table weekly_results (
  id uuid primary key default uuid_generate_v4(),
  week_id text not null references weeks(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  rank integer not null,
  total_points integer not null,
  created_at timestamptz default now(),
  unique(week_id, member_id)
);

-- 7. Rewards Table
create table rewards (
  id text primary key default ('rew-' || replace(uuid_generate_v4()::text, '-', '')),
  week_id text not null references weeks(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  place integer not null check (place in (1, 2, 3)),
  reward_type text not null,
  status text not null check (status in ('pending', 'delivered')) default 'pending',
  delivered_at timestamptz,
  delivered_by text references members(id),
  unique(week_id, place) -- Idempotency: One reward per place per week
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table members enable row level security;
alter table weeks enable row level security;
alter table point_entries enable row level security;
alter table weekly_results enable row level security;
alter table rewards enable row level security;

-- Public read access: Anyone (authenticated or anonymous) can view the scoreboard
create policy "Allow public read on members" on members for select using (true);
create policy "Allow public read on weeks" on weeks for select using (true);
create policy "Allow public read on point_entries" on point_entries for select using (true);
create policy "Allow public read on weekly_results" on weekly_results for select using (true);
create policy "Allow public read on rewards" on rewards for select using (true);

-- ==============================================================================
-- WRITE ACCESS: ADMIN-ONLY RPCs
-- No direct INSERT/UPDATE/DELETE from the browser. Every write goes through a
-- SECURITY DEFINER function that checks auth.uid() -> members.auth_user_id.
-- The acting admin is derived on the server; the client never supplies it.
-- ==============================================================================

-- Browser roles keep read-only access; auth_user_id is hidden from public reads.
revoke insert, update, delete on members, weeks, point_entries, weekly_results, rewards from anon, authenticated;
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
  update weeks set status = 'open', closed_at = null where id = p_week_id returning * into v_row;
  if not found then
    raise exception 'Week % not found', p_week_id;
  end if;
  -- TODO(audit): record who reopened and why (needs an audit table).
  return v_row;
end;
$$;

-- ==============================================================================
-- IDEMPOTENT WEEK CLOSING (admin only)
-- ==============================================================================
create or replace function close_week(p_week_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_admin text := require_admin();
  v_week record;
  v_rec record;
  v_rank integer := 1;
begin
  select * into v_week from weeks where id = p_week_id;
  if not found then
    raise exception 'Week % not found', p_week_id;
  end if;

  -- Idempotency check: if already closed, return existing status
  if v_week.status = 'closed' then
    return jsonb_build_object('success', true, 'message', 'Week is already closed');
  end if;

  -- Snapshot standings from point_entries ledger
  for v_rec in (
    select member_id, sum(delta)::int as total_points
    from point_entries
    where week_id = p_week_id
    group by member_id
    order by sum(delta) desc, max(created_at) asc
  ) loop
    insert into weekly_results (week_id, member_id, rank, total_points)
    values (p_week_id, v_rec.member_id, v_rank, v_rec.total_points)
    on conflict (week_id, member_id) do nothing;

    -- Provision rewards for top 3
    if v_rank = 1 then
      insert into rewards (id, week_id, member_id, place, reward_type, status)
      values ('rew-' || p_week_id || '-1', p_week_id, v_rec.member_id, 1, '₹500 Amazon Voucher + Gold Badge', 'pending')
      on conflict (week_id, place) do nothing;
    elsif v_rank = 2 then
      insert into rewards (id, week_id, member_id, place, reward_type, status)
      values ('rew-' || p_week_id || '-2', p_week_id, v_rec.member_id, 2, '₹300 Amazon Voucher + Silver Badge', 'pending')
      on conflict (week_id, place) do nothing;
    elsif v_rank = 3 then
      insert into rewards (id, week_id, member_id, place, reward_type, status)
      values ('rew-' || p_week_id || '-3', p_week_id, v_rec.member_id, 3, '₹200 Amazon Voucher + Bronze Badge', 'pending')
      on conflict (week_id, place) do nothing;
    end if;

    v_rank := v_rank + 1;
  end loop;

  update weeks set status = 'closed', closed_at = now() where id = p_week_id;

  return jsonb_build_object('success', true, 'closed_week', p_week_id);
end;
$$;

-- Only signed-in admins may call write RPCs; helpers are internal-only.
revoke execute on function
  current_admin_id(), require_admin(), current_admin(),
  award_points(text, integer, text, text, text),
  bulk_award_points(text[], integer, text, text, text),
  revert_entry(text), mark_reward_delivered(text),
  reopen_week(text, text), close_week(text)
from public, anon, authenticated;
grant execute on function
  current_admin(),
  award_points(text, integer, text, text, text),
  bulk_award_points(text[], integer, text, text, text),
  revert_entry(text), mark_reward_delivered(text),
  reopen_week(text, text), close_week(text)
to authenticated;

-- ==============================================================================
-- INITIAL SEED MEMBERS
-- ==============================================================================
insert into members (id, name, avatar_url, role) values
  ('m-1', 'Shaurya Dwivedi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShauryaDwivedi', 'admin'),
  ('m-2', 'Priya Sharma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma', 'admin'),
  ('m-3', 'Rohan Verma', 'https://api.dicebear.com/7.x/avataaars/svg?seed=RohanVerma', 'admin'),
  ('m-4', 'Aarav Patel', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AaravPatel', 'viewer'),
  ('m-5', 'Ananya Iyer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaIyer', 'viewer'),
  ('m-6', 'Vikramaditya Singh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VikramadityaSingh', 'viewer'),
  ('m-7', 'Sneha Kulkarni', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SnehaKulkarni', 'viewer'),
  ('m-8', 'Aditya Nair', 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdityaNair', 'viewer'),
  ('m-9', 'Pooja Sundaram', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PoojaSundaram', 'viewer'),
  ('m-10', 'Arjun Reddy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArjunReddy', 'viewer'),
  ('m-11', 'Meera Joshi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeeraJoshi', 'viewer'),
  ('m-12', 'Rahul Deshmukh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulDeshmukh', 'viewer'),
  ('m-13', 'Kavita Menon', 'https://api.dicebear.com/7.x/avataaars/svg?seed=KavitaMenon', 'viewer'),
  ('m-14', 'Siddharth Mukherjee', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SiddharthMukherjee', 'viewer'),
  ('m-15', 'Divya Pillai', 'https://api.dicebear.com/7.x/avataaars/svg?seed=DivyaPillai', 'viewer'),
  ('m-16', 'Kunal Kapoor', 'https://api.dicebear.com/7.x/avataaars/svg?seed=KunalKapoor', 'viewer'),
  ('m-17', 'Ritu Bhattacharya', 'https://api.dicebear.com/7.x/avataaars/svg?seed=RituBhattacharya', 'viewer'),
  ('m-18', 'Harsh Vardhan', 'https://api.dicebear.com/7.x/avataaars/svg?seed=HarshVardhan', 'viewer'),
  ('m-19', 'Tanvi Hegde', 'https://api.dicebear.com/7.x/avataaars/svg?seed=TanviHegde', 'viewer'),
  ('m-20', 'Nikhil Agarwal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=NikhilAgarwal', 'viewer'),
  ('m-21', 'Ishita Gupta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=IshitaGupta', 'viewer'),
  ('m-22', 'Pranav Rao', 'https://api.dicebear.com/7.x/avataaars/svg?seed=PranavRao', 'viewer'),
  ('m-23', 'Neha Chawla', 'https://api.dicebear.com/7.x/avataaars/svg?seed=NehaChawla', 'viewer'),
  ('m-24', 'Varun Sengupta', 'https://api.dicebear.com/7.x/avataaars/svg?seed=VarunSengupta', 'viewer'),
  ('m-25', 'Swati Nambiar', 'https://api.dicebear.com/7.x/avataaars/svg?seed=SwatiNambiar', 'viewer')
on conflict (id) do nothing;

-- ==============================================================================
-- LINK ADMINS TO LOGINS (run once per admin after creating them under
-- Supabase Dashboard -> Authentication -> Users; copy the user's UUID)
-- ==============================================================================
-- update members set auth_user_id = '<auth-user-uuid>' where id = 'm-1';
