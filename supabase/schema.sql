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

-- Admin write access helper function
create or replace function is_admin(user_id text) returns boolean as $$
  select exists (
    select 1 from members where id = user_id and role = 'admin'
  );
$$ language sql security definer;

-- Allow inserts into point_entries only if created_by is an admin
create policy "Allow admin insert on point_entries" on point_entries for insert
with check (is_admin(created_by));

-- Allow admin update on rewards (to mark delivered)
create policy "Allow admin update on rewards" on rewards for update
using (is_admin(coalesce(delivered_by, 'm-1')));

-- ==============================================================================
-- IDEMPOTENT WEEK CLOSING STORED PROCEDURE
-- ==============================================================================
create or replace function close_week(p_week_id text)
returns jsonb as $$
declare
  v_week record;
  v_rec record;
  v_rank integer := 1;
  v_count integer := 0;
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
    select
      member_id,
      sum(delta)::int as total_points,
      max(created_at) as reached_at
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

  -- Mark week closed
  update weeks set status = 'closed', closed_at = now() where id = p_week_id;

  return jsonb_build_object('success', true, 'closed_week', p_week_id);
end;
$$ language plpgsql security definer;

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
