import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Avatar } from '../../shared/ui/Avatar';
import { AnimatedNumber } from '../../shared/ui/AnimatedNumber';
import { Crown, Medal } from 'lucide-react';
import { CONFIG } from '../../config';
import type { LeaderboardEntry } from '../../types';

interface PodiumColumnProps {
  entry: LeaderboardEntry | null;
  place: 1 | 2 | 3;
  delay: number;
}

const placeConfig = {
  1: {
    height: 'h-36 md:h-44',
    width: 'w-24 md:w-32',
    avatarSize: 'xl' as const,
    color: 'text-gold',
    bgGradient: 'from-gold/20 to-gold/5',
    borderColor: 'border-gold/30',
    glowColor: 'shadow-gold/20',
    icon: Crown,
    label: '1st',
  },
  2: {
    height: 'h-28 md:h-36',
    width: 'w-22 md:w-28',
    avatarSize: 'lg' as const,
    color: 'text-silver',
    bgGradient: 'from-silver/15 to-silver/5',
    borderColor: 'border-silver/20',
    glowColor: '',
    icon: Medal,
    label: '2nd',
  },
  3: {
    height: 'h-22 md:h-28',
    width: 'w-22 md:w-28',
    avatarSize: 'lg' as const,
    color: 'text-bronze',
    bgGradient: 'from-bronze/15 to-bronze/5',
    borderColor: 'border-bronze/20',
    glowColor: '',
    icon: Medal,
    label: '3rd',
  },
};

export function PodiumColumn({ entry, place, delay }: PodiumColumnProps) {
  const config = placeConfig[place];
  const Icon = config.icon;

  if (!entry) {
    // Empty placeholder for fewer than 3 participants
    return (
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex flex-col items-center justify-end rounded-t-xl border border-dashed border-border/40 bg-surface-secondary/30',
            config.height,
            config.width,
          )}
        >
          <span className="text-xs text-text-muted/40 pb-4 font-display">{config.label}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: CONFIG.SPRING.stiffness,
        damping: CONFIG.SPRING.damping,
        delay,
      }}
    >
      {/* Avatar + Name above podium */}
      <motion.div
        className="flex flex-col items-center mb-3 gap-1.5"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="relative">
          <Avatar src={entry.memberAvatar} name={entry.memberName} size={config.avatarSize} />
          {place === 1 && (
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: delay + 0.4, type: 'spring', stiffness: 300, damping: 15 }}
            >
              <Crown className="h-5 w-5 text-gold fill-gold/30" />
            </motion.div>
          )}
        </div>
        <span
          className={cn(
            'text-xs md:text-sm font-semibold text-text-primary text-center max-w-[100px] truncate',
          )}
        >
          {entry.memberName}
        </span>
      </motion.div>

      {/* Podium block */}
      <motion.div
        className={cn(
          'flex flex-col items-center justify-between rounded-t-xl border-t border-x pt-3 pb-2',
          `bg-gradient-to-b ${config.bgGradient}`,
          config.borderColor,
          config.width,
          place === 1 && 'shadow-lg ' + config.glowColor,
        )}
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{
          type: 'spring',
          stiffness: CONFIG.SPRING.stiffness,
          damping: CONFIG.SPRING.damping,
          delay,
        }}
      >
        <div className={cn('flex flex-col items-center gap-1', config.height, 'justify-center')}>
          <Icon className={cn('h-4 w-4 md:h-5 md:w-5', config.color)} />
          <span className={cn('text-xs font-bold font-display', config.color)}>{config.label}</span>
          <AnimatedNumber
            value={entry.totalPoints}
            className={cn('text-lg md:text-2xl font-bold', config.color)}
          />
          <span className="text-[10px] text-text-muted">pts</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
