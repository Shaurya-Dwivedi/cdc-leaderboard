import { useState } from 'react';
import { CONFIG } from '../config';
import { useRewardTiers } from '../hooks/useRewards';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useCurrentWeek, useWeeks } from '../hooks/useWeeks';
import { useCloseWeek, useReopenWeek } from '../hooks/usePoints';
import { CountdownTimer } from '../features/countdown/CountdownTimer';
import { Podium } from '../features/leaderboard/Podium';
import { RankedList } from '../features/leaderboard/RankedList';
import { HallOfFame } from '../features/hall-of-fame/HallOfFame';
import { ActivityFeed } from '../features/leaderboard/ActivityFeed';
import { WinnerAnnouncement } from '../features/hall-of-fame/WinnerAnnouncement';
import { AwardPointsModal } from '../features/admin/AwardPointsModal';
import { BulkAwardModal } from '../features/admin/BulkAwardModal';
import { AddMemberModal } from '../features/admin/AddMemberModal';
import { AuditLog } from '../features/admin/AuditLog';
import { RewardManager } from '../features/admin/RewardManager';
import { AdminLoginModal } from '../features/admin/AdminLoginModal';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import { LayoutGroup, motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useBoardMotion } from '../features/leaderboard/board/motion';
import './results-board.css';
import { cn } from '../lib/utils';
import { splitPodium } from '../lib/ranking';
import type { LeaderboardScope } from '../types';

const TABS = [
  { id: 'weekly', label: 'This Week' },
  { id: 'alltime', label: 'All Time' },
  { id: 'hall-of-fame', label: 'Hall of Fame' },
] as const;

const PLACE_NAME: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' };

export function LeaderboardPage() {
  const { user, isAdmin, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('view') as LeaderboardScope | 'hall-of-fame') || 'weekly';

  // The class is applied before first paint by an inline script in index.html.
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('light') ? 'light' : 'dark',
  );

  // Modals state
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [selectedMemberForAward, setSelectedMemberForAward] = useState<string | null>(null);
  const [isBulkAwardOpen, setIsBulkAwardOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  // Queries
  const { data: currentWeekData, serverOffset } = useCurrentWeek();
  const { data: closedWeeks = [] } = useWeeks();
  const { data: rewardTiers = [] } = useRewardTiers();
  const currentWeek = currentWeekData?.week;
  // An open week whose end has passed can only be a reopened one (the scheduler closes the latest).
  const isReopened = !!currentWeek && new Date(currentWeek.endAt).getTime() <= Date.now() + serverOffset;
  const lastClosed = closedWeeks[0];

  const leaderboardScope: LeaderboardScope = activeTab === 'alltime' ? 'alltime' : 'weekly';
  const { data: entries, isLoading } = useLeaderboard(leaderboardScope);

  const closeWeekMutation = useCloseWeek();
  const { spring } = useBoardMotion();
  const reopenWeekMutation = useReopenWeek();

  const handleTabChange = (tab: 'weekly' | 'alltime' | 'hall-of-fame') => {
    setSearchParams({ view: tab });
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage blocked: theme just won't survive a refresh
    }
    if (next === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  const handleOpenAward = (memberId?: string) => {
    setSelectedMemberForAward(memberId || null);
    setIsAwardOpen(true);
  };

  const handleCloseWeek = () => {
    if (!currentWeek) return;
    closeWeekMutation.mutate(currentWeek.id);
  };

  const handleReopenWeek = () => {
    if (!lastClosed) return;
    const reason = window.prompt(
      'Enter reason for reopening week (will be recorded in audit ledger):',
      'Late reconciliation of weekend support tickets',
    );
    if (reason) {
      reopenWeekMutation.mutate({ weekId: lastClosed.id, reason });
    }
  };

  return (
    <div className="rb pb-24">
      {/* Masthead */}
      <header className="sticky top-0 z-30 h-14 border-b border-text-primary bg-surface">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <h1 className="rb-serif truncate text-lg leading-none md:text-xl">CDC Support Scoreboard</h1>
            <p className="rb-eyebrow mt-1 hidden truncate sm:block">
              Weekly & All-Time Engineering Support Impact Leaderboard
            </p>
          </div>

          <div className="flex shrink-0 items-center">
            <button onClick={toggleTheme} className="rb-btn-icon" title="Toggle Theme" aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAdmin ? (
              <>
                <span className="hidden border-l border-border pl-3 text-xs font-medium md:block">{user.name}</span>
                <button onClick={logout} className="rb-btn" title="Sign out">
                  <span className="font-semibold uppercase tracking-[0.12em]">Admin</span>
                  <span className="text-text-muted">Sign out</span>
                </button>
              </>
            ) : (
              <button onClick={() => setIsLoginOpen(true)} className="rb-btn">
                Admin login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Notice: week status + countdown */}
      <section className="border-b border-border py-6 md:py-8">
        <div className="mx-auto flex max-w-6xl flex-col px-4 gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-eyebrow">
              {isReopened && currentWeek
                ? `Week ${currentWeek.id.replace('w-', '')} reopened for adjustments`
                : `${currentWeek ? `Week ${currentWeek.id.replace('w-', '')}` : 'This week'} closes Sunday ${CONFIG.WEEK_END_TIME} (${CONFIG.TIMEZONE})`}
            </p>
            <p className="rb-serif mt-2 text-3xl md:text-4xl">Closes in</p>
          </div>

          <CountdownTimer />
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-8 px-4 pt-6">
        {/* View tabs + admin toolbar */}
        <div className="flex flex-col gap-3 border-b border-text-primary lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Leaderboard views" className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none]">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  aria-pressed={active}
                  className={cn(
                    'relative min-h-11 shrink-0 whitespace-nowrap px-3 text-sm',
                    active ? 'font-semibold text-text-primary' : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {t.label}
                  {active && (
                    <motion.span
                      layoutId="rb-tab"
                      transition={spring}
                      className="absolute -bottom-px left-3 right-3 h-0.5 bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Action Bar (Role === Admin only) */}
          {user.role === 'admin' && (
            <div className="-mx-4 flex overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0">
              <button onClick={() => handleOpenAward()} className="rb-btn rb-btn-primary">
                Award Points
              </button>
              <button onClick={() => setIsBulkAwardOpen(true)} className="rb-btn">
                Bulk Award
              </button>
              <button onClick={() => setIsAddMemberOpen(true)} className="rb-btn">
                Add Member
              </button>
              <button onClick={() => setIsAuditLogOpen(true)} className="rb-btn">
                Audit Log
              </button>
              <button onClick={() => setIsRewardsOpen(true)} className="rb-btn">
                Rewards
              </button>

              {/* Finalize the open week; reopen the newest closed one for late adjustments */}
              {currentWeek?.status === 'open' && (
                <button
                  onClick={() => setIsCloseConfirmOpen(true)}
                  className="rb-btn text-text-muted"
                  title={isReopened ? 'Re-close the reopened week' : 'Test scheduled week finalization job'}
                >
                  {isReopened ? 'Re-close Week' : 'Finalize Week'}
                </button>
              )}
              {!isReopened && lastClosed && (
                <button
                  onClick={handleReopenWeek}
                  disabled={reopenWeekMutation.isPending}
                  className="rb-btn font-semibold"
                  title={`Reopen Week ${lastClosed.id.replace('w-', '')} for late adjustments`}
                >
                  Reopen Week {lastClosed.id.replace('w-', '')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'hall-of-fame' ? (
          <HallOfFame />
        ) : (
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-4 lg:gap-8">
            {/* Standings ledger */}
            <div className="lg:col-span-3">
              <h2 className="rb-serif pb-4 text-2xl md:text-3xl">
                {activeTab === 'weekly' ? 'Current Weekly Standings' : 'All-Time Champions'}
              </h2>

              <LayoutGroup>
                <div className="rb-colhead rb-grid hidden lg:grid" aria-hidden>
                  <span className="rb-rank">No.</span>
                  <span className="rb-name">Member</span>
                  <span className="rb-move text-right">Move</span>
                  <span className="rb-wk text-right">{leaderboardScope === 'alltime' ? 'This wk' : ''}</span>
                  <span className="rb-pts text-right">Points</span>
                </div>

                <Podium entries={entries} isLoading={isLoading} />

                <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-text-primary pt-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
                    Ranked Members <span className="rb-num">({splitPodium(entries).rest.length})</span>
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Tie-break rule: Higher points → Earliest time reached → Alphabetical order.
                  </p>
                </div>

                <RankedList
                  entries={entries}
                  isLoading={isLoading}
                  scope={leaderboardScope}
                  onAwardPoints={user.role === 'admin' ? handleOpenAward : undefined}
                />
              </LayoutGroup>
            </div>

            {/* Activity feed & rewards */}
            <aside className="space-y-10 lg:border-l lg:border-border lg:pl-6">
              <ActivityFeed />

              <section>
                <h4 className="rb-serif border-b border-text-primary pb-2 text-lg">Weekly Rewards</h4>
                <ul>
                  {rewardTiers.map((t) => (
                    <li key={t.place} className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-xs">
                      <span className={cn('shrink-0', t.place === 1 ? 'font-bold' : 'text-text-muted')}>
                        {PLACE_NAME[t.place] ?? t.place}
                      </span>
                      <span className="text-right font-medium">{t.label}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-text-muted">
                  Points reset weekly every Sunday at {CONFIG.WEEK_END_TIME} ({CONFIG.TIMEZONE}). All past records remain permanently in Hall of Fame.
                </p>
              </section>
            </aside>
          </div>
        )}
      </main>

      {/* Admin Modals */}
      {user.role === 'admin' && (
        <>
          <AwardPointsModal
            open={isAwardOpen}
            onClose={() => {
              setIsAwardOpen(false);
              setSelectedMemberForAward(null);
            }}
            preselectedMemberId={selectedMemberForAward}
          />
          <BulkAwardModal
            open={isBulkAwardOpen}
            onClose={() => setIsBulkAwardOpen(false)}
          />
          <AddMemberModal
            open={isAddMemberOpen}
            onClose={() => setIsAddMemberOpen(false)}
          />
          <AuditLog
            open={isAuditLogOpen}
            onClose={() => setIsAuditLogOpen(false)}
          />
          <RewardManager
            open={isRewardsOpen}
            onClose={() => setIsRewardsOpen(false)}
          />
          <ConfirmDialog
            open={isCloseConfirmOpen}
            onClose={() => setIsCloseConfirmOpen(false)}
            onConfirm={handleCloseWeek}
            title="Finalize & Close Current Week?"
            message="This will snapshot standings, record the top 3 winners, generate pending reward vouchers, and transition to a new open week. This action is idempotent."
            confirmLabel="Finalize Week Now"
            variant="warning"
          />
        </>
      )}

      {/* Winner Announcement Popup (Shows on first visit after week close) */}
      <WinnerAnnouncement />

      <AdminLoginModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
