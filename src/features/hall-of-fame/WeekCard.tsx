import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar } from '../../shared/ui/Avatar';
import { Crown, ChevronDown, ChevronUp, Calendar, Trophy } from 'lucide-react';
import { formatWeekRange } from '../../lib/week';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { RankedRow } from '../leaderboard/RankedRow';
import { cn } from '../../lib/utils';
import type { WeekWithWinners } from '../../types';

interface WeekCardProps {
  week: WeekWithWinners;
  allWeeks: WeekWithWinners[];
}

export function WeekCard({ week, allWeeks }: WeekCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Lazy query the full standings when expanded
  const { data: fullStandings = [], isLoading } = useLeaderboard('weekly', expanded ? week.id : undefined);

  // Compute champion streak / repeat count
  const firstWinner = week.winners.find((w) => w.rank === 1) || week.winners[0];
  const championWinsCount = firstWinner
    ? allWeeks.reduce((count, w) => {
        const top = w.winners.find((win) => win.rank === 1);
        return top?.memberId === firstWinner.memberId ? count + 1 : count;
      }, 0)
    : 0;

  return (
    <div className="rounded-xl border border-border bg-surface-card overflow-hidden shadow-sm transition-all hover:border-border/80">
      {/* Week Card Header / Summary */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-secondary/30 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-base text-text-primary">
              Week {week.id.replace('w-', '')}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatWeekRange(week.startAt, week.endAt)}
            </span>
          </div>

          {firstWinner && championWinsCount > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-gold font-medium mt-1">
              <Trophy className="h-3.5 w-3.5" />
              <span>
                {firstWinner.memberName} — {championWinsCount}× Weekly Champion
              </span>
            </div>
          )}
        </div>

        {/* Mini Podium for Top 3 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {week.winners.slice(0, 3).map((winner) => {
              const placeStyle = {
                1: 'border-gold text-gold',
                2: 'border-silver text-silver',
                3: 'border-bronze text-bronze',
              }[winner.rank as 1 | 2 | 3] || 'border-border text-text-muted';

              return (
                <div
                  key={winner.memberId}
                  className="flex items-center gap-1.5 bg-surface-secondary/60 px-2.5 py-1.5 rounded-lg border border-border/60"
                >
                  <div className="relative">
                    <Avatar src={winner.memberAvatar} name={winner.memberName} size="sm" />
                    {winner.rank === 1 && (
                      <Crown className="h-3 w-3 text-gold absolute -top-1.5 -right-1.5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary max-w-[80px] truncate">
                      {winner.memberName.split(' ')[0]}
                    </span>
                    <span className={cn('text-[10px] font-display font-bold', placeStyle)}>
                      {winner.points} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label={expanded ? 'Collapse standings' : 'Expand full standings'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Full Standings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-surface-secondary/20 p-4"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Full Standings Archive — Week {week.id.replace('w-', '')}
            </h4>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-text-muted">Loading standings…</div>
            ) : (
              <div className="space-y-1">
                {fullStandings.map((entry) => (
                  <RankedRow key={entry.memberId} entry={entry} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
