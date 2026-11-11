import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Crown, Medal } from 'lucide-react';

export interface RankBadgeProps {
  rank: number;
  className?: string;
}

const rankStyles: Record<number, { bg: string; text: string; icon?: typeof Crown }> = {
  1: { bg: 'bg-gold/15', text: 'text-gold', icon: Crown },
  2: { bg: 'bg-silver/15', text: 'text-silver', icon: Medal },
  3: { bg: 'bg-bronze/15', text: 'text-bronze', icon: Medal },
};

export function RankBadge({ rank, className }: RankBadgeProps) {
  const style = rankStyles[rank];

  if (style) {
    const Icon = style.icon;
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold font-display',
          style.bg,
          style.text,
          className,
        )}
      >
        {Icon && <Icon className="h-3 w-3" />}
        #{rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-surface-secondary px-2 py-0.5 text-xs font-bold font-display text-text-muted',
        className,
      )}
    >
      #{rank}
    </span>
  );
}

export interface StreakBadgeProps {
  count: number;
  className?: string;
}

export function StreakBadge({ count, className }: StreakBadgeProps) {
  if (count < 2) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent',
        className,
      )}
    >
      {count}× Champion
    </span>
  );
}

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

const badgeVariants = {
  default: 'bg-surface-secondary text-text-muted',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-positive/10 text-positive',
  warning: 'bg-amber-500/10 text-amber-500',
  danger: 'bg-negative/10 text-negative',
  outline: 'border border-border text-text-muted',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
