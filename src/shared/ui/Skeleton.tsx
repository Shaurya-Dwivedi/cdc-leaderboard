import { cn } from '../../lib/utils';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-secondary',
        className,
      )}
    />
  );
}

export function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-3 h-64">
      <div className="flex flex-col items-center gap-2 w-24">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
      <div className="flex flex-col items-center gap-2 w-28">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="flex flex-col items-center gap-2 w-24">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-5 w-8" />
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-4 w-32" />
      <div className="ml-auto">
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <PodiumSkeleton />
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
