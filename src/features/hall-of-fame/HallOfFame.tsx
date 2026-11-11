import { useWeeks } from '../../hooks/useWeeks';
import { WeekCard } from './WeekCard';
import { Trophy } from 'lucide-react';
import { EmptyState } from '../../shared/ui/EmptyState';

export function HallOfFame() {
  const { data: weeks = [], isLoading } = useWeeks();

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-surface-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-12 w-12 text-gold" />}
        title="Hall of Fame Archive"
        description="No past weeks finalized yet. Once the current week concludes, its winners and full standings will be preserved here."
      />
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <span>Hall of Fame & Past Champions</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Archived final standings and reward recipients from previous cycles.
          </p>
        </div>
        <span className="text-xs font-display font-semibold text-text-muted bg-surface-secondary px-2.5 py-1 rounded-full border border-border">
          {weeks.length} Weeks Archived
        </span>
      </div>

      <div className="space-y-3">
        {weeks.map((week) => (
          <WeekCard key={week.id} week={week} allWeeks={weeks} />
        ))}
      </div>
    </div>
  );
}
