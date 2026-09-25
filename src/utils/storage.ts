import type { Bench, InspectionStatusType } from '@/types';

const STORAGE_KEY = 'bench-archive-data';

const VALID_INSPECTION_STATUSES: InspectionStatusType[] = ['normal', 'needs_repair', 'decommissioned'];

/**
 * 兼容旧档案：缺少巡检字段时按「待巡检」处理（留空即可，由
 * getInspectionStatus 派生），绝不默认成停用；原有评分与体验记录保留。
 */
function migrateBench(raw: Partial<Bench> & { id: string }): Bench {
  const inspectionStatus = VALID_INSPECTION_STATUSES.includes(raw.inspectionStatus as InspectionStatusType)
    ? (raw.inspectionStatus as InspectionStatusType)
    : undefined;

  return {
    ...raw,
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
    rating: typeof raw.rating === 'number' && Number.isFinite(raw.rating) ? raw.rating : 0,
    review: typeof raw.review === 'string' ? raw.review : '',
    inspectionStatus,
    lastInspectionDate: raw.lastInspectionDate || null,
    nextInspectionDue: raw.nextInspectionDue || null,
  } as Bench;
}

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && item.id).map(migrateBench);
      }
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}
