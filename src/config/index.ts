export const CONFIG = {
  /** 0 = Sunday */
  WEEK_END_DAY: 0 as const,
  WEEK_END_TIME: '23:59:59',
  TIMEZONE: 'Asia/Kolkata',

  POLL_INTERVAL_MS: 30_000,

  /** Confirm dialog threshold for point adjustments */
  LARGE_ADJUSTMENT_THRESHOLD: 100,

  /** Whether to show the public activity feed to viewers */
  SHOW_PUBLIC_FEED: true,

  /** Reward definitions per podium place */
  REWARDS: {
    1: { type: 'voucher', label: '₹500 Amazon Voucher + Gold Badge' },
    2: { type: 'voucher', label: '₹300 Amazon Voucher + Silver Badge' },
    3: { type: 'voucher', label: '₹200 Amazon Voucher + Bronze Badge' },
  } as Record<number, { type: string; label: string }>,

  REASON_CATEGORIES: [
    'Ticket Resolved',
    'Escalation Handled',
    'Event Helped',
    'Documentation Written',
    'Mentoring',
    'Bug Fix',
    'Customer Feedback',
    'Other',
  ] as const,

  /** Spring animation defaults */
  SPRING: {
    stiffness: 300,
    damping: 28,
  },

  /** Urgency threshold in milliseconds (24 hours) */
  URGENCY_THRESHOLD_MS: 24 * 60 * 60 * 1000,
} as const;
