import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { formatWeekRange } from '../../lib/week';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { RankedRow } from '../leaderboard/RankedRow';
import { useBoardMotion } from '../leaderboard/board/motion';
import { cn } from '../../lib/utils';
import type { WeekWithWinners } from '../../types';

interface WeekCardProps {
  week: WeekWithWinners;
  allWeeks: WeekWithWinners[];
}

export function WeekCard({ week, allWeeks }: WeekCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { fade } = useBoardMotion();

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
    <div className="border-b border-border">
      {/* Week summary line */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer flex-col justify-between gap-3 py-4 md:flex-row md:items-center"
      >
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="rb-serif text-xl">Week {week.id.replace('w-', '')}</span>
            <span className="rb-num text-xs text-text-muted">{formatWeekRange(week.startAt, week.endAt)}</span>
          </div>

          {firstWinner && championWinsCount > 1 && (
            <p className="mt-1 text-xs text-text-muted">
              {firstWinner.memberName} — <span className="rb-num">{championWinsCount}×</span> Weekly Champion
            </p>
          )}
        </div>

        {/* Top 3 of that week */}
        <div className="flex items-center justify-between gap-3">
          <ol className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            {week.winners.slice(0, 3).map((winner) => (
              <li key={winner.memberId} className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'rb-num text-xs',
                    winner.rank === 1 ? 'font-bold text-text-primary' : 'text-text-muted',
                  )}
                >
                  {winner.rank}
                </span>
                <span className="max-w-[80px] truncate text-sm font-medium">
                  {winner.memberName.split(' ')[0]}
                </span>
                <span className="rb-num text-xs text-text-muted">{winner.points} pts</span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="rb-btn-icon shrink-0"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse standings' : 'Expand full standings'}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      {/* Expanded Full Standings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            className="pb-6"
          >
            <h4 className="rb-eyebrow mb-1">Full Standings Archive — Week {week.id.replace('w-', '')}</h4>

            {isLoading ? (
              <div className="py-6 text-xs text-text-muted">Loading standings…</div>
            ) : (
              <div>
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
