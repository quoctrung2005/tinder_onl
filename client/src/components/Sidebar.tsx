import React, { useState } from 'react';
import type { UserProfile } from '../types';
import {
  Zap, Compass, Briefcase, Shield, CheckCircle, Search, Heart, ExternalLink, Sliders, MessageCircle,
  Globe, Crown, ShieldCheck, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentUser: UserProfile | null;
  matches: UserProfile[];
  activeMatch: UserProfile | null;
  isProfileMode?: boolean;
  onGoToProfile?: () => void;
  onSelectMatch: (user: UserProfile) => void;
  onBackToSwipe: () => void;
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onOpenSafetyToolkit?: () => void;
  onOpenGoldModal?: () => void;
  onOpenLikesYou?: () => void;
  likesCount?: number;
  onOpenAdmin?: () => void;
  onTriggerBoost?: () => void;
  onOpenGraphTuner?: () => void;
  onLogout: () => void;
  onOpenProfile?: (user: UserProfile) => void;
  shortcutsEnabled?: boolean;
  onToggleShortcuts?: () => void;
  onOpenPassport?: () => void;
  onOpenPhotoVerify?: () => void;
  onOpenVipCheckout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  matches,
  activeMatch,
  isProfileMode = false,
  onGoToProfile,
  onSelectMatch,
  onBackToSwipe,
  onOpenEditProfile,
  onOpenSettings,
  onOpenSafetyToolkit,
  onOpenGoldModal,
  onOpenLikesYou,
  likesCount = 0,
  onOpenAdmin,
  onTriggerBoost,
  onOpenGraphTuner: _onOpenGraphTuner,
  onLogout,
  onOpenProfile,
  shortcutsEnabled = true,
  onToggleShortcuts,
  onOpenPassport,
  onOpenPhotoVerify,
  onOpenVipCheckout
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'messages'>('matches');
  const [searchQuery, setSearchQuery] = useState('');

  // Đảm bảo tuyệt đối không có tương hợp trùng lặp trong danh sách
  const uniqueMatches: UserProfile[] = Array.from(
    new Map<string, UserProfile>(matches.map((m) => [m.id, m])).values()
  );

  // Lọc matches theo từ khóa tìm kiếm
  const filteredMatches = uniqueMatches.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <aside className="w-[320px] md:w-[360px] h-screen bg-[#111418] border-r border-neutral-900 flex flex-col shrink-0 select-none">
      {/* 1. TOP HEADER (Khớp 100% hình 2 và hình 3) */}
      <div className="h-16 px-4 bg-gradient-to-r from-[#e01939] via-[#ea1d45] to-[#f42b58] flex items-center justify-between text-white shadow-md">
        {isProfileMode ? (
          /* HÌNH 3: Khi ở trang Profile, bên trái là icon Trái tim Match để quay lại Quẹt thẻ */
          <button
            onClick={onBackToSwipe}
            className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
            title="Quay lại khám phá tương hợp (Quẹt thẻ)"
          >
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          </button>
        ) : (
          /* HÌNH 2: Khi ở trang chính, bên trái là Avatar + chữ "Bạn" để mở Profile */
          <button
            onClick={onGoToProfile}
            className="flex items-center space-x-2.5 focus:outline-none hover:opacity-90 transition-opacity cursor-pointer group"
            title="Bấm để xem hồ sơ của bạn và cài đặt đăng xuất"
          >
            <div className="relative">
              <img
                src={currentUser?.photos[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/90 shadow-md group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="font-bold text-base tracking-wide">
              Bạn
            </span>
          </button>
        )}

        {/* 4 Icon tròn bên phải (Boost, Explore, Match Gold, Safety) */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onTriggerBoost}
            title="Tăng tốc hồ sơ (Boost)"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/95 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Zap className="w-4 h-4 fill-purple-300 text-purple-300" />
          </button>

          <button
            type="button"
            onClick={onBackToSwipe}
            title="Khám phá tương hợp (Quẹt thẻ)"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/95 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Compass className="w-4 h-4 text-amber-300" />
          </button>

          <button
            type="button"
            onClick={onOpenLikesYou || onOpenGoldModal}
            title={likesCount > 0 ? `Có ${likesCount} người đã thích bạn (Match Gold™)` : 'Ai Đã Thích Bạn (Match Gold™)'}
            className="relative w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/95 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Briefcase className="w-4 h-4 text-amber-300" />
            {likesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-neutral-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-md">
                {likesCount > 99 ? '99+' : likesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSafetyToolkit}
            title="Bộ công cụ An Toàn"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/95 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Shield className="w-4 h-4" />
          </button>

          {onOpenPassport && (
            <button
              type="button"
              onClick={onOpenPassport}
              title="Hộ chiếu Match Passport™ - Đổi địa điểm toàn cầu"
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-cyan-300 hover:text-cyan-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}

          {onOpenAdmin && currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenAdmin}
              title="Bảng Quản Trị Hệ Thống (Admin Console)"
              className="w-9 h-9 rounded-full bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 flex items-center justify-center text-amber-300 hover:text-amber-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Shield className="w-4 h-4 fill-amber-400/30 text-amber-300" />
            </button>
          )}
        </div>
      </div>

      {isProfileMode ? (
        /* DANH SÁCH MENU CÀI ĐẶT HỒ SƠ & ĐĂNG XUẤT (Khớp 100% hình 3) */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-white bg-[#111418]">
          {/* VIP Upgrade Banner */}
          {onOpenVipCheckout && (
            <div
              onClick={onOpenVipCheckout}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-rose-500/15 to-amber-500/25 border border-amber-400/50 hover:border-amber-400 transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>{currentUser?.is_gold ? 'Match Gold™ Đang Hoạt Động' : 'Nâng Cấp Match VIP'}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full">
                  {currentUser?.is_gold ? 'ĐÃ KÍCH HOẠT' : 'ƯU ĐÃI 50%'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1">
                Xem ai đã thích bạn, vô hạn Likes, Rewind & Match Passport™ toàn cầu.
              </p>
            </div>
          )}

          {/* Hộ Chiếu Tinder Passport */}
          {onOpenPassport && (
            <button
              type="button"
              onClick={onOpenPassport}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer border border-neutral-800/60"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Hộ Chiếu Match Passport™</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/15 px-2 py-0.5 rounded-full">
                {currentUser?.city || 'Hồ Chí Minh'}
              </span>
            </button>
          )}

          {/* Xác Minh Ảnh AI (Tích Xanh) */}
          {onOpenPhotoVerify && (
            <button
              type="button"
              onClick={onOpenPhotoVerify}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer border border-neutral-800/60"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-4 h-4 ${currentUser?.is_verified ? 'text-blue-400' : 'text-neutral-400'}`} />
                <span>Xác Minh Ảnh Chính Chủ</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentUser?.is_verified
                  ? 'text-blue-300 bg-blue-500/20'
                  : 'text-amber-300 bg-amber-500/20'
              }`}>
                {currentUser?.is_verified ? '✓ Đã có tích xanh' : 'Nhận tích xanh'}
              </span>
            </button>
          )}

          {/* Nhóm liên kết chính sách (Khớp 100% hình 1) */}
          <div className="space-y-1">
            <div className="p-3 text-xs font-bold text-neutral-300">
              Cài đặt Quyền Riêng Tư
            </div>
            <a
              href="https://policies.tinder.com/cookie-policy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Chính sách Cookie</span>
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            </a>
            <a
              href="https://policies.tinder.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Chính sách Quyền Riêng Tư</span>
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            </a>
            <a
              href="https://policies.tinder.com/terms"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Điều khoản Dịch vụ</span>
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            </a>
            <a
              href="https://policies.tinder.com/accessibility"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Tuyên bố về khả năng tiếp cận</span>
              <ExternalLink className="w-4 h-4 text-neutral-400" />
            </a>
          </div>

          {/* Phần Trợ năng: Phím tắt */}
          <div className="pt-2 border-t border-neutral-800/80">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 px-3">
              Trợ năng
            </h4>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60">
              <span className="text-xs font-semibold text-neutral-200">Phím tắt</span>
              <button
                type="button"
                onClick={onToggleShortcuts}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  shortcutsEnabled ? 'bg-[#ea1d45] justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
              </button>
            </div>
          </div>

          {/* Cài đặt Tìm kiếm & Chặn Liên hệ */}
          <div className="pt-2 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Cài đặt Tìm kiếm & Chặn liên hệ</span>
              <Sliders className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Sửa thông tin hồ sơ */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/60 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            >
              <span>Sửa Thông Tin Hồ Sơ</span>
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                96%
              </span>
            </button>
          </div>

          {/* Nút Chia sẻ Match & ĐĂNG XUẤT */}
          <div className="pt-2 space-y-2.5 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                alert('Đã sao chép liên kết Match vào bộ nhớ tạm!');
              }}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold transition-all cursor-pointer text-center border border-neutral-800/80 active:scale-98"
            >
              Chia sẻ Match
            </button>

            {onOpenAdmin && currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-rose-500/25 text-amber-300 hover:text-amber-200 text-xs font-extrabold transition-all cursor-pointer text-center border border-amber-400/40 active:scale-98 flex items-center justify-center gap-2 shadow-sm"
              >
                <Shield className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span>Bảng Quản Trị Hệ Thống (Admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold transition-all cursor-pointer text-center border border-neutral-800/80 active:scale-98"
            >
              Đăng xuất
            </button>
          </div>

          {/* Phiên bản Match */}
          <div className="pt-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Phiên bản Match 7.41.0</span>
            </div>
          </div>

          {/* Xóa tài khoản */}
          <div className="pt-2 pb-4">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản Tinder? Mọi tương hợp và tin nhắn sẽ mất vĩnh viễn.')) {
                  onLogout();
                }
              }}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-900/50 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer text-center border border-neutral-800/60"
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ THƯỜNG: TABS CÁC TƯƠNG HỢP & TIN NHẮN (Khớp hình 2) */
        <>
          {/* BANNER VIP & PHÍM TẮT ĐẶC QUYỀN TRỰC DIỆN */}
          <div className="px-3 pt-3 pb-2 border-b border-neutral-800/80 bg-[#141820]">
            {/* 1. NÚT ĐĂNG KÝ / NÂNG CẤP VIP CHÍNH */}
            {onOpenVipCheckout && (
              <button
                type="button"
                onClick={onOpenVipCheckout}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-amber-500/25 hover:from-amber-500/35 hover:to-rose-500/30 border border-amber-400/60 hover:border-amber-400 flex items-center justify-between text-left transition-all cursor-pointer shadow-lg group active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shadow-inner">
                    <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <span>{currentUser?.is_gold ? `Match ${currentUser.vip_level || 'Gold'} (Đã kích hoạt)` : 'Đăng Ký Match Gold™ VIP'}</span>
                      <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                    </div>
                    <div className="text-[10px] text-neutral-300 mt-0.5">
                      {currentUser?.is_gold ? 'Đặc quyền VIP đang hoạt động' : 'Xem ai thích bạn, vô hạn lượt thích'}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 px-2.5 py-1 rounded-full shadow-md shrink-0">
                  {currentUser?.is_gold ? 'VIP' : 'Nâng Cấp'}
                </span>
              </button>
            )}

            {/* 2. BA PHÍM TẮT TIỆN ÍCH: PASSPORT, TÍCH XANH, AN TOÀN */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {onOpenPassport && (
                <button
                  type="button"
                  onClick={onOpenPassport}
                  className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-300 flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm group"
                  title="Hộ chiếu Match Passport™ - Đổi địa điểm khám phá toàn cầu"
                >
                  <Globe className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold truncate max-w-full">
                    Passport
                  </span>
                </button>
              )}

              {onOpenPhotoVerify && (
                <button
                  type="button"
                  onClick={onOpenPhotoVerify}
                  className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-blue-500/50 text-neutral-300 hover:text-blue-300 flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm group"
                  title="Xác minh khuôn mặt AI - Nhận huy hiệu tích xanh"
                >
                  <ShieldCheck className={`w-4 h-4 group-hover:scale-110 transition-transform ${currentUser?.is_verified ? 'text-blue-400' : 'text-amber-400'}`} />
                  <span className="text-[10px] font-bold truncate max-w-full">
                    {currentUser?.is_verified ? 'Đã Tích Xanh' : 'Tích Xanh AI'}
                  </span>
                </button>
              )}

              {onOpenSafetyToolkit && (
                <button
                  type="button"
                  onClick={onOpenSafetyToolkit}
                  className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-rose-500/50 text-neutral-300 hover:text-rose-300 flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm group"
                  title="Bộ công cụ an toàn: Báo cáo, mẹo hẹn hò, chặn liên hệ"
                >
                  <Shield className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold truncate max-w-full">
                    An Toàn
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2. TABS: CÁC TƯƠNG HỢP | TIN NHẮN */}
          <div className="flex px-4 pt-3 pb-1 border-b border-neutral-800 bg-[#111418]">
            <button
              onClick={() => {
                setActiveTab('matches');
                onBackToSwipe();
              }}
              className={`pb-2.5 text-xs font-bold tracking-wide transition-all relative mr-6 ${
                activeTab === 'matches'
                  ? 'text-white border-b-2 border-rose-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Các Tương Hợp ({uniqueMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`pb-2.5 text-xs font-bold tracking-wide transition-all relative ${
                activeTab === 'messages'
                  ? 'text-white border-b-2 border-rose-500'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Tin nhắn
            </button>
          </div>

          {/* 3. THANH TÌM KIẾM TƯƠNG HỢP (SEARCH MATCH BAR) */}
          <div className="px-3 py-2 border-b border-neutral-800/80 bg-[#111418]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tương hợp..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* 4. NỘI DUNG CUỘN */}
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar bg-[#111418]">
            {/* TAB: CÁC TƯƠNG HỢP */}
            {activeTab === 'matches' && (
              <div className="grid grid-cols-3 gap-2">
                {/* THẺ VÀNG LƯỢT THÍCH - HIỂN THỊ CHÍNH XÁC THEO SỐ LƯỢNG NGƯỜI ĐÃ THÍCH */}
                <div
                  onClick={onOpenLikesYou || onOpenGoldModal}
                  className="relative aspect-3/4 rounded-xl overflow-hidden border-2 border-amber-400/90 bg-gradient-to-br from-amber-600/40 via-yellow-700/30 to-amber-950 p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-102 active:scale-98 transition-transform shadow-lg shadow-amber-500/10 group"
                  title={likesCount > 0 ? `Xem danh sách ${likesCount} người đã thích bạn với Match Gold` : 'Chưa có lượt thích mới'}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-400/90 text-neutral-900 font-extrabold text-xs flex items-center justify-center mb-1 shadow-md group-hover:scale-110 transition-transform">
                    {likesCount > 99 ? '99+' : likesCount}
                  </div>
                  <span className="text-[11px] font-bold text-amber-200 leading-tight">
                    {likesCount > 99 ? '99+' : likesCount} Lượt Thích
                  </span>
                </div>

                {/* CÁC THẺ MATCHES */}
                {filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`relative aspect-3/4 rounded-xl overflow-hidden group transition-all text-left bg-neutral-900 ${
                      activeMatch?.id === match.id
                        ? 'ring-2 ring-rose-500 scale-102'
                        : 'hover:scale-102'
                    }`}
                  >
                    <img
                      src={match.photos[0]}
                      alt={match.name}
                      onClick={() => onSelectMatch(match)}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300 cursor-pointer"
                    />

                    {/* Dấu chấm xanh online trong vòng 24h qua */}
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full shadow-sm z-10" />

                    <div
                      onClick={() => onSelectMatch(match)}
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-2 cursor-pointer z-10"
                    >
                      <span className="text-white text-xs font-bold truncate flex items-center gap-1 drop-shadow-md">
                        {match.name}
                        <CheckCircle className="w-3 h-3 text-sky-400 fill-sky-400 shrink-0" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: TIN NHẮN */}
            {activeTab === 'messages' && (
              <div className="space-y-1">
                {filteredMatches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-rose-500 shadow-inner">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <h4 className="text-white text-xs font-bold mb-1">Chưa có tin nhắn nào</h4>
                    <p className="text-neutral-400 text-[11px] max-w-[200px] leading-relaxed">
                      Hãy tương hợp và mở lời chào với các bạn mới nhé!
                    </p>
                  </div>
                )}

                {filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left group ${
                      activeMatch?.id === match.id
                        ? 'bg-neutral-800'
                        : 'hover:bg-neutral-800/60'
                    }`}
                  >
                    {/* Avatar bấm vào mở hồ sơ chi tiết */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile?.(match);
                      }}
                      title={`Bấm để xem hồ sơ của ${match.name}`}
                      className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <img
                        src={match.photos[0]}
                        alt={match.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-rose-500/60"
                      />
                      {/* Trạng thái hoạt động online */}
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#111418] rounded-full"></span>
                    </div>

                    {/* Vùng văn bản bấm vào để vào phòng trò chuyện */}
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match)}
                      className="flex-1 min-w-0 text-left cursor-pointer py-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white truncate flex items-center gap-1">
                          {match.name}
                          <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                        </h4>
                        <span className="text-[10px] text-neutral-500">
                          {match.lastMessageTime ? new Date(match.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {match.lastMessage || 'hi'}
                      </p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
