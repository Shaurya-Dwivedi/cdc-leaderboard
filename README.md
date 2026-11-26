# Support Team Leaderboard

An engineering support team leaderboard built with **React**, **TypeScript**, **Tailwind CSS**, and **Motion** (`motion/react`). Features live standings, animated physical podium, URL-synced views, countdown timer with server time offset sync, full admin audit ledger with compensating reverts, and a persistent Hall of Fame archive.

---

## ⚡ Key Features

### 1. Views & Routing
- **Tabs**: `This Week` | `All Time` | `Hall of Fame` (past weeks). Tab state is synchronized with URL search params (`?view=weekly`, `?view=alltime`, `?view=hall-of-fame`).
- **Viewer vs Admin Modes**: Seamless in-app mode gating. Admins receive inline row actions, global award triggers, audit log drawer, and reward fulfillment controls.

### 2. Physical Podium (Top 3)
- Staggered spring entrance animation with Olympic 2nd – 1st – 3rd layout (1st place tallest with subtle gold crown and glow).
- Dynamic re-animation on data updates (e.g. member overtakes).
- Graceful tie handling (shared ranks) and placeholder empty slots for fewer than 3 participants.

### 3. Ranked List (Rank 4+)
- **Live Reordering**: Physical row reordering powered by Motion `layout` / `layoutId`.
- **Rank Deltas**: Green `↑` / Red `↓` / neutral indicators reflecting movement against the previous cycle.
- **Sticky "You are #N" Bar**: Smooth floating indicator anchored when the current user's row scrolls out of viewport.
- **Search & Pagination**: Client-side name filtering and pagination.

### 4. Countdown Timer
- Synchronized to Asia/Kolkata Sunday 23:59:59 IST.
- Calculates remaining time using server clock offset to prevent client clock discrepancies.
- Animated individual digit flips using Motion `AnimatePresence`.
- Urgency treatment in the final 24 hours (coral color shift + subtle pulse). Respects `prefers-reduced-motion`.

### 5. Admin Controls & Append-Only Ledger
- **Point Awards & Adjustments**: Inline per-row button and global modal with reason categories, optional notes, and reference links.
- **Bulk Awards**: Multi-member selection with one-click presets and batch granting.
- **Self-Award Restriction**: Server-side enforced restriction preventing admins from awarding points to themselves.
- **Audit Log**: Full chronological history with search and member filters.
- **Compensating Reverts**: Append-only ledger integrity — reverts create opposite-delta entries with `revertsId`, never deleting rows.
- **Confirmation Dialogs**: Configurable threshold (default: 100 pts) prompts confirmation before applying large adjustments.

### 6. Hall of Fame & Weekly Finalization
- **Idempotent Week Finalization**: Scheduled/admin week close snapshots final standings and provisions reward vouchers safely.
- **Reward Fulfillment**: Tracks pending and delivered status for Amazon vouchers and medals.
- **Celebratory Announcement**: One-time celebratory popup on first visit after a week concludes with confetti effects (stored per user).

---

## 🎨 Visual Design System: Editorial Sports Scoreboard
- **Display Font**: JetBrains Mono for ranks, points, and timers (`font-display`, `tabular-nums`).
- **Body Font**: Inter for high legibility.
- **Palette**: Near-black `#0A0A0B` base with hot coral `#FF4D4F` accent. Gold, silver, and bronze reserved exclusively for podium ranks.
- **Theme**: Full light and dark mode support with semantic tokens.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + Vite
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Animation**: Motion (`motion/react`)
- **State & Data**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Testing**: Vitest

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

### Admin auth (Supabase mode)
Admins sign in with Supabase Auth email + password; viewers need no login (public read-only).
1. Run `supabase/schema.sql` in the SQL editor.
2. Dashboard -> Authentication -> Providers -> Email: **disable "Allow new users to sign up"**.
3. Authentication -> Users -> add each admin, copy their UUID.
4. `update members set auth_user_id = '<uuid>' where id = 'm-1';` (repeat per admin).

All writes go through admin-only RPCs (`award_points`, `revert_entry`, `close_week`, ...); the browser has no direct write access to tables.
Without env vars the app runs on an in-memory mock where any admin-login credentials work.
