import { useActivity } from '../../hooks/usePoints';
import { CONFIG } from '../../config';
import { formatDistanceToNow } from 'date-fns';

export function ActivityFeed() {
  const { data: activities = [], isLoading } = useActivity();

  if (!CONFIG.SHOW_PUBLIC_FEED) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-text-primary pb-2">
        <h3 className="rb-serif text-lg">Live Activity Feed</h3>
        <span className="rb-eyebrow flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-text-primary" aria-hidden />
          Live
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-xs text-text-muted">Loading live activity…</div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-xs text-text-muted">No recent point events.</div>
      ) : (
        <ol className="max-h-72 overflow-y-auto pr-1">
          {activities.slice(0, 15).map((act) => (
            <li
              key={act.id}
              className="grid grid-cols-[3rem_minmax(0,1fr)] gap-2 border-b border-border py-2.5 text-xs last:border-0"
            >
              <span className="rb-num font-semibold">{act.delta > 0 ? `+${act.delta}` : act.delta}</span>
              <div className="min-w-0">
                <p>
                  <strong className="font-semibold">{act.memberName}</strong>{' '}
                  <span className="text-text-muted">for</span> <span>{act.reason}</span>
                </p>
                <span className="rb-num mt-0.5 block text-[10px] text-text-muted">
                  {formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
