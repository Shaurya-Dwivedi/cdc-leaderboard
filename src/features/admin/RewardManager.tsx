import { useState, useMemo } from 'react';
import { Modal } from '../../shared/ui/Modal';
import { useRewards, useMarkRewardDelivered } from '../../hooks/useRewards';
import { useMembers } from '../../hooks/useMembers';
import { useWeeks } from '../../hooks/useWeeks';
import { Avatar } from '../../shared/ui/Avatar';
import { Gift, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RewardManagerProps {
  open: boolean;
  onClose: () => void;
}

export function RewardManager({ open, onClose }: RewardManagerProps) {
  const { data: rewards = [], isLoading } = useRewards();
  const { data: members = [] } = useMembers();
  const { data: weeks = [] } = useWeeks();
  const markDeliveredMutation = useMarkRewardDelivered();

  const [selectedWeekId, setSelectedWeekId] = useState<string>('');

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const filtered = useMemo(() => {
    let list = [...rewards];
    if (selectedWeekId) {
      list = list.filter((r) => r.weekId === selectedWeekId);
    }
    return list;
  }, [rewards, selectedWeekId]);

  const handleDeliver = (rewardId: string) => {
    markDeliveredMutation.mutate(rewardId);
  };

  return (
    <Modal open={open} onClose={onClose} title="Weekly Rewards Fulfillment" size="lg">
      <div className="space-y-4">
        {/* Week Selector */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted">
            Track and dispatch top-3 rewards awarded upon week finalization.
          </p>
          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-surface-secondary border border-border text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Weeks</option>
            {weeks.map((w) => (
              <option key={w.id} value={w.id}>
                Week {w.id.replace('w-', '')} ({w.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* List of rewards */}
        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading rewards…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted">
            No rewards found. Once a week is closed, top-3 winners receive reward vouchers automatically.
          </div>
        ) : (
          <div className="divide-y divide-border/60 border border-border rounded-xl bg-surface-card overflow-hidden max-h-[60vh] overflow-y-auto">
            {filtered.map((reward) => {
              const member = memberMap.get(reward.memberId);
              const isDelivered = reward.status === 'delivered';

              const placeColors = {
                1: 'text-gold border-gold/40 bg-gold/10',
                2: 'text-silver border-silver/40 bg-silver/10',
                3: 'text-bronze border-bronze/40 bg-bronze/10',
              }[reward.place as 1 | 2 | 3] || 'text-text-muted';

              return (
                <div
                  key={reward.id}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center font-display font-bold border text-xs',
                        placeColors,
                      )}
                    >
                      #{reward.place}
                    </span>

                    <Avatar src={member?.avatarUrl} name={member?.name || 'Member'} size="sm" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">
                          {member?.name || reward.memberId}
                        </span>
                        <span className="text-[10px] text-text-muted font-display">
                          Week {reward.weekId.replace('w-', '')}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted font-medium mt-0.5">
                        {reward.rewardType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isDelivered ? (
                      <div className="flex items-center gap-1.5 text-positive text-[11px] font-semibold bg-positive/10 px-2.5 py-1 rounded-md">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Delivered</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeliver(reward.id)}
                        disabled={markDeliveredMutation.isPending}
                        className="flex items-center gap-1.5 text-[11px] font-bold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        <Gift className="h-3.5 w-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
