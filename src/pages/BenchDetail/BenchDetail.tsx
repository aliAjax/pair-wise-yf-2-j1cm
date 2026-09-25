import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Sun,
  Volume2,
  Clock,
  Armchair,
  Compass,
  Edit3,
  Trash2,
  Sunrise,
  Sunset,
  Moon,
  CloudSun,
  ClipboardCheck,
  Wrench,
  Ban,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import {
  MATERIAL_LABELS,
  ORIENTATION_LABELS,
  SHADE_LABELS,
  NOISE_LABELS,
  STAY_DURATION_LABELS,
  TIME_PERIOD_LABELS,
} from '@/types';
import type { TimePeriodType } from '@/types';
import Rating from '@/components/Rating/Rating';
import { calculateComfortScore, getComfortLevel, getComfortColor } from '@/utils/comfort';
import {
  EFFECTIVE_INSPECTION_STATUS_LABELS,
  formatInspectionDate,
  getInspectionBadgeClass,
  getInspectionStatus,
  isInspectionOverdue,
} from '@/utils/inspection';
import type { EffectiveInspectionStatus } from '@/utils/inspection';

const inspectionStatusIcons: Record<EffectiveInspectionStatus, typeof ClipboardCheck> = {
  normal: ClipboardCheck,
  pending: ClipboardCheck,
  'needs-repair': Wrench,
  decommissioned: Ban,
};

export default function BenchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBenchById, deleteBench, updateBench, initialize, initialized } = useBenchStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingInspection, setEditingInspection] = useState(false);
  const [inspectionForm, setInspectionForm] = useState<{
    inspectionStatus: EffectiveInspectionStatus;
    lastInspectionDate: string;
    nextInspectionDue: string;
  }>({ inspectionStatus: 'pending', lastInspectionDate: '', nextInspectionDue: '' });

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const bench = id ? getBenchById(id) : undefined;

  useEffect(() => {
    if (bench === undefined && initialized) {
      navigate('/');
    }
  }, [bench, initialized, navigate]);

  if (!bench) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-ink-light">加载中...</p>
        </div>
      </div>
    );
  }

  const comfortScore = calculateComfortScore(bench);
  const comfortLevel = getComfortLevel(comfortScore);
  const comfortColor = getComfortColor(comfortScore);

  const inspectionStatus = getInspectionStatus(bench);
  const inspectionOverdue = isInspectionOverdue(bench);
  const InspectionStatusIcon = inspectionStatusIcons[inspectionStatus];

  const startEditInspection = () => {
    setInspectionForm({
      inspectionStatus,
      lastInspectionDate: bench.lastInspectionDate?.slice(0, 10) ?? '',
      nextInspectionDue: bench.nextInspectionDue?.slice(0, 10) ?? '',
    });
    setEditingInspection(true);
  };

  const saveInspection = () => {
    updateBench(bench.id, {
      // 「待巡检」表示尚未录入巡检信息，清空显式状态而不是写入新状态
      inspectionStatus:
        inspectionForm.inspectionStatus === 'pending' ? undefined : inspectionForm.inspectionStatus,
      lastInspectionDate: inspectionForm.lastInspectionDate || undefined,
      nextInspectionDue: inspectionForm.nextInspectionDue || undefined,
    });
    setEditingInspection(false);
  };

  const timePeriodIcons: Record<TimePeriodType, typeof Sunrise> = {
    morning: Sunrise,
    noon: Sun,
    afternoon: CloudSun,
    evening: Sunset,
    night: Moon,
  };

  const sortedExperiences = [...bench.experiences].sort((a, b) => {
    const order: TimePeriodType[] = ['morning', 'noon', 'afternoon', 'evening', 'night'];
    return order.indexOf(a.timePeriod) - order.indexOf(b.timePeriod);
  });

  const handleDelete = () => {
    if (id) {
      deleteBench(id);
      navigate('/');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-ink-light hover:text-deep-brown mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="paper-texture rounded-xl shadow-paper overflow-hidden fade-in opacity-0 stagger-1">
            <div className="h-48 bg-gradient-to-br from-warm-cream via-warm-beige to-moss-green/10 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white/60 flex items-center justify-center backdrop-blur-sm">
                  <Armchair className="w-14 h-14 text-moss-green/60" />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h1 className="font-serif text-2xl font-bold text-deep-brown">
                      {bench.name}
                    </h1>
                    {inspectionStatus !== 'normal' && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getInspectionBadgeClass(inspectionStatus)}`}
                      >
                        <InspectionStatusIcon className="w-3 h-3" />
                        {EFFECTIVE_INSPECTION_STATUS_LABELS[inspectionStatus]}
                      </span>
                    )}
                    {inspectionOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        已逾期
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-ink-light">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{bench.location}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold font-serif ${comfortColor}`}>
                    {comfortScore}
                  </div>
                  <div className="text-sm text-ink-light">{comfortLevel}</div>
                </div>
              </div>

              <div className="h-2 bg-warm-beige rounded-full mb-6 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    comfortScore >= 4 ? 'bg-moss-green' :
                    comfortScore >= 3 ? 'bg-ochre' :
                    'bg-ink-light'
                  }`}
                  style={{ width: `${(comfortScore / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-moss-green/5 rounded-lg">
                  <Sun className="w-5 h-5 text-moss-green mx-auto mb-1" />
                  <div className="text-xs text-ink-light mb-0.5">遮阴</div>
                  <div className="text-sm font-medium text-deep-brown">
                    {SHADE_LABELS[bench.shadeLevel]}
                  </div>
                </div>
                <div className="text-center p-3 bg-ochre/5 rounded-lg">
                  <Volume2 className="w-5 h-5 text-ochre mx-auto mb-1" />
                  <div className="text-xs text-ink-light mb-0.5">噪音</div>
                  <div className="text-sm font-medium text-deep-brown">
                    {NOISE_LABELS[bench.noiseLevel]}
                  </div>
                </div>
                <div className="text-center p-3 bg-moss-green/5 rounded-lg">
                  <Armchair className="w-5 h-5 text-moss-green mx-auto mb-1" />
                  <div className="text-xs text-ink-light mb-0.5">靠背</div>
                  <div className="text-sm font-medium text-deep-brown">
                    {bench.hasBackrest ? '有' : '无'}
                  </div>
                </div>
                <div className="text-center p-3 bg-ochre/5 rounded-lg">
                  <Compass className="w-5 h-5 text-ochre mx-auto mb-1" />
                  <div className="text-xs text-ink-light mb-0.5">朝向</div>
                  <div className="text-sm font-medium text-deep-brown">
                    {ORIENTATION_LABELS[bench.orientation]}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6 p-4 bg-warm-cream/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-light">材质</span>
                  <span className="text-sm font-medium text-deep-brown">
                    {MATERIAL_LABELS[bench.material]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-ink-light" />
                  <span className="text-sm text-ink-light">适合停留</span>
                  <span className="text-sm font-medium text-deep-brown">
                    {STAY_DURATION_LABELS[bench.stayDuration]}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-serif font-semibold text-deep-brown mb-2">个人评价</h3>
                <p className="text-ink-light leading-relaxed">{bench.review}</p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-deep-brown/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-light">评分</span>
                  <Rating value={bench.rating} readOnly />
                </div>

                <div className="flex-1" />

                <button
                  onClick={() => navigate(`/edit/${bench.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-moss-green hover:bg-moss-green/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-deep-brown">
                巡检信息
              </h2>
              {!editingInspection && (
                <button
                  onClick={startEditInspection}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-moss-green hover:bg-moss-green/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  更新巡检
                </button>
              )}
            </div>

            {editingInspection ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-deep-brown mb-1.5">
                    巡检状态
                  </label>
                  <select
                    value={inspectionForm.inspectionStatus}
                    onChange={(e) =>
                      setInspectionForm((prev) => ({
                        ...prev,
                        inspectionStatus: e.target.value as EffectiveInspectionStatus,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white cursor-pointer"
                  >
                    {Object.entries(EFFECTIVE_INSPECTION_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-brown mb-1.5">
                    检查日期
                  </label>
                  <input
                    type="date"
                    value={inspectionForm.lastInspectionDate}
                    onChange={(e) =>
                      setInspectionForm((prev) => ({ ...prev, lastInspectionDate: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-deep-brown mb-1.5">
                    下次到期日
                  </label>
                  <input
                    type="date"
                    value={inspectionForm.nextInspectionDue}
                    onChange={(e) =>
                      setInspectionForm((prev) => ({ ...prev, nextInspectionDue: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingInspection(false)}
                    className="flex-1 px-4 py-2 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveInspection}
                    className="flex-1 px-4 py-2 text-sm text-white bg-moss-green hover:bg-moss-light rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getInspectionBadgeClass(inspectionStatus)}`}
                  >
                    <InspectionStatusIcon className="w-3.5 h-3.5" />
                    {EFFECTIVE_INSPECTION_STATUS_LABELS[inspectionStatus]}
                  </span>
                  {inspectionStatus === 'needs-repair' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      需要处理
                    </span>
                  )}
                  {inspectionOverdue && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      已逾期
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-light">检查日期</span>
                    <span className="text-deep-brown">
                      {formatInspectionDate(bench.lastInspectionDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-light">下次到期日</span>
                    <span className={inspectionOverdue ? 'text-red-500 font-medium' : 'text-deep-brown'}>
                      {formatInspectionDate(bench.nextInspectionDue)}
                    </span>
                  </div>
                </div>

                {inspectionOverdue && (
                  <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-500 leading-relaxed">
                    巡检已逾期，请尽快安排检查并更新巡检信息。
                  </div>
                )}
                {inspectionStatus === 'needs-repair' && (
                  <div className="mt-4 p-3 bg-ochre/5 border border-ochre/20 rounded-lg text-xs text-ochre leading-relaxed">
                    该长椅待维修，需要处理；维修完成后请更新巡检状态。
                  </div>
                )}
                {inspectionStatus === 'decommissioned' && (
                  <div className="mt-4 p-3 bg-ink-light/5 border border-ink-light/20 rounded-lg text-xs text-ink-light leading-relaxed">
                    该长椅已停用：不再参与舒适度排行，历史体验仍可查看，停用期间不能新增体验记录。
                  </div>
                )}
                {inspectionStatus === 'pending' && (
                  <div className="mt-4 p-3 bg-ochre/5 border border-ochre/20 rounded-lg text-xs text-ochre leading-relaxed">
                    尚未记录巡检信息，点击「更新巡检」补充检查日期和状态。
                  </div>
                )}
              </>
            )}
          </div>

          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-3">
            <h2 className="font-serif text-lg font-semibold text-deep-brown mb-4">
              分时段体验
            </h2>

            {sortedExperiences.length > 0 ? (
              <div className="space-y-4">
                {sortedExperiences.map((experience) => {
                  const TimeIcon = timePeriodIcons[experience.timePeriod];
                  return (
                    <div
                      key={experience.id}
                      className="p-4 bg-warm-cream/50 rounded-lg hover:bg-warm-cream transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TimeIcon className="w-4 h-4 text-ochre" />
                          <span className="font-medium text-deep-brown text-sm">
                            {TIME_PERIOD_LABELS[experience.timePeriod]}
                          </span>
                        </div>
                        <Rating value={experience.rating} readOnly size="sm" />
                      </div>
                      <p className="text-sm text-ink-light leading-relaxed">
                        {experience.notes}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-moss-green/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-moss-green/50" />
                </div>
                <p className="text-sm text-ink-light">
                  还没有分时段体验记录
                </p>
                <p className="text-xs text-ink-light/60 mt-1">
                  {inspectionStatus === 'decommissioned'
                    ? '长椅已停用，停用期间不能新增体验'
                    : '编辑长椅时可以添加'}
                </p>
              </div>
            )}
          </div>

          <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-4">
            <h3 className="font-serif text-sm font-semibold text-deep-brown mb-3">
              档案信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-light">创建时间</span>
                <span className="text-deep-brown">
                  {new Date(bench.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-light">更新时间</span>
                <span className="text-deep-brown">
                  {new Date(bench.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-light">时段记录</span>
                <span className="text-deep-brown">{bench.experiences.length} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="paper-texture rounded-xl shadow-paper-hover p-6 max-w-sm w-full fade-in">
            <h3 className="font-serif text-lg font-semibold text-deep-brown mb-2">
              确认删除
            </h3>
            <p className="text-ink-light text-sm mb-6">
              确定要删除这张长椅的档案吗？此操作无法撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
