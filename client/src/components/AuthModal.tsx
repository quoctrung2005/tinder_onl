import React, { useState } from 'react';
import axios from 'axios';
import { Heart, X, Lock, Mail, User, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';
import { GoogleAuthModal } from './GoogleAuthModal';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (token: string, user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('user@tinder.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState('MALE');
  const [city, setCity] = useState('Hồ Chí Minh');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  React.useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        localStorage.setItem('tinder_token', res.data.token);
        onSuccess(res.data.token, res.data.user);
        onClose();
      } else {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
          email,
          password,
          name: name.trim() || 'Người dùng mới',
          age,
          gender,
          pref_gender: gender === 'MALE' ? ['FEMALE'] : ['MALE'],
          bio: 'Thành viên mới của Match ✨ Tìm kiếm tình yêu đích thực.',
          city,
          photos: [
            gender === 'MALE'
              ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
          ],
          interests: ['Cà phê', 'Du lịch', 'Âm nhạc', 'Nhiếp ảnh']
        });
        localStorage.setItem('tinder_token', res.data.token);
        onSuccess(res.data.token, res.data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    setIsGoogleModalOpen(true);
  };

  const handleAdminLogin = async () => {
    setEmail('admin@match.com');
    setPassword('admin123');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@match.com',
        password: 'admin123'
      });
      localStorage.setItem('tinder_token', res.data.token);
      onSuccess(res.data.token, res.data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi đăng nhập tài khoản Admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('user@match.com');
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'user@match.com',
        password: 'password123'
      });
      localStorage.setItem('tinder_token', res.data.token);
      onSuccess(res.data.token, res.data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi đăng nhập tài khoản mẫu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 opacity-70 blur-sm animate-pulse" />
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff2a5f] to-[#ff7a45] p-[1.5px] shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-[#141218] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#ff2a5f] fill-[#ff2a5f] drop-shadow-[0_0_8px_rgba(255,42,95,0.8)]" />
                </div>
              </div>
            </div>
            <span className="text-3xl font-extrabold tracking-[-0.05em] font-['Syne',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-300">
              match<span className="text-rose-500">.</span>
            </span>
          </div>
          <h2 className="text-xl font-bold">
            {isLogin ? 'Đăng nhập vào Match' : 'Tạo tài khoản Match mới'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Khởi đầu tình yêu mới cùng Match</p>
        </div>

        {/* TAB CHUYỂN ĐỔI: ĐĂNG NHẬP | TẠO TÀI KHOẢN */}
        <div className="flex p-1 bg-slate-800/80 rounded-2xl mb-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLogin
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isLogin
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tạo tài khoản mới
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Tuổi</label>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Thành phố</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="Hồ Chí Minh">TP.HCM</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@tinder.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 font-bold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        {/* Nút đăng nhập Google & Test nhanh */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-center space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full border border-neutral-700 bg-neutral-800 hover:bg-neutral-750 text-white font-semibold text-xs flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer hover:border-neutral-600"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDemoLogin}
              type="button"
              className="py-2.5 px-3 rounded-2xl border border-rose-500/40 hover:bg-rose-500/10 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Đăng nhập tài khoản User để vào quẹt thẻ và chat"
            >
              <Sparkles className="w-3.5 h-3.5" /> 👤 User Demo
            </button>
            <button
              onClick={handleAdminLogin}
              type="button"
              className="py-2.5 px-3 rounded-2xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Đăng nhập tài khoản Admin để vào Dashboard quản trị"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 🛡️ Admin Demo
            </button>
          </div>

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer pt-1 block w-full"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại Đăng nhập'}
          </button>
        </div>
      </div>

      {/* MODAL GOOGLE CHÍNH HÃNG */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(token, user) => {
          setIsGoogleModalOpen(false);
          onClose();
          onSuccess(token, user);
        }}
      />
    </div>
  );
};
