import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import type { UserProfile } from '../types';
import { Heart, Send, Sparkles } from 'lucide-react';
import { AntigravityCanvas } from './AntigravityCanvas';

interface MatchModalProps {
  currentUser: UserProfile | null;
  matchedUser: UserProfile | null;
  onClose: () => void;
  onStartChat: (user: UserProfile) => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  currentUser,
  matchedUser,
  onClose,
  onStartChat
}) => {
  const modalBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!matchedUser || !modalBoxRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-match-title',
        { scale: 0.3, rotateX: 45, opacity: 0, transformPerspective: 800 },
        { scale: 1, rotateX: 0, opacity: 1, duration: 0.9, ease: 'elastic.out(1, 0.4)' }
      );
      gsap.fromTo(
        '.gsap-avatar-left',
        { x: -100, rotateY: -45, opacity: 0, transformPerspective: 800 },
        { x: 0, rotateY: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.gsap-avatar-right',
        { x: 100, rotateY: 45, opacity: 0, transformPerspective: 800 },
        { x: 0, rotateY: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.gsap-heart-center',
        { scale: 0, rotate: -20 },
        { scale: 1, rotate: 0, duration: 0.75, ease: 'elastic.out(1.2, 0.3)', delay: 0.45 }
      );
    }, modalBoxRef);

    return () => ctx.revert();
  }, [matchedUser]);

  if (!matchedUser) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Hiệu ứng Antigravity Celebration Hearts (Theo David Pelayo) */}
        <AntigravityCanvas
          particleCount={50}
          gravity={-0.05}
          speed={1.1}
          shape="hearts"
          className="absolute inset-0 pointer-events-none z-0"
        />
        <motion.div
          ref={modalBoxRef}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Hạt lấp lánh trang trí */}
          <div className="absolute top-4 right-6 text-amber-300 animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>

          {/* Dòng chữ Match nổi tiếng */}
          <div>
            <h1 className="gsap-match-title text-4xl md:text-5xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 drop-shadow-lg will-change-transform">
              It's a Match!
            </h1>
            <p className="text-slate-300 text-sm mt-2">
              Bạn và <span className="font-bold text-white">{matchedUser.name}</span> đã thích nhau.
            </p>
          </div>

          {/* Hai Avatar cạnh nhau */}
          <div className="flex items-center justify-center gap-4 my-8 relative">
            <div className="gsap-avatar-left relative will-change-transform">
              <img
                src={currentUser?.photos[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt="Me"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-500 shadow-xl"
              />
            </div>

            <div className="gsap-heart-center z-10 bg-slate-900 p-2 rounded-full ring-2 ring-rose-500 shadow-xl will-change-transform">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            </div>

            <div className="gsap-avatar-right relative will-change-transform">
              <img
                src={matchedUser.photos[0]}
                alt={matchedUser.name}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-500 shadow-xl"
              />
            </div>
          </div>

          {/* Các nút hành động */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onClose();
                onStartChat(matchedUser);
              }}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Send className="w-4 h-4" /> Gửi tin nhắn ngay
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all"
            >
              Tiếp tục quẹt thẻ
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
