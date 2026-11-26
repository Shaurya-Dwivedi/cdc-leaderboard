export type Role = 'viewer' | 'admin';

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
}

export type WeekStatus = 'open' | 'closed';

export interface Week {
  id: string;
  startAt: string;
  endAt: string;
  status: WeekStatus;
  closedAt?: string;
}

export type ReasonCategory =
  | 'Ticket Resolved'
  | 'Escalation Handled'
  | 'Event Helped'
  | 'Documentation Written'
  | 'Mentoring'
  | 'Bug Fix'
  | 'Customer Feedback'
  | 'Other';

export interface PointEntry {
  id: string;
  memberId: string;
  weekId: string;
  delta: number;
  reasonCategory: ReasonCategory;
  note?: string;
  link?: string;
  createdBy: string;
  createdAt: string;
  revertsId?: string;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  totalPoints: number;
  weeklyPoints?: number;
  delta?: number;
  previousRank?: number;
}

export interface WeeklyResult {
  weekId: string;
  memberId: string;
  rank: number;
  totalPoints: number;
}

export type RewardStatus = 'pending' | 'delivered';

export interface RewardTier {
  place: number;
  label: string;
}

export interface Reward {
  id: string;
  weekId: string;
  memberId: string;
  place: number;
  rewardType: string;
  status: RewardStatus;
  deliveredAt?: string;
  deliveredBy?: string;
}

export interface CurrentWeekResponse {
  week: Week;
  serverNow: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  delta: number;
  memberName: string;
  reason: string;
  adminName: string;
}

export type LeaderboardScope = 'weekly' | 'alltime';

export interface AwardPointsInput {
  memberId: string;
  delta: number;
  reasonCategory: ReasonCategory;
  note?: string;
  link?: string;
}

export interface BulkAwardInput {
  memberIds: string[];
  delta: number;
  reasonCategory: ReasonCategory;
  note?: string;
  link?: string;
}

export interface WeekWithWinners extends Week {
  winners: {
    memberId: string;
    memberName: string;
    memberAvatar: string;
    rank: number;
    points: number;
  }[];
}
