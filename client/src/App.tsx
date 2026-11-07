import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import type { UserProfile, SwipeResponse } from './types';
import { Sidebar } from './components/Sidebar';
import { CardStack } from './components/CardStack';
import { MatchModal } from './components/MatchModal';
import { ChatBox } from './components/ChatBox';
import { AuthModal } from './components/AuthModal';
import { EditProfileModal } from './components/EditProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { TinderLanding } from './components/TinderLanding';
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { UserProfileView } from './components/UserProfileView';
import { SafetyToolkitModal } from './components/SafetyToolkitModal';
import { GraphTunerModal, type GraphTuningParams } from './components/GraphTunerModal';
import { MatchGoldModal } from './components/MatchGoldModal';
import { LikesYouView } from './components/LikesYouView';
import { AdminDashboard } from './components/AdminDashboard';
import { PassportModal } from './components/PassportModal';
import { PhotoVerificationModal } from './components/PhotoVerificationModal';
import { VipCheckoutModal } from './components/VipCheckoutModal';

const API_BASE = 'http://localhost:5000/api';

export function App() {
  // BẮT BUỘC MỖI LẦN VÀO WEB ĐỀU PHẢI QUA BƯỚC ĐĂNG KÝ / ĐĂNG NHẬP TRƯỚC
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [activeMatch, setActiveMatch] = useState<UserProfile | null>(null);
  const [matchedPopupUser, setMatchedPopupUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Tham số thuật toán gợi ý đồ thị Neo4j (Graph Recommendation Weights & Tuning)
  const [graphParams, setGraphParams] = useState<GraphTuningParams>({
    wInterest: 40,
    wGoal: 25,
    wLifestyle: 15,
    wLocation: 20,
    minScore: 0,
    minAge: 18,
    maxAge: 50
  });
  const [isGraphTunerOpen, setIsGraphTunerOpen] = useState(false);

  // Xóa token lưu sẵn trong trình duyệt khi mở web để luôn bắt đầu từ màn hình Đăng nhập / Đăng ký
  useEffect(() => {
    localStorage.removeItem('tinder_token');
  }, []);

  // Lịch sử quẹt để thực hiện tính năng Rewind (Hồi lại thẻ)
  const [swipeHistory, setSwipeHistory] = useState<{ profile: UserProfile; action: string }[]>([]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode] = useState<'login' | 'register'>('login');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSafetyToolkitOpen, setIsSafetyToolkitOpen] = useState(false);
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [isLikesYouMode, setIsLikesYouMode] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isPhotoVerifyOpen, setIsPhotoVerifyOpen] = useState(false);
  const [isVipCheckoutOpen, setIsVipCheckoutOpen] = useState(false);
  const [broadcastAlert, setBroadcastAlert] = useState<{ title: string; message: string; type: string; createdAt: string } | null>(null);
  const [boostToastMessage, setBoostToastMessage] = useState<string | null>(null);

  const handleTriggerBoost = () => {
    setBoostToastMessage('⚡ Đã kích hoạt Boost! Hồ sơ của bạn được đẩy lên đầu trong 30 phút.');
    setTimeout(() => setBoostToastMessage(null), 3500);
  };
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<UserProfile | null>(null);
  const [isProfileMode, setIsProfileMode] = useState(false);
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);

  const getAuthHeaders = () => {
    const activeToken = token || localStorage.getItem('tinder_token');
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  };

  const loadInitialData = async (tokenOverride?: string, customParams?: GraphTuningParams) => {
    const activeToken = tokenOverride || token || localStorage.getItem('tinder_token');
    if (!activeToken) {
      setLoading(false);
      return;
    }

    const p = customParams || graphParams;
    const query = new URLSearchParams({
      wInterest: String(p.wInterest),
      wGoal: String(p.wGoal),
      wLifestyle: String(p.wLifestyle),
      wLocation: String(p.wLocation),
      minScore: String(p.minScore),
      minAge: String(p.minAge),
      maxAge: String(p.maxAge)
    }).toString();

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${activeToken}` };

      const [meRes, feedRes, matchRes, likesRes] = await Promise.all([
        axios.get(`${API_BASE}/auth/me`, { headers }),
        axios.get(`${API_BASE}/feed?${query}`, { headers }),
        axios.get(`${API_BASE}/matches`, { headers }),
        axios.get(`${API_BASE}/likes-you`, { headers })
      ]);

      setCurrentUser(meRes.data);
      // Đảm bảo không bao giờ có match trùng lặp từ server
      const uniqueInitialMatches: UserProfile[] = Array.from(
        new Map<string, UserProfile>((matchRes.data || []).map((m: UserProfile) => [m.id, m])).values()
      );
      setMatches(uniqueInitialMatches);

      // Loại bỏ người đã tương hợp khỏi hàng chờ thẻ quẹt
      const matchedIds = new Set(uniqueInitialMatches.map((m: UserProfile) => m.id));
      setCards((feedRes.data || []).filter((c: UserProfile) => !matchedIds.has(c.id)));

      // Cập nhật số lượt thích thực tế (Likes You)
      const rawLikes = likesRes.data || [];
      const activeLikes = rawLikes.filter((l: UserProfile) => !matchedIds.has(l.id));
      setLikesCount(activeLikes.length);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu từ Server:', error);
      // Nếu token không hợp lệ, đăng xuất về màn hình đăng nhập
      localStorage.removeItem('tinder_token');
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadInitialData(token);

      const socket = io('http://localhost:5000');
      socket.emit('join_user', currentUser?.id || 'user_me');

      socket.on('system_broadcast', (data: any) => {
        setBroadcastAlert(data);
      });

      socket.on('new_match', (data: any) => {
        if (data?.matchedUser) {
          addUniqueMatch(data.matchedUser, data.chatRoomId);
        }
      });

      socket.on(`match_${currentUser?.id || 'user_me'}`, async (data: any) => {
        if (data?.matchedUser) {
          addUniqueMatch(data.matchedUser, data.chatRoomId);
        } else {
          const headers = getAuthHeaders();
          const matchRes = await axios.get(`${API_BASE}/matches`, { headers });
          const unique: UserProfile[] = Array.from(
            new Map<string, UserProfile>((matchRes.data || []).map((m: UserProfile) => [m.id, m])).values()
          );
          setMatches(unique);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token, currentUser?.id]);

  // Hàm thêm tương hợp DUY NHẤT - Đảm bảo KHÔNG TRÙNG LẶP và hiển thị lập tức ở Các tương hợp & Tin nhắn
  const addUniqueMatch = (matchedUser: UserProfile, chatRoomId?: string) => {
    const fullMatch: UserProfile = {
      ...matchedUser,
      chatRoomId: chatRoomId || matchedUser.chatRoomId || `room_${matchedUser.id}`,
      lastMessage: matchedUser.lastMessage || 'Vừa tương hợp! Hãy gửi lời chào 😊',
      lastMessageTime: matchedUser.lastMessageTime || new Date().toISOString()
    };

    setMatches((prev) => {
      const filtered = prev.filter((m) => m.id !== fullMatch.id);
      return [fullMatch, ...filtered];
    });

    // Bỏ ngay khỏi hàng đợi thẻ quẹt để không bị gặp lại
    setCards((prev) => prev.filter((c) => c.id !== fullMatch.id));

    // Giảm số lượt thích chưa xem nếu vừa match
    setLikesCount((prev) => Math.max(0, prev - 1));

    // Kích hoạt Modal chúc mừng Match!
    setMatchedPopupUser(fullMatch);
  };

  // Quẹt thẻ (Swipe)
  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (cards.length === 0) return;

    const currentCard = cards[0];
    const action = direction === 'left' ? 'PASS' : direction === 'up' ? 'SUPER_LIKE' : 'LIKE';

    // Lưu vào lịch sử để có thể Rewind
    setSwipeHistory((prev) => [...prev, { profile: currentCard, action }]);

    // Bỏ card khỏi giao diện ngay
    setCards((prev) => prev.slice(1));

    try {
      const response = await axios.post<SwipeResponse>(
        `${API_BASE}/swipe`,
        {
          toUserId: currentCard.id,
          action
        },
        { headers: getAuthHeaders() }
      );

      // Nếu 2 bên cùng thích nhau -> Nổ Modal chúc mừng Match & hiển thị trên sidebar Các tương hợp + Tin nhắn!
      if (response.data.isMatch && response.data.matchedUser) {
        addUniqueMatch(response.data.matchedUser, response.data.chatRoomId);
      }
    } catch (error) {
      console.error('Lỗi khi gửi hành động quẹt:', error);
    }
  };

  // Hoàn tác thẻ vừa quẹt (Rewind)
  const handleRewind = async () => {
    if (swipeHistory.length === 0) return;

    const lastSwiped = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));

    // Đưa thẻ quay trở lại vị trí đầu tiên của bảng tin
    setCards((prev) => [lastSwiped.profile, ...prev]);

    try {
      await axios.post(
        `${API_BASE}/rewind`,
        { targetUserId: lastSwiped.profile.id },
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      console.error('Lỗi khi hoàn tác lượt quẹt:', error);
    }
  };

  // Nạp lại danh sách khi quẹt hết hoặc khi thay đổi thông số thuật toán Neo4j
  const handleReload = async (customParams?: GraphTuningParams) => {
    try {
      await axios.post(`${API_BASE}/reset`, {}, { headers: getAuthHeaders() });
      await loadInitialData(undefined, customParams || graphParams);
      setSwipeHistory([]);
    } catch (error) {
      console.error('Lỗi khi tải lại feed:', error);
      await loadInitialData(undefined, customParams || graphParams);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tinder_token');
    setToken(null);
    setCurrentUser(null);
    setCards([]);
    setMatches([]);
    setIsSettingsOpen(false);
  };

  // NẾU ĐANG Ở CHẾ ĐỘ QUẢN TRỊ ADMIN -> HIỂN THỊ ADMIN DASHBOARD
  if (isAdminOpen) {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onBackToApp={() => setIsAdminOpen(false)}
        onLogout={handleLogout}
      />
    );
  }

  // NẾU CHƯA ĐĂNG NHẬP (KHÔNG CÓ TOKEN) -> HIỂN THỊ MÀN HÌNH CHÀO MỪNG ĐĂNG KÝ / ĐĂNG NHẬP CHUẨN TINDER
  if (!token) {
    return (
      <TinderLanding
        onAuthSuccess={(newToken, user) => {
          setToken(newToken);
          setCurrentUser(user);
          if (user.role === 'admin') {
            setIsAdminOpen(true);
          } else {
            setIsAdminOpen(false);
            loadInitialData(newToken);
          }
        }}
      />
    );
  }

  if (loading && !currentUser) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neutral-300 font-medium tracking-wide">
          Đang kết nối cơ sở dữ liệu đồ thị Neo4j AuraDB...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black font-sans">
      {/* 1. Sidebar bên trái (360px - Chuẩn Tinder Web) */}
      <Sidebar
        currentUser={currentUser}
        matches={matches}
        activeMatch={activeMatch}
        isProfileMode={isProfileMode}
        onGoToProfile={() => {
          setIsProfileMode(true);
          setIsLikesYouMode(false);
          setActiveMatch(null);
        }}
        onSelectMatch={(match) => {
          setIsProfileMode(false);
          setIsLikesYouMode(false);
          setActiveMatch(match);
        }}
        onBackToSwipe={() => {
          setIsProfileMode(false);
          setIsLikesYouMode(false);
          setActiveMatch(null);
        }}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSafetyToolkit={() => setIsSafetyToolkitOpen(true)}
        onOpenGoldModal={() => setIsGoldModalOpen(true)}
        onOpenLikesYou={() => {
          setIsLikesYouMode(true);
          setIsProfileMode(false);
          setActiveMatch(null);
        }}
        likesCount={likesCount}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onTriggerBoost={handleTriggerBoost}
        onOpenGraphTuner={() => setIsGraphTunerOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={(user) => setSelectedProfileForModal(user)}
        shortcutsEnabled={shortcutsEnabled}
        onToggleShortcuts={() => setShortcutsEnabled((prev) => !prev)}
      />

      {/* 2. Main Stage bên phải */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-black relative">
        {/* Thông báo đẩy toàn hệ thống thời gian thực từ Quản Trị Viên (System Broadcast) */}
        {broadcastAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl p-4 rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white shadow-2xl border border-white/20 flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📢</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide">
                    {broadcastAlert.title}
                  </span>
                  <span className="text-[10px] font-extrabold bg-black/30 px-2 py-0.5 rounded-full">
                    {broadcastAlert.type || 'HỆ THỐNG'}
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  {broadcastAlert.message}
                </p>
                <span className="text-[9px] text-white/60 block mt-1">
                  Phát lúc: {new Date(broadcastAlert.createdAt).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setBroadcastAlert(null)}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {boostToastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-purple-300/60 animate-bounce">
            <span>{boostToastMessage}</span>
          </div>
        )}

        {isProfileMode && currentUser ? (
          <UserProfileView
            user={currentUser}
            onUpdateUser={(updated) => setCurrentUser(updated)}
            onBackToSwipe={() => setIsProfileMode(false)}
          />
        ) : isLikesYouMode ? (
          <LikesYouView
            currentUser={currentUser}
            existingMatches={matches}
            onBackToSwipe={() => setIsLikesYouMode(false)}
            onMatchCreated={(matchedUser, chatRoomId) => {
              addUniqueMatch(matchedUser, chatRoomId);
            }}
            onLikesCountChange={(count) => setLikesCount(count)}
          />
        ) : activeMatch ? (
          <ChatBox
            currentUser={currentUser}
            partner={activeMatch}
            onBack={() => setActiveMatch(null)}
            onUnmatched={(partnerId) => {
              setMatches((prev) => prev.filter((m) => m.id !== partnerId));
              setActiveMatch(null);
            }}
            onLastMessageUpdate={(partnerId, lastMessage, lastMessageTime) => {
              setMatches((prev) =>
                prev.map((m) =>
                  m.id === partnerId
                    ? { ...m, lastMessage, lastMessageTime }
                    : m
                )
              );
            }}
          />
        ) : (
          <CardStack
            cards={cards}
            currentUser={currentUser}
            onSwipe={handleSwipe}
            onRewind={handleRewind}
            canRewind={swipeHistory.length > 0}
            onReload={() => handleReload()}
            onTriggerBoost={handleTriggerBoost}
          />
        )}
      </main>

      {/* 2.5. Modal Match Gold VIP */}
      <MatchGoldModal
        isOpen={isGoldModalOpen}
        onClose={() => setIsGoldModalOpen(false)}
        onActivateGold={() => {
          setIsGoldModalOpen(false);
          setIsLikesYouMode(true);
          setBoostToastMessage('🎉 Đã kích hoạt Tinder Gold! Đang mở danh sách Ai Đã Thích Bạn.');
          setTimeout(() => setBoostToastMessage(null), 3500);
        }}
      />

      {/* 2.5. Modal Tuỳ Chỉnh Trọng Số Thuật Toán Gợi Ý Neo4j */}
      <GraphTunerModal
        isOpen={isGraphTunerOpen}
        onClose={() => setIsGraphTunerOpen(false)}
        currentParams={graphParams}
        onApplyParams={(newParams) => {
          setGraphParams(newParams);
          handleReload(newParams);
        }}
      />

      {/* 3. Modal chúc mừng Match ("It's a Match! 🎉") */}
      <MatchModal
        currentUser={currentUser}
        matchedUser={matchedPopupUser}
        onClose={() => setMatchedPopupUser(null)}
        onStartChat={(user) => {
          setMatchedPopupUser(null);
          setActiveMatch(user);
        }}
      />

      {/* 4. Modal Đăng nhập / Đăng ký */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newToken, user) => {
          setToken(newToken);
          setCurrentUser(user);
          if (user.role === 'admin') {
            setIsAdminOpen(true);
          } else {
            setIsAdminOpen(false);
            loadInitialData(newToken);
          }
        }}
      />

      {/* 5. Modal Sửa Hồ sơ Chuẩn Tinder (Lưới 9 ô ảnh, upload trực tiếp, bio, sở thích, cài đặt tìm kiếm, chặn) */}
      {currentUser && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          user={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onUpdate={(updated) => setCurrentUser(updated)}
        />
      )}

      {/* 6. Modal Cài đặt Tìm kiếm & Chặn liên hệ */}
      {currentUser && (
        <SettingsModal
          isOpen={isSettingsOpen}
          user={currentUser}
          onClose={() => setIsSettingsOpen(false)}
          onUpdatePreferences={(pref) => {
            setCurrentUser({ ...currentUser, ...pref });
            handleReload();
          }}
          onLogout={handleLogout}
        />
      )}

      {/* 7. Modal Bộ Công Cụ An Toàn (Icon Khiên: Báo cáo, Bí quyết an toàn, Điều khiển tin nhắn) */}
      <SafetyToolkitModal
        isOpen={isSafetyToolkitOpen}
        onClose={() => setIsSafetyToolkitOpen(false)}
      />

      {/* 8. Modal Chi Tiết Toàn Bộ Hồ Sơ Đối Phương */}
      <ProfileDetailModal
        isOpen={!!selectedProfileForModal}
        profile={selectedProfileForModal}
        onClose={() => setSelectedProfileForModal(null)}
        onSendMessage={() => {
          if (selectedProfileForModal) {
            setActiveMatch(selectedProfileForModal);
            setIsProfileMode(false);
          }
          setSelectedProfileForModal(null);
        }}
      />

      {/* 9. Modal Hộ Chiếu Tinder Passport™ (Đổi vị trí toàn cầu) */}
      <PassportModal
        isOpen={isPassportOpen}
        currentUser={currentUser}
        onClose={() => setIsPassportOpen(false)}
        onLocationUpdated={(newCity, newCountry) => {
          if (currentUser) {
            setCurrentUser({
              ...currentUser,
              city: newCity,
              passport_city: newCity,
              passport_country: newCountry
            });
            handleReload();
          }
        }}
      />

      {/* 10. Modal Xác Minh Khuôn Mặt AI (Tích Xanh Chính Chủ) */}
      <PhotoVerificationModal
        isOpen={isPhotoVerifyOpen}
        currentUser={currentUser}
        onClose={() => setIsPhotoVerifyOpen(false)}
        onSuccess={(updated) => {
          setCurrentUser(updated);
          setBoostToastMessage('✨ Chúc mừng! Hồ sơ của bạn đã nhận Tích Xanh Chính Chủ Tinder AI.');
          setTimeout(() => setBoostToastMessage(null), 3500);
        }}
      />

      {/* 11. Modal Nâng Cấp Tinder VIP (Plus, Gold, Platinum) */}
      <VipCheckoutModal
        isOpen={isVipCheckoutOpen}
        currentUser={currentUser}
        onClose={() => setIsVipCheckoutOpen(false)}
        onSuccess={(updated) => {
          setCurrentUser(updated);
          setIsGoldModalOpen(false);
          setBoostToastMessage('👑 Đặc quyền Tinder VIP đã được kích hoạt thành công!');
          setTimeout(() => setBoostToastMessage(null), 3500);
        }}
      />
    </div>
  );
}

export default App;
