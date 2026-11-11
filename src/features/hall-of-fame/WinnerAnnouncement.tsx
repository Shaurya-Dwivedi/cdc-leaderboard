import { useEffect, useState } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useWeeks } from '../../hooks/useWeeks';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../shared/ui/Avatar';
import { Crown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CONFIG } from '../../config';

export function WinnerAnnouncement() {
  const { user } = useAuth();
  const { data: weeks = [] } = useWeeks();
  const [open, setOpen] = useState(false);
  const [announcedWeek, setAnnouncedWeek] = useState<(typeof weeks)[0] | null>(null);

  useEffect(() => {
    if (weeks.length === 0) return;

    // Get the most recently closed week
    const latestClosed = weeks[0];
    if (!latestClosed || latestClosed.winners.length === 0) return;

    const storageKey = `leaderboard_seen_winner_${user.id}_${latestClosed.id}`;
    const alreadySeen = localStorage.getItem(storageKey);

    if (!alreadySeen) {
      setAnnouncedWeek(latestClosed);
      setOpen(true);

      // Trigger tasteful confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D4A017', '#FF4D4F', '#A0A0A0', '#CD7F32'],
          disableForReducedMotion: true,
        });
      } catch (err) {
        // Safe fallback if canvas-confetti isn't supported
      }
    }
  }, [weeks, user.id]);

  const handleDismiss = () => {
    if (announcedWeek) {
      localStorage.setItem(`leaderboard_seen_winner_${user.id}_${announcedWeek.id}`, 'true');
    }
    setOpen(false);
  };

  if (!open || !announcedWeek) return null;

  const top1 = announcedWeek.winners.find((w) => w.rank === 1) || announcedWeek.winners[0];
  const top2 = announcedWeek.winners.find((w) => w.rank === 2) || announcedWeek.winners[1];
  const top3 = announcedWeek.winners.find((w) => w.rank === 3) || announcedWeek.winners[2];

  return (
    <Modal
      open={open}
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
            Week {announcedWeek.id.replace('w-', '')} Winners
          </h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            Congratulations to this week’s top contributors for stellar support and impact!
          </p>
        </div>

        {/* Podium display */}
        <div className="flex items-end justify-center gap-3 pt-2">
          {/* 2nd place */}
          {top2 && (
            <div className="flex flex-col items-center w-24">
              <Avatar src={top2.memberAvatar} name={top2.memberName} size="md" />
              <div className="mt-2 text-center">
                <span className="block text-xs font-bold text-text-primary truncate max-w-[90px]">
                  {top2.memberName.split(' ')[0]}
                </span>
                <span className="text-[11px] font-display font-bold text-silver">
                  #{top2.rank} • {top2.points} pts
                </span>
                <span className="block text-[10px] text-text-muted mt-0.5">
                  {CONFIG.REWARDS[2]?.label.split('+')[0] || 'Silver'}
                </span>
              </div>
            </div>
          )}

          {/* 1st place */}
          {top1 && (
            <div className="flex flex-col items-center w-28 -translate-y-3">
              <div className="relative">
                <Avatar src={top1.memberAvatar} name={top1.memberName} size="lg" />
                <Crown className="h-6 w-6 text-gold fill-gold/30 absolute -top-3 -right-2 rotate-12" />
              </div>
              <div className="mt-2 text-center">
                <span className="block text-sm font-bold text-text-primary truncate max-w-[100px]">
                  {top1.memberName}
                </span>
                <span className="text-xs font-display font-bold text-gold">
                  #{top1.rank} • {top1.points} pts
                </span>
                <span className="block text-[10px] text-accent font-semibold mt-0.5">
                  {CONFIG.REWARDS[1]?.label.split('+')[0] || 'Gold'}
                </span>
              </div>
            </div>
          )}

          {/* 3rd place */}
          {top3 && (
            <div className="flex flex-col items-center w-24">
              <Avatar src={top3.memberAvatar} name={top3.memberName} size="md" />
              <div className="mt-2 text-center">
                <span className="block text-xs font-bold text-text-primary truncate max-w-[90px]">
                  {top3.memberName.split(' ')[0]}
                </span>
                <span className="text-[11px] font-display font-bold text-bronze">
                  #{top3.rank} • {top3.points} pts
                </span>
                <span className="block text-[10px] text-text-muted mt-0.5">
                  {CONFIG.REWARDS[3]?.label.split('+')[0] || 'Bronze'}
                </span>
              </div>
            </div>
          )}
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
