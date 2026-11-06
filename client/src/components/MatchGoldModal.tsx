import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Heart, Star, Zap, RotateCcw, Globe, Eye, Sparkles } from 'lucide-react';

interface MatchGoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateGold?: () => void;
}

export const MatchGoldModal: React.FC<MatchGoldModalProps> = ({
  isOpen,
  onClose,
  onActivateGold
}) => {
  const perks = [
    {
      icon: <Eye className="w-5 h-5 text-amber-400" />,
      title: 'Xem ai đã thích bạn',
      desc: 'Biết trước ai đã thích bạn để ghép đôi ngay lập tức không cần chờ đợi.'
    },
    {
      icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />,
      title: 'Lượt Thích không giới hạn',
      desc: 'Quẹt bao nhiêu tùy thích, không giới hạn số lượt mỗi ngày.'
    },
    {
      icon: <Star className="w-5 h-5 text-sky-400 fill-sky-400" />,
      title: '5 lượt Siêu Thích mỗi tuần',
      desc: 'Tăng gấp 3 lần khả năng ghép đôi với những người bạn thực sự ấn tượng.'
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-400 fill-purple-400" />,
      title: '1 lượt Boost miễn phí mỗi tháng',
      desc: 'Đưa hồ sơ lên vị trí hàng đầu khu vực trong 30 phút để nhận nhiều tương hợp hơn.'
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-amber-400" />,
      title: 'Hoàn tác vô hạn',
      desc: 'Lấy lại người bạn vô tình quẹt nhầm bất cứ lúc nào.'
    },
    {
      icon: <Globe className="w-5 h-5 text-emerald-400" />,
      title: 'Hộ chiếu toàn cầu',
      desc: 'Kết nối và trò chuyện với mọi người ở bất cứ thành phố nào trên thế giới.'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#14171c] border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Glow decoration */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    Match Gold™
                  </h3>
                  <p className="text-xs text-neutral-400">Trải nghiệm hẹn hò cao cấp và không giới hạn</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Perks list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar relative z-10 pr-1">
              {perks.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-amber-500/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-neutral-800/90 flex items-center justify-center shrink-0 mt-0.5">
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                      {p.title}
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Footer */}
            <div className="pt-4 border-t border-neutral-800 relative z-10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onActivateGold) onActivateGold();
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-110 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Kích hoạt Match Gold VIP Miễn Phí</span>
              </button>
              <p className="text-[11px] text-center text-neutral-500">
                Gói mở rộng tài khoản thử nghiệm đặc quyền miễn phí dành cho thành viên Match
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
