import React, { useState } from 'react';
import axios from 'axios';
import { X, Check, Sparkles, CreditCard, QrCode } from 'lucide-react';
import type { UserProfile } from '../types';

interface VipCheckoutModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

const PACKAGES = [
  {
    id: 'GOLD',
    name: 'Match Gold™',
    price: 199000,
    priceLabel: '199.000 đ',
    duration: '1 Tháng',
    badge: 'Phổ biến nhất',
    features: [
      'Xem ai đã thích bạn (Likes You) không bị mờ ảnh',
      'Lượt thích không giới hạn (Unlimited Likes)',
      '1 Lượt Tăng tốc Boost miễn phí mỗi tháng',
      '5 Siêu thích (Super Likes) mỗi tuần',
      'Hộ chiếu Match Passport™ quẹt thẻ toàn cầu',
      'Hồi lại lượt quẹt thẻ (Rewind) không giới hạn'
    ],
    bgGradient: 'from-amber-500/20 via-rose-500/10 to-amber-500/20',
    borderColor: 'border-amber-400',
    btnGradient: 'from-amber-500 to-rose-500 text-neutral-950 font-black'
  },
  {
    id: 'PLATINUM',
    name: 'Match Platinum™',
    price: 399000,
    priceLabel: '399.000 đ',
    duration: '1 Tháng',
    badge: 'Đặc quyền Tối Thượng',
    features: [
      'Bao gồm toàn bộ đặc quyền Match Gold™',
      'Ưu tiên hiển thị lượt thích (Priority Likes)',
      'Đính kèm tin nhắn vào Super Like trước khi match',
      'Xem lại các lượt thích đã gửi trong 7 ngày qua'
    ],
    bgGradient: 'from-slate-700/30 via-neutral-800/40 to-slate-700/30',
    borderColor: 'border-slate-400',
    btnGradient: 'from-slate-200 to-neutral-300 text-neutral-950 font-black'
  },
  {
    id: 'PLUS',
    name: 'Match Plus®',
    price: 99000,
    priceLabel: '99.000 đ',
    duration: '1 Tháng',
    badge: 'Tiết kiệm',
    features: [
      'Lượt thích không giới hạn',
      'Hồi lại lượt quẹt thẻ không giới hạn',
      'Hộ chiếu Match Passport™'
    ],
    bgGradient: 'from-rose-500/15 via-neutral-900 to-rose-500/15',
    borderColor: 'border-rose-500/50',
    btnGradient: 'from-rose-600 to-pink-600 text-white font-bold'
  }
];

export const VipCheckoutModal: React.FC<VipCheckoutModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0]);
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY'>('MOMO');
  const [step, setStep] = useState<'select' | 'qr' | 'success'>('select');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tinder_token');
      await axios.post('http://localhost:5000/api/users/upgrade-vip', {
        packageType: selectedPkg.id,
        paymentMethod: paymentMethod,
        amount: selectedPkg.price
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (currentUser) {
        const updated = {
          ...currentUser,
          is_gold: true,
          vip_level: selectedPkg.id
        };
        onSuccess(updated);
      }

      setStep('success');
    } catch (err: any) {
      alert('Lỗi kích hoạt VIP: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl rounded-3xl bg-[#111418] border border-neutral-800 shadow-2xl p-6 text-white relative overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'select' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center mx-auto mb-2 text-neutral-950 shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 fill-neutral-950" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Nâng Cấp Match VIP</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Mở khóa mọi đặc quyền hẹn hò độc quyền số 1 thế giới</p>
            </div>

            {/* Danh sách 3 gói */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPkg.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? `${pkg.borderColor} bg-gradient-to-b ${pkg.bgGradient} shadow-lg scale-102`
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 block w-fit mb-2">
                        {pkg.badge}
                      </span>
                      <h3 className="font-extrabold text-sm">{pkg.name}</h3>
                      <div className="text-base font-black text-amber-300 mt-1">{pkg.priceLabel}</div>
                      <span className="text-[10px] text-neutral-400">/{pkg.duration}</span>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-[10px] text-neutral-300">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-neutral-400 block mb-2">Phương thức thanh toán</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOMO')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'MOMO'
                      ? 'border-pink-500 bg-pink-500/15 text-pink-300'
                      : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-pink-500" />
                  <span>Ví MoMo QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('VNPAY')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'VNPAY'
                      ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                      : 'border-neutral-800 hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>VNPay / Thẻ ATM</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('qr')}
              className={`w-full py-3.5 rounded-full bg-gradient-to-r ${selectedPkg.btnGradient} transition-all hover:scale-102 active:scale-98 shadow-xl cursor-pointer text-sm`}
            >
              Tiếp tục thanh toán ({selectedPkg.priceLabel})
            </button>
          </div>
        )}

        {/* STEP 2: MÃ QR THANH TOÁN (VIETQR / MOMO) */}
        {step === 'qr' && (
          <div className="text-center space-y-4 py-2">
            <h3 className="text-lg font-black">Quét Mã QR Để Thanh Toán</h3>
            <p className="text-xs text-neutral-400">
              Sử dụng ứng dụng {paymentMethod === 'MOMO' ? 'MoMo' : 'Ngân hàng / VNPay'} để quét mã bên dưới:
            </p>

            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MATCH_VIP_${selectedPkg.id}_${selectedPkg.price}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-neutral-900 rounded-2xl text-xs space-y-1 max-w-sm mx-auto border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">Gói nâng cấp:</span>
                <span className="font-bold text-amber-300">{selectedPkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Số tiền:</span>
                <span className="font-bold text-white">{selectedPkg.priceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Mã giao dịch:</span>
                <span className="font-mono text-neutral-300">TNDR_{Math.floor(Math.random() * 899999 + 100000)}</span>
              </div>
            </div>

            <div className="flex gap-3 max-w-sm mx-auto">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-bold cursor-pointer"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                {loading ? 'Đang kích hoạt...' : 'Tôi Đã Thanh Toán'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: THÀNH CÔNG */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Nâng Cấp Thành Công!</h3>
            <p className="text-xs text-neutral-300 max-w-sm mx-auto">
              Chúc mừng bạn đã gia nhập thành viên VIP. Toàn bộ tính năng độc quyền của <strong className="text-amber-300">{selectedPkg.name}</strong> đã sẵn sàng!
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Bắt đầu trải nghiệm ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
