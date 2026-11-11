import type {
  ApiClient,
  AuditLogFilters,
} from './client';
import type {
  LeaderboardEntry,
  LeaderboardScope,
  Week,
  CurrentWeekResponse,
  PointEntry,
  AwardPointsInput,
  BulkAwardInput,
  Reward,
  ActivityEntry,
  Member,
  WeekWithWinners,
  WeeklyResult,
} from '../types';
import {
  SEED_MEMBERS,
  SEED_WEEKS,
  SEED_POINT_ENTRIES,
  SEED_REWARDS,
} from '../seed/data';
import { CONFIG } from '../config';
import { computeRankings, computeDeltas } from '../lib/ranking';
import { generateId } from '../lib/utils';

// Mutable in-memory ledger and state
let members: Member[] = [...SEED_MEMBERS];
let weeks: Week[] = [...SEED_WEEKS];
let pointEntries: PointEntry[] = [...SEED_POINT_ENTRIES];
let rewards: Reward[] = [...SEED_REWARDS];
let weeklyResults: WeeklyResult[] = [];

// Rate limiting tracker for admin writes
const adminWriteTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 40;

function checkRateLimit() {
  const now = Date.now();
  while (adminWriteTimestamps.length > 0 && adminWriteTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    adminWriteTimestamps.shift();
  }
  if (adminWriteTimestamps.length >= RATE_LIMIT_MAX_WRITES) {
    throw new Error('Admin write rate limit exceeded. Please wait a moment before trying again.');
  }
  adminWriteTimestamps.push(now);
}

// Simulated network delay
async function simulateLatency(min = 100, max = 250) {
  const ms = min + Math.random() * (max - min);
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// Active admin context ID
let currentAdminId = 'm-1'; // Shaurya Dwivedi

export function setCurrentAdminId(id: string) {
  currentAdminId = id;
}

export class MockApiClient implements ApiClient {
  async getMembers(): Promise<Member[]> {
    await simulateLatency(50, 120);
    return [...members];
  }

  async getCurrentWeek(): Promise<CurrentWeekResponse> {
    await simulateLatency(50, 120);
    const openWeek = weeks.find((w) => w.status === 'open') || weeks[weeks.length - 1];
    return {
      week: { ...openWeek },
      serverNow: new Date().toISOString(),
    };
  }

  async getWeeks(): Promise<WeekWithWinners[]> {
    await simulateLatency(80, 180);
    // Return closed weeks, newest first
    const closed = weeks.filter((w) => w.status === 'closed');

    const result: WeekWithWinners[] = closed.map((week) => {
      const rankings = computeRankings(pointEntries, members, week.id);
      const top3 = rankings.slice(0, 3).map((r) => ({
        memberId: r.memberId,
        memberName: r.memberName,
        memberAvatar: r.memberAvatar,
        rank: r.rank,
        points: r.totalPoints,
      }));
      return {
        ...week,
        winners: top3,
      };
    });

    return result.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }

  async getLeaderboard(scope: LeaderboardScope, weekId?: string): Promise<LeaderboardEntry[]> {
    await simulateLatency(100, 220);

    const openWeek = weeks.find((w) => w.status === 'open') || weeks[weeks.length - 1];
    const targetWeekId = weekId || openWeek.id;

    if (scope === 'weekly') {
      const currentRankings = computeRankings(pointEntries, members, targetWeekId);

      // Find chronological previous week to compute deltas
      const weekIndex = weeks.findIndex((w) => w.id === targetWeekId);
      if (weekIndex > 0) {
        const prevWeek = weeks[weekIndex - 1];
        const prevRankings = computeRankings(pointEntries, members, prevWeek.id);
        return computeDeltas(currentRankings, prevRankings);
      }

      return currentRankings;
    }

    // scope === 'alltime'
    // 1. Compute overall standings across all weeks
    const allTimeRankings = computeRankings(pointEntries, members);

    // 2. Compute weekly points for the current week to show "+X this week"
    const currentWeekEntries = pointEntries.filter((e) => e.weekId === targetWeekId);
    const weeklyPointsMap = new Map<string, number>();
    for (const entry of currentWeekEntries) {
      weeklyPointsMap.set(
        entry.memberId,
        (weeklyPointsMap.get(entry.memberId) || 0) + entry.delta,
      );
    }

    // 3. Compute previous all-time rankings (excluding current week) for deltas
    const priorEntries = pointEntries.filter((e) => e.weekId !== targetWeekId);
    const priorRankings = computeRankings(priorEntries, members);
    const withDeltas = computeDeltas(allTimeRankings, priorRankings);

    return withDeltas.map((entry) => ({
      ...entry,
      weeklyPoints: weeklyPointsMap.get(entry.memberId) || 0,
    }));
  }

  async awardPoints(input: AwardPointsInput): Promise<PointEntry> {
    checkRateLimit();
    await simulateLatency(150, 300);

    if (!input.memberId) {
      throw new Error('Member is required');
    }
    const member = members.find((m) => m.id === input.memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new Error('Points must be a non-zero integer');
    }

    if (!input.reasonCategory) {
      throw new Error('Reason category is required');
    }

    // Server-enforced rule: Admins cannot award points to themselves
    if (input.memberId === currentAdminId) {
      throw new Error('Admins are not permitted to award points to themselves');
    }

    const currentWeek = weeks.find((w) => w.status === 'open') || weeks[weeks.length - 1];
    if (currentWeek.status !== 'open') {
      throw new Error('Current week is closed. An admin must reopen the week to add points.');
    }

    const newEntry: PointEntry = {
      id: `pe-${generateId()}`,
      memberId: input.memberId,
      weekId: currentWeek.id,
      delta: input.delta,
      reasonCategory: input.reasonCategory,
      note: input.note?.trim() || undefined,
      link: input.link?.trim() || undefined,
      createdBy: currentAdminId,
      createdAt: new Date().toISOString(),
    };

    pointEntries.push(newEntry);
    return { ...newEntry };
  }

  async bulkAwardPoints(input: BulkAwardInput): Promise<PointEntry[]> {
    checkRateLimit();
    await simulateLatency(180, 350);

    if (!input.memberIds || input.memberIds.length === 0) {
      throw new Error('At least one member must be selected');
    }

    if (!Number.isInteger(input.delta) || input.delta === 0) {
      throw new Error('Points must be a non-zero integer');
    }

    if (!input.reasonCategory) {
      throw new Error('Reason category is required');
    }

    // Server-enforced: admin cannot be in the list
    if (input.memberIds.includes(currentAdminId)) {
      throw new Error('Admins cannot award points to themselves. Please deselect yourself.');
    }

    const currentWeek = weeks.find((w) => w.status === 'open') || weeks[weeks.length - 1];
    if (currentWeek.status !== 'open') {
      throw new Error('Current week is closed. An admin must reopen the week to add points.');
    }

    const created: PointEntry[] = [];
    const timestamp = new Date().toISOString();

    for (const memberId of input.memberIds) {
      const entry: PointEntry = {
        id: `pe-${generateId()}`,
        memberId,
        weekId: currentWeek.id,
        delta: input.delta,
        reasonCategory: input.reasonCategory,
        note: input.note?.trim() || undefined,
        link: input.link?.trim() || undefined,
        createdBy: currentAdminId,
        createdAt: timestamp,
      };
      pointEntries.push(entry);
      created.push(entry);
    }

    return created;
  }

  async revertEntry(entryId: string): Promise<PointEntry> {
    checkRateLimit();
    await simulateLatency(150, 300);

    const original = pointEntries.find((e) => e.id === entryId);
    if (!original) {
      throw new Error(`Entry with id "${entryId}" not found`);
    }

    if (original.revertsId) {
      throw new Error('Cannot revert a compensating revert entry');
    }

    const existingRevert = pointEntries.find((e) => e.revertsId === entryId);
    if (existingRevert) {
      throw new Error('This point entry has already been reverted');
    }

    // Append-only ledger: create compensating entry with opposite delta
    const compensating: PointEntry = {
      id: `pe-${generateId()}`,
      memberId: original.memberId,
      weekId: original.weekId,
      delta: -original.delta,
      reasonCategory: 'Other',
      note: `Reverting entry ${original.id} (${original.reasonCategory}: ${original.note || `${original.delta > 0 ? '+' : ''}${original.delta} pts`})`,
      createdBy: currentAdminId,
      createdAt: new Date().toISOString(),
      revertsId: original.id,
    };

    pointEntries.push(compensating);
    return { ...compensating };
  }

  async getAuditLog(filters?: AuditLogFilters): Promise<PointEntry[]> {
    await simulateLatency(80, 180);

    let entries = [...pointEntries];

    if (filters?.memberId) {
      entries = entries.filter((e) => e.memberId === filters.memberId);
    }
    if (filters?.adminId) {
      entries = entries.filter((e) => e.createdBy === filters.adminId);
    }
    if (filters?.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      entries = entries.filter((e) => new Date(e.createdAt).getTime() >= startMs);
    }
    if (filters?.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      entries = entries.filter((e) => new Date(e.createdAt).getTime() <= endMs);
    }

    // Return newest first
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActivity(): Promise<ActivityEntry[]> {
    await simulateLatency(60, 140);

    const memberMap = new Map(members.map((m) => [m.id, m]));
    // Exclude zero deltas and sort by createdAt desc
    const sorted = [...pointEntries]
      .filter((e) => e.delta !== 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 40);

    return sorted.map((entry) => {
      const member = memberMap.get(entry.memberId);
      const admin = memberMap.get(entry.createdBy);
      return {
        id: entry.id,
        timestamp: entry.createdAt,
        delta: entry.delta,
        memberName: member ? member.name : 'Unknown Member',
        reason: entry.note ? `${entry.reasonCategory}: ${entry.note}` : entry.reasonCategory,
        adminName: admin ? admin.name : 'System Admin',
      };
    });
  }

  async markRewardDelivered(rewardId: string): Promise<Reward> {
    checkRateLimit();
    await simulateLatency(120, 250);

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) {
      throw new Error(`Reward with id "${rewardId}" not found`);
    }

    reward.status = 'delivered';
    reward.deliveredAt = new Date().toISOString();
    reward.deliveredBy = currentAdminId;

    return { ...reward };
  }

  async getRewards(weekId?: string): Promise<Reward[]> {
    await simulateLatency(60, 140);
    let list = [...rewards];
    if (weekId) {
      list = list.filter((r) => r.weekId === weekId);
    }
    return list.sort((a, b) => a.place - b.place);
  }

  /**
   * Idempotent scheduled / admin week-finalization job.
   * Running twice never double-awards rewards. Safe if run late.
   */
  async closeWeek(weekId: string): Promise<Week> {
    checkRateLimit();
    await simulateLatency(200, 400);

    const week = weeks.find((w) => w.id === weekId);
    if (!week) {
      throw new Error(`Week with id "${weekId}" not found`);
    }

    // Idempotent: If already closed, return without re-awarding
    if (week.status === 'closed') {
      return { ...week };
    }

    // 1. Snapshot standings
    const standings = computeRankings(pointEntries, members, week.id);
    for (const standing of standings) {
      // Check if result already recorded
      const exists = weeklyResults.some(
        (r) => r.weekId === week.id && r.memberId === standing.memberId,
      );
      if (!exists) {
        weeklyResults.push({
          weekId: week.id,
          memberId: standing.memberId,
          rank: standing.rank,
          totalPoints: standing.totalPoints,
        });
      }
    }

    // 2. Award top 3 rewards idempotently
    const top3 = standings.slice(0, 3);
    for (let place = 1; place <= 3; place++) {
      const winner = top3.find((w) => w.rank === place) || top3[place - 1];
      if (winner) {
        const existingReward = rewards.find(
          (r) => r.weekId === week.id && r.place === place && r.memberId === winner.memberId,
        );
        if (!existingReward) {
          const rewardConfig = CONFIG.REWARDS[place];
          rewards.push({
            id: `rew-${week.id}-${place}`,
            weekId: week.id,
            memberId: winner.memberId,
            place,
            rewardType: rewardConfig ? rewardConfig.label : `Place #${place} reward`,
            status: 'pending',
          });
        }
      }
    }

    // 3. Mark closed
    week.status = 'closed';
    week.closedAt = new Date().toISOString();

    // 4. Create new open week if this was the latest week
    const isLatest = weeks[weeks.length - 1].id === week.id;
    if (isLatest) {
      const nextNum = weeks.length + 1;
      const startAt = week.endAt;
      const endMs = new Date(startAt).getTime() + 7 * 24 * 60 * 60 * 1000;
      const nextWeek: Week = {
        id: `w-${nextNum}`,
        startAt,
        endAt: new Date(endMs).toISOString(),
        status: 'open',
      };
      weeks.push(nextWeek);
    }

    return { ...week };
  }

  /**
   * Explicit admin action to reopen a closed week for late edits.
   * Logged in audit log.
   */
  async reopenWeek(weekId: string, reason: string): Promise<Week> {
    checkRateLimit();
    await simulateLatency(150, 300);

    const week = weeks.find((w) => w.id === weekId);
    if (!week) {
      throw new Error(`Week with id "${weekId}" not found`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('A reason is required to reopen a closed week');
    }

    week.status = 'open';
    delete week.closedAt;

    // Log explicit audit log entry for this action
    pointEntries.push({
      id: `pe-${generateId()}`,
      memberId: currentAdminId,
      weekId: week.id,
      delta: 0,
      reasonCategory: 'Other',
      note: `ADMIN ACTION: Reopened week ${weekId} for adjustments. Reason: ${reason.trim()}`,
      createdBy: currentAdminId,
      createdAt: new Date().toISOString(),
    });

    return { ...week };
  }
}

// Singleton mock client instance
export const mockApiClient = new MockApiClient();
