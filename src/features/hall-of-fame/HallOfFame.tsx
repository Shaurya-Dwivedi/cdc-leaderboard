import { useWeeks } from '../../hooks/useWeeks';
import { WeekCard } from './WeekCard';
import { EmptyState } from '../../shared/ui/EmptyState';

export function HallOfFame() {
  const { data: weeks = [], isLoading } = useWeeks();

  if (isLoading) {
    return (
      <div className="py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 border-b border-border animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <EmptyState
        icon={null}
        title="Hall of Fame Archive"
        description="No past weeks finalized yet. Once the current week concludes, its winners and full standings will be preserved here."
      />
    );
  }

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-text-primary pb-3">
        <div>
          <h3 className="rb-serif text-2xl md:text-3xl">Hall of Fame & Past Champions</h3>
          <p className="mt-1 text-xs text-text-muted">
            Archived final standings and reward recipients from previous cycles.
          </p>
        </div>
        <span className="rb-num text-xs text-text-muted">{weeks.length} Weeks Archived</span>
      </div>

      <div>
        {weeks.map((week) => (
          <WeekCard key={week.id} week={week} allWeeks={weeks} />
        ))}
      </div>
    </div>
  );
}
