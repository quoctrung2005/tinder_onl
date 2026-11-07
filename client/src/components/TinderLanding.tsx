import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { Heart, Sparkles, Shield, Cpu, MessageCircle } from 'lucide-react';
import type { UserProfile } from '../types';
import { AuthModal } from './AuthModal';
import { GoogleAuthModal } from './GoogleAuthModal';
import { AntigravityCanvas } from './AntigravityCanvas';

interface TinderLandingProps {
  onAuthSuccess: (token: string, user: UserProfile) => void;
}

export const TinderLanding: React.FC<TinderLandingProps> = ({ onAuthSuccess }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [loadingGoogle] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-3d-title',
        { opacity: 0, y: 45, rotateX: 25, transformPerspective: 1000 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.gsap-3d-btn',
        { opacity: 0, y: 25, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)', delay: 0.25 }
      );
      gsap.fromTo(
        '.gsap-3d-feature',
        { opacity: 0, y: 35, rotateY: 15, transformPerspective: 800 },
        { opacity: 1, y: 0, rotateY: 0, duration: 0.85, stagger: 0.12, ease: 'power2.out', delay: 0.45 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const openRegister = () => {
    setAuthMode('register');
    setIsAuthOpen(true);
  };

  const openLogin = () => {
    setAuthMode('login');
    setIsAuthOpen(true);
  };

  const handleGoogleLogin = () => {
    setError('');
    setIsGoogleModalOpen(true);
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoadingDemo(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'user@tinder.com',
        password: 'password123'
      });
      localStorage.setItem('tinder_token', res.data.token);
      onAuthSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi đăng nhập tài khoản mẫu');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-black text-white select-none flex flex-col justify-between">
      {/* ẢNH NỀN ATMOSPHERIC ROMANTIC VỚI GRADIENT OVERLAY */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1522264879685-61266b0cf9eb?auto=format&fit=crop&w=2000&q=80"
          alt="Tinder Background"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/75" />
      </div>

      {/* HIỆU ỨNG ANTIGRAVITY PARTICLE CANVAS (CHUẨN REPO DAVIDPELAYO) */}
      <AntigravityCanvas
        particleCount={45}
        gravity={-0.035}
        speed={0.7}
        shape="mixed"
        className="absolute inset-0 pointer-events-none z-1"
      />

      {/* 1. TOP HEADER (CHUẨN TINDER.COM) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* LOGO MATCH NGHỆ THUẬT VỚI TYPOGRAPHY SYNE & BIỂU TƯỢNG TRÁI TIM NEON */}
        <div className="flex items-center gap-3 group cursor-pointer">
          {/* Biểu tượng Trái Tim Nghệ Thuật 3D */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 opacity-75 blur-md group-hover:opacity-100 transition duration-300 animate-pulse" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff2a5f] via-[#ff4081] to-[#ff7a45] p-[1.5px] shadow-2xl">
              <div className="w-full h-full rounded-[14px] bg-[#110e15]/90 backdrop-blur-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#ff2a5f] fill-[#ff2a5f] drop-shadow-[0_0_12px_rgba(255,42,95,0.9)] transform group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          {/* Chữ 'match' Typography Nghệ Thuật */}
          <div className="flex items-baseline select-none">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-[-0.05em] font-['Syne',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              match
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#ff2a5f] to-[#ff7a45] ml-1 shadow-[0_0_12px_#ff2a5f] animate-pulse" />
          </div>
        </div>

        {/* NÚT ĐĂNG NHẬP Ở HEADER & NÚT ADMIN CONSOLE */}
        <div className="flex items-center gap-3">
          
          <span className="hidden sm:inline-block text-xs font-semibold text-neutral-300">
            Tiếng Việt
          </span>
          <button
            onClick={openLogin}
            className="px-6 py-2 rounded-full bg-white text-black font-extrabold text-sm hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
          >
            Đăng nhập
          </button>
        </div>
      </header>

      {/* 2. HERO CONTENT Ở TRUNG TÂM (GSAP 3D PERSPECTIVE ANIMATION) */}
      <main ref={heroRef} className="relative z-10 max-w-3xl mx-auto px-6 text-center my-auto py-12 flex flex-col items-center">
        <h1 className="gsap-3d-title text-5xl sm:text-7xl font-black tracking-tight leading-[1.08] mb-6 drop-shadow-xl will-change-transform">
          Quẹt Phải.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-400 to-amber-400">
            Kết Đôi.
          </span>{' '}
          Hẹn Hò.
        </h1>

        <p className="gsap-3d-title text-sm sm:text-base text-neutral-300 font-medium max-w-xl mx-auto mb-8 drop-shadow-md">
          Ứng dụng hẹn hò trực tuyến chuẩn đồ án môn học với thuật toán gợi ý tương hợp đa nhân tố kết nối Cơ sở dữ liệu Đồ thị <strong className="text-white font-bold">Neo4j AuraDB</strong> và Nhắn tin thời gian thực.
        </p>

        {error && (
          <div className="mb-4 px-4 py-2 bg-rose-600/20 border border-rose-500 text-rose-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* KHỐI NÚT HÀNH ĐỘNG CHÍNH */}
        <div className="w-full max-w-sm space-y-3.5">
          {/* Nút 1: Tạo tài khoản (Đăng ký) */}
          <button
            onClick={openRegister}
            className="gsap-3d-btn w-full py-4 rounded-full bg-gradient-to-r from-[#ea1d45] via-[#fd267a] to-[#ff6036] hover:opacity-95 text-white font-black text-base shadow-[0_8px_25px_rgba(234,29,69,0.5)] transition-all hover:scale-102 active:scale-95 cursor-pointer uppercase tracking-wider will-change-transform"
          >
            Tạo tài khoản mới
          </button>

          {/* Nút 2: Tiếp tục với Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="gsap-3d-btn w-full py-3.5 px-6 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all hover:scale-102 active:scale-95 shadow-md cursor-pointer will-change-transform"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loadingGoogle ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
          </button>

          {/* Nút 3: 1-Click Đăng nhập Demo (Giảng viên / Báo cáo) */}
          <button
            onClick={handleDemoLogin}
            disabled={loadingDemo}
            className="gsap-3d-btn w-full py-3 rounded-full border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm will-change-transform"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loadingDemo ? 'Đang đăng nhập demo...' : '1-Click Đăng nhập Demo (user@tinder.com)'}</span>
          </button>
        </div>

        {/* 3 ĐIỂM NỔI BẬT ĐỒ ÁN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-2xl text-left">
          <div className="gsap-3d-feature p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 will-change-transform">
            <Cpu className="w-5 h-5 text-rose-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Graph Database Neo4j</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Phân tích Jaccard Similarity trên node sở thích và lối sống.</p>
          </div>

          <div className="gsap-3d-feature p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 will-change-transform">
            <MessageCircle className="w-5 h-5 text-sky-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Realtime Chat 1-1</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Socket.io trao đổi tin nhắn, ảnh GIF và thông báo Match tức thì.</p>
          </div>

          <div className="gsap-3d-feature p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-neutral-800 will-change-transform">
            <Shield className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-xs font-bold text-white">Xác minh & Bảo mật</h4>
            <p className="text-[11px] text-neutral-400 mt-1">Chụp selfie nhận tích xanh, chế độ toàn cầu và chặn danh bạ.</p>
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="relative z-10 w-full py-5 text-center border-t border-neutral-900/80 bg-black/60 backdrop-blur-sm text-xs text-neutral-500">
        © 2026 Tinder Web Clone • Đồ án môn học Cơ sở dữ liệu Đồ thị Neo4j & Fullstack React/Node.js
      </footer>

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(token, user) => {
          setIsAuthOpen(false);
          onAuthSuccess(token, user);
        }}
      />

      {/* MODAL ĐĂNG NHẬP GOOGLE CHÍNH HÃNG */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(token, user) => {
          setIsGoogleModalOpen(false);
          onAuthSuccess(token, user);
        }}
      />
    </div>
  );
};
