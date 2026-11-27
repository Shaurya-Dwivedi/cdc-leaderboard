import { useEffect, useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useWeeks, useCurrentWeek } from '../../hooks/useWeeks';
import confetti from 'canvas-confetti';
import { useRewardTiers } from '../../hooks/useRewards';
import type { WeekWithWinners } from '../../types';

const SHOW_WINDOW_MS = 24 * 60 * 60 * 1000;
type Winner = WeekWithWinners['winners'][number];

/** One line of the results notice. Rank 1 is set larger, in the accent. */
function WinnerLine({ w, reward }: { w: Winner; reward?: string }) {
  const first = w.rank === 1;
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border py-3 text-left">
      <span className={`rb-num text-right ${first ? 'text-[2.5rem] leading-none text-accent' : 'text-2xl text-text-muted'}`}>
        {w.rank}
      </span>
      <span className="min-w-0">
        <span className={`block truncate ${first ? 'rb-serif text-xl' : 'text-sm font-semibold'}`}>{w.memberName}</span>
        <span className="block text-[11px] text-text-muted">{reward?.split('+')[0]}</span>
      </span>
      <span className="rb-num text-sm font-semibold">
        {w.points}
        <span className="rb-unit">pts</span>
      </span>
    </li>
  );
}

/** Shows the latest closed week's winners for 24h after it closed, once per browser. */
export function WinnerAnnouncement() {
  const { data: weeks = [] } = useWeeks();
  const { serverOffset } = useCurrentWeek();
  const { data: tiers = [] } = useRewardTiers();
  const [dismissed, setDismissed] = useState(false);

  const latest = weeks[0];
  const storageKey = latest ? `leaderboard_seen_winner_${latest.id}` : '';
  const inWindow =
    !!latest?.closedAt &&
    Date.now() + serverOffset < new Date(latest.closedAt).getTime() + SHOW_WINDOW_MS;
  const showId =
    latest && latest.winners.length > 0 && inWindow && !dismissed && !localStorage.getItem(storageKey)
      ? latest.id
      : null;

  useEffect(() => {
    if (!showId) return;
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#C8411E', '#1A1813', '#6E6A60', '#D6D0C2'],
        disableForReducedMotion: true,
      });
    } catch {
      // canvas-confetti unsupported: skip
    }
  }, [showId]);

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, 'true');
    setDismissed(true);
  };

  if (!showId || !latest) return null;

  return (
    <Modal
      open
      onClose={handleDismiss}
      title="Week Concluded — Champions Announced!"
      size="md"
    >
      <div className="space-y-5 py-2">
        <div>
          <span className="rb-eyebrow">Official Standings Finalized</span>
          <h3 className="rb-serif mt-1 text-2xl">Week {latest.id.replace('w-', '')} Winners</h3>
          <p className="mt-1 max-w-sm text-xs text-text-muted">
            Congratulations to this week’s top contributors for stellar support and impact!
          </p>
        </div>

        <ol className="border-t border-text-primary">
          {[...latest.winners]
            .sort((a, b) => a.rank - b.rank)
            .map((w) => (
              <WinnerLine key={w.memberId} w={w} reward={tiers.find((t) => t.place === w.rank)?.label} />
            ))}
        </ol>

        <button onClick={handleDismiss} className="rb-btn rb-btn-primary w-full justify-center">
          View Full Leaderboard
        </button>
      </div>
    </Modal>
  );
}
