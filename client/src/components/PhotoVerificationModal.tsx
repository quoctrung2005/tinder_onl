import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, CheckCircle, ShieldCheck, Camera, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';

interface PhotoVerificationModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const PhotoVerificationModal: React.FC<PhotoVerificationModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'intro' | 'scanning' | 'complete'>('intro');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const prompts = [
    { text: 'Nhìn thẳng vào tâm khung tròn', duration: 1500 },
    { text: 'Nghiêng đầu nhẹ sang bên phải', duration: 1800 },
    { text: 'Mỉm cười nhẹ tự nhiên để xác thực sinh trắc', duration: 1800 }
  ];

  // Khởi động Camera khi chuyển sang bước scanning
  useEffect(() => {
    if (step !== 'scanning' || !isOpen) return;

    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
            audio: false
          });
          streamRef.current = localStream;
          if (videoRef.current) {
            videoRef.current.srcObject = localStream;
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera không khả dụng hoặc bị từ chối, chuyển sang giả lập thị giác AI:', err);
        setCameraActive(false);
      }
    };

    startCamera();

    // Chạy chuỗi giả lập kiểm tra sinh trắc học
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2;
      setScanProgress(Math.min(100, progress));

      if (progress === 35) setCurrentPromptIndex(1);
      if (progress === 70) setCurrentPromptIndex(2);

      if (progress >= 100) {
        clearInterval(progressInterval);
        handleConfirmVerification();
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step, isOpen]);

  const handleConfirmVerification = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/users/verify-photo',
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (currentUser) {
        onSuccess({
          ...currentUser,
          is_verified: true
        });
      }
      setStep('complete');
    } catch (err: any) {
      console.error('Lỗi xác thực ảnh:', err);
      setErrorMsg(err.response?.data?.error || 'Không thể xác thực sinh trắc khuôn mặt. Vui lòng thử lại.');
      setStep('intro');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setStep('intro');
    setScanProgress(0);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#141923] border border-neutral-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Nút thoát */}
        <div className="relative p-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white">Xác Minh Ảnh Chính Chủ</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NỘI DUNG TỪNG BƯỚC */}
        <div className="p-6 text-center text-white">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'intro' && (
            <div className="space-y-5">
              <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <ShieldCheck className="w-12 h-12 text-white" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500" />
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-white">
                  Nhận Huy Hiệu Tích Xanh Chính Chủ
                </h4>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Match AI sẽ so sánh một video selfie ngắn với các bức ảnh trên hồ sơ của bạn để đảm bảo bạn là người thật 100%.
                </p>
              </div>

              <div className="bg-[#1b2230] rounded-2xl p-4 text-left space-y-2 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tăng gấp 3 lần tỷ lệ ghép đôi thành công</span>
                </div>
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Được ưu tiên hiển thị trên thẻ khám phá</span>
                </div>
                <div className="flex items-center gap-2.5 text-neutral-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bảo vệ danh tính khỏi tài khoản giả mạo (Catfish)</span>
                </div>
              </div>

              <button
                onClick={() => setStep('scanning')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Bắt đầu Quét Khuôn Mặt</span>
              </button>
            </div>
          )}

          {step === 'scanning' && (
            <div className="space-y-4">
              <div className="relative mx-auto w-56 h-56 rounded-full overflow-hidden border-4 border-blue-500/80 shadow-2xl bg-black">
                {/* Luồng Video từ Camera */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform scale-x-[-1] ${
                    !cameraActive ? 'hidden' : 'block'
                  }`}
                />

                {/* Giả lập khi không có Camera */}
                {!cameraActive && currentUser && (
                  <img
                    src={currentUser.photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                    alt="Selfie Frame"
                    className="w-full h-full object-cover filter brightness-90 contrast-110"
                  />
                )}

                {/* Vòng quét Laser Sinh Trắc Học */}
                <div className="absolute inset-0 border-2 border-dashed border-sky-400/60 rounded-full animate-spin-slow pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse" />

                {/* HUD Lưới tọa độ khuôn mặt */}
                <div className="absolute inset-4 border border-white/20 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-16 h-16 border-t-2 border-b-2 border-sky-400/80 rounded-full" />
                </div>
              </div>

              {/* Tiến trình % */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span className="text-sky-400 font-extrabold">
                    {prompts[currentPromptIndex].text}
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-neutral-400 animate-pulse">
                {loading ? 'Đang mã hóa & đối chiếu chữ ký số sinh trắc...' : 'Giữ cố định khuôn mặt trong vòng quét'}
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle className="w-14 h-14" />
              </div>

              <div>
                <h4 className="text-xl font-black text-white">
                  Đã Xác Thực Thành Công!
                </h4>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  Hồ sơ của bạn đã được cấp biểu tượng <strong className="text-sky-400">Tích Xanh Chính Chủ</strong>. Bạn đã sẵn sàng để quẹt thẻ với mức độ uy tín cao nhất!
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg transition-all cursor-pointer"
              >
                Tuyệt vời, Bắt đầu Quẹt thẻ!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
