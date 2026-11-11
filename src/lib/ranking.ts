import type { PointEntry, Member, LeaderboardEntry } from '../types';

interface MemberScore {
  memberId: string;
  memberName: string;
  memberAvatar: string;
  totalPoints: number;
  /** ISO timestamp when this member first reached their current point total */
  reachedAt: string;
}

/**
 * Tie-break comparator:
 * 1. Higher points first
 * 2. Who reached that score earliest
 * 3. Alphabetical by name
 */
function tieBreakCompare(a: MemberScore, b: MemberScore): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (a.reachedAt !== b.reachedAt) return a.reachedAt < b.reachedAt ? -1 : 1;
  return a.memberName.localeCompare(b.memberName);
}

/**
 * Compute ranked leaderboard from point entries and members.
 * Entries with revertsId are still counted — the revert itself is a compensating entry
 * (negative delta) rather than a deletion.
 */
export function computeRankings(
  entries: PointEntry[],
  members: Member[],
  weekId?: string,
): LeaderboardEntry[] {
  // Filter entries by week if specified
  const filtered = weekId ? entries.filter((e) => e.weekId === weekId) : entries;

  // Accumulate points per member and track when they reached their current total
  const scores = new Map<string, { total: number; reachedAt: string }>();

  // Sort entries by createdAt to correctly track "reachedAt"
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  for (const entry of sorted) {
    const current = scores.get(entry.memberId) ?? { total: 0, reachedAt: entry.createdAt };
    current.total += entry.delta;
    current.reachedAt = entry.createdAt; // last change = when they reached current total
    scores.set(entry.memberId, current);
  }

  // Build score list for all members (include members with 0 points)
  const scoreList: MemberScore[] = [];
  for (const member of members) {
    const score = scores.get(member.id);
    scoreList.push({
      memberId: member.id,
      memberName: member.name,
      memberAvatar: member.avatarUrl,
      totalPoints: score?.total ?? 0,
      reachedAt: score?.reachedAt ?? new Date(0).toISOString(),
    });
  }

  // Sort with tie-break
  scoreList.sort(tieBreakCompare);

  // Assign ranks (tied members share the same rank)
  const result: LeaderboardEntry[] = [];
  let currentRank = 1;
  for (let i = 0; i < scoreList.length; i++) {
    const s = scoreList[i];
    if (i > 0 && s.totalPoints < scoreList[i - 1].totalPoints) {
      currentRank = i + 1;
    }
    result.push({
      rank: currentRank,
      memberId: s.memberId,
      memberName: s.memberName,
      memberAvatar: s.memberAvatar,
      totalPoints: s.totalPoints,
    });
  }

  return result;
}

/**
 * Compute rank deltas between current and previous rankings.
 * Positive delta = moved up, negative = moved down.
 */
export function computeDeltas(
  current: LeaderboardEntry[],
  previous: LeaderboardEntry[],
): LeaderboardEntry[] {
  const prevRankMap = new Map(previous.map((e) => [e.memberId, e.rank]));

  return current.map((entry) => {
    const prevRank = prevRankMap.get(entry.memberId);
    const delta = prevRank != null ? prevRank - entry.rank : 0;
    return { ...entry, delta, previousRank: prevRank };
  });
}

/**
 * Get weekly points for each member for a specific week (used in All Time tab).
 */
export function getWeeklyPointsMap(entries: PointEntry[], weekId: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of entries) {
    if (entry.weekId === weekId) {
      map.set(entry.memberId, (map.get(entry.memberId) ?? 0) + entry.delta);
    }
  }
  return map;
}
