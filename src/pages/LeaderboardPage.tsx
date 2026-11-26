import { useState } from 'react';
import { CONFIG } from '../config';
import { useRewardTiers } from '../hooks/useRewards';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useCurrentWeek } from '../hooks/useWeeks';
import { useCloseWeek, useReopenWeek } from '../hooks/usePoints';
import { CountdownTimer } from '../features/countdown/CountdownTimer';
import { Podium } from '../features/leaderboard/Podium';
import { RankedList } from '../features/leaderboard/RankedList';
import { HallOfFame } from '../features/hall-of-fame/HallOfFame';
import { ActivityFeed } from '../features/leaderboard/ActivityFeed';
import { WinnerAnnouncement } from '../features/hall-of-fame/WinnerAnnouncement';
import { AwardPointsModal } from '../features/admin/AwardPointsModal';
import { BulkAwardModal } from '../features/admin/BulkAwardModal';
import { AuditLog } from '../features/admin/AuditLog';
import { RewardManager } from '../features/admin/RewardManager';
import { AdminLoginModal } from '../features/admin/AdminLoginModal';
import { Avatar } from '../shared/ui/Avatar';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import {
  Trophy,
  Users,
  ShieldCheck,
  Plus,
  FileText,
  Gift,
  Sun,
  Moon,
  Flame,
  CheckCircle2,
  Lock,
  Unlock,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { LeaderboardScope } from '../types';

const PLACE_STYLE: Record<number, { icon: string; name: string; color: string }> = {
  1: { icon: '🥇', name: '1st Place', color: 'text-gold' },
  2: { icon: '🥈', name: '2nd Place', color: 'text-silver' },
  3: { icon: '🥉', name: '3rd Place', color: 'text-bronze' },
};

export function LeaderboardPage() {
  const { user, isAdmin, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('view') as LeaderboardScope | 'hall-of-fame') || 'weekly';

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modals state
  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [selectedMemberForAward, setSelectedMemberForAward] = useState<string | null>(null);
  const [isBulkAwardOpen, setIsBulkAwardOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  // Queries
  const { data: currentWeekData } = useCurrentWeek();
  const { data: rewardTiers = [] } = useRewardTiers();
  const currentWeek = currentWeekData?.week;

  const leaderboardScope: LeaderboardScope = activeTab === 'alltime' ? 'alltime' : 'weekly';
  const { data: entries, isLoading } = useLeaderboard(leaderboardScope);

  const closeWeekMutation = useCloseWeek();
  const reopenWeekMutation = useReopenWeek();

  const handleTabChange = (tab: 'weekly' | 'alltime' | 'hall-of-fame') => {
    setSearchParams({ view: tab });
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
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
    if (!currentWeek) return;
    const reason = window.prompt(
      'Enter reason for reopening week (will be recorded in audit ledger):',
      'Late reconciliation of weekend support tickets',
    );
    if (reason) {
      reopenWeekMutation.mutate({ weekId: currentWeek.id, reason });
    }
  };

  return (
    <div className="min-h-screen bg-surface text-text-primary transition-colors pb-24">
      {/* Top Header / Bar */}
      <header className="border-b border-border bg-surface-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-sm md:text-base tracking-tight uppercase">
                  CDC Support Scoreboard
                </h1>
              </div>
              <p className="text-[11px] text-text-muted hidden sm:block">
                Weekly & All-Time Engineering Support Impact Leaderboard
              </p>
            </div>
          </div>

          {/* User Profile + Role Toggle + Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-border bg-surface-secondary/50 text-text-muted hover:text-text-primary transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 text-xs font-semibold transition-all"
                  title="Sign out"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="uppercase font-bold">Admin</span>
                  <LogOut className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                  <span className="hidden md:block text-xs font-semibold text-text-primary">
                    {user.name}
                  </span>
                </div>
              </>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-secondary text-text-muted hover:text-text-primary text-xs font-semibold transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Admin login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero: Weekly Countdown Timer */}
      <section className="border-b border-border bg-gradient-to-b from-surface-card to-surface py-6 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs text-text-muted">
            <Flame className="h-3.5 w-3.5 text-accent" />
            <span>
              {currentWeek ? `Week ${currentWeek.id.replace('w-', '')}` : 'This week'} closes Sunday {CONFIG.WEEK_END_TIME} ({CONFIG.TIMEZONE})
            </span>
          </div>

          <CountdownTimer />
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs + Admin Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
          {/* View Tabs */}
          <nav className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border self-start">
            <button
              onClick={() => handleTabChange('weekly')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'weekly'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary',
              )}
            >
              <span>This Week</span>
            </button>
            <button
              onClick={() => handleTabChange('alltime')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'alltime'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary',
              )}
            >
              <span>All Time</span>
            </button>
            <button
              onClick={() => handleTabChange('hall-of-fame')}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                activeTab === 'hall-of-fame'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-secondary',
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Hall of Fame</span>
            </button>
          </nav>

          {/* Admin Action Bar (Role === Admin only) */}
          {user.role === 'admin' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenAward()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-hover shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Award Points</span>
              </button>

              <button
                onClick={() => setIsBulkAwardOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card text-text-primary hover:bg-surface-secondary text-xs font-semibold transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-text-muted" />
                <span>Bulk Award</span>
              </button>

              <button
                onClick={() => setIsAuditLogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card text-text-primary hover:bg-surface-secondary text-xs font-semibold transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-text-muted" />
                <span>Audit Log</span>
              </button>

              <button
                onClick={() => setIsRewardsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card text-text-primary hover:bg-surface-secondary text-xs font-semibold transition-colors"
              >
                <Gift className="h-3.5 w-3.5 text-text-muted" />
                <span>Rewards</span>
              </button>

              {/* Close / Reopen week actions for testing idempotence and late edits */}
              {currentWeek?.status === 'open' ? (
                <button
                  onClick={() => setIsCloseConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/80 bg-surface-card text-text-muted hover:text-text-primary text-xs font-medium transition-colors"
                  title="Test scheduled week finalization job"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Finalize Week</span>
                </button>
              ) : (
                <button
                  onClick={handleReopenWeek}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                  title="Reopen closed week for late adjustments"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Reopen Week</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'hall-of-fame' ? (
          <HallOfFame />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left 3 columns: Podium + Ranked List */}
            <div className="lg:col-span-3 space-y-6">
              {/* Podium for Top 3 */}
              <div className="rounded-2xl border border-border bg-surface-card p-6 shadow-sm">
                <div className="text-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {activeTab === 'weekly' ? 'Current Weekly Standings' : 'All-Time Champions'}
                  </span>
                  <h2 className="text-lg font-bold font-display uppercase tracking-wider text-text-primary">
                    Leaders Podium
                  </h2>
                </div>

                <Podium entries={entries} isLoading={isLoading} />
              </div>

              {/* Ranked List (Rank 4+) */}
              <div className="rounded-2xl border border-border bg-surface-card p-4 md:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-text-primary">
                      Ranked Members ({entries ? Math.max(0, entries.length - 3) : 0})
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Tie-break rule: Higher points → Earliest time reached → Alphabetical order.
                    </p>
                  </div>
                </div>

                <RankedList
                  entries={entries}
                  isLoading={isLoading}
                  scope={leaderboardScope}
                  onAwardPoints={user.role === 'admin' ? handleOpenAward : undefined}
                />
              </div>
            </div>

            {/* Right 1 column: Public Activity Feed & Rules */}
            <div className="space-y-6">
              <ActivityFeed />

              {/* Rules & Rewards Info Card */}
              <div className="rounded-xl border border-border bg-surface-card p-4 space-y-3 text-xs">
                <h4 className="font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-positive" />
                  <span>Weekly Rewards</span>
                </h4>
                <ul className="space-y-2 text-text-muted">
                  {rewardTiers.map((t) => (
                    <li key={t.place} className="flex items-center justify-between gap-3">
                      <span className={`${PLACE_STYLE[t.place]?.color} font-bold shrink-0`}>
                        {PLACE_STYLE[t.place]?.icon} {PLACE_STYLE[t.place]?.name}
                      </span>
                      <span className="font-medium text-text-primary text-right">{t.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-border/60 text-[11px] text-text-muted/80">
                  Points reset weekly every Sunday at {CONFIG.WEEK_END_TIME} ({CONFIG.TIMEZONE}). All past records remain permanently in Hall of Fame.
                </div>
              </div>
            </div>
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
