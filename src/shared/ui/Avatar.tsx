import { useState } from 'react';
import { cn, getInitials, hashString } from '../../lib/utils';

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-rose-500',
];

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const colorClass = AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        sizeClasses[size],
        colorClass,
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
