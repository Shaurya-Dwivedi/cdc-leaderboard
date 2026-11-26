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

/** Aggregated points for one member in one week (what the DB view returns). */
export interface MemberTotal {
  memberId: string;
  weekId: string;
  total: number;
  /** ISO timestamp of the member's last entry that week */
  reachedAt: string;
}

/** Collapse a raw ledger into per-member-per-week totals. */
export function entriesToTotals(entries: PointEntry[]): MemberTotal[] {
  const map = new Map<string, MemberTotal>();
  for (const e of entries) {
    const key = `${e.memberId}|${e.weekId}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { memberId: e.memberId, weekId: e.weekId, total: e.delta, reachedAt: e.createdAt });
    } else {
      cur.total += e.delta;
      if (e.createdAt > cur.reachedAt) cur.reachedAt = e.createdAt;
    }
  }
  return [...map.values()];
}

/**
 * Rank members from per-week totals. Omit weekId to sum across all weeks.
 * Members with no totals rank at 0 points.
 */
export function computeRankingsFromTotals(
  totals: MemberTotal[],
  members: Member[],
  weekId?: string,
): LeaderboardEntry[] {
  const scores = new Map<string, { total: number; reachedAt: string }>();
  for (const t of totals) {
    if (weekId && t.weekId !== weekId) continue;
    const cur = scores.get(t.memberId);
    if (!cur) {
      scores.set(t.memberId, { total: t.total, reachedAt: t.reachedAt });
    } else {
      cur.total += t.total;
      if (t.reachedAt > cur.reachedAt) cur.reachedAt = t.reachedAt;
    }
  }

  // Build score list for all members (include members with 0 points)
  const scoreList: MemberScore[] = members.map((member) => {
    const score = scores.get(member.id);
    return {
      memberId: member.id,
      memberName: member.name,
      memberAvatar: member.avatarUrl,
      totalPoints: score?.total ?? 0,
      reachedAt: score?.reachedAt ?? new Date(0).toISOString(),
    };
  });

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
 * Compute ranked leaderboard from raw point entries (used by the mock API).
 * Revert entries are counted as ordinary negative-delta entries.
 */
export function computeRankings(
  entries: PointEntry[],
  members: Member[],
  weekId?: string,
): LeaderboardEntry[] {
  return computeRankingsFromTotals(entriesToTotals(entries), members, weekId);
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

/**
 * The podium shows one member per place 1-3 (first in tie-break order when places are
 * shared). Everyone else, including extra members tied into those places, goes in the list.
 */
export function splitPodium(entries: LeaderboardEntry[] | undefined) {
  const all = entries ?? [];
  const podium = [1, 2, 3].map((r) => all.find((e) => e.rank === r) ?? null) as [
    LeaderboardEntry | null,
    LeaderboardEntry | null,
    LeaderboardEntry | null,
  ];
  const onPodium = new Set(podium.flatMap((e) => (e ? [e.memberId] : [])));
  return { podium, rest: all.filter((e) => !onPodium.has(e.memberId)) };
}
