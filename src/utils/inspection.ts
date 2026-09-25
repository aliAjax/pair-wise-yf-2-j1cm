import type { Bench, InspectionStatusType } from '@/types';
import { INSPECTION_STATUS_LABELS } from '@/types';

/**
 * 派生巡检状态：在存储状态（正常/待维修/停用）之外，
 * 缺少巡检字段的旧档案会被识别为「待巡检」，而不是停用。
 */
export type DerivedInspectionStatus = InspectionStatusType | 'pending';

export const DERIVED_INSPECTION_LABELS: Record<DerivedInspectionStatus, string> = {
  ...INSPECTION_STATUS_LABELS,
  pending: '待巡检',
};

export function getInspectionStatus(bench: Bench): DerivedInspectionStatus {
  if (bench.inspectionStatus === 'decommissioned') return 'decommissioned';
  if (bench.inspectionStatus === 'needs_repair') return 'needs_repair';
  // 正常状态但从未巡检（含缺少巡检字段的旧档案）→ 待巡检
  if (!bench.lastInspectionDate) return 'pending';
  return 'normal';
}

function parseDateOnly(value: string): Date {
  // 按本地日期解析 'YYYY-MM-DD'，避免时区导致的偏差
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function isInspectionOverdue(bench: Bench): boolean {
  if (getInspectionStatus(bench) === 'decommissioned') return false;
  if (!bench.nextInspectionDue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDateOnly(bench.nextInspectionDue).getTime() < today.getTime();
}

/**
 * 列表排序分组：正常/待巡检在前，待维修靠后，停用垫底。
 */
export function getInspectionSortGroup(bench: Bench): number {
  const status = getInspectionStatus(bench);
  if (status === 'needs_repair') return 1;
  if (status === 'decommissioned') return 2;
  return 0;
}

export function compareByInspection(a: Bench, b: Bench): number {
  const groupDiff = getInspectionSortGroup(a) - getInspectionSortGroup(b);
  if (groupDiff !== 0) return groupDiff;

  // 同组内逾期的排在前面，提醒尽快处理
  const overdueDiff = Number(isInspectionOverdue(b)) - Number(isInspectionOverdue(a));
  if (overdueDiff !== 0) return overdueDiff;

  // 再按到期日升序，无到期日的排最后
  const dueA = a.nextInspectionDue ? parseDateOnly(a.nextInspectionDue).getTime() : Infinity;
  const dueB = b.nextInspectionDue ? parseDateOnly(b.nextInspectionDue).getTime() : Infinity;
  return dueA - dueB;
}

export function getInspectionBadgeClass(status: DerivedInspectionStatus): string {
  switch (status) {
    case 'normal':
      return 'bg-moss-green/10 text-moss-green';
    case 'pending':
      return 'bg-ochre/10 text-ochre';
    case 'needs_repair':
      return 'bg-red-500/10 text-red-500';
    case 'decommissioned':
      return 'bg-ink-light/10 text-ink-light';
  }
}

export function formatInspectionDate(value?: string | null): string {
  if (!value) return '未记录';
  return parseDateOnly(value).toLocaleDateString('zh-CN');
}
