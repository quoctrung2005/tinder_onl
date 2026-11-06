import React, { useState } from 'react';
import {
  X, Sliders, Flame, Sparkles, Target, Compass, MapPin,
  RefreshCw, Check, Zap, ShieldCheck
} from 'lucide-react';

export interface GraphTuningParams {
  wInterest: number;
  wGoal: number;
  wLifestyle: number;
  wLocation: number;
  minScore: number;
  minAge: number;
  maxAge: number;
}

interface GraphTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: GraphTuningParams;
  onApplyParams: (params: GraphTuningParams) => void;
}

export const GraphTunerModal: React.FC<GraphTunerModalProps> = ({
  isOpen,
  onClose,
  currentParams,
  onApplyParams
}) => {
  const [params, setParams] = useState<GraphTuningParams>(currentParams);
  const [activePreset, setActivePreset] = useState<string>('balanced');

  if (!isOpen) return null;

  const handleApplyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === 'balanced') {
      setParams((prev) => ({
        ...prev,
        wInterest: 40,
        wGoal: 25,
        wLifestyle: 15,
        wLocation: 20,
        minScore: 0
      }));
    } else if (presetName === 'jaccard') {
      setParams((prev) => ({
        ...prev,
        wInterest: 60,
        wGoal: 20,
        wLifestyle: 10,
        wLocation: 10,
        minScore: 70
      }));
    } else if (presetName === 'goal') {
      setParams((prev) => ({
        ...prev,
        wInterest: 20,
        wGoal: 50,
        wLifestyle: 15,
        wLocation: 15,
        minScore: 65
      }));
    } else if (presetName === 'location') {
      setParams((prev) => ({
        ...prev,
        wInterest: 15,
        wGoal: 15,
        wLifestyle: 10,
        wLocation: 60,
        minScore: 0
      }));
    }
  };

  const handleSave = () => {
    onApplyParams(params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#111418] border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1c1412] to-[#141820] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Bộ Điều Khiển Thuật Toán Gợi Ý Neo4j
              </h2>
              <p className="text-xs text-neutral-400">
                Tuỳ biến trọng số tính toán độ tương hợp theo nhu cầu thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0d0f12]">
          
          {/* CÁC GÓI CHIẾN LƯỢC GỢI Ý NHANH (PRESETS) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Chiến Lược Gợi Ý Thông Minh
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('balanced')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePreset === 'balanced'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cân Bằng Đa Chiều
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Đồ thị chuẩn kết hợp cả 4 tiêu chí hài hòa (Khuyên dùng)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('jaccard')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePreset === 'jaccard'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                  <Flame className="w-3.5 h-3.5" />
                  Tâm Đầu Ý Hợp (Jaccard)
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Ưu tiên 60% cho người có nhiều sở thích chung trên đồ thị
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('goal')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePreset === 'goal'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-rose-300">
                  <Target className="w-3.5 h-3.5" />
                  Hẹn Hò Nghiêm Túc
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Ưu tiên 50% cho người cùng mục tiêu tìm bạn đời lâu dài
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('location')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  activePreset === 'location'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                  <MapPin className="w-3.5 h-3.5" />
                  Gần Tôi Nhất
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Ưu tiên 60% cho người cùng thành phố, cự ly gần
                </div>
              </button>
            </div>
          </div>

          {/* CÁC THANH TRƯỢT TRỌNG SỐ THỜI GIAN THỰC */}
          <div className="space-y-4 pt-2 border-t border-neutral-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Tuỳ Chỉnh Trọng Số Chi Tiết (Tổng 100%)
              </label>
              <span className="text-xs font-black text-amber-400">
                {params.wInterest + params.wGoal + params.wLifestyle + params.wLocation}%
              </span>
            </div>

            {/* Slider 1: Sở thích Jaccard */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>☕</span> Trọng số Sở thích chung (Jaccard Index)
                </span>
                <span className="font-bold text-amber-400">{params.wInterest}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="5"
                value={params.wInterest}
                onChange={(e) => {
                  setActivePreset('custom');
                  setParams({ ...params, wInterest: Number(e.target.value) });
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Slider 2: Mục đích hẹn hò */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" /> Trọng số Mục đích quan hệ
                </span>
                <span className="font-bold text-rose-400">{params.wGoal}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={params.wGoal}
                onChange={(e) => {
                  setActivePreset('custom');
                  setParams({ ...params, wGoal: Number(e.target.value) });
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Slider 3: Lối sống */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-400" /> Trọng số Thói quen sống & Pet
                </span>
                <span className="font-bold text-purple-400">{params.wLifestyle}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={params.wLifestyle}
                onChange={(e) => {
                  setActivePreset('custom');
                  setParams({ ...params, wLifestyle: Number(e.target.value) });
                }}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Slider 4: Vị trí địa lý */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Trọng số Vị trí địa lý
                </span>
                <span className="font-bold text-emerald-400">{params.wLocation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={params.wLocation}
                onChange={(e) => {
                  setActivePreset('custom');
                  setParams({ ...params, wLocation: Number(e.target.value) });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* BỘ LỌC ĐỘ TƯƠNG HỢP TỐI THIỂU */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Lọc Ngưỡng Tương Hợp Tối Thiểu
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Tất cả (0%)', value: 0 },
                { label: '>= 70%', value: 70 },
                { label: '>= 80% (Siêu match)', value: 80 },
                { label: '>= 90% (Đỉnh)', value: 90 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParams({ ...params, minScore: opt.value })}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                    params.minScore === opt.value
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ĐỘ TUỔI TÌM KIẾM */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-neutral-300">Độ tuổi gợi ý:</span>
              <span className="text-amber-400 font-bold">{params.minAge} - {params.maxAge} tuổi</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="18"
                max="50"
                value={params.minAge}
                onChange={(e) => setParams({ ...params, minAge: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
              <span className="text-xs text-neutral-500">đến</span>
              <input
                type="range"
                min="18"
                max="60"
                value={params.maxAge}
                onChange={(e) => setParams({ ...params, maxAge: Number(e.target.value) })}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-[#141820] border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleApplyPreset('balanced')}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>ÁP DỤNG THUẬT TOÁN</span>
          </button>
        </div>

      </div>
    </div>
  );
};
