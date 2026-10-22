import { CheckCircle2, CircleHelp, Clock, XCircle } from 'lucide-react';
import type { DoseDisplayStatus, RiskLevel } from '../../types';

const doseStyles: Record<DoseDisplayStatus, { label: string; cls: string; Icon: typeof Clock }> = {
  TAKEN: { label: 'Taken', cls: 'bg-taken-bg text-taken', Icon: CheckCircle2 },
  MISSED: { label: 'Missed', cls: 'bg-missed-bg text-missed', Icon: XCircle },
  UNCONFIRMED: { label: 'Unconfirmed', cls: 'bg-unconfirmed-bg text-unconfirmed', Icon: CircleHelp },
  UPCOMING: { label: 'Upcoming', cls: 'bg-upcoming-bg text-upcoming', Icon: Clock },
};

/** Status is always conveyed with an icon and a word, never by color alone. */
export function DoseStatusBadge({ status, size = 'md' }: { status: DoseDisplayStatus; size?: 'sm' | 'md' }) {
  const { label, cls, Icon } = doseStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cls} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      }`}
    >
      <Icon aria-hidden className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {label}
    </span>
  );
}

const riskStyles: Record<RiskLevel, { label: string; cls: string }> = {
  GOOD: { label: 'On track', cls: 'bg-taken-bg text-taken' },
  WARNING: { label: 'Watch', cls: 'bg-unconfirmed-bg text-unconfirmed' },
  HIGH_RISK: { label: 'Follow up', cls: 'bg-missed-bg text-missed' },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, cls } = riskStyles[level];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export const riskLabel = (level: RiskLevel) => riskStyles[level].label;
