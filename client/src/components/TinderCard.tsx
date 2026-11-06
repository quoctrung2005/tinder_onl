import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo, MotionValue } from 'framer-motion';
import type { UserProfile } from '../types';
import {
  MapPin, CheckCircle, ChevronLeft, ChevronRight,
  ChevronUp, X, Heart, Home, Flame,
  Briefcase, GraduationCap
} from 'lucide-react';

interface TinderCardProps {
  profile: UserProfile;
  currentUser?: UserProfile | null;
  isFront: boolean;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  showDetailsModal: boolean;
  setShowDetailsModal: (val: boolean) => void;
  swipeExitDirection: 'left' | 'right' | 'up' | null;
  photoNavAction?: 'next' | 'prev' | null;
  dragX?: MotionValue<number>;
  dragY?: MotionValue<number>;
}

export const TinderCard: React.FC<TinderCardProps> = ({
  profile,
  currentUser: _currentUser,
  isFront,
  onSwipe,
  showDetailsModal,
  setShowDetailsModal,
  swipeExitDirection,
  photoNavAction,
  dragX,
  dragY
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Phản hồi phím tắt N (tiếp theo) và M (quay lại)
  React.useEffect(() => {
    if (!isFront) return;
    if (photoNavAction === 'next' && profile.photos && photoIndex < profile.photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    } else if (photoNavAction === 'prev' && photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    }
  }, [photoNavAction, isFront]);

  // Framer-Motion motion values nhận từ cha hoặc dùng fallback
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const x = dragX || fallbackX;
  const y = dragY || fallbackY;

  // Xoay thẻ mượt theo khoảng cách kéo chuột
  const rotate = useTransform(x, [-260, 0, 260], [-18, 0, 18]);

  // Tem LIKE / NOPE / SUPER LIKE xuất hiện mượt mà
  const likeOpacity = useTransform(x, [15, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-15, -110], [0, 1]);
  const superLikeOpacity = useTransform(y, [-15, -90], [0, 1]);

  // Xử lý cử chỉ quẹt kết hợp cả khoảng cách (offset) và tốc độ vung tay (velocity)
  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 95;
    const velocityThreshold = 420;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    } else if (info.offset.y < -threshold || info.velocity.y < -velocityThreshold) {
      onSwipe('up');
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profile.photos && photoIndex < profile.photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    }
  };

  const isSuperCompat = (profile.compatibilityScore || 0) >= 90;
  const isHighCompat = (profile.compatibilityScore || 0) >= 80;

  // Hiệu ứng bay khỏi màn hình (Fly-Out Physics mượt mà, không giật lag)
  const cardVariants = {
    initial: isFront
      ? { scale: 1, y: 0, opacity: 1 }
      : { scale: 0.95, y: 12, opacity: 0.8 },
    animate: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { duration: 0.22, ease: 'easeOut' as const }
    },
    exit: (direction: 'left' | 'right' | 'up' | null) => {
      const dir = swipeExitDirection || direction;
      if (dir === 'right') {
        return {
          x: 950,
          rotate: 28,
          opacity: 0,
          transition: { duration: 0.28, ease: 'easeIn' as const }
        };
      }
      if (dir === 'left') {
        return {
          x: -950,
          rotate: -28,
          opacity: 0,
          transition: { duration: 0.28, ease: 'easeIn' as const }
        };
      }
      if (dir === 'up') {
        return {
          y: -950,
          opacity: 0,
          transition: { duration: 0.28, ease: 'easeIn' as const }
        };
      }
      return { opacity: 0, transition: { duration: 0.18 } };
    }
  };

  if (!isFront) {
    return (
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="initial"
        className="absolute inset-0 w-full h-full rounded-[24px] overflow-hidden shadow-2xl bg-[#111418] pointer-events-none border border-neutral-800"
      >
        <img
          src={profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h2 className="text-3xl font-extrabold">{profile.name} {profile.age}</h2>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        style={{ x, y, rotate }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.75}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        custom={swipeExitDirection}
        className={`absolute inset-0 w-full h-full rounded-[24px] overflow-hidden bg-[#111418] cursor-grab active:cursor-grabbing select-none z-10 will-change-transform transition-shadow ${
          isSuperCompat
            ? 'ring-[3px] ring-amber-400 shadow-[0_0_45px_rgba(251,191,36,0.55),0_20px_40px_rgba(0,0,0,0.85)]'
            : isHighCompat
            ? 'ring-2 ring-rose-400/90 shadow-[0_0_35px_rgba(244,63,94,0.45),0_20px_40px_rgba(0,0,0,0.85)]'
            : 'border border-neutral-800 shadow-[0_15px_35px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* LỚP SHIMMER NỔI BẬT DÀNH CHO SIÊU TƯƠNG HỢP (HIGH COMPATIBILITY GLOW AURA) */}
        {isHighCompat && (
          <div className="absolute inset-0 pointer-events-none rounded-[24px] z-20 ring-1 ring-inset ring-amber-400/30" />
        )}

        {/* ẢNH CHÍNH CỦA THẺ */}
        <img
          src={profile.photos[photoIndex] || profile.photos[0]}
          alt={profile.name}
          className="w-full h-full object-cover pointer-events-none"
        />

        {/* 1. THANH VẠCH TIẾN TRÌNH TRẮNG Ở ĐỈNH THẺ */}
        <div className="absolute top-2.5 left-3 right-3 flex gap-1 z-30">
          {profile.photos.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                idx === photoIndex
                  ? 'bg-white shadow-md'
                  : 'bg-black/50 backdrop-blur-sm'
              }`}
            />
          ))}
        </div>

        {/* 2. HUY HIỆU ĐỘ TƯƠNG HỢP CAO NỔI BẬT (CLEAN COMPATIBILITY BADGE) */}
        <div className="absolute top-6 left-3.5 z-30 flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-black shadow-xl select-none ${
              isSuperCompat
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-black border border-amber-300'
                : isHighCompat
                ? 'bg-black/75 text-amber-300 border border-amber-400/70 shadow-amber-500/20'
                : 'bg-black/60 text-white border border-neutral-700'
            }`}
          >
            <Flame className={`w-4 h-4 ${isSuperCompat ? 'text-black fill-black' : 'text-amber-400 fill-amber-400 animate-pulse'}`} />
            <span>
              {profile.compatibilityScore || 85}% {isSuperCompat ? 'ĐỈNH TƯƠNG HỢP' : isHighCompat ? 'SIÊU TƯƠNG HỢP' : 'TƯƠNG HỢP'}
            </span>
          </div>
        </div>

        {/* 3. MŨI TÊN < VÀ > NẰM 2 BÊN MÉP ẢNH */}
        {photoIndex > 0 && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={prevPhoto}
            title="Ảnh trước"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm flex items-center justify-center text-white/90 z-25 transition-all hover:scale-110 active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {photoIndex < profile.photos.length - 1 && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={nextPhoto}
            title="Ảnh tiếp theo"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm flex items-center justify-center text-white/90 z-25 transition-all hover:scale-110 active:scale-90 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* VÙNG BẤM TÀNG HÌNH NỬA TRÁI / NỬA PHẢI ĐỂ CHUYỂN ẢNH KHI KHÔNG KÉO */}
        {!isDragging && (
          <div className="absolute inset-0 z-10 flex">
            <div onClick={prevPhoto} className="w-1/2 h-3/4" />
            <div onClick={nextPhoto} className="w-1/2 h-3/4" />
          </div>
        )}

        {/* TEM LIKE CHUẨN TINDER */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-12 left-6 z-35 pointer-events-none border-[5px] border-emerald-400 text-emerald-400 font-black text-5xl px-5 py-1.5 rounded-2xl -rotate-15 uppercase tracking-wider shadow-[0_0_25px_rgba(52,211,153,0.6)] bg-black/50 backdrop-blur-xs"
        >
          LIKE 💚
        </motion.div>

        {/* TEM NOPE CHUẨN TINDER */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-12 right-6 z-35 pointer-events-none border-[5px] border-rose-500 text-rose-500 font-black text-5xl px-5 py-1.5 rounded-2xl rotate-15 uppercase tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.6)] bg-black/50 backdrop-blur-xs"
        >
          NOPE ❌
        </motion.div>

        {/* TEM SUPER LIKE */}
        <motion.div
          style={{ opacity: superLikeOpacity }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-35 pointer-events-none border-[5px] border-sky-400 text-sky-400 font-black text-4xl px-6 py-2 rounded-2xl uppercase tracking-widest shadow-[0_0_25px_rgba(56,189,248,0.6)] bg-black/60 backdrop-blur-xs"
        >
          SUPER LIKE ⭐
        </motion.div>

        {/* LỚP GRADIENT ĐEN Ở ĐÁY THẺ */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none z-15" />

        {/* 4. THÔNG TIN HỒ SƠ Ở ĐÁY */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-25 text-white pointer-events-auto space-y-2">
          
          {/* CÁC SỞ THÍCH NỔI BẬT CỦA HỒ SƠ */}
          {((profile.commonInterests && profile.commonInterests.length > 0)
            ? profile.commonInterests
            : (profile.interests?.slice(0, 3) || [])
          ).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {((profile.commonInterests && profile.commonInterests.length > 0)
                ? profile.commonInterests
                : (profile.interests?.slice(0, 3) || [])
              ).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 border border-white/20 text-white backdrop-blur-xs shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between">
            <div className="space-y-1">
              {/* Tên, Tuổi và Tích xanh xác minh */}
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
                  {profile.name}
                </h1>
                <span className="text-2xl font-light text-neutral-200">{profile.age}</span>
                <CheckCircle className="w-5 h-5 text-sky-400 fill-sky-400 shrink-0 shadow-sm" />
              </div>

              {/* Dòng: 🏠 Sống tại [Thành phố] */}
              <div className="flex items-center gap-2 text-xs text-neutral-200 font-medium">
                <Home className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Sống tại {profile.city || 'Hồ Chí Minh'}</span>
              </div>

              {/* Dòng: 📍 Cách xa [X] km */}
              <div className="flex items-center gap-2 text-xs text-neutral-200 font-medium">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Cách xa 6 km</span>
              </div>
            </div>

            {/* NÚT MỞ CHI TIẾT HỒ SƠ */}
            <div className="flex items-center">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailsModal(true);
                }}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center text-white focus:outline-none transition-transform hover:scale-110 active:scale-90 cursor-pointer shadow-md"
                title="Mở hồ sơ"
              >
                <ChevronUp className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5. MODAL XEM CHI TIẾT ĐẦY ĐỦ HỒ SƠ */}
      {showDetailsModal && (
        <div className="absolute inset-0 bg-[#111418]/98 backdrop-blur-md z-40 p-6 overflow-y-auto custom-scrollbar text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{profile.name} {profile.age}</h2>
                <CheckCircle className="w-5 h-5 text-sky-400 fill-sky-400" />
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-neutral-400" />
                <span>Sống tại {profile.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span>Cách xa 6 km</span>
              </div>
              {profile.job && (
                <div className="flex items-center gap-2 text-neutral-200">
                  <Briefcase className="w-4 h-4 text-rose-400" />
                  <span>{profile.job} {profile.company ? `tại ${profile.company}` : ''}</span>
                </div>
              )}
              {profile.school && (
                <div className="flex items-center gap-2 text-neutral-200">
                  <GraduationCap className="w-4 h-4 text-rose-400" />
                  <span>{profile.school}</span>
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 uppercase">Về tôi</h3>
              <p className="mt-1 text-neutral-200 text-xs leading-relaxed">{profile.bio}</p>
            </div>

            {/* Mức độ tương hợp */}
            <div className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500/15 to-amber-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 shadow-sm">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
              <span>Độ tương hợp cao: {profile.compatibilityScore || 85}%</span>
            </div>

            {/* Mục đích hẹn hò */}
            {profile.relationship_goal && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase">Mục đích hẹn hò</h3>
                <div className="mt-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold inline-block">
                  {profile.relationship_goal}
                </div>
              </div>
            )}

            {/* Bài hát chủ đề Spotify (Spotify Anthem) */}
            {profile.spotify_anthem && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    🎵 Bài hát chủ đề Spotify
                  </span>
                  <span className="text-[10px] text-neutral-400">Spotify Connected</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={profile.spotify_anthem.cover}
                    alt="Anthem"
                    className="w-12 h-12 rounded-xl object-cover shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{profile.spotify_anthem.title}</h4>
                    <p className="text-xs text-neutral-300 truncate">{profile.spotify_anthem.artist}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Album ảnh Instagram gần nhất */}
            {profile.instagram_photos && profile.instagram_photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase">
                    📷 Ảnh gần đây trên Instagram
                  </h3>
                  <span className="text-[10px] text-pink-400 font-semibold">@instagram</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {profile.instagram_photos.slice(0, 6).map((imgUrl, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-800">
                      <img src={imgUrl} alt="Instagram" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sở thích */}
            {profile.interests && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase mb-1.5">Sở thích</h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((it) => (
                    <span key={it} className="px-3 py-1 rounded-full text-xs bg-neutral-800 border border-neutral-700 text-neutral-300">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 flex justify-center gap-4">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                onSwipe('left');
              }}
              className="p-3.5 bg-neutral-800 hover:bg-rose-600/20 text-rose-500 rounded-full border border-neutral-700 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                setShowDetailsModal(false);
                onSwipe('right');
              }}
              className="p-3.5 bg-neutral-800 hover:bg-emerald-600/20 text-emerald-400 rounded-full border border-neutral-700 transition-all cursor-pointer"
            >
              <Heart className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
