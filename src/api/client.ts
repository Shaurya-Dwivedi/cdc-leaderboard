import type {
  LeaderboardEntry,
  LeaderboardScope,
  Week,
  CurrentWeekResponse,
  PointEntry,
  AwardPointsInput,
  BulkAwardInput,
  Reward,
  RewardTier,
  ActivityEntry,
  Member,
  WeekWithWinners,
} from '../types';

export type { Week };

export interface AuditLogFilters {
  memberId?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiClient {
  getLeaderboard(scope: LeaderboardScope, weekId?: string): Promise<LeaderboardEntry[]>;
  getWeeks(): Promise<WeekWithWinners[]>;
  getCurrentWeek(): Promise<CurrentWeekResponse>;
  getMembers(): Promise<Member[]>;
  awardPoints(input: AwardPointsInput): Promise<PointEntry>;
  bulkAwardPoints(input: BulkAwardInput): Promise<PointEntry[]>;
  revertEntry(entryId: string): Promise<PointEntry>;
  getAuditLog(filters?: AuditLogFilters): Promise<PointEntry[]>;
  getActivity(): Promise<ActivityEntry[]>;
  markRewardDelivered(rewardId: string): Promise<Reward>;
  getRewards(weekId?: string): Promise<Reward[]>;
  getRewardTiers(): Promise<RewardTier[]>;
  closeWeek(weekId: string): Promise<Week>;
  reopenWeek(weekId: string, reason: string): Promise<Week>;
}

let _client: ApiClient | null = null;

export function setApiClient(client: ApiClient) {
  _client = client;
}

export function getApiClient(): ApiClient {
  if (!_client) throw new Error('API client not initialized. Call setApiClient() first.');
  return _client;
}
