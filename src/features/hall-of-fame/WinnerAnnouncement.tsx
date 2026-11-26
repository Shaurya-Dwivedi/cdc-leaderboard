import { useEffect, useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useWeeks, useCurrentWeek } from '../../hooks/useWeeks';
import { Avatar } from '../../shared/ui/Avatar';
import { Crown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CONFIG } from '../../config';
import type { WeekWithWinners } from '../../types';

const SHOW_WINDOW_MS = 24 * 60 * 60 * 1000;
const RANK_STYLE: Record<number, string> = { 1: 'text-gold', 2: 'text-silver', 3: 'text-bronze' };

type Winner = WeekWithWinners['winners'][number];

/** Classic podium order (2-1-3) when ranks are distinct, otherwise plain rank order. */
function podiumOrder(winners: Winner[]): Winner[] {
  const sorted = [...winners].sort((a, b) => a.rank - b.rank);
  const distinct = sorted.length === 3 && sorted.every((w, i) => w.rank === i + 1);
  return distinct ? [sorted[1], sorted[0], sorted[2]] : sorted;
}

function WinnerCard({ w }: { w: Winner }) {
  const first = w.rank === 1;
  return (
    <div className={`flex flex-col items-center ${first ? 'w-28 -translate-y-3' : 'w-24'}`}>
      <div className="relative">
        <Avatar src={w.memberAvatar} name={w.memberName} size={first ? 'lg' : 'md'} />
        {first && (
          <Crown className="h-6 w-6 text-gold fill-gold/30 absolute -top-3 -right-2 rotate-12" />
        )}
      </div>
      <div className="mt-2 text-center">
        <span className="block text-xs font-bold text-text-primary truncate max-w-[100px]">
          {first ? w.memberName : w.memberName.split(' ')[0]}
        </span>
        <span className={`text-[11px] font-display font-bold ${RANK_STYLE[w.rank] ?? ''}`}>
          #{w.rank} • {w.points} pts
        </span>
        <span className="block text-[10px] text-text-muted mt-0.5">
          {CONFIG.REWARDS[w.rank]?.label.split('+')[0]}
        </span>
      </div>
    </div>
  );
}

/** Shows the latest closed week's winners for 24h after it closed, once per browser. */
export function WinnerAnnouncement() {
  const { data: weeks = [] } = useWeeks();
  const { serverOffset } = useCurrentWeek();
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
        colors: ['#D4A017', '#FF4D4F', '#A0A0A0', '#CD7F32'],
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
      title="🏆 Week Concluded — Champions Announced!"
      size="md"
    >
      <div className="text-center space-y-6 py-2">
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official Standings Finalized</span>
          </span>
          <h3 className="text-xl font-bold text-text-primary">
            Week {latest.id.replace('w-', '')} Winners
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Congratulations to this week’s top contributors for stellar support and impact!
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-3 pt-2">
          {podiumOrder(latest.winners).map((w) => (
            <WinnerCard key={w.memberId} w={w} />
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-2.5 rounded-lg bg-accent text-white font-bold text-xs uppercase tracking-wider hover:bg-accent-hover transition-colors shadow-md shadow-accent/25"
        >
          View Full Leaderboard
        </button>
      </div>
    </Modal>
  );
}
