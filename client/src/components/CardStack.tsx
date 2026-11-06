import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import type { UserProfile } from '../types';
import { TinderCard } from './TinderCard';
import { RotateCcw, X, Star, Heart, RefreshCw, Send, Zap } from 'lucide-react';
import { AntigravityCanvas } from './AntigravityCanvas';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  char: string;
}

// COMPONENT NÚT TỪ TÍNH SIÊU MƯỢT (SPRING-MAGNETIC BUTTON CHUẨN TINDER)
const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}> = ({ children, className = '', onClick, disabled = false, title }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`transition-all duration-150 ease-out hover:scale-115 active:scale-90 select-none ${className}`}
    >
      {children}
    </button>
  );
};

interface CardStackProps {
  cards: UserProfile[];
  currentUser?: UserProfile | null;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onRewind: () => void;
  canRewind: boolean;
  onReload: () => void;
  onTriggerBoost?: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({
  cards,
  currentUser,
  onSwipe,
  onRewind,
  canRewind,
  onReload,
  onTriggerBoost
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [swipeExitDir, setSwipeExitDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [photoNavAction, setPhotoNavAction] = useState<'next' | 'prev' | null>(null);
  const [showKeyHints, setShowKeyHints] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [boostToast, setBoostToast] = useState<string | null>(null);

  const currentCard = cards[0];
  const nextCard = cards[1];

  // Motion Values liên kết cử chỉ vuốt thẻ và các nút hành động bên dưới
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // --- HIỆU ỨNG NÚT ĐỒNG BỘ 100% THEO CỬ CHỈ VUỐT CARD ---
  // 1. Nút NOPE ❌: Sáng rực đỏ và phóng to khi vuốt sang trái (dragX < 0)
  const nopeScale = useTransform(dragX, [-150, -40, 0, 40], [1.32, 1.15, 1, 0.95]);
  const nopeBg = useTransform(
    dragX,
    [-150, 0],
    ['rgba(244, 63, 94, 0.28)', 'rgba(30, 35, 41, 0.95)']
  );
  const nopeBorder = useTransform(
    dragX,
    [-150, 0],
    ['rgba(244, 63, 94, 0.95)', 'rgba(64, 64, 64, 0.8)']
  );
  const nopeShadow = useTransform(
    dragX,
    [-150, -30, 0],
    [
      '0px 0px 30px rgba(244, 63, 94, 0.9)',
      '0px 0px 14px rgba(244, 63, 94, 0.45)',
      '0px 4px 18px rgba(244, 63, 94, 0.25)'
    ]
  );
  const nopeRotate = useTransform(dragX, [-150, 0], [-15, 0]);

  // 2. Nút LIKE ❤️: Sáng rực ngọc bích / đỏ hồng và phóng to khi vuốt sang phải (dragX > 0)
  const likeScale = useTransform(dragX, [-40, 0, 40, 150], [0.95, 1, 1.15, 1.32]);
  const likeBg = useTransform(
    dragX,
    [0, 150],
    ['rgba(30, 35, 41, 0.95)', 'rgba(16, 185, 129, 0.28)']
  );
  const likeBorder = useTransform(
    dragX,
    [0, 150],
    ['rgba(64, 64, 64, 0.8)', 'rgba(16, 185, 129, 0.95)']
  );
  const likeShadow = useTransform(
    dragX,
    [0, 30, 150],
    [
      '0px 4px 20px rgba(234, 29, 69, 0.25)',
      '0px 0px 14px rgba(16, 185, 129, 0.45)',
      '0px 0px 30px rgba(16, 185, 129, 0.9)'
    ]
  );
  const likeRotate = useTransform(dragX, [0, 150], [0, 15]);

  // 3. Nút SUPER LIKE ⭐: Sáng rực xanh dương và phóng to khi vuốt lên trên (dragY < 0)
  const superLikeScale = useTransform(dragY, [-140, -35, 0], [1.32, 1.15, 1]);
  const superLikeBg = useTransform(
    dragY,
    [-140, 0],
    ['rgba(56, 189, 248, 0.28)', 'rgba(30, 35, 41, 0.95)']
  );
  const superLikeBorder = useTransform(
    dragY,
    [-140, 0],
    ['rgba(56, 189, 248, 0.95)', 'rgba(64, 64, 64, 0.8)']
  );
  const superLikeShadow = useTransform(
    dragY,
    [-140, -30, 0],
    [
      '0px 0px 30px rgba(56, 189, 248, 0.9)',
      '0px 0px 14px rgba(56, 189, 248, 0.45)',
      '0px 4px 14px rgba(56, 189, 248, 0.25)'
    ]
  );
  const superLikeRotate = useTransform(dragY, [-140, 0], [20, 0]);

  // Hiệu ứng pháo hoa hạt (Particle burst) khi Like / Nope / Super Like
  const spawnParticles = (type: 'like' | 'nope' | 'super') => {
    const newParticles: Particle[] = [];
    const count = 16;
    const char = type === 'like' ? '💚' : type === 'super' ? '⭐' : '❌';
    const color = type === 'like' ? '#10b981' : type === 'super' ? '#38bdf8' : '#f43f5e';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 8;
      newParticles.push({
        id: Math.random() + Date.now(),
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        char
      });
    }

    setParticles(newParticles);
    setTimeout(() => setParticles([]), 700);
  };

  const triggerSwipeWithAnimation = (direction: 'left' | 'right' | 'up') => {
    if (!currentCard || swipeExitDir) return;
    spawnParticles(direction === 'right' ? 'like' : direction === 'up' ? 'super' : 'nope');
    setSwipeExitDir(direction);
    dragX.set(0);
    dragY.set(0);
    setTimeout(() => {
      onSwipe(direction);
      setSwipeExitDir(null);
    }, 220);
  };

  const handleBoostClick = () => {
    if (onTriggerBoost) {
      onTriggerBoost();
    } else {
      setBoostToast('⚡ Đã kích hoạt Boost! Hồ sơ của bạn được đẩy lên đầu trong 30 phút.');
      setTimeout(() => setBoostToast(null), 3500);
    }
  };

  // Hệ thống phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
        triggerSwipeWithAnimation('right');
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'h') {
        triggerSwipeWithAnimation('left');
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 's') {
        triggerSwipeWithAnimation('up');
      } else if (e.key === 'ArrowDown' || e.code === 'Space') {
        e.preventDefault();
        setShowDetails((prev) => !prev);
      } else if (e.key === 'Backspace' || e.key === 'Enter') {
        if (canRewind) {
          onRewind();
        }
      } else if (e.key.toLowerCase() === 'n') {
        setPhotoNavAction('next');
        setTimeout(() => setPhotoNavAction(null), 100);
      } else if (e.key.toLowerCase() === 'm') {
        setPhotoNavAction('prev');
        setTimeout(() => setPhotoNavAction(null), 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, swipeExitDir, canRewind, onRewind]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 h-screen bg-black relative select-none overflow-hidden">
      {/* TOAST BOOST HOẠT ĐỘNG */}
      <AnimatePresence>
        {boostToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-4 z-50 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center gap-2 border border-purple-300"
          >
            <Zap className="w-4 h-4 fill-white animate-pulse" />
            <span>{boostToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KHỐI TRUNG TÂM GỒM CARD VÀ 5 NÚT NGAY DƯỚI HÌNH (GỌN GÀNG, KHÔNG BỊ TRỐNG ĐEN LỚN) */}
      <div className="flex flex-col items-center justify-center w-full max-w-[390px] relative my-auto">
        {/* VÙNG THẺ CARD */}
        <div className="relative w-full h-[520px] sm:h-[550px] md:h-[580px]">
          {cards.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {/* Thẻ thứ 2 nằm dưới */}
              {nextCard && (
                <TinderCard
                  key={nextCard.id}
                  profile={nextCard}
                  currentUser={currentUser}
                  isFront={false}
                  onSwipe={onSwipe}
                  showDetailsModal={false}
                  setShowDetailsModal={() => {}}
                  swipeExitDirection={null}
                />
              )}

              {/* Thẻ đầu tiên (đang tương tác với cử chỉ vuốt) */}
              {currentCard && (
                <TinderCard
                  key={currentCard.id}
                  profile={currentCard}
                  currentUser={currentUser}
                  isFront={true}
                  onSwipe={(dir) => {
                    spawnParticles(dir === 'right' ? 'like' : dir === 'up' ? 'super' : 'nope');
                    setSwipeExitDir(dir);
                    dragX.set(0);
                    dragY.set(0);
                    setTimeout(() => {
                      onSwipe(dir);
                      setSwipeExitDir(null);
                    }, 180);
                  }}
                  showDetailsModal={showDetails}
                  setShowDetailsModal={setShowDetails}
                  swipeExitDirection={swipeExitDir}
                  photoNavAction={photoNavAction}
                  dragX={dragX}
                  dragY={dragY}
                />
              )}
            </AnimatePresence>
          ) : (
            <div className="relative w-full h-full rounded-[24px] border border-neutral-800 bg-[#111418] flex flex-col items-center justify-center p-8 text-center shadow-2xl overflow-hidden">
              <AntigravityCanvas
                particleCount={20}
                gravity={-0.02}
                speed={0.5}
                shape="hearts"
                className="absolute inset-0 pointer-events-none z-0 opacity-40"
              />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center mb-5 shadow-lg shadow-rose-600/30 animate-pulse">
                  <Heart className="w-9 h-9 text-white fill-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Đã hết hồ sơ quanh bạn</h3>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed max-w-xs">
                  Bạn đã xem hết các gợi ý hiện có. Bấm nút dưới để nạp lại thẻ và tiếp tục quẹt!
                </p>
                <button
                  type="button"
                  onClick={onReload}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Khám phá lại từ đầu
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5 NÚT HÀNH ĐỘNG NẰM NGAY DƯỚI HÌNH VỚI ANIMATION ĐỒNG BỘ THEO CỬ CHỈ */}
        {cards.length > 0 && (
          <div className="flex items-center justify-center gap-3.5 sm:gap-4 mt-3 sm:mt-3.5 z-20">
            {/* 1. Nút Rewind (Hoàn tác) */}
            <MagneticButton
              onClick={onRewind}
              disabled={!canRewind}
              title="Hoàn tác (Phím Backspace / Enter)"
              className={`w-12 h-12 rounded-full bg-[#1e2329]/95 border border-neutral-700/80 flex items-center justify-center ${
                canRewind
                  ? 'text-amber-400 cursor-pointer hover:bg-neutral-800 shadow-[0_4px_14px_rgba(251,191,36,0.25)]'
                  : 'text-neutral-600 cursor-not-allowed opacity-40'
              }`}
            >
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </MagneticButton>

            {/* 2. Nút NOPE ❌ - Đồng bộ hiệu ứng phóng to & rực sáng đỏ theo cử chỉ quẹt trái */}
            <motion.button
              type="button"
              style={{
                scale: nopeScale,
                backgroundColor: nopeBg,
                borderColor: nopeBorder,
                boxShadow: nopeShadow,
                rotate: nopeRotate
              }}
              whileTap={{ scale: 0.88 }}
              onClick={() => triggerSwipeWithAnimation('left')}
              title="Bỏ qua (Phím ⬅️ hoặc H)"
              className="w-14 h-14 rounded-full border flex items-center justify-center cursor-pointer select-none transition-transform"
            >
              <X className="w-7 h-7 stroke-[2.5] text-rose-500" />
            </motion.button>

            {/* 3. Nút SUPER LIKE ⭐ - Đồng bộ hiệu ứng phóng to & rực sáng xanh theo cử chỉ vuốt lên */}
            <motion.button
              type="button"
              style={{
                scale: superLikeScale,
                backgroundColor: superLikeBg,
                borderColor: superLikeBorder,
                boxShadow: superLikeShadow,
                rotate: superLikeRotate
              }}
              whileTap={{ scale: 0.88 }}
              onClick={() => triggerSwipeWithAnimation('up')}
              title="Siêu thích (Phím ⬆️ hoặc S)"
              className="w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer select-none transition-transform"
            >
              <Star className="w-5 h-5 fill-sky-400/20 stroke-[2.2] text-sky-400" />
            </motion.button>

            {/* 4. Nút LIKE ❤️ - Đồng bộ hiệu ứng phóng to & rực sáng theo cử chỉ quẹt phải */}
            <motion.button
              type="button"
              style={{
                scale: likeScale,
                backgroundColor: likeBg,
                borderColor: likeBorder,
                boxShadow: likeShadow,
                rotate: likeRotate
              }}
              whileTap={{ scale: 0.88 }}
              onClick={() => triggerSwipeWithAnimation('right')}
              title="Thích (Phím ➡️ hoặc L)"
              className="w-14 h-14 rounded-full border flex items-center justify-center cursor-pointer select-none transition-transform"
            >
              <Heart className="w-7 h-7 fill-[#ea1d45] stroke-[1.5] text-[#ea1d45]" />
            </motion.button>

            {/* 5. Nút Boost (⚡) */}
            <MagneticButton
              onClick={handleBoostClick}
              title="Tăng tốc Boost hồ sơ trong 30 phút"
              className="w-12 h-12 rounded-full bg-[#1e2329]/95 border border-neutral-700/80 text-purple-400 flex items-center justify-center hover:bg-neutral-800 shadow-[0_4px_14px_rgba(192,132,252,0.25)] cursor-pointer"
            >
              <Send className="w-5 h-5 stroke-[2.2] -rotate-45 -translate-y-0.5" />
            </MagneticButton>
          </div>
        )}
      </div>

      {/* HIỆU ỨNG PHÁO HOA PARTICLE BURST KHI QUẸT */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, scale: 0.5, opacity: 1 }}
          animate={{
            x: p.x + p.vx * 25,
            y: p.y + p.vy * 25,
            scale: 1.6,
            opacity: 0
          }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="fixed pointer-events-none z-50 text-2xl select-none"
        >
          {p.char}
        </motion.div>
      ))}

      {/* THANH HƯỚNG DẪN PHÍM TẮT ĐÁY MÀN HÌNH CHUẨN TINDER WEB (CỐ ĐỊNH Ở ĐÁY, KHÔNG GÂY KHOẢNG TRỐNG) */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-auto">
        {showKeyHints ? (
          <div className="hidden lg:flex items-center gap-3.5 py-1 px-3 text-[12px] text-white/90 font-medium">
            <button
              type="button"
              onClick={() => setShowKeyHints(false)}
              className="px-3 py-1 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
              title="Ẩn thanh gợi ý phím tắt"
            >
              Ẩn
            </button>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                ←
              </span>
              <span>Không</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                →
              </span>
              <span>Thích</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                ↑
              </span>
              <span>Mở hồ sơ</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                ↓
              </span>
              <span>Đóng hồ sơ</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-5 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-300 font-mono">
                ↵
              </span>
              <span>Siêu Thích</span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-12 h-5 rounded border border-neutral-600 bg-neutral-900 flex items-center justify-center text-[9px] text-neutral-400 font-mono">
                Space / N
              </span>
              <span>Ảnh tiếp theo</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowKeyHints(true)}
            className="hidden lg:block text-[11px] text-neutral-500 hover:text-neutral-300 underline mb-1 cursor-pointer"
          >
            Hiện phím tắt bàn phím
          </button>
        )}
      </div>
    </div>
  );
};
