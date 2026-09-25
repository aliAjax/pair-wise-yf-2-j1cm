import { CircleCheck, ClipboardCheck, Wrench, Ban, AlertTriangle } from 'lucide-react';
import type { Bench } from '@/types';
import {
  DERIVED_INSPECTION_LABELS,
  getInspectionStatus,
  getInspectionBadgeClass,
  isInspectionOverdue,
} from '@/utils/inspection';
import type { DerivedInspectionStatus } from '@/utils/inspection';

const STATUS_ICONS: Record<DerivedInspectionStatus, typeof ClipboardCheck> = {
  normal: CircleCheck,
  pending: ClipboardCheck,
  needs_repair: Wrench,
  decommissioned: Ban,
};

interface InspectionBadgeProps {
  bench: Bench;
  /** 是否附带「需要处理」「已逾期」标记 */
  showMarkers?: boolean;
}

export default function InspectionBadge({ bench, showMarkers = true }: InspectionBadgeProps) {
  const status = getInspectionStatus(bench);
  const StatusIcon = STATUS_ICONS[status];
  const overdue = isInspectionOverdue(bench);

  return (
    <>
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${getInspectionBadgeClass(status)}`}
      >
        <StatusIcon className="w-3 h-3" />
        {DERIVED_INSPECTION_LABELS[status]}
      </span>
      {showMarkers && status === 'needs_repair' && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-md">
          <Wrench className="w-3 h-3" />
          需要处理
        </span>
      )}
      {showMarkers && overdue && (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 text-xs rounded-md">
          <AlertTriangle className="w-3 h-3" />
          已逾期
        </span>
      )}
    </>
  );
}
