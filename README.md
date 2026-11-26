# Support Team Leaderboard

Weekly points leaderboard for a placement-cell support team. Admins award points, a weekly timer ends the week, and the top 3 get rewards. Anyone can view the board; only signed-in admins can change anything.

Stack: React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, Supabase (Postgres + Auth), Motion, Sonner, Vitest.

## Status

- **Mock mode** (no env vars): fully working, state saved in the browser's `localStorage`. Any admin-login credentials work. Mock seed data (names and points) is fake demo data.
- **Supabase mode**: the client and `supabase/schema.sql` are written, but **the schema has not been run on a live project yet**. Treat all SQL (RPCs, `pg_cron` close job, admin linking) as untested until you run it end to end.

## What it does

- **Tabs**: This Week, All Time, Hall of Fame. The tab is kept in the URL (`?view=weekly|alltime|hall-of-fame`).
- **Ranking**: higher points first; ties are broken by who reached the score earliest, then by name. Members on equal points share a rank. Weekly view shows rank movement against the previous week.
- **Podium** for the top 3 (tie-aware) and a ranked list below with search and paging (50 per page). Signed-in viewers matching a member get a sticky "You are #N" bar.
- **Countdown** to the week end (Sunday 23:59:59 in `CONFIG.TIMEZONE`, default Asia/Kolkata), using a server-clock offset (`server_now()`) so client clock drift does not matter.
- **Admin actions**: award or deduct points (reason category, note, link), bulk award, add a member, revert an entry, view the audit log, mark rewards delivered, close or reopen a week. Awards above `CONFIG.LARGE_ADJUSTMENT_THRESHOLD` (100) ask for confirmation.
- **Append-only ledger**: points are never edited or deleted. A revert adds an opposite entry that points at the original.
- **Week close**: ranks the week (shared ranks), snapshots it into `weekly_results`, creates a reward for every member ranked 1-3 with more than 0 points, and opens the next week. Re-closing re-snapshots. In Supabase mode a `pg_cron` job closes the latest week when it expires; awards are rejected after the week's end time.
- **Hall of Fame** reads the closed-week snapshot. A winners popup shows for 24 hours after a close, once per browser.
- **Rewards**: ₹500 / ₹300 / ₹200 Amazon vouchers plus Gold / Silver / Bronze badges for places 1-3. Text lives in the `reward_tiers` table (Supabase) and `CONFIG.REWARDS` (mock). Admins change the text in Rewards -> Reward for each place (applies to rewards created from then on). Delivery is tracked manually; nothing is sent automatically.
- Light and dark theme (the choice is remembered in the browser), reduced-motion support.

## Not built

- No winner emails or notifications.
- No UI to edit or remove members, and no UI to create admins. Do those with SQL (see below).
- No pagination or caching strategy beyond polling every 30 seconds; the audit log reads the whole ledger.
- `supabase/schema.sql` hardcodes `Asia/Kolkata` for week boundaries. Changing `CONFIG.TIMEZONE` alone changes the UI only, not the database.

## Run locally

```bash
npm install
npm run dev       # dev server
npm test          # vitest
npm run build     # tsc + vite build
```

## Supabase setup

1. Create a project. Enable the `pg_cron` extension (Database -> Extensions) first.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/schema.sql` in the SQL editor. It is idempotent (re-runnable), seeds week `w-1` (Monday 00:00 IST) and the three admins (Shaurya Dwivedi `m-1`, Sanchit Garg `m-2`, Krish Patel `m-3`). Everyone else is added in the app with **Add Member**.
4. Authentication -> Providers -> Email: **disable "Allow new users to sign up"**.
5. Authentication -> Users: create each admin, copy their UUID, then link it:
   ```sql
   update members set auth_user_id = '<uuid>' where id = 'm-1';  -- repeat for m-2, m-3
   ```
   The member's `role` must be `admin`.

Already ran an older version of `schema.sql`? Re-running the current one upgrades it in place. If that database only has the old fake demo members, run `supabase/cleanup-demo-members.sql` once afterwards to remove them.

Viewers need no login. Browsers have read-only table access; every write goes through admin-only `SECURITY DEFINER` RPCs (`award_points`, `bulk_award_points`, `add_member`, `set_reward_tier`, `revert_entry`, `close_week`, `reopen_week`, `mark_reward_delivered`) that check the caller's session.

### Adding a member

Signed-in admins use the **Add Member** button (name only; creates a regular member with an auto-generated id, rejects duplicate names). SQL equivalent:

```sql
insert into members (id, name, avatar_url, role) values ('m-99', 'New Person', '', 'viewer');
```

Admins are always made by hand: use `role = 'admin'` plus the `auth_user_id` step above.
