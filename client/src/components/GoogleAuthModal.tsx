import React, { useState } from 'react';
import axios from 'axios';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';
import type { UserProfile } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: UserProfile) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [userEmail, setUserEmail] = useState('trungtrungbadu@gmail.com');
  const [userName, setUserName] = useState('Trung Nguyễn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ĐĂNG NHẬP TRỰC TIẾP BẰNG TÀI KHOẢN GOOGLE VÀO NEO4J AURADB
  const handleGoogleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userEmail.trim()) {
      setError('Vui lòng nhập địa chỉ Gmail');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/google', {
        email: userEmail.trim().toLowerCase(),
        name: userName.trim() || userEmail.split('@')[0],
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
      });

      localStorage.setItem('tinder_token', res.data.token);
      onSuccess(res.data.token, res.data.user);
      onClose();
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      setError(err.response?.data?.error || 'Đăng nhập Google thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-[420px] bg-[#14171d] text-white border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGO GOOGLE CHÍNH HÃNG */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-lg shadow-white/10">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Đăng Nhập Bằng Google
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            để tiếp tục tới <span className="font-semibold text-rose-400">Tinder Web</span>
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM ĐĂNG NHẬP GOOGLE */}
        <form onSubmit={handleGoogleLogin} className="mt-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Tài khoản Gmail:
              </label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="vd: trungtrungbadu@gmail.com"
                className="w-full bg-[#0d0f12] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Tên hiển thị:
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full bg-[#0d0f12] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center gap-3 shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer mt-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tự động đồng bộ với CSDL Đồ thị Neo4j AuraDB</span>
        </div>

      </div>
    </div>
  );
};
