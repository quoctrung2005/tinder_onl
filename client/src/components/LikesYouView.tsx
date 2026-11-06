import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '../types';
import {
  ArrowLeft, Heart, X, CheckCircle, Flame, Sparkles, MapPin
} from 'lucide-react';
import { ProfileDetailModal } from './ProfileDetailModal';

interface LikesYouViewProps {
  currentUser: UserProfile | null;
  existingMatches?: UserProfile[];
  onBackToSwipe: () => void;
  onMatchCreated: (matchedUser: UserProfile, chatRoomId?: string) => void;
  onLikesCountChange?: (count: number) => void;
}

export const LikesYouView: React.FC<LikesYouViewProps> = ({
  currentUser,
  existingMatches = [],
  onBackToSwipe,
  onMatchCreated,
  onLikesCountChange
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'high_compat' | 'nearby'>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikesYou = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('tinder_token');
        const res = await axios.get('http://localhost:5000/api/likes-you', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const rawProfiles: UserProfile[] = res.data || [];
        setProfiles(rawProfiles);
        const matchedIds = new Set(existingMatches.map((m) => m.id));
        const activeCount = rawProfiles.filter((p) => !matchedIds.has(p.id)).length;
        onLikesCountChange?.(activeCount);
      } catch (err) {
        console.error('Lỗi lấy danh sách Ai thích bạn:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikesYou();
  }, [existingMatches.length]);

  // Lọc theo bộ lọc và loại bỏ người đã tương hợp (tránh tương hợp trùng)
  const matchedIds = new Set(existingMatches.map((m) => m.id));
  const filteredProfiles = profiles.filter((p) => {
    if (matchedIds.has(p.id)) return false;
    if (filterType === 'high_compat') {
      return (p.compatibilityScore || 0) >= 88;
    }
    if (filterType === 'nearby') {
      return p.city === (currentUser?.city || 'Hồ Chí Minh');
    }
    return true;
  });

  // Xử lý Match Ngay (Like lại)
  const handleLikeBack = async (target: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setActioningId(target.id);

    try {
      const token = localStorage.getItem('tinder_token');
      const res = await axios.post(
        'http://localhost:5000/api/swipe',
        {
          toUserId: target.id,
          action: 'LIKE',
          forceMatch: true
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      // Xóa khỏi danh sách Likes You với hiệu ứng mượt
      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== target.id);
        onLikesCountChange?.(next.length);
        return next;
      });

      // Kích hoạt Match chúc mừng!
      if (res.data.isMatch) {
        const fullMatchedUser: UserProfile = {
          ...(res.data.matchedUser || target),
          chatRoomId: res.data.chatRoomId || target.chatRoomId || `room_${target.id}`,
          lastMessage: res.data.matchedUser?.lastMessage || 'Vừa tương hợp! Hãy gửi lời chào 😊',
          lastMessageTime: res.data.matchedUser?.lastMessageTime || new Date().toISOString()
        };
        onMatchCreated(fullMatchedUser, res.data.chatRoomId);
      }
    } catch (err) {
      console.error('Lỗi khi Thích lại:', err);
    } finally {
      setActioningId(null);
    }
  };

  // Xử lý Bỏ qua (Nope)
  const handlePass = async (target: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setActioningId(target.id);

    try {
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/swipe',
        {
          toUserId: target.id,
          action: 'PASS'
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== target.id);
        onLikesCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      console.error('Lỗi khi bỏ qua:', err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b0e11] text-white relative select-none overflow-hidden">
      {/* 1. HEADER VÀNG ĐẶC QUYỀN MATCH GOLD */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#18150f] via-[#1a1710] to-[#121417] border-b border-amber-500/30 flex items-center justify-between shadow-xl z-20">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToSwipe}
            className="w-10 h-10 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Quay lại quẹt thẻ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Ai Đã Thích Bạn
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Match Gold™
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Có <strong className="text-amber-300 font-bold">{profiles.length} người</strong> đã vuốt Thích bạn! Thích lại để ghép đôi ngay lập tức.
            </p>
          </div>
        </div>

        {/* NÚT BỘ LỌC */}
        <div className="hidden sm:flex items-center gap-2 bg-neutral-900/80 p-1 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tất cả ({profiles.length})
          </button>
          <button
            onClick={() => setFilterType('high_compat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'high_compat'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Tương hợp 88%+
          </button>
          <button
            onClick={() => setFilterType('nearby')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'nearby'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Gần bạn
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC LƯỚI CARD NGƯỜI ĐÃ THÍCH BẠN (CỰC KỲ SẮC NÉT, MỞ KHÓA HOÀN TOÀN) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
            <p className="text-xs text-neutral-400">Đang tải danh sách những người thích bạn...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-300">
              <Heart className="w-10 h-10 fill-amber-300/30" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chưa có thêm lượt thích nào</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              Bạn đã xem hoặc phản hồi tất cả những người đã thích bạn trong danh mục này. Hãy tiếp tục quẹt thẻ hoặc kích hoạt Boost!
            </p>
            <button
              onClick={onBackToSwipe}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer"
            >
              Tiếp tục quẹt thẻ khám phá
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 max-w-6xl mx-auto">
            <AnimatePresence mode="popLayout">
              {filteredProfiles.map((p) => {
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedProfile(p)}
                    className="relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/90 shadow-xl group hover:border-amber-400/70 hover:shadow-[0_8px_30px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    {/* ẢNH ỨNG VIÊN KHÔNG BỊ MỜ (ĐẶC QUYỀN GOLD) */}
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient đen phủ đều */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/30 pointer-events-none" />

                    {/* Huy hiệu đỉnh: ĐÃ THÍCH BẠN */}
                    <div className="relative z-10 p-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/60 flex items-center gap-1 shadow-md">
                        <Heart className="w-3 h-3 fill-amber-400 text-amber-400" />
                        Đã thích bạn
                      </span>

                      {/* Điểm tương hợp */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-rose-400 border border-rose-500/50 flex items-center gap-0.5 shadow-md">
                        <Flame className="w-3 h-3 fill-rose-500" />
                        {p.compatibilityScore || 85}%
                      </span>
                    </div>

                    {/* Thông tin ở đáy và 2 nút hành động trực tiếp */}
                    <div className="relative z-10 p-3 space-y-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 drop-shadow-md truncate">
                          {p.name}, {p.age}
                          <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400 shrink-0" />
                        </h4>
                        <p className="text-[11px] text-neutral-300 truncate">
                          {p.city || 'Hồ Chí Minh'} • Cách 6 km
                        </p>
                      </div>

                      {/* 2 NÚT HÀNH ĐỘNG TRỰC TIẾP TRÊN CARD: BỎ QUA HOẶC MATCH NGAY! */}
                      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                        <button
                          type="button"
                          disabled={actioningId === p.id}
                          onClick={(e) => handlePass(p, e)}
                          title="Bỏ qua lượt thích này"
                          className="flex-1 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 text-rose-400 font-bold text-xs flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Bỏ qua</span>
                        </button>

                        <button
                          type="button"
                          disabled={actioningId === p.id}
                          onClick={(e) => handleLikeBack(p, e)}
                          title="Thích lại để Ghép đôi ngay lập tức!"
                          className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        >
                          <Heart className="w-3.5 h-3.5 fill-white stroke-none" />
                          <span>Match ngay</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 3. MODAL XEM CHI TIẾT ĐẦY ĐỦ HỒ SƠ PARTNER */}
      <ProfileDetailModal
        isOpen={Boolean(selectedProfile)}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
    </div>
  );
};
