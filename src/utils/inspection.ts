import type { Bench, InspectionStatusType } from '@/types';
import { INSPECTION_STATUS_LABELS } from '@/types';

/**
 * 巡检有效状态：三种显式状态之外，缺少巡检字段的旧档案按「待巡检」处理。
 */
export type EffectiveInspectionStatus = InspectionStatusType | 'pending';

export const EFFECTIVE_INSPECTION_STATUS_LABELS: Record<EffectiveInspectionStatus, string> = {
  ...INSPECTION_STATUS_LABELS,
  pending: '待巡检',
};

export function getInspectionStatus(bench: Bench): EffectiveInspectionStatus {
  return bench.inspectionStatus ?? 'pending';
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 下次到期日已过（不含到期日当天）即为逾期；停用长椅不再参与巡检，不提示逾期。
 */
export function isInspectionOverdue(bench: Bench, today: Date = new Date()): boolean {
  if (getInspectionStatus(bench) === 'decommissioned') return false;
  const due = bench.nextInspectionDue?.slice(0, 10);
  if (!due) return false;
  return due < toLocalDateString(today);
}

/**
 * 列表排序权重：正常 / 待巡检在前，待维修靠后，停用垫底。
 */
export function getInspectionSortRank(bench: Bench): number {
  const status = getInspectionStatus(bench);
  if (status === 'needs-repair') return 1;
  if (status === 'decommissioned') return 2;
  return 0;
}

export function formatInspectionDate(dateStr?: string): string {
  if (!dateStr) return '未记录';
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${y}年${m}月${d}日`;
}

export function getInspectionBadgeClass(status: EffectiveInspectionStatus): string {
  switch (status) {
    case 'normal':
      return 'bg-moss-green/10 text-moss-green';
    case 'pending':
      return 'bg-ochre/10 text-ochre';
    case 'needs-repair':
      return 'bg-red-500/10 text-red-500';
    case 'decommissioned':
      return 'bg-ink-light/10 text-ink-light';
  }
}
