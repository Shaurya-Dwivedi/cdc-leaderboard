import { useActivity } from '../../hooks/usePoints';
import { CONFIG } from '../../config';
import { Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useActivity();

  if (!CONFIG.SHOW_PUBLIC_FEED) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-card p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span>Live Activity Feed</span>
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-positive"></span>
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-text-muted">Loading live activity…</div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center text-xs text-text-muted">No recent point events.</div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {activities.slice(0, 15).map((act) => {
            const isPositive = act.delta > 0;
            return (
              <div
                key={act.id}
                className="flex items-start justify-between gap-2 text-xs py-1 border-b border-border/30 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary">
                    <span
                      className={cn(
                        'font-display font-bold mr-1.5 px-1 py-0.2 rounded text-[11px]',
                        isPositive ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10',
                      )}
                    >
                      {isPositive ? `+${act.delta}` : act.delta}
                    </span>
                    <strong className="font-semibold text-text-primary">{act.memberName}</strong>{' '}
                    <span className="text-text-muted">for</span>{' '}
                    <span className="text-text-primary/90">{act.reason}</span>
                  </p>
                  <span className="text-[10px] text-text-muted mt-0.5 block">
                    {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
