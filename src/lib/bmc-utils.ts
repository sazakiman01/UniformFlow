import { Period } from '@/types';

/**
 * Normalize an amount with a given period to a monthly amount.
 * - month → as-is
 * - quarter → ÷ 3
 * - year → ÷ 12
 */
export function normalizeToMonthly(amount: number, period: Period | undefined): number {
  if (!amount) return 0;
  switch (period) {
    case 'quarter':
      return amount / 3;
    case 'year':
      return amount / 12;
    case 'month':
    default:
      return amount;
  }
}

export function normalizeToYearly(amount: number, period: Period | undefined): number {
  return normalizeToMonthly(amount, period) * 12;
}

export const PERIOD_LABELS: Record<Period, string> = {
  month: 'รายเดือน',
  quarter: 'รายไตรมาส',
  year: 'รายปี',
};

export function formatTHB(value: number, options: { compact?: boolean } = {}): string {
  if (!isFinite(value)) return '0';
  if (options.compact) {
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
