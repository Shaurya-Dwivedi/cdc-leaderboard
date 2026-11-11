import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../shared/ui/Avatar';
import { AnimatedNumber } from '../../shared/ui/AnimatedNumber';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface RankedRowProps {
  entry: LeaderboardEntry;
  showWeeklyPoints?: boolean;
  onAwardPoints?: (memberId: string) => void;
  isHighlighted?: boolean;
}

export function RankedRow({ entry, showWeeklyPoints, onAwardPoints, isHighlighted }: RankedRowProps) {
  const { user } = useAuth();
  const isCurrentUser = user.id === entry.memberId;
  const isAdmin = user.role === 'admin';

  const DeltaIcon = entry.delta && entry.delta > 0 ? TrendingUp : entry.delta && entry.delta < 0 ? TrendingDown : Minus;
  const deltaColor = entry.delta && entry.delta > 0 ? 'text-positive' : entry.delta && entry.delta < 0 ? 'text-negative' : 'text-text-muted';

  return (
    <motion.div
      layout
      layoutId={`row-${entry.memberId}`}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 md:px-4 md:py-3 transition-colors',
        isCurrentUser && 'bg-accent/5 border border-accent/20',
        isHighlighted && 'bg-accent/10',
        !isCurrentUser && 'hover:bg-surface-secondary/50',
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
    >
      {/* Rank */}
      <span className="w-8 text-center font-display text-sm font-bold text-text-muted tabular-nums">
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar src={entry.memberAvatar} name={entry.memberName} size="sm" />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isCurrentUser ? 'text-accent' : 'text-text-primary',
            )}
          >
            {entry.memberName}
          </span>
          {isCurrentUser && (
            <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              YOU
            </span>
          )}
        </div>
        {showWeeklyPoints && entry.weeklyPoints != null && (
          <span className="text-xs text-text-muted">
            +{entry.weeklyPoints} this week
          </span>
        )}
      </div>

      {/* Delta */}
      {entry.delta != null && (
        <div
          className={cn('flex items-center gap-0.5', deltaColor)}
          aria-label={
            entry.delta > 0
              ? `Moved up ${entry.delta} positions`
              : entry.delta < 0
              ? `Moved down ${Math.abs(entry.delta)} positions`
              : 'No change'
          }
        >
          <DeltaIcon className="h-3.5 w-3.5" />
          {entry.delta !== 0 && (
            <span className="text-xs font-semibold font-display tabular-nums">
              {Math.abs(entry.delta)}
            </span>
          )}
        </div>
      )}

      {/* Points */}
      <div className="text-right min-w-[60px]">
        <AnimatedNumber
          value={entry.totalPoints}
          className="text-sm font-bold text-text-primary"
        />
        <span className="text-[10px] text-text-muted ml-0.5">pts</span>
      </div>

      {/* Admin actions */}
      {isAdmin && onAwardPoints && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAwardPoints(entry.memberId)}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-secondary hover:text-accent transition-colors"
            aria-label={`Award points to ${entry.memberName}`}
            disabled={entry.memberId === user.id}
            title={entry.memberId === user.id ? "Can't award points to yourself" : `Award points to ${entry.memberName}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
