import type { Member, Week, PointEntry, Reward, ReasonCategory } from '../types';
import { getCurrentWeekBoundary } from '../lib/week';

export const SEED_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Shaurya Dwivedi', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShauryaDwivedi', role: 'admin' },
  { id: 'm-2', name: 'Priya Sharma', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PriyaSharma', role: 'admin' },
  { id: 'm-3', name: 'Rohan Verma', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RohanVerma', role: 'admin' },
  { id: 'm-4', name: 'Aarav Patel', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AaravPatel', role: 'viewer' },
  { id: 'm-5', name: 'Ananya Iyer', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnanyaIyer', role: 'viewer' },
  { id: 'm-6', name: 'Vikramaditya Singh', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VikramadityaSingh', role: 'viewer' },
  { id: 'm-7', name: 'Sneha Kulkarni', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SnehaKulkarni', role: 'viewer' },
  { id: 'm-8', name: 'Aditya Nair', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdityaNair', role: 'viewer' },
  { id: 'm-9', name: 'Pooja Sundaram', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PoojaSundaram', role: 'viewer' },
  { id: 'm-10', name: 'Arjun Reddy', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArjunReddy', role: 'viewer' },
  { id: 'm-11', name: 'Meera Joshi', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeeraJoshi', role: 'viewer' },
  { id: 'm-12', name: 'Rahul Deshmukh', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulDeshmukh', role: 'viewer' },
  { id: 'm-13', name: 'Kavita Menon', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KavitaMenon', role: 'viewer' },
  { id: 'm-14', name: 'Siddharth Mukherjee', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SiddharthMukherjee', role: 'viewer' },
  { id: 'm-15', name: 'Divya Pillai', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DivyaPillai', role: 'viewer' },
  { id: 'm-16', name: 'Kunal Kapoor', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KunalKapoor', role: 'viewer' },
  { id: 'm-17', name: 'Ritu Bhattacharya', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RituBhattacharya', role: 'viewer' },
  { id: 'm-18', name: 'Harsh Vardhan', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HarshVardhan', role: 'viewer' },
  { id: 'm-19', name: 'Tanvi Hegde', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TanviHegde', role: 'viewer' },
  { id: 'm-20', name: 'Nikhil Agarwal', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NikhilAgarwal', role: 'viewer' },
  { id: 'm-21', name: 'Ishita Gupta', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IshitaGupta', role: 'viewer' },
  { id: 'm-22', name: 'Pranav Rao', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PranavRao', role: 'viewer' },
  { id: 'm-23', name: 'Neha Chawla', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NehaChawla', role: 'viewer' },
  { id: 'm-24', name: 'Varun Sengupta', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VarunSengupta', role: 'viewer' },
  { id: 'm-25', name: 'Swati Nambiar', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SwatiNambiar', role: 'viewer' },
];

const currentBoundary = getCurrentWeekBoundary();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface WeekTimeInfo {
  startAt: string;
  endAt: string;
  startMs: number;
  endMs: number;
}

function computeWeekInfo(weeksAgo: number): WeekTimeInfo {
  const startMs = currentBoundary.start.getTime() - weeksAgo * ONE_WEEK_MS;
  const endMs = currentBoundary.end.getTime() - weeksAgo * ONE_WEEK_MS;
  return {
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    startMs,
    endMs,
  };
}

const wInfo: Record<string, WeekTimeInfo> = {
  'w-1': computeWeekInfo(6),
  'w-2': computeWeekInfo(5),
  'w-3': computeWeekInfo(4),
  'w-4': computeWeekInfo(3),
  'w-5': computeWeekInfo(2),
  'w-6': computeWeekInfo(1),
  'w-7': computeWeekInfo(0),
};

export const SEED_WEEKS: Week[] = [
  { id: 'w-1', startAt: wInfo['w-1'].startAt, endAt: wInfo['w-1'].endAt, status: 'closed', closedAt: wInfo['w-1'].endAt },
  { id: 'w-2', startAt: wInfo['w-2'].startAt, endAt: wInfo['w-2'].endAt, status: 'closed', closedAt: wInfo['w-2'].endAt },
  { id: 'w-3', startAt: wInfo['w-3'].startAt, endAt: wInfo['w-3'].endAt, status: 'closed', closedAt: wInfo['w-3'].endAt },
  { id: 'w-4', startAt: wInfo['w-4'].startAt, endAt: wInfo['w-4'].endAt, status: 'closed', closedAt: wInfo['w-4'].endAt },
  { id: 'w-5', startAt: wInfo['w-5'].startAt, endAt: wInfo['w-5'].endAt, status: 'closed', closedAt: wInfo['w-5'].endAt },
  { id: 'w-6', startAt: wInfo['w-6'].startAt, endAt: wInfo['w-6'].endAt, status: 'closed', closedAt: wInfo['w-6'].endAt },
  { id: 'w-7', startAt: wInfo['w-7'].startAt, endAt: wInfo['w-7'].endAt, status: 'open' },
];

function timeInWeek(weekId: string, progress: number): string {
  const info = wInfo[weekId];
  if (weekId === 'w-7') {
    const now = Date.now();
    const elapsed = Math.max(2 * 60 * 60 * 1000, now - info.startMs);
    const capped = Math.min(elapsed, info.endMs - info.startMs - 60000);
    const ms = info.startMs + progress * capped;
    return new Date(ms).toISOString();
  }
  const ms = info.startMs + progress * (info.endMs - info.startMs);
  return new Date(ms).toISOString();
}

interface RawEntry {
  weekId: string;
  memberId: string;
  delta: number;
  reasonCategory: ReasonCategory;
  note: string;
  createdBy: string;
  progress: number;
  link?: string;
  revertsTargetIndex?: number;
}

const RAW_ENTRIES: RawEntry[] = [
  // --- Week 1 (Pilot week: Only 2 active participants) ---
  { weekId: 'w-1', memberId: 'm-4', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Resolved 15 critical backlog support tickets in pilot kickoff', createdBy: 'm-1', progress: 0.15 },
  { weekId: 'w-1', memberId: 'm-4', delta: 25, reasonCategory: 'Bug Fix', note: 'Patched memory leak in cache ingestion service', createdBy: 'm-2', progress: 0.45 },
  { weekId: 'w-1', memberId: 'm-5', delta: 30, reasonCategory: 'Documentation Written', note: 'Authored initial runbooks for on-call triage process', createdBy: 'm-1', progress: 0.3 },
  { weekId: 'w-1', memberId: 'm-5', delta: 15, reasonCategory: 'Mentoring', note: 'Conducted 1:1 onboarding session for pilot batch', createdBy: 'm-3', progress: 0.7 },

  // --- Week 2 (Expansion to 9 active members) ---
  { weekId: 'w-2', memberId: 'm-6', delta: 50, reasonCategory: 'Escalation Handled', note: 'P0 outage response for payment gateway failure', createdBy: 'm-1', progress: 0.1 },
  { weekId: 'w-2', memberId: 'm-6', delta: 35, reasonCategory: 'Bug Fix', note: 'Fixed race condition in distributed lock scheduler', createdBy: 'm-2', progress: 0.4 },
  { weekId: 'w-2', memberId: 'm-6', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Cleared 8 complex integration query tickets', createdBy: 'm-3', progress: 0.75 },
  { weekId: 'w-2', memberId: 'm-4', delta: 45, reasonCategory: 'Ticket Resolved', note: 'Triaged 18 user support escalations', createdBy: 'm-1', progress: 0.15 },
  { weekId: 'w-2', memberId: 'm-4', delta: 40, reasonCategory: 'Mentoring', note: 'Led workshop on system telemetry and tracing', createdBy: 'm-2', progress: 0.65 },
  { weekId: 'w-2', memberId: 'm-8', delta: 40, reasonCategory: 'Documentation Written', note: 'Documented API rate limits and throttling strategy', createdBy: 'm-1', progress: 0.2 },
  { weekId: 'w-2', memberId: 'm-8', delta: 30, reasonCategory: 'Customer Feedback', note: 'Direct resolution of high-profile customer feature blocker', createdBy: 'm-3', progress: 0.55 },
  { weekId: 'w-2', memberId: 'm-5', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Handled customer data export requests ahead of SLA', createdBy: 'm-1', progress: 0.25 },
  { weekId: 'w-2', memberId: 'm-5', delta: 20, reasonCategory: 'Other', note: 'Organized internal code quality retrospectives', createdBy: 'm-2', progress: 0.8 },
  { weekId: 'w-2', memberId: 'm-7', delta: 25, reasonCategory: 'Bug Fix', note: 'Resolved CSS z-index stacking glitch on navigation modals', createdBy: 'm-3', progress: 0.35 },
  { weekId: 'w-2', memberId: 'm-7', delta: 20, reasonCategory: 'Customer Feedback', note: 'Assisted partner team with webhook verification', createdBy: 'm-1', progress: 0.7 },
  { weekId: 'w-2', memberId: 'm-9', delta: 35, reasonCategory: 'Event Helped', note: 'Volunteered as speaker in CDC Tech Community talk', createdBy: 'm-2', progress: 0.4 },
  { weekId: 'w-2', memberId: 'm-10', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Closed 12 lingering billing discrepancies', createdBy: 'm-1', progress: 0.3 },
  { weekId: 'w-2', memberId: 'm-11', delta: 20, reasonCategory: 'Documentation Written', note: 'Wrote step-by-step setup guide for local development', createdBy: 'm-3', progress: 0.5 },
  { weekId: 'w-2', memberId: 'm-12', delta: 15, reasonCategory: 'Other', note: 'Benchmarked container startup latency across clusters', createdBy: 'm-2', progress: 0.6 },
  { weekId: 'w-2', memberId: 'm-10', delta: 10, reasonCategory: 'Bug Fix', note: 'Fixed typo in localized notification strings', createdBy: 'm-1', progress: 0.85 },
  { weekId: 'w-2', memberId: 'm-4', delta: 10, reasonCategory: 'Ticket Resolved', note: 'Follow-up verification on reported sync errors', createdBy: 'm-3', progress: 0.9 },
  { weekId: 'w-2', memberId: 'm-8', delta: 10, reasonCategory: 'Mentoring', note: 'Assisted peer with Docker networking debugging', createdBy: 'm-1', progress: 0.92 },
  { weekId: 'w-2', memberId: 'm-11', delta: 15, reasonCategory: 'Bug Fix', note: 'Corrected timezone offset logic in PDF exporter', createdBy: 'm-2', progress: 0.94 },
  { weekId: 'w-2', memberId: 'm-12', delta: 10, reasonCategory: 'Customer Feedback', note: 'Verified patch with customer enterprise admin', createdBy: 'm-3', progress: 0.96 },

  // --- Week 3 (15 members active, with a revert pair) ---
  { weekId: 'w-3', memberId: 'm-7', delta: 50, reasonCategory: 'Escalation Handled', note: 'Critical latency spike mitigation in primary DB cluster', createdBy: 'm-1', progress: 0.08 },
  { weekId: 'w-3', memberId: 'm-7', delta: 45, reasonCategory: 'Bug Fix', note: 'Redesigned connection pool retry logic to prevent deadlocks', createdBy: 'm-2', progress: 0.35 },
  { weekId: 'w-3', memberId: 'm-7', delta: 30, reasonCategory: 'Mentoring', note: 'Mentored 2 junior engineers on distributed query debugging', createdBy: 'm-3', progress: 0.65 },
  { weekId: 'w-3', memberId: 'm-10', delta: 50, reasonCategory: 'Ticket Resolved', note: 'Resolved 22 high-complexity enterprise support tickets', createdBy: 'm-1', progress: 0.12 },
  { weekId: 'w-3', memberId: 'm-10', delta: 45, reasonCategory: 'Customer Feedback', note: 'Commended by VIP client for swift disaster recovery assistance', createdBy: 'm-2', progress: 0.58 },
  { weekId: 'w-3', memberId: 'm-5', delta: 40, reasonCategory: 'Documentation Written', note: 'Overhauled system architecture diagrams and specs', createdBy: 'm-3', progress: 0.18 },
  { weekId: 'w-3', memberId: 'm-5', delta: 40, reasonCategory: 'Event Helped', note: 'Co-hosted workshop on Kubernetes security hardening', createdBy: 'm-1', progress: 0.6 },
  { weekId: 'w-3', memberId: 'm-4', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Cleared Monday morning backlog of 14 customer issues', createdBy: 'm-2', progress: 0.15 },
  { weekId: 'w-3', memberId: 'm-4', delta: 30, reasonCategory: 'Bug Fix', note: 'Resolved edge case in CSV data export date parsing', createdBy: 'm-3', progress: 0.5 },
  { weekId: 'w-3', memberId: 'm-6', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Handled customer account recovery tickets', createdBy: 'm-1', progress: 0.22 },
  { weekId: 'w-3', memberId: 'm-6', delta: 25, reasonCategory: 'Mentoring', note: 'Conducted code review clinic for React components', createdBy: 'm-2', progress: 0.7 },
  { weekId: 'w-3', memberId: 'm-8', delta: 25, reasonCategory: 'Other', note: 'Automated CI/CD bundle size regression checks', createdBy: 'm-3', progress: 0.28 },
  { weekId: 'w-3', memberId: 'm-8', delta: 20, reasonCategory: 'Customer Feedback', note: 'Customer testimonial on proactive communication', createdBy: 'm-1', progress: 0.72 },
  { weekId: 'w-3', memberId: 'm-9', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Resolved 10 API authentication query tickets', createdBy: 'm-2', progress: 0.3 },
  { weekId: 'w-3', memberId: 'm-9', delta: 15, reasonCategory: 'Bug Fix', note: 'Patched dropdown overlay clipping in dark mode', createdBy: 'm-3', progress: 0.68 },
  { weekId: 'w-3', memberId: 'm-11', delta: 25, reasonCategory: 'Documentation Written', note: 'Authored troubleshooting guide for webhook retries', createdBy: 'm-1', progress: 0.32 },
  { weekId: 'w-3', memberId: 'm-12', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Resolved 12 complex search query slowdown tickets', createdBy: 'm-2', progress: 0.38 },
  // Duplicate entry to be reverted:
  { weekId: 'w-3', memberId: 'm-12', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Duplicate: Resolved 12 complex search query tickets', createdBy: 'm-2', progress: 0.4 },
  // Compensating revert entry:
  { weekId: 'w-3', memberId: 'm-12', delta: -35, reasonCategory: 'Ticket Resolved', note: 'Revert accidental duplicate entry for search query tickets', createdBy: 'm-1', progress: 0.42, revertsTargetIndex: 37 },
  { weekId: 'w-3', memberId: 'm-13', delta: 25, reasonCategory: 'Bug Fix', note: 'Fixed null pointer exception on missing user avatar', createdBy: 'm-3', progress: 0.45 },
  { weekId: 'w-3', memberId: 'm-14', delta: 20, reasonCategory: 'Mentoring', note: 'Pair-programmed on SQL index optimization with junior engineer', createdBy: 'm-1', progress: 0.52 },
  { weekId: 'w-3', memberId: 'm-15', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Closed 6 onboarding support requests', createdBy: 'm-2', progress: 0.55 },
  { weekId: 'w-3', memberId: 'm-16', delta: 15, reasonCategory: 'Other', note: 'Assisted infra team in zero-downtime certificate rotation', createdBy: 'm-3', progress: 0.62 },
  { weekId: 'w-3', memberId: 'm-17', delta: 20, reasonCategory: 'Documentation Written', note: 'Created template for post-incident RCA reviews', createdBy: 'm-1', progress: 0.74 },
  { weekId: 'w-3', memberId: 'm-18', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Resolved permissions mismatch for analytics viewer role', createdBy: 'm-2', progress: 0.78 },
  { weekId: 'w-3', memberId: 'm-19', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed broken link in transactional welcome emails', createdBy: 'm-3', progress: 0.82 },
  { weekId: 'w-3', memberId: 'm-20', delta: 10, reasonCategory: 'Ticket Resolved', note: 'Handled routine token refresh inquiries', createdBy: 'm-1', progress: 0.88 },

  // --- Week 4 (Top 3 have ties: m-7 and m-13 tie at 95 points!) ---
  { weekId: 'w-4', memberId: 'm-9', delta: 50, reasonCategory: 'Ticket Resolved', note: 'Resolved 20 critical tickets during major service migration', createdBy: 'm-1', progress: 0.05 },
  { weekId: 'w-4', memberId: 'm-9', delta: 40, reasonCategory: 'Escalation Handled', note: 'Handled Sev-1 escalation for international customer region', createdBy: 'm-2', progress: 0.35 },
  { weekId: 'w-4', memberId: 'm-9', delta: 30, reasonCategory: 'Documentation Written', note: 'Authored migration playbook and tenant isolation FAQs', createdBy: 'm-3', progress: 0.7 }, // Total: 120 (Rank 1)
  // m-7 reaches 95 earlier:
  { weekId: 'w-4', memberId: 'm-7', delta: 50, reasonCategory: 'Escalation Handled', note: 'Immediate containment of data pipeline replication lag', createdBy: 'm-1', progress: 0.1 },
  { weekId: 'w-4', memberId: 'm-7', delta: 45, reasonCategory: 'Bug Fix', note: 'Fixed deadlock in distributed distributed lock lease renewals', createdBy: 'm-2', progress: 0.4 }, // Reached 95 at 0.4
  // m-13 reaches 95 later:
  { weekId: 'w-4', memberId: 'm-13', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Resolved 16 customer configuration tickets', createdBy: 'm-3', progress: 0.15 },
  { weekId: 'w-4', memberId: 'm-13', delta: 35, reasonCategory: 'Mentoring', note: 'Conducted hands-on debugging lab for incoming team members', createdBy: 'm-1', progress: 0.45 },
  { weekId: 'w-4', memberId: 'm-13', delta: 20, reasonCategory: 'Customer Feedback', note: 'Recognized by key enterprise client for proactive solution', createdBy: 'm-2', progress: 0.65 }, // Reached 95 at 0.65
  // Rank 4: m-11 with 75 points
  { weekId: 'w-4', memberId: 'm-11', delta: 40, reasonCategory: 'Bug Fix', note: 'Patched memory leak in long-running WebSocket clients', createdBy: 'm-3', progress: 0.2 },
  { weekId: 'w-4', memberId: 'm-11', delta: 35, reasonCategory: 'Documentation Written', note: 'Comprehensive guide to WebSocket protocol telemetry', createdBy: 'm-1', progress: 0.55 },
  // Other members in Week 4:
  { weekId: 'w-4', memberId: 'm-4', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Handled 11 tier-2 customer support tickets', createdBy: 'm-2', progress: 0.22 },
  { weekId: 'w-4', memberId: 'm-4', delta: 30, reasonCategory: 'Mentoring', note: 'Mentored new on-call engineers during shift transition', createdBy: 'm-3', progress: 0.6 },
  { weekId: 'w-4', memberId: 'm-5', delta: 35, reasonCategory: 'Event Helped', note: 'Organized internal engineering brown bag on modern CSS', createdBy: 'm-1', progress: 0.25 },
  { weekId: 'w-4', memberId: 'm-5', delta: 20, reasonCategory: 'Customer Feedback', note: 'Positive feedback for prompt customer query assistance', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-4', memberId: 'm-6', delta: 45, reasonCategory: 'Ticket Resolved', note: 'Resolved 18 challenging billing calculation tickets', createdBy: 'm-3', progress: 0.18 },
  { weekId: 'w-4', memberId: 'm-8', delta: 40, reasonCategory: 'Bug Fix', note: 'Resolved race condition in async report generation', createdBy: 'm-1', progress: 0.3 },
  { weekId: 'w-4', memberId: 'm-8', delta: 20, reasonCategory: 'Other', note: 'Cleaned up deprecated feature flags across code repositories', createdBy: 'm-2', progress: 0.75 },
  { weekId: 'w-4', memberId: 'm-10', delta: 35, reasonCategory: 'Escalation Handled', note: 'Managed high-priority alert on Redis memory fragmentation', createdBy: 'm-3', progress: 0.32 },
  { weekId: 'w-4', memberId: 'm-10', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Triaged 7 incoming user permission issues', createdBy: 'm-1', progress: 0.68 },
  { weekId: 'w-4', memberId: 'm-12', delta: 30, reasonCategory: 'Bug Fix', note: 'Fixed rendering glitch in nested table views', createdBy: 'm-2', progress: 0.42 },
  { weekId: 'w-4', memberId: 'm-14', delta: 30, reasonCategory: 'Documentation Written', note: 'Updated disaster recovery playbook for database failure', createdBy: 'm-3', progress: 0.48 },
  { weekId: 'w-4', memberId: 'm-15', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Resolved 9 account setup inquiries', createdBy: 'm-1', progress: 0.5 },
  { weekId: 'w-4', memberId: 'm-16', delta: 20, reasonCategory: 'Mentoring', note: 'Assisted intern with Git workflow and PR branching', createdBy: 'm-2', progress: 0.58 },
  { weekId: 'w-4', memberId: 'm-17', delta: 25, reasonCategory: 'Event Helped', note: 'Volunteered for mock interview sessions for campus recruits', createdBy: 'm-3', progress: 0.62 },
  { weekId: 'w-4', memberId: 'm-18', delta: 20, reasonCategory: 'Customer Feedback', note: 'Delighted user praise for rapid fix of export feature', createdBy: 'm-1', progress: 0.78 },
  { weekId: 'w-4', memberId: 'm-19', delta: 20, reasonCategory: 'Bug Fix', note: 'Fixed keyboard navigation trap in modal dialogues', createdBy: 'm-2', progress: 0.8 },
  { weekId: 'w-4', memberId: 'm-20', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Closed 5 basic API integration inquiry tickets', createdBy: 'm-3', progress: 0.82 },
  { weekId: 'w-4', memberId: 'm-21', delta: 15, reasonCategory: 'Documentation Written', note: 'Added inline JSDoc comments to common utilities', createdBy: 'm-1', progress: 0.85 },
  { weekId: 'w-4', memberId: 'm-22', delta: 15, reasonCategory: 'Other', note: 'Audited npm package dependencies for vulnerability alerts', createdBy: 'm-2', progress: 0.88 },
  { weekId: 'w-4', memberId: 'm-23', delta: 10, reasonCategory: 'Ticket Resolved', note: 'Closed 4 user profile update tickets', createdBy: 'm-3', progress: 0.9 },
  { weekId: 'w-4', memberId: 'm-24', delta: 10, reasonCategory: 'Bug Fix', note: 'Fixed spelling in error dialog messaging', createdBy: 'm-1', progress: 0.92 },
  { weekId: 'w-4', memberId: 'm-25', delta: 10, reasonCategory: 'Other', note: 'Configured automated weekly uptime health check notifications', createdBy: 'm-2', progress: 0.95 },

  // --- Week 5 (Dramatic surges: m-15 shoots to #1 with 160 pts, m-18 to #2 with 130 pts! Revert included) ---
  { weekId: 'w-5', memberId: 'm-15', delta: 60, reasonCategory: 'Escalation Handled', note: 'Single-handedly orchestrated emergency rollover during cloud outage', createdBy: 'm-1', progress: 0.08 },
  { weekId: 'w-5', memberId: 'm-15', delta: 50, reasonCategory: 'Bug Fix', note: 'Rewrote broken SQL query reducing DB CPU from 95% to 15%', createdBy: 'm-2', progress: 0.32 },
  { weekId: 'w-5', memberId: 'm-15', delta: 50, reasonCategory: 'Customer Feedback', note: 'Received glowing executive commendation from Fortune 500 partner', createdBy: 'm-3', progress: 0.65 }, // Total: 160 (Rank 1!)
  { weekId: 'w-5', memberId: 'm-18', delta: 50, reasonCategory: 'Ticket Resolved', note: 'Crushed team record by resolving 28 complex tickets in 3 days', createdBy: 'm-1', progress: 0.12 },
  { weekId: 'w-5', memberId: 'm-18', delta: 45, reasonCategory: 'Mentoring', note: 'Designed full-curriculum onboarding boot camp for Q4 recruits', createdBy: 'm-2', progress: 0.45 },
  { weekId: 'w-5', memberId: 'm-18', delta: 35, reasonCategory: 'Documentation Written', note: 'Authored 30-page architecture decision log for microservices', createdBy: 'm-3', progress: 0.75 }, // Total: 130 (Rank 2!)
  { weekId: 'w-5', memberId: 'm-6', delta: 50, reasonCategory: 'Escalation Handled', note: 'Resolved multi-region DNS propagation failure', createdBy: 'm-1', progress: 0.18 },
  { weekId: 'w-5', memberId: 'm-6', delta: 45, reasonCategory: 'Bug Fix', note: 'Fixed silent failure in background email dispatcher queue', createdBy: 'm-2', progress: 0.58 }, // Total: 95 (Rank 3)
  { weekId: 'w-5', memberId: 'm-4', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Resolved 15 tier-2 support issues', createdBy: 'm-3', progress: 0.2 },
  { weekId: 'w-5', memberId: 'm-4', delta: 35, reasonCategory: 'Mentoring', note: 'Conducted team office hours on TypeScript generics', createdBy: 'm-1', progress: 0.68 },
  { weekId: 'w-5', memberId: 'm-7', delta: 40, reasonCategory: 'Bug Fix', note: 'Fixed race condition in token refresh loop', createdBy: 'm-2', progress: 0.22 },
  { weekId: 'w-5', memberId: 'm-7', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Resolved 10 priority customer tickets', createdBy: 'm-3', progress: 0.62 },
  { weekId: 'w-5', memberId: 'm-8', delta: 35, reasonCategory: 'Documentation Written', note: 'Documented security baseline and IAM permission boundaries', createdBy: 'm-1', progress: 0.25 },
  { weekId: 'w-5', memberId: 'm-8', delta: 30, reasonCategory: 'Customer Feedback', note: 'Commended by client for prompt security audit assistance', createdBy: 'm-2', progress: 0.7 },
  { weekId: 'w-5', memberId: 'm-9', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Resolved 12 tickets regarding webhook payload validation', createdBy: 'm-3', progress: 0.28 },
  { weekId: 'w-5', memberId: 'm-10', delta: 30, reasonCategory: 'Escalation Handled', note: 'Assisted in resolving gateway 502 bad gateway spikes', createdBy: 'm-1', progress: 0.35 },
  { weekId: 'w-5', memberId: 'm-11', delta: 30, reasonCategory: 'Bug Fix', note: 'Corrected timezone calculation in scheduling cron jobs', createdBy: 'm-2', progress: 0.38 },
  { weekId: 'w-5', memberId: 'm-12', delta: 25, reasonCategory: 'Event Helped', note: 'Coordinated company-wide hackathon team logistics', createdBy: 'm-3', progress: 0.42 },
  { weekId: 'w-5', memberId: 'm-13', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Closed 9 challenging webhook subscription issues', createdBy: 'm-1', progress: 0.48 },
  { weekId: 'w-5', memberId: 'm-14', delta: 35, reasonCategory: 'Bug Fix', note: 'Fixed memory leak in server-sent events connection handler', createdBy: 'm-2', progress: 0.52 },
  // Member 16 erroneous entry and revert:
  { weekId: 'w-5', memberId: 'm-16', delta: 50, reasonCategory: 'Bug Fix', note: 'Award for performance optimization (incorrect member credited)', createdBy: 'm-1', progress: 0.5 },
  { weekId: 'w-5', memberId: 'm-16', delta: -50, reasonCategory: 'Bug Fix', note: 'Revert: Incorrect member credited for performance optimization', createdBy: 'm-1', progress: 0.53, revertsTargetIndex: 97 },
  { weekId: 'w-5', memberId: 'm-16', delta: 20, reasonCategory: 'Mentoring', note: 'Led onboarding walkthrough for new QA engineer', createdBy: 'm-3', progress: 0.6 },
  { weekId: 'w-5', memberId: 'm-17', delta: 25, reasonCategory: 'Documentation Written', note: 'Published guidelines on API backwards compatibility', createdBy: 'm-1', progress: 0.64 },
  { weekId: 'w-5', memberId: 'm-19', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Resolved 7 SSO SAML authentication tickets', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-5', memberId: 'm-20', delta: 25, reasonCategory: 'Other', note: 'Upgraded Node.js runtime across 12 staging microservices', createdBy: 'm-3', progress: 0.76 },
  { weekId: 'w-5', memberId: 'm-21', delta: 20, reasonCategory: 'Customer Feedback', note: 'Helped resolve tricky client SSO onboarding step', createdBy: 'm-1', progress: 0.8 },
  { weekId: 'w-5', memberId: 'm-22', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed date picker boundary check on leap year', createdBy: 'm-2', progress: 0.83 },
  { weekId: 'w-5', memberId: 'm-23', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Closed 5 basic report export queries', createdBy: 'm-3', progress: 0.86 },
  { weekId: 'w-5', memberId: 'm-24', delta: 15, reasonCategory: 'Other', note: 'Cleaned up outdated Docker containers from test cluster', createdBy: 'm-1', progress: 0.89 },
  { weekId: 'w-5', memberId: 'm-25', delta: 15, reasonCategory: 'Documentation Written', note: 'Wrote release notes for monthly platform update', createdBy: 'm-2', progress: 0.92 },

  // --- Week 6 (Last closed week; Top 3: m-10 #1, m-14 #2, m-4 #3; rewards pending!) ---
  { weekId: 'w-6', memberId: 'm-10', delta: 55, reasonCategory: 'Escalation Handled', note: 'Steered live disaster recovery during major upstream cloud outage', createdBy: 'm-1', progress: 0.08 },
  { weekId: 'w-6', memberId: 'm-10', delta: 45, reasonCategory: 'Ticket Resolved', note: 'Resolved 24 critical support escalations within 48 hours', createdBy: 'm-2', progress: 0.35 },
  { weekId: 'w-6', memberId: 'm-10', delta: 40, reasonCategory: 'Customer Feedback', note: 'Praised by enterprise director for zero data loss recovery', createdBy: 'm-3', progress: 0.7 }, // Total: 140 (Rank 1)
  { weekId: 'w-6', memberId: 'm-14', delta: 45, reasonCategory: 'Bug Fix', note: 'Squashed tricky concurrency bug in payment transaction processor', createdBy: 'm-1', progress: 0.12 },
  { weekId: 'w-6', memberId: 'm-14', delta: 40, reasonCategory: 'Mentoring', note: 'Led deep-dive architecture masterclass for 15 engineers', createdBy: 'm-2', progress: 0.45 },
  { weekId: 'w-6', memberId: 'm-14', delta: 30, reasonCategory: 'Documentation Written', note: 'Authored end-to-end distributed tracing specification', createdBy: 'm-3', progress: 0.75 }, // Total: 115 (Rank 2)
  { weekId: 'w-6', memberId: 'm-4', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Resolved 16 complex customer billing adjustment tickets', createdBy: 'm-1', progress: 0.15 },
  { weekId: 'w-6', memberId: 'm-4', delta: 35, reasonCategory: 'Bug Fix', note: 'Fixed broken search filtering logic for multi-byte characters', createdBy: 'm-2', progress: 0.5 },
  { weekId: 'w-6', memberId: 'm-4', delta: 25, reasonCategory: 'Other', note: 'Automated Slack alerts for critical SLA breaches', createdBy: 'm-3', progress: 0.8 }, // Total: 100 (Rank 3)
  { weekId: 'w-6', memberId: 'm-6', delta: 40, reasonCategory: 'Escalation Handled', note: 'Resolved production queue backlog during flash sale peak', createdBy: 'm-1', progress: 0.18 },
  { weekId: 'w-6', memberId: 'm-6', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Triaged 14 priority support queries', createdBy: 'm-2', progress: 0.62 },
  { weekId: 'w-6', memberId: 'm-5', delta: 35, reasonCategory: 'Documentation Written', note: 'Created developer onboarding checklist and handbook', createdBy: 'm-3', progress: 0.22 },
  { weekId: 'w-6', memberId: 'm-5', delta: 30, reasonCategory: 'Event Helped', note: 'Keynote host for CDC monthly demo day showcase', createdBy: 'm-1', progress: 0.65 },
  { weekId: 'w-6', memberId: 'm-7', delta: 35, reasonCategory: 'Bug Fix', note: 'Resolved race condition in WebSocket heartbeat disconnect', createdBy: 'm-2', progress: 0.25 },
  { weekId: 'w-6', memberId: 'm-7', delta: 25, reasonCategory: 'Mentoring', note: 'Pair-programming with frontend team on virtualized lists', createdBy: 'm-3', progress: 0.68 },
  { weekId: 'w-6', memberId: 'm-8', delta: 30, reasonCategory: 'Customer Feedback', note: 'Customer appreciation for fast turnaround on bug report', createdBy: 'm-1', progress: 0.28 },
  { weekId: 'w-6', memberId: 'm-8', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Closed 10 API integration issues', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-6', memberId: 'm-9', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Resolved 13 configuration issues for enterprise tenants', createdBy: 'm-3', progress: 0.3 },
  { weekId: 'w-6', memberId: 'm-9', delta: 15, reasonCategory: 'Bug Fix', note: 'Patched alignment issue on mobile responsive navigation', createdBy: 'm-1', progress: 0.74 },
  { weekId: 'w-6', memberId: 'm-11', delta: 30, reasonCategory: 'Documentation Written', note: 'Wrote step-by-step audit compliance playbook', createdBy: 'm-2', progress: 0.38 },
  { weekId: 'w-6', memberId: 'm-12', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Handled 8 database query slow-log tickets', createdBy: 'm-3', progress: 0.42 },
  { weekId: 'w-6', memberId: 'm-13', delta: 25, reasonCategory: 'Bug Fix', note: 'Fixed incorrect date formatting on PDF invoices', createdBy: 'm-1', progress: 0.48 },
  { weekId: 'w-6', memberId: 'm-15', delta: 25, reasonCategory: 'Customer Feedback', note: 'Positive feedback on reliable support for audit questions', createdBy: 'm-2', progress: 0.52 },
  { weekId: 'w-6', memberId: 'm-16', delta: 20, reasonCategory: 'Mentoring', note: 'Helped junior colleague debug complex SQL join query', createdBy: 'm-3', progress: 0.55 },
  { weekId: 'w-6', memberId: 'm-17', delta: 20, reasonCategory: 'Event Helped', note: 'Assisted in technical judging for hackathon projects', createdBy: 'm-1', progress: 0.58 },
  { weekId: 'w-6', memberId: 'm-18', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Closed 9 authentication edge-case tickets', createdBy: 'm-2', progress: 0.6 },
  { weekId: 'w-6', memberId: 'm-19', delta: 20, reasonCategory: 'Bug Fix', note: 'Fixed tooltip cut-off in overflow containers', createdBy: 'm-3', progress: 0.76 },
  { weekId: 'w-6', memberId: 'm-20', delta: 20, reasonCategory: 'Other', note: 'Refactored logging configuration to reduce storage costs', createdBy: 'm-1', progress: 0.78 },
  { weekId: 'w-6', memberId: 'm-21', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Resolved 7 webhook delivery failure tickets', createdBy: 'm-2', progress: 0.82 },
  { weekId: 'w-6', memberId: 'm-22', delta: 15, reasonCategory: 'Documentation Written', note: 'Added API example payloads in Postman collection', createdBy: 'm-3', progress: 0.85 },
  { weekId: 'w-6', memberId: 'm-23', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed color contrast issue on secondary buttons', createdBy: 'm-1', progress: 0.88 },
  { weekId: 'w-6', memberId: 'm-24', delta: 15, reasonCategory: 'Other', note: 'Organized shared UI component directory structure', createdBy: 'm-2', progress: 0.9 },
  { weekId: 'w-6', memberId: 'm-25', delta: 15, reasonCategory: 'Customer Feedback', note: 'Acknowledged by support lead for fast ticket response times', createdBy: 'm-3', progress: 0.94 },

  // --- Week 7 (Current Open Week; Active competition, realistic timestamps up to now, 1 revert pair) ---
  { weekId: 'w-7', memberId: 'm-5', delta: 45, reasonCategory: 'Escalation Handled', note: 'Swift resolution of critical CDN edge node failure', createdBy: 'm-1', progress: 0.05 },
  { weekId: 'w-7', memberId: 'm-5', delta: 40, reasonCategory: 'Bug Fix', note: 'Patched cache invalidation bug across edge workers', createdBy: 'm-2', progress: 0.35 },
  { weekId: 'w-7', memberId: 'm-5', delta: 25, reasonCategory: 'Documentation Written', note: 'Documented multi-region failover testing protocol', createdBy: 'm-3', progress: 0.7 }, // Total: 110 (Rank 1)
  { weekId: 'w-7', memberId: 'm-8', delta: 50, reasonCategory: 'Ticket Resolved', note: 'Resolved 20 priority customer onboarding tickets', createdBy: 'm-1', progress: 0.1 },
  { weekId: 'w-7', memberId: 'm-8', delta: 45, reasonCategory: 'Mentoring', note: 'Conducted interactive workshop on React Server Components', createdBy: 'm-2', progress: 0.45 }, // Total: 95 (Rank 2)
  { weekId: 'w-7', memberId: 'm-12', delta: 45, reasonCategory: 'Bug Fix', note: 'Resolved high-impact memory leak in background worker pool', createdBy: 'm-3', progress: 0.15 },
  { weekId: 'w-7', memberId: 'm-12', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Resolved 16 complex database query tickets', createdBy: 'm-1', progress: 0.55 }, // Total: 85 (Rank 3)
  { weekId: 'w-7', memberId: 'm-4', delta: 40, reasonCategory: 'Ticket Resolved', note: 'Handled 15 support inquiries for billing system update', createdBy: 'm-2', progress: 0.18 },
  { weekId: 'w-7', memberId: 'm-4', delta: 35, reasonCategory: 'Customer Feedback', note: 'Direct customer compliment for resolving urgent blocker', createdBy: 'm-3', progress: 0.65 }, // Total: 75
  { weekId: 'w-7', memberId: 'm-6', delta: 40, reasonCategory: 'Bug Fix', note: 'Fixed race condition in realtime websocket leaderboard updates', createdBy: 'm-1', progress: 0.2 },
  { weekId: 'w-7', memberId: 'm-6', delta: 30, reasonCategory: 'Ticket Resolved', note: 'Closed 11 tickets for API token management', createdBy: 'm-2', progress: 0.6 },
  { weekId: 'w-7', memberId: 'm-7', delta: 35, reasonCategory: 'Mentoring', note: 'Mentored team members on writing clean TypeScript contracts', createdBy: 'm-3', progress: 0.22 },
  { weekId: 'w-7', memberId: 'm-7', delta: 30, reasonCategory: 'Documentation Written', note: 'Updated API swagger specs and integration tests', createdBy: 'm-1', progress: 0.62 },
  { weekId: 'w-7', memberId: 'm-9', delta: 35, reasonCategory: 'Ticket Resolved', note: 'Resolved 12 tickets regarding customer SSO integration', createdBy: 'm-2', progress: 0.25 },
  { weekId: 'w-7', memberId: 'm-9', delta: 25, reasonCategory: 'Other', note: 'Optimized Docker build caching, cutting CI runtime by 40%', createdBy: 'm-3', progress: 0.68 },
  { weekId: 'w-7', memberId: 'm-10', delta: 30, reasonCategory: 'Escalation Handled', note: 'Handled minor escalation during platform dependency update', createdBy: 'm-1', progress: 0.28 },
  { weekId: 'w-7', memberId: 'm-10', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Resolved 8 user permissions tickets', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-7', memberId: 'm-11', delta: 30, reasonCategory: 'Bug Fix', note: 'Corrected rounding error in currency conversion display', createdBy: 'm-3', progress: 0.3 },
  { weekId: 'w-7', memberId: 'm-13', delta: 25, reasonCategory: 'Event Helped', note: 'Organized weekly developer standup and show & tell', createdBy: 'm-1', progress: 0.35 },
  { weekId: 'w-7', memberId: 'm-14', delta: 30, reasonCategory: 'Documentation Written', note: 'Wrote guide on setting up end-to-end Playwright tests', createdBy: 'm-2', progress: 0.38 },
  { weekId: 'w-7', memberId: 'm-15', delta: 25, reasonCategory: 'Customer Feedback', note: 'Client positive review on swift bug resolution', createdBy: 'm-3', progress: 0.42 },
  { weekId: 'w-7', memberId: 'm-16', delta: 25, reasonCategory: 'Ticket Resolved', note: 'Closed 9 report export tickets', createdBy: 'm-1', progress: 0.46 },
  { weekId: 'w-7', memberId: 'm-17', delta: 25, reasonCategory: 'Bug Fix', note: 'Fixed modal closing when clicking within datepicker calendar', createdBy: 'm-2', progress: 0.48 },
  { weekId: 'w-7', memberId: 'm-18', delta: 20, reasonCategory: 'Mentoring', note: 'Onboarded 2 incoming interns on testing practices', createdBy: 'm-3', progress: 0.52 },
  { weekId: 'w-7', memberId: 'm-19', delta: 20, reasonCategory: 'Other', note: 'Cleaned up stale git branches across frontend repositories', createdBy: 'm-1', progress: 0.56 },
  { weekId: 'w-7', memberId: 'm-20', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Resolved 6 webhook verification tickets', createdBy: 'm-2', progress: 0.58 },
  // Erroneous entry and revert in current week:
  { weekId: 'w-7', memberId: 'm-21', delta: 40, reasonCategory: 'Bug Fix', note: 'Bug fix reward mistakenly assigned to wrong repository', createdBy: 'm-1', progress: 0.6 },
  { weekId: 'w-7', memberId: 'm-21', delta: -40, reasonCategory: 'Bug Fix', note: 'Revert: Bug fix reward mistakenly assigned to wrong repository', createdBy: 'm-1', progress: 0.64, revertsTargetIndex: 168 },
  { weekId: 'w-7', memberId: 'm-21', delta: 25, reasonCategory: 'Documentation Written', note: 'Authored cheat sheet for Tailwind v4 utility migration', createdBy: 'm-3', progress: 0.75 },
  { weekId: 'w-7', memberId: 'm-22', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Resolved 7 customer configuration requests', createdBy: 'm-1', progress: 0.78 },
  { weekId: 'w-7', memberId: 'm-23', delta: 15, reasonCategory: 'Bug Fix', note: 'Patched form validation error on special characters in name field', createdBy: 'm-2', progress: 0.82 },
  { weekId: 'w-7', memberId: 'm-24', delta: 15, reasonCategory: 'Other', note: 'Set up ESLint rule to enforce motion/react imports', createdBy: 'm-3', progress: 0.86 },
  { weekId: 'w-7', memberId: 'm-25', delta: 15, reasonCategory: 'Customer Feedback', note: 'Customer praised thorough response in community forum', createdBy: 'm-1', progress: 0.9 },
  // Additional points to bring entry count well above 200:
  { weekId: 'w-2', memberId: 'm-13', delta: 20, reasonCategory: 'Ticket Resolved', note: 'Handled 7 user profile tickets', createdBy: 'm-1', progress: 0.4 },
  { weekId: 'w-2', memberId: 'm-14', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed tooltip display bug', createdBy: 'm-2', progress: 0.45 },
  { weekId: 'w-2', memberId: 'm-15', delta: 15, reasonCategory: 'Documentation Written', note: 'Updated FAQ section', createdBy: 'm-3', progress: 0.5 },
  { weekId: 'w-3', memberId: 'm-21', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Resolved 5 email delivery inquiries', createdBy: 'm-1', progress: 0.8 },
  { weekId: 'w-3', memberId: 'm-22', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed avatar upload preview crop', createdBy: 'm-2', progress: 0.82 },
  { weekId: 'w-3', memberId: 'm-23', delta: 10, reasonCategory: 'Other', note: 'Reindexed search documents', createdBy: 'm-3', progress: 0.85 },
  { weekId: 'w-3', memberId: 'm-24', delta: 10, reasonCategory: 'Customer Feedback', note: 'Assisted user with export filters', createdBy: 'm-1', progress: 0.87 },
  { weekId: 'w-3', memberId: 'm-25', delta: 10, reasonCategory: 'Documentation Written', note: 'Cleaned up wiki page formatting', createdBy: 'm-2', progress: 0.9 },
  { weekId: 'w-4', memberId: 'm-2', delta: 25, reasonCategory: 'Mentoring', note: 'Organized engineering book club session', createdBy: 'm-1', progress: 0.7 },
  { weekId: 'w-4', memberId: 'm-3', delta: 25, reasonCategory: 'Other', note: 'Evaluated open-source performance profiling tools', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-5', memberId: 'm-2', delta: 30, reasonCategory: 'Documentation Written', note: 'Wrote security vulnerability disclosure policy', createdBy: 'm-1', progress: 0.4 },
  { weekId: 'w-5', memberId: 'm-3', delta: 30, reasonCategory: 'Bug Fix', note: 'Optimized Docker multi-stage build caching', createdBy: 'm-1', progress: 0.42 },
  { weekId: 'w-6', memberId: 'm-2', delta: 35, reasonCategory: 'Event Helped', note: 'Coordinated company hackathon judging panels', createdBy: 'm-1', progress: 0.5 },
  { weekId: 'w-6', memberId: 'm-3', delta: 35, reasonCategory: 'Mentoring', note: 'Delivered technical presentation on event-driven architecture', createdBy: 'm-2', progress: 0.52 },
  { weekId: 'w-7', memberId: 'm-2', delta: 20, reasonCategory: 'Other', note: 'Automated weekly dependency audit alerts', createdBy: 'm-1', progress: 0.7 },
  { weekId: 'w-7', memberId: 'm-3', delta: 20, reasonCategory: 'Documentation Written', note: 'Authored security guidelines for third-party integrations', createdBy: 'm-2', progress: 0.72 },
  { weekId: 'w-6', memberId: 'm-13', delta: 15, reasonCategory: 'Other', note: 'Tested beta release on staging environment', createdBy: 'm-1', progress: 0.92 },
  { weekId: 'w-6', memberId: 'm-18', delta: 15, reasonCategory: 'Documentation Written', note: 'Updated database schema migration checklist', createdBy: 'm-2', progress: 0.93 },
  { weekId: 'w-5', memberId: 'm-10', delta: 20, reasonCategory: 'Mentoring', note: 'Guided new team member through first production deployment', createdBy: 'm-3', progress: 0.85 },
  { weekId: 'w-5', memberId: 'm-14', delta: 20, reasonCategory: 'Event Helped', note: 'Volunteered for developer meetup setup', createdBy: 'm-1', progress: 0.87 },
  { weekId: 'w-4', memberId: 'm-16', delta: 15, reasonCategory: 'Other', note: 'Automated Slack reminders for daily standup', createdBy: 'm-2', progress: 0.84 },
  { weekId: 'w-4', memberId: 'm-17', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Triaged 4 incoming customer support tickets', createdBy: 'm-3', progress: 0.86 },
  { weekId: 'w-7', memberId: 'm-15', delta: 20, reasonCategory: 'Mentoring', note: 'Held code review office hours for team members', createdBy: 'm-1', progress: 0.88 },
  { weekId: 'w-7', memberId: 'm-18', delta: 20, reasonCategory: 'Bug Fix', note: 'Fixed keyboard navigation trap in search dialog', createdBy: 'm-2', progress: 0.89 },
  { weekId: 'w-7', memberId: 'm-16', delta: 15, reasonCategory: 'Other', note: 'Refactored CSS class names to match design system', createdBy: 'm-3', progress: 0.91 },
  { weekId: 'w-7', memberId: 'm-17', delta: 15, reasonCategory: 'Ticket Resolved', note: 'Closed 4 urgent access permission requests', createdBy: 'm-1', progress: 0.92 },
  { weekId: 'w-7', memberId: 'm-19', delta: 15, reasonCategory: 'Documentation Written', note: 'Wrote user guide for new analytics reporting filters', createdBy: 'm-2', progress: 0.93 },
  { weekId: 'w-7', memberId: 'm-20', delta: 15, reasonCategory: 'Bug Fix', note: 'Fixed missing ellipsis on long team member names', createdBy: 'm-3', progress: 0.94 },
  { weekId: 'w-7', memberId: 'm-22', delta: 10, reasonCategory: 'Other', note: 'Audited unused npm packages from root workspace', createdBy: 'm-1', progress: 0.95 },
  { weekId: 'w-7', memberId: 'm-23', delta: 10, reasonCategory: 'Customer Feedback', note: 'Shared customer feedback summary with product team', createdBy: 'm-2', progress: 0.96 },
  { weekId: 'w-7', memberId: 'm-24', delta: 10, reasonCategory: 'Event Helped', note: 'Set up recording equipment for all-hands engineering demo', createdBy: 'm-3', progress: 0.97 },
  { weekId: 'w-7', memberId: 'm-25', delta: 10, reasonCategory: 'Ticket Resolved', note: 'Handled routine password reset requests', createdBy: 'm-1', progress: 0.98 },
];

export const SEED_POINT_ENTRIES: PointEntry[] = RAW_ENTRIES.map((r, index) => {
  const id = `e-${index + 1}`;
  const revertsId = r.revertsTargetIndex !== undefined ? `e-${r.revertsTargetIndex + 1}` : undefined;
  return {
    id,
    memberId: r.memberId,
    weekId: r.weekId,
    delta: r.delta,
    reasonCategory: r.reasonCategory,
    note: r.note,
    createdBy: r.createdBy,
    createdAt: timeInWeek(r.weekId, r.progress),
    link: r.link,
    revertsId,
  };
});

function getRewardDeliveredDate(weekId: string): string {
  const info = wInfo[weekId];
  // Delivered 12 hours after the week closed
  return new Date(info.endMs + 12 * 60 * 60 * 1000).toISOString();
}

export const SEED_REWARDS: Reward[] = [
  // Week 1 rewards (delivered) - Only 2 active participants
  {
    id: 'rew-1-1',
    weekId: 'w-1',
    memberId: 'm-4',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-1'),
    deliveredBy: 'm-1',
  },
  {
    id: 'rew-1-2',
    weekId: 'w-1',
    memberId: 'm-5',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-1'),
    deliveredBy: 'm-1',
  },

  // Week 2 rewards (delivered)
  {
    id: 'rew-2-1',
    weekId: 'w-2',
    memberId: 'm-6',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-2'),
    deliveredBy: 'm-1',
  },
  {
    id: 'rew-2-2',
    weekId: 'w-2',
    memberId: 'm-4',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-2'),
    deliveredBy: 'm-2',
  },
  {
    id: 'rew-2-3',
    weekId: 'w-2',
    memberId: 'm-8',
    place: 3,
    rewardType: '₹200 Amazon Voucher + Bronze Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-2'),
    deliveredBy: 'm-1',
  },

  // Week 3 rewards (delivered)
  {
    id: 'rew-3-1',
    weekId: 'w-3',
    memberId: 'm-7',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-3'),
    deliveredBy: 'm-1',
  },
  {
    id: 'rew-3-2',
    weekId: 'w-3',
    memberId: 'm-10',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-3'),
    deliveredBy: 'm-3',
  },
  {
    id: 'rew-3-3',
    weekId: 'w-3',
    memberId: 'm-5',
    place: 3,
    rewardType: '₹200 Amazon Voucher + Bronze Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-3'),
    deliveredBy: 'm-1',
  },

  // Week 4 rewards (delivered; Top 3 tie: m-7 and m-13 tied for rank 2!)
  {
    id: 'rew-4-1',
    weekId: 'w-4',
    memberId: 'm-9',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-4'),
    deliveredBy: 'm-1',
  },
  {
    id: 'rew-4-2',
    weekId: 'w-4',
    memberId: 'm-7',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-4'),
    deliveredBy: 'm-2',
  },
  {
    id: 'rew-4-3',
    weekId: 'w-4',
    memberId: 'm-13',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-4'),
    deliveredBy: 'm-1',
  },

  // Week 5 rewards (delivered; m-15 surge #1, m-18 surge #2, m-6 #3)
  {
    id: 'rew-5-1',
    weekId: 'w-5',
    memberId: 'm-15',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-5'),
    deliveredBy: 'm-1',
  },
  {
    id: 'rew-5-2',
    weekId: 'w-5',
    memberId: 'm-18',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-5'),
    deliveredBy: 'm-2',
  },
  {
    id: 'rew-5-3',
    weekId: 'w-5',
    memberId: 'm-6',
    place: 3,
    rewardType: '₹200 Amazon Voucher + Bronze Badge',
    status: 'delivered',
    deliveredAt: getRewardDeliveredDate('w-5'),
    deliveredBy: 'm-1',
  },

  // Week 6 rewards (PENDING - admin can mark as delivered!)
  {
    id: 'rew-6-1',
    weekId: 'w-6',
    memberId: 'm-10',
    place: 1,
    rewardType: '₹500 Amazon Voucher + Gold Badge',
    status: 'pending',
  },
  {
    id: 'rew-6-2',
    weekId: 'w-6',
    memberId: 'm-14',
    place: 2,
    rewardType: '₹300 Amazon Voucher + Silver Badge',
    status: 'pending',
  },
  {
    id: 'rew-6-3',
    weekId: 'w-6',
    memberId: 'm-4',
    place: 3,
    rewardType: '₹200 Amazon Voucher + Bronze Badge',
    status: 'pending',
  },
];
