import { describe, it, expect } from 'vitest';
import { getWeekBoundary, getTimeRemaining } from '../week';
import { computeRankings, computeRankingsFromTotals, entriesToTotals, computeDeltas } from '../ranking';
import { mockApiClient } from '../../api/mock';
import type { PointEntry, Member } from '../../types';

describe('1. Week Boundary & Time Remaining Calculation', () => {
  it('correctly calculates week start (Monday 00:00:00 IST) and end (Sunday 23:59:59 IST)', () => {
    // Wednesday Nov 11, 2026 09:30:00 IST (UTC: Nov 11 04:00:00Z)
    const testDate = new Date('2026-11-11T04:00:00.000Z');
    const { start, end } = getWeekBoundary(testDate);

    // IST is UTC+5:30. Monday 00:00:00 IST is Sunday 18:30:00 UTC
    // Sunday 23:59:59.999 IST is Sunday 18:29:59.999 UTC
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const startIST = new Date(start.getTime() + istOffsetMs);
    const endIST = new Date(end.getTime() + istOffsetMs);

    // Start must be Monday (day 1) 00:00:00
    expect(startIST.getUTCDay()).toBe(1);
    expect(startIST.getUTCHours()).toBe(0);
    expect(startIST.getUTCMinutes()).toBe(0);
    expect(startIST.getUTCSeconds()).toBe(0);

    // End must be Sunday (day 0) 23:59:59
    expect(endIST.getUTCDay()).toBe(0);
    expect(endIST.getUTCHours()).toBe(23);
    expect(endIST.getUTCMinutes()).toBe(59);
    expect(endIST.getUTCSeconds()).toBe(59);

    // End is after start by exactly 7 days minus 1 millisecond
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });

  it('correctly computes countdown remaining with server time offset', () => {
    const futureEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString();
    // Server clock is 5000ms ahead of client
    const serverOffsetMs = 5000;
    const remaining = getTimeRemaining(futureEnd, serverOffsetMs);

    expect(remaining.days).toBe(2);
    expect(remaining.hours).toBe(2); // due to 5000ms offset forward
    expect(remaining.totalMs).toBeGreaterThan(0);
  });
});

describe('2. Tie-Break Ranking Logic', () => {
  const members: Member[] = [
    { id: 'm-1', name: 'Alice Smith', avatarUrl: '', role: 'viewer' },
    { id: 'm-2', name: 'Bob Jones', avatarUrl: '', role: 'viewer' },
    { id: 'm-3', name: 'Charlie Brown', avatarUrl: '', role: 'viewer' },
  ];

  it('ranks higher points first', () => {
    const entries: PointEntry[] = [
      {
        id: 'e-1',
        memberId: 'm-1',
        weekId: 'w-1',
        delta: 30,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'e-2',
        memberId: 'm-2',
        weekId: 'w-1',
        delta: 50,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T11:00:00Z',
      },
    ];

    const ranked = computeRankings(entries, members, 'w-1');
    expect(ranked[0].memberId).toBe('m-2');
    expect(ranked[0].totalPoints).toBe(50);
    expect(ranked[0].rank).toBe(1);

    expect(ranked[1].memberId).toBe('m-1');
    expect(ranked[1].totalPoints).toBe(30);
    expect(ranked[1].rank).toBe(2);
  });

  it('breaks ties by who reached that score earliest', () => {
    const entries: PointEntry[] = [
      // Alice reached 40 points at 10:00
      {
        id: 'e-1',
        memberId: 'm-1',
        weekId: 'w-1',
        delta: 40,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T10:00:00Z',
      },
      // Bob reached 40 points later at 12:00
      {
        id: 'e-2',
        memberId: 'm-2',
        weekId: 'w-1',
        delta: 40,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T12:00:00Z',
      },
    ];

    const ranked = computeRankings(entries, members, 'w-1');
    expect(ranked[0].memberId).toBe('m-1'); // Alice reached 40 first
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].memberId).toBe('m-2'); // Bob reached 40 later
    expect(ranked[1].rank).toBe(1); // Shared rank for tied points
  });

  it('breaks ties alphabetically if score and time are identical', () => {
    const entries: PointEntry[] = [
      {
        id: 'e-1',
        memberId: 'm-2', // Bob
        weekId: 'w-1',
        delta: 25,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'e-2',
        memberId: 'm-1', // Alice
        weekId: 'w-1',
        delta: 25,
        reasonCategory: 'Ticket Resolved',
        createdBy: 'admin',
        createdAt: '2026-11-01T10:00:00Z',
      },
    ];

    const ranked = computeRankings(entries, members, 'w-1');
    expect(ranked[0].memberId).toBe('m-1'); // Alice comes before Bob alphabetically
    expect(ranked[1].memberId).toBe('m-2');
  });

  it('correctly calculates position movement deltas', () => {
    const previous = [
      { rank: 1, memberId: 'm-1', memberName: 'Alice', memberAvatar: '', totalPoints: 50 },
      { rank: 2, memberId: 'm-2', memberName: 'Bob', memberAvatar: '', totalPoints: 40 },
    ];
    const current = [
      { rank: 1, memberId: 'm-2', memberName: 'Bob', memberAvatar: '', totalPoints: 60 },
      { rank: 2, memberId: 'm-1', memberName: 'Alice', memberAvatar: '', totalPoints: 50 },
    ];

    const withDeltas = computeDeltas(current, previous);
    const bob = withDeltas.find((e) => e.memberId === 'm-2');
    const alice = withDeltas.find((e) => e.memberId === 'm-1');

    expect(bob?.delta).toBe(1); // Moved up from #2 to #1 (+1)
    expect(alice?.delta).toBe(-1); // Moved down from #1 to #2 (-1)
  });
});

describe('3. Ledger Sums & Revert Logic', () => {
  it('accurately computes weekly vs all-time sums from append-only ledger', async () => {
    const leaderboardWeekly = await mockApiClient.getLeaderboard('weekly', 'w-1');
    const leaderboardAllTime = await mockApiClient.getLeaderboard('alltime');

    expect(leaderboardWeekly.length).toBeGreaterThan(0);
    expect(leaderboardAllTime.length).toBeGreaterThan(0);

    // All-time points must be >= weekly points for every member
    for (const entry of leaderboardAllTime) {
      if (entry.weeklyPoints != null) {
        expect(entry.totalPoints).toBeGreaterThanOrEqual(entry.weeklyPoints);
      }
    }
  });

  it('compensates reverted entries without deleting rows', async () => {
    // Award 30 points to member m-4
    const awarded = await mockApiClient.awardPoints({
      memberId: 'm-4',
      delta: 30,
      reasonCategory: 'Bug Fix',
      note: 'Test award to verify revert compensating transaction',
    });

    expect(awarded.id).toBeDefined();
    expect(awarded.delta).toBe(30);

    // Revert the entry
    const revertCompensating = await mockApiClient.revertEntry(awarded.id);
    expect(revertCompensating.revertsId).toBe(awarded.id);
    expect(revertCompensating.delta).toBe(-30);

    // Verify double-reverting throws error
    await expect(mockApiClient.revertEntry(awarded.id)).rejects.toThrow(
      'This point entry has already been reverted',
    );

    // Verify reverting a compensating entry throws error
    await expect(mockApiClient.revertEntry(revertCompensating.id)).rejects.toThrow(
      'Cannot revert a compensating revert entry',
    );

    // Audit log contains both original and compensating entry (append-only ledger)
    const log = await mockApiClient.getAuditLog({ memberId: 'm-4' });
    const hasOriginal = log.some((e) => e.id === awarded.id);
    const hasCompensating = log.some((e) => e.id === revertCompensating.id);
    expect(hasOriginal).toBe(true);
    expect(hasCompensating).toBe(true);
  });

  it('enforces server-side rule that admins cannot award points to themselves', async () => {
    await expect(
      mockApiClient.awardPoints({
        memberId: 'm-1', // currentAdminId
        delta: 50,
        reasonCategory: 'Ticket Resolved',
      }),
    ).rejects.toThrow('Admins are not permitted to award points to themselves');
  });
});

describe('4. Idempotent Week Closing & Rewards Snapshotting', () => {
  it('safely closes a week and creates top 3 reward entries', async () => {
    const currentWeekRes = await mockApiClient.getCurrentWeek();
    const weekId = currentWeekRes.week.id;

    // Close the week
    const closedWeek = await mockApiClient.closeWeek(weekId);
    expect(closedWeek.status).toBe('closed');
    expect(closedWeek.closedAt).toBeDefined();

    // Verify rewards were created for places 1, 2, 3
    const rewards = await mockApiClient.getRewards(weekId);
    expect(rewards.length).toBeGreaterThanOrEqual(1);
    expect(rewards.some((r) => r.place === 1)).toBe(true);

    const initialRewardCount = rewards.length;

    // Idempotence test: calling closeWeek a second time must NOT create duplicate rewards
    const secondClose = await mockApiClient.closeWeek(weekId);
    expect(secondClose.status).toBe('closed');

    const rewardsAfterSecond = await mockApiClient.getRewards(weekId);
    expect(rewardsAfterSecond.length).toBe(initialRewardCount);
  });
});

describe('Ranking from aggregated totals (DB view rows)', () => {
  const members: Member[] = [
    { id: 'm-1', name: 'Alice', avatarUrl: '', role: 'viewer' },
    { id: 'm-2', name: 'Bob', avatarUrl: '', role: 'viewer' },
  ];
  const mk = (id: string, memberId: string, weekId: string, delta: number, createdAt: string): PointEntry => ({
    id, memberId, weekId, delta, reasonCategory: 'Ticket Resolved', createdBy: 'admin', createdAt,
  });
  const entries = [
    mk('1', 'm-1', 'w-1', 20, '2026-11-01T10:00:00Z'),
    mk('2', 'm-2', 'w-1', 10, '2026-11-01T11:00:00Z'),
    mk('3', 'm-2', 'w-2', 10, '2026-11-08T09:00:00Z'),
  ];

  it('matches raw-ledger ranking for weekly and all-time, incl. tie-break', () => {
    const totals = entriesToTotals(entries);
    expect(totals).toHaveLength(3);
    for (const wk of ['w-1', 'w-2', undefined]) {
      expect(computeRankingsFromTotals(totals, members, wk)).toEqual(computeRankings(entries, members, wk));
    }
    // all-time tie at 20: Alice reached it first
    const all = computeRankingsFromTotals(totals, members);
    expect(all.map((r) => [r.memberId, r.rank])).toEqual([['m-1', 1], ['m-2', 1]]);
  });
});
