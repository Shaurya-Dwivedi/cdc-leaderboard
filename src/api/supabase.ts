import type { SupabaseClient } from '@supabase/supabase-js';
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
} from '../types';
import { computeRankings, computeDeltas } from '../lib/ranking';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(e: any): PointEntry {
  return {
    id: e.id,
    memberId: e.member_id,
    weekId: e.week_id,
    delta: e.delta,
    reasonCategory: e.reason_category,
    note: e.note,
    link: e.link,
    createdBy: e.created_by,
    createdAt: e.created_at,
    revertsId: e.reverts_id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWeek(w: any): Week {
  return {
    id: w.id,
    startAt: w.start_at,
    endAt: w.end_at,
    status: w.status,
    closedAt: w.closed_at,
  };
}

export class SupabaseApiClient implements ApiClient {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getMembers(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select('id, name, avatar_url, role')
      .order('name');
    if (error) throw new Error(error.message);
    return (data || []).map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatar_url,
      role: m.role,
    }));
  }

  /** Database clock, nudged forward by half the round-trip. */
  private async serverNow(): Promise<string> {
    const t0 = Date.now();
    const { data, error } = await this.supabase.rpc('server_now');
    if (error) throw new Error(error.message);
    return new Date(new Date(data).getTime() + (Date.now() - t0) / 2).toISOString();
  }

  async getCurrentWeek(): Promise<CurrentWeekResponse> {
    const { data, error } = await this.supabase
      .from('weeks')
      .select('*')
      .eq('status', 'open')
      .order('start_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) throw new Error('No open week. Run supabase/schema.sql to seed one, or reopen a week.');

    return { week: mapWeek(data), serverNow: await this.serverNow() };
  }

  async getWeeks(): Promise<WeekWithWinners[]> {
    const { data: closedWeeks, error: wErr } = await this.supabase
      .from('weeks')
      .select('*')
      .eq('status', 'closed')
      .order('start_at', { ascending: false });
    if (wErr) throw new Error(wErr.message);

    // Winners come from the weekly_results snapshot written by close_week.
    const { data: results, error: rErr } = await this.supabase
      .from('weekly_results')
      .select('week_id, member_id, rank, total_points')
      .lte('rank', 3)
      .order('rank');
    if (rErr) throw new Error(rErr.message);

    const members = await this.getMembers();
    const byId = new Map(members.map((m) => [m.id, m]));

    return (closedWeeks || []).map((w) => ({
      ...mapWeek(w),
      winners: (results || [])
        .filter((r) => r.week_id === w.id)
        .map((r) => ({
          memberId: r.member_id,
          memberName: byId.get(r.member_id)?.name ?? 'Member',
          memberAvatar: byId.get(r.member_id)?.avatarUrl ?? '',
          rank: r.rank,
          points: r.total_points,
        })),
    }));
  }

  async getLeaderboard(scope: LeaderboardScope, weekId?: string): Promise<LeaderboardEntry[]> {
    const members = await this.getMembers();
    const { data: entries, error } = await this.supabase
      .from('point_entries')
      .select('*');

    if (error) throw new Error(error.message);

    const pointEntries = (entries || []).map(mapEntry);

    const currentWeekRes = await this.getCurrentWeek();
    const targetWeekId = weekId || currentWeekRes.week.id;

    if (scope === 'weekly') {
      const currentRankings = computeRankings(pointEntries, members, targetWeekId);

      // Deltas vs the chronologically previous week (same as mock).
      const { data: allWeeks, error: wErr } = await this.supabase
        .from('weeks')
        .select('id')
        .order('start_at');
      if (wErr) throw new Error(wErr.message);
      const idx = (allWeeks || []).findIndex((w) => w.id === targetWeekId);
      if (idx > 0) {
        const prev = computeRankings(pointEntries, members, allWeeks![idx - 1].id);
        return computeDeltas(currentRankings, prev);
      }
      return currentRankings;
    }

    // scope === 'alltime'
    const allTimeRankings = computeRankings(pointEntries, members);
    const weeklyPointsMap = new Map<string, number>();
    for (const entry of pointEntries) {
      if (entry.weekId === targetWeekId) {
        weeklyPointsMap.set(
          entry.memberId,
          (weeklyPointsMap.get(entry.memberId) || 0) + entry.delta,
        );
      }
    }

    const priorEntries = pointEntries.filter((e) => e.weekId !== targetWeekId);
    const priorRankings = computeRankings(priorEntries, members);
    const withDeltas = computeDeltas(allTimeRankings, priorRankings);

    return withDeltas.map((entry) => ({
      ...entry,
      weeklyPoints: weeklyPointsMap.get(entry.memberId) || 0,
    }));
  }

  // Writes go through admin-only RPCs: the server derives the acting admin from the
  // signed-in session and enforces the self-award, open-week and double-revert rules.
  async awardPoints(input: AwardPointsInput): Promise<PointEntry> {
    const { data, error } = await this.supabase.rpc('award_points', {
      p_member_id: input.memberId,
      p_delta: input.delta,
      p_reason: input.reasonCategory,
      p_note: input.note ?? null,
      p_link: input.link ?? null,
    });
    if (error) throw new Error(error.message);
    return mapEntry(data);
  }

  async bulkAwardPoints(input: BulkAwardInput): Promise<PointEntry[]> {
    const { data, error } = await this.supabase.rpc('bulk_award_points', {
      p_member_ids: input.memberIds,
      p_delta: input.delta,
      p_reason: input.reasonCategory,
      p_note: input.note ?? null,
      p_link: input.link ?? null,
    });
    if (error) throw new Error(error.message);
    return (data || []).map(mapEntry);
  }

  async revertEntry(entryId: string): Promise<PointEntry> {
    const { data, error } = await this.supabase.rpc('revert_entry', { p_entry_id: entryId });
    if (error) throw new Error(error.message);
    return mapEntry(data);
  }

  async getAuditLog(filters?: AuditLogFilters): Promise<PointEntry[]> {
    let query = this.supabase
      .from('point_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.memberId) query = query.eq('member_id', filters.memberId);
    if (filters?.adminId) query = query.eq('created_by', filters.adminId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map(mapEntry);
  }

  async getActivity(): Promise<ActivityEntry[]> {
    const { data, error } = await this.supabase
      .from('point_entries')
      .select('*, member:members!point_entries_member_id_fkey(name), admin:members!point_entries_created_by_fkey(name)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);

    return (data || []).map((d) => ({
      id: d.id,
      timestamp: d.created_at,
      delta: d.delta,
      memberName: d.member?.name || 'Member',
      reason: d.note ? `${d.reason_category}: ${d.note}` : d.reason_category,
      adminName: d.admin?.name || 'Admin',
    }));
  }

  async markRewardDelivered(rewardId: string): Promise<Reward> {
    const { data, error } = await this.supabase.rpc('mark_reward_delivered', {
      p_reward_id: rewardId,
    });
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      weekId: data.week_id,
      memberId: data.member_id,
      place: data.place,
      rewardType: data.reward_type,
      status: data.status,
      deliveredAt: data.delivered_at,
      deliveredBy: data.delivered_by,
    };
  }

  async getRewards(weekId?: string): Promise<Reward[]> {
    let query = this.supabase.from('rewards').select('*').order('place');
    if (weekId) query = query.eq('week_id', weekId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((d) => ({
      id: d.id,
      weekId: d.week_id,
      memberId: d.member_id,
      place: d.place,
      rewardType: d.reward_type,
      status: d.status,
      deliveredAt: d.delivered_at,
      deliveredBy: d.delivered_by,
    }));
  }

  async closeWeek(weekId: string): Promise<Week> {
    const { error } = await this.supabase.rpc('close_week', { p_week_id: weekId });
    if (error) throw new Error(error.message);

    const { data: updated, error: uErr } = await this.supabase
      .from('weeks')
      .select('*')
      .eq('id', weekId)
      .single();

    if (uErr) throw new Error(uErr.message);

    return mapWeek(updated);
  }

  async reopenWeek(weekId: string, reason: string): Promise<Week> {
    const { data, error } = await this.supabase.rpc('reopen_week', {
      p_week_id: weekId,
      p_reason: reason,
    });
    if (error) throw new Error(error.message);

    return mapWeek(data);
  }
}
