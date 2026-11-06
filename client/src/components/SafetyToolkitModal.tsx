import React, { useState } from 'react';
import {
  Flag, ShieldCheck, Settings, ArrowLeft, CheckCircle, Shield
} from 'lucide-react';

interface SafetyToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyToolkitModal: React.FC<SafetyToolkitModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'report' | 'tips' | 'controls'>('menu');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Cài đặt điều khiển tin nhắn
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);

  if (!isOpen) return null;

  const handleReset = () => {
    setActiveTab('menu');
    setReportReason('');
    setReportSubmitted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReportSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-[380px] bg-[#16181d] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
        {/* 1. MÀN HÌNH MENU CHÍNH (Khớp 100% ảnh chụp Bộ Công Cụ An Toàn của người dùng) */}
        {activeTab === 'menu' && (
          <div>
            <div className="py-4 px-6 text-center border-b border-neutral-800/80">
              <h3 className="text-base font-bold text-white tracking-wide">
                Bộ Công Cụ An Toàn
              </h3>
            </div>

            <div className="divide-y divide-neutral-800/80 text-xs font-bold tracking-wider">
              {/* 1. BÁO CÁO (Cờ đỏ) */}
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="w-full py-4 px-6 flex items-center gap-3.5 hover:bg-neutral-800/50 transition-colors text-left text-neutral-100 cursor-pointer"
              >
                <Flag className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                <span>BÁO CÁO</span>
              </button>

              {/* 2. BÍ QUYẾT AN TOÀN (Khiên xanh) */}
              <button
                type="button"
                onClick={() => setActiveTab('tips')}
                className="w-full py-4 px-6 flex items-center gap-3.5 hover:bg-neutral-800/50 transition-colors text-left text-neutral-100 cursor-pointer"
              >
                <Shield className="w-5 h-5 text-sky-400 fill-sky-400/20" />
                <span>BÍ QUYẾT AN TOÀN</span>
              </button>

              {/* 3. ĐIỀU KHIỂN TIN NHẮN (Bánh răng) */}
              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className="w-full py-4 px-6 flex items-center gap-3.5 hover:bg-neutral-800/50 transition-colors text-left text-neutral-100 cursor-pointer"
              >
                <Settings className="w-5 h-5 text-neutral-400" />
                <span>ĐIỀU KHIỂN TIN NHẮN</span>
              </button>
            </div>

            {/* NÚT HỦY DƯỚI ĐÁY */}
            <div className="border-t border-neutral-800/80">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 text-center text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800/40 transition-colors cursor-pointer"
              >
                HỦY
              </button>
            </div>
          </div>
        )}

        {/* 2. SUB-VIEW: BÁO CÁO */}
        {activeTab === 'report' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('menu')}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
                <Flag className="w-4 h-4 fill-rose-500" /> Gửi Báo Cáo An Toàn
              </h4>
            </div>

            {reportSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">Đã tiếp nhận báo cáo của bạn!</p>
                <p className="text-[11px] text-neutral-400">
                  Đội ngũ an toàn Tinder sẽ xem xét và xử lý trong vòng 24 giờ.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <p className="text-xs text-neutral-300">
                  Hãy cho chúng tôi biết vấn đề bạn gặp phải:
                </p>
                <div className="space-y-1.5">
                  {[
                    'Hồ sơ giả mạo hoặc mạo danh người khác',
                    'Nội dung quấy rối hoặc tin nhắn khiếm nhã',
                    'Hành vi lừa đảo hoặc gửi link nguy hiểm',
                    'Người dùng chưa đủ 18 tuổi',
                    'Hành vi nguy hiểm ngoài đời thực'
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReportReason(item)}
                      className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all ${
                        reportReason === item
                          ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                          : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="flex-1 py-2 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason}
                    className="flex-1 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    Gửi báo cáo
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. SUB-VIEW: BÍ QUYẾT AN TOÀN */}
        {activeTab === 'tips' && (
          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('menu')}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Bí Quyết An Toàn Khi Hẹn Hò
              </h4>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <h5 className="font-bold text-white">💰 Không gửi tiền hoặc thông tin tài chính</h5>
                <p className="text-[11px] text-neutral-400">
                  Tuyệt đối không chuyển tiền, thẻ nạp, tiền điện tử hoặc số tài khoản ngân hàng cho bất kỳ ai trên ứng dụng.
                </p>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <h5 className="font-bold text-white">☕ Gặp gỡ ở nơi công cộng</h5>
                <p className="text-[11px] text-neutral-400">
                  Lần hẹn đầu tiên hãy luôn chọn quán cà phê, nhà hàng đông người. Tự chủ phương tiện đi lại của mình.
                </p>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <h5 className="font-bold text-white">👥 Báo cho bạn bè hoặc người thân</h5>
                <p className="text-[11px] text-neutral-400">
                  Nói với người quen về địa điểm, thời gian và thông tin của người bạn sắp gặp.
                </p>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                <h5 className="font-bold text-white">✔ Nhận diện tích xanh xác minh</h5>
                <p className="text-[11px] text-neutral-400">
                  Ưu tiên tương hợp với hồ sơ có dấu Tích Xanh chính chủ được xác thực bằng video selfie.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className="w-full py-2.5 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer text-center"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* 4. SUB-VIEW: ĐIỀU KHIỂN TIN NHẮN */}
        {activeTab === 'controls' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <button
                onClick={() => setActiveTab('menu')}
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-sm text-neutral-200 flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Điều Khiển Tin Nhắn & Bảo Vệ
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white">Tự động lọc từ ngữ khiếm nhã</h5>
                  <p className="text-[11px] text-neutral-400">Ẩn tin nhắn quấy rối hoặc xúc phạm</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfanityFilter(!profanityFilter)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${
                    profanityFilter ? 'bg-rose-500 justify-end' : 'bg-neutral-700 justify-start'
                  } flex items-center`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white">Chỉ nhận từ tài khoản Tích Xanh</h5>
                  <p className="text-[11px] text-neutral-400">Giới hạn tin nhắn từ người đã xác minh</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${
                    verifiedOnly ? 'bg-rose-500 justify-end' : 'bg-neutral-700 justify-start'
                  } flex items-center`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white">Cảnh báo an toàn thông minh</h5>
                  <p className="text-[11px] text-neutral-400">Cảnh báo khi tin nhắn có dấu hiệu lừa đảo</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSafetyAlerts(!safetyAlerts)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${
                    safetyAlerts ? 'bg-rose-500 justify-end' : 'bg-neutral-700 justify-start'
                  } flex items-center`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className="w-full py-2.5 text-xs rounded-xl bg-neutral-800 hover:bg-neutral-700 font-semibold cursor-pointer text-center"
            >
              Lưu & Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
