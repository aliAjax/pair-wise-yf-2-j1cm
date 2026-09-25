import type { Bench } from '@/types';

const STORAGE_KEY = 'bench-archive-data';

/**
 * 兼容旧档案：保留原有评分和体验记录，补齐缺失的容器字段。
 * 巡检字段不做填充——缺失时由 getInspectionStatus 按「待巡检」处理。
 */
function normalizeBench(raw: Bench): Bench {
  return {
    ...raw,
    rating: typeof raw.rating === 'number' ? raw.rating : 3,
    review: typeof raw.review === 'string' ? raw.review : '',
    experiences: Array.isArray(raw.experiences) ? raw.experiences : [],
  };
}

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeBench);
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
