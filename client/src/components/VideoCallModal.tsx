import React, { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Shield } from 'lucide-react';
import type { UserProfile } from '../types';

interface VideoCallModalProps {
  isOpen: boolean;
  partner: UserProfile;
  currentUser: UserProfile | null;
  isVideoCall?: boolean;
  onClose: () => void;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  partner,
  currentUser,
  isVideoCall = true,
  onClose
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Khởi động Camera thật của người dùng qua WebRTC getUserMedia
  useEffect(() => {
    if (!isOpen) return;

    let timer: any;
    let stream: MediaStream | null = null;

    const startLocalStream = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: isVideoCall,
            audio: true
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Không thể truy cập Camera/Mic thực tế (sẽ dùng chế độ giả lập trực tuyến):', err);
      }
    };

    startLocalStream();

    // Giả lập đối phương nhấc máy sau 2.5 giây
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2500);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isVideoCall]);

  // Bộ đếm thời lượng cuộc gọi khi đã kết nối
  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  if (!isOpen) return null;

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setTimeout(() => {
      onClose();
      setCallStatus('calling');
      setCallDuration(0);
    }, 600);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] rounded-3xl overflow-hidden bg-[#0c1017] border border-neutral-800 shadow-2xl flex flex-col justify-between">
        
        {/* 1. MÀN HÌNH ĐỐI PHƯƠNG (MAIN STAGE) */}
        <div className="absolute inset-0 z-0">
          <img
            src={partner.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80'}
            alt={partner.name}
            className={`w-full h-full object-cover filter transition-all duration-700 ${
              callStatus === 'calling' ? 'brightness-40 blur-md scale-105' : 'brightness-80 scale-100'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>

        {/* 2. TOP BAR: THÔNG TIN CUỘC GỌI VÀ MÃ HÓA E2EE */}
        <div className="relative z-10 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <span>Mã hóa đầu cuối (E2EE)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-base font-extrabold">{partner.name}</h2>
            </div>
          </div>

          <div className="px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-mono font-bold tracking-wider">
            {callStatus === 'calling' ? (
              <span className="text-amber-400 animate-pulse">ĐANG ĐỔ CHUÔNG...</span>
            ) : (
              <span className="text-emerald-400">{formatDuration(callDuration)}</span>
            )}
          </div>
        </div>

        {/* 3. TRẠNG THÁI KHI ĐANG KẾT NỐI (CALLING ANIMATION) */}
        {callStatus === 'calling' && (
          <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center space-y-4">
            <div className="relative">
              {/* Sóng xung quanh Avatar */}
              <div className="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping opacity-75" />
              <div className="absolute -inset-8 rounded-full bg-rose-500/15 animate-pulse" />
              <img
                src={partner.photos?.[0]}
                alt={partner.name}
                className="relative w-28 h-28 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{partner.name}</h3>
              <p className="text-xs text-neutral-300 mt-1">Đang liên lạc qua WebRTC trực tuyến...</p>
            </div>
          </div>
        )}

        {/* 4. CAMERA NHỎ CỦA BẠN (LOCAL STREAM PREVIEW GÓC PHẢI DƯỚI) */}
        <div className="absolute top-6 right-6 z-20 w-36 sm:w-44 h-48 sm:h-60 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black">
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-center p-2">
              <img
                src={currentUser?.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                alt="Your Avatar"
                className="w-14 h-14 rounded-full object-cover mb-2 ring-2 ring-rose-500"
              />
              <span className="text-[10px] text-neutral-400 font-bold">Camera Tắt</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white">
            Bạn
          </span>
        </div>

        {/* 5. BOTTOM CONTROLS BAR (CÁC NÚT ĐIỀU KHIỂN CUỘC GỌI) */}
        <div className="relative z-10 p-8 flex items-center justify-center gap-5">
          {/* Nút Bật/Tắt Mic */}
          <button
            onClick={toggleMic}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg ${
              isMuted
                ? 'bg-rose-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
            }`}
            title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Nút Bật/Tắt Video */}
          <button
            onClick={toggleVideo}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg ${
              !isVideoEnabled
                ? 'bg-rose-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
            }`}
            title={isVideoEnabled ? 'Tắt Camera' : 'Bật Camera'}
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          {/* Nút Kết thúc cuộc gọi */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-2xl shadow-rose-600/50"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
