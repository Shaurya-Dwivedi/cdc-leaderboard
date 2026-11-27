import { useId, useState, type Ref } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { BoardNumber } from './board/BoardNumber';
import { useBoardMotion } from './board/motion';
import { ChevronDown, Plus } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface RankedRowProps {
  entry: LeaderboardEntry;
  showWeeklyPoints?: boolean;
  onAwardPoints?: (memberId: string) => void;
  isHighlighted?: boolean;
  /** Entrance delay in seconds (first-load stagger). */
  enterDelay?: number;
  /** Top-3 place: set larger, by size and spacing only. */
  place?: 1 | 2 | 3;
  /** Lets AnimatePresence mode="popLayout" measure the row. */
  ref?: Ref<HTMLDivElement>;
}

const RANK_SIZE = {
  1: 'text-[2.75rem] sm:text-[3.5rem] text-accent',
  2: 'text-[2.25rem] sm:text-[2.75rem]',
  3: 'text-[2.25rem] sm:text-[2.75rem]',
};
const NAME_SIZE = { 1: 'text-2xl sm:text-3xl', 2: 'text-xl sm:text-2xl', 3: 'text-xl sm:text-2xl' };
const POINTS_SIZE = { 1: 'text-xl sm:text-2xl', 2: 'text-lg sm:text-xl', 3: 'text-lg sm:text-xl' };

export function RankedRow({
  entry,
  showWeeklyPoints,
  onAwardPoints,
  isHighlighted,
  enterDelay = 0,
  place,
  ref,
}: RankedRowProps) {
  const { user } = useAuth();
  const { reduced, spring, fade } = useBoardMotion();
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const isCurrentUser = user.id === entry.memberId;
  const isAdmin = user.role === 'admin';

  const delta = entry.delta;
  const deltaLabel =
    delta == null
      ? null
      : delta > 0
      ? `Moved up ${delta} positions`
      : delta < 0
      ? `Moved down ${Math.abs(delta)} positions`
      : 'No change';
  const weekly = showWeeklyPoints && entry.weeklyPoints != null ? entry.weeklyPoints : null;

  const name = (
    <>
      <span
        className={cn(
          'truncate',
          place ? cn('rb-serif', NAME_SIZE[place]) : 'text-[15px]',
          isCurrentUser ? 'font-semibold' : !place && 'font-medium',
        )}
      >
        {entry.memberName}
      </span>
      {isCurrentUser && <span className="rb-you">You</span>}
    </>
  );

  return (
    <motion.div
      ref={ref}
      layout="position"
      layoutId={`row-${entry.memberId}`}
      data-member-id={entry.memberId}
      data-open={open || undefined}
      data-highlight={isHighlighted || undefined}
      className={cn('rb-row rb-grid group', place && 'rb-top')}
      initial={{ opacity: 0, y: reduced ? 0 : 7 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: fade }}
      transition={{ layout: spring, default: { ...fade, delay: enterDelay } }}
    >
      <span className="rb-mark" aria-hidden />

      <span
        className={cn(
          'rb-rank rb-num',
          place ? RANK_SIZE[place] : 'text-xl sm:text-[1.375rem] text-text-muted',
        )}
      >
        {entry.rank}
      </span>

      <div className="rb-name min-w-0">
        {/* Below desktop the name opens the row's details; on desktop every stat has a column. */}
        <button
          type="button"
          className="rb-toggle"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((o) => !o)}
        >
          {name}
          <span className="sr-only">, details</span>
          <ChevronDown
            aria-hidden
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
        <span className="hidden min-w-0 items-center gap-2 lg:flex">{name}</span>
      </div>

      <div className="rb-meta">
        <span className={cn('rb-pts', place && POINTS_SIZE[place])}>
          <BoardNumber value={entry.totalPoints} className="font-semibold" />
          <span className="rb-unit">pts</span>
        </span>
        <span className="rb-sec rb-move rb-num text-xs text-text-muted">
          {deltaLabel && (
            <span role="img" aria-label={deltaLabel}>
              {delta! > 0 ? `▲${delta}` : delta! < 0 ? `▼${Math.abs(delta!)}` : '–'}
            </span>
          )}
        </span>
        <span className="rb-sec rb-wk rb-num text-xs">
          {weekly != null && (
            <>
              +{weekly}
              <span className="rb-unit">this wk</span>
            </>
          )}
        </span>
      </div>

      <div className="rb-act">
        {isAdmin && onAwardPoints && (
          <button
            type="button"
            onClick={() => onAwardPoints(entry.memberId)}
            className="rb-award"
            aria-label={`Award points to ${entry.memberName}`}
            disabled={entry.memberId === user.id}
            title={entry.memberId === user.id ? "Can't award points to yourself" : `Award points to ${entry.memberName}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.dl
            id={detailsId}
            className="rb-details grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 pb-1 pt-2 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            <dt className="text-text-muted">Movement</dt>
            <dd>{deltaLabel ?? '—'}</dd>
            <dt className="text-text-muted">Previous rank</dt>
            <dd className="rb-num">{entry.previousRank ?? '—'}</dd>
            {weekly != null && (
              <>
                <dt className="text-text-muted">This week</dt>
                <dd className="rb-num">+{weekly} pts</dd>
              </>
            )}
          </motion.dl>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
