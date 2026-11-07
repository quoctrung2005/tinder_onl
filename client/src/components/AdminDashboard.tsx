import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Users, ShieldAlert, Zap, Database, MessageCircle,
  RefreshCw, Search, ArrowLeft, Sun, Moon, LogOut, CheckCircle, Ban,
  Trash2, Eye, Sparkles, Heart, Activity, ShieldCheck, Flame, Plus,
  Edit, Key, Download, X, MessageSquare,
  CreditCard, Radio, FileText, Sliders, DollarSign, TrendingUp, CheckCircle2, Save, Send
} from 'lucide-react';
import type { UserProfile } from '../types';
import { ProfileDetailModal } from './ProfileDetailModal';

interface AdminStats {
  totalUsers: number;
  maleCount: number;
  femaleCount: number;
  verifiedCount: number;
  bannedCount: number;
  adminCount: number;
  totalMatches: number;
  totalLikes: number;
  totalPasses: number;
  totalReports: number;
  totalMessages: number;
  dbLatencyMs: number;
  ageDemographics?: {
    '18-21': number;
    '22-25': number;
    '26-29': number;
    '30+': number;
  };
  topInterests: { name: string; count: number }[];
  cityDistribution: { city: string; count: number }[];
  goalsDistribution?: { goal: string; count: number }[];
  recentMatches?: {
    userA: string;
    avatarA?: string;
    userB: string;
    avatarB?: string;
    matchedAt: string;
  }[];
}

interface ReportItem {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  targetId: string;
  targetName: string;
  targetAvatar?: string;
  targetBanned: boolean;
  reason: string;
  createdAt: string;
}

interface ConversationItem {
  roomId: string;
  userA: { id: string; name: string; avatar?: string };
  userB: { id: string; name: string; avatar?: string };
  messageCount: number;
  lastMessage: string;
  lastActive: string;
}

interface ChatMessageItem {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  sentAt: string;
}

interface AdminDashboardProps {
  currentUser?: UserProfile | null;
  onBackToApp: () => void;
  onLogout?: () => void;
}

const API_BASE = 'http://localhost:5000/api';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onBackToApp,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'conversations' | 'reports' | 'force_match' | 'system' | 'revenue' | 'broadcast' | 'audit' | 'config'>('overview');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'banned' | 'admin'>('all');
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modals Quản lý
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [inspectingRoom, setInspectingRoom] = useState<ConversationItem | null>(null);
  const [roomMessages, setRoomMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Quản lý Doanh thu & VIP
  const [revenueData, setRevenueData] = useState<{
    totalRevenue: number;
    mrr: number;
    goldSubscribers: number;
    platinumSubscribers: number;
    conversionRate: string;
    transactions: {
      id: string;
      userName: string;
      userAvatar?: string;
      packageType: string;
      paymentMethod: string;
      amount: number;
      status: string;
      createdAt: string;
    }[];
  } | null>(null);

  // Nhật ký Quản trị viên (Audit Logs)
  const [auditLogs, setAuditLogs] = useState<{
    id: string;
    adminName: string;
    action: string;
    target: string;
    ip: string;
    timestamp: string;
  }[]>([]);

  // Phát sóng Thông báo (System Broadcast)
  const [broadcastForm, setBroadcastForm] = useState({
    title: 'SỰ KIỆN GOLDEN HOUR TỐI NAY',
    message: 'Tất cả tài khoản online từ 20:00 - 22:00 sẽ được tặng miễn phí 1 lượt Tăng tốc Boost & 5 Siêu Thích!',
    type: 'EVENT'
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Cấu hình Nền tảng & Thuật toán Đồ thị (System Config)
  const [systemConfig, setSystemConfig] = useState({
    wInterest: 35,
    wGoal: 25,
    wLifestyle: 20,
    wLocation: 20,
    freeDailySwipes: 50,
    enableNsfwFilter: true,
    enablePassport: true,
    enableVideoCall: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Form Ghép đôi thủ công
  const [forceUserA, setForceUserA] = useState<string>('');
  const [forceUserB, setForceUserB] = useState<string>('');
  const [matchingInProgress, setMatchingInProgress] = useState<boolean>(false);

  // Form Thêm Người Dùng Mới
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    age: 22,
    gender: 'FEMALE',
    city: 'Hồ Chí Minh',
    bio: 'Thành viên mới gia nhập Match.',
    role: 'user',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    interests: 'Cà phê, Du lịch, Âm nhạc'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tinder_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Tải dữ liệu Doanh thu & Giao dịch
  const fetchRevenue = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/revenue`, { headers: getAuthHeaders() });
      setRevenueData(res.data);
    } catch (err: any) {
      console.error('Lỗi lấy dữ liệu doanh thu:', err);
    }
  };

  // Tải Nhật ký Quản trị viên
  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/audit-logs`, { headers: getAuthHeaders() });
      setAuditLogs(res.data || []);
    } catch (err: any) {
      console.error('Lỗi lấy nhật ký kiểm toán:', err);
    }
  };

  // Tải Cấu hình Hệ thống
  const fetchSystemConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/config`, { headers: getAuthHeaders() });
      if (res.data) setSystemConfig(res.data);
    } catch (err: any) {
      console.error('Lỗi lấy cấu hình hệ thống:', err);
    }
  };

  // Xử lý Phát sóng Thông báo trực tiếp đến toàn bộ người dùng
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      showToast('⚠️ Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }
    try {
      setSendingBroadcast(true);
      const res = await axios.post(`${API_BASE}/admin/broadcast`, broadcastForm, {
        headers: getAuthHeaders()
      });
      showToast('📢 ' + (res.data.message || 'Đã phát sóng thông báo thành công!'));
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Xử lý Cập nhật Cấu hình Nền tảng & Tham số Thuật toán
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await axios.put(`${API_BASE}/admin/config`, systemConfig, {
        headers: getAuthHeaders()
      });
      showToast('⚙️ ' + (res.data.message || 'Đã lưu cấu hình thành công!'));
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingConfig(false);
    }
  };

  // Kích hoạt nạp dữ liệu theo Tab
  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenue();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'config') fetchSystemConfig();
  }, [activeTab]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const [statsRes, usersRes, reportsRes, convsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats`, { headers }),
        axios.get(`${API_BASE}/admin/users`, { headers }),
        axios.get(`${API_BASE}/admin/reports`, { headers }),
        axios.get(`${API_BASE}/admin/conversations`, { headers })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setReports(reportsRes.data || []);
      setConversations(convsRes.data || []);
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu Admin:', err);
      showToast('❌ Lỗi xác thực hoặc máy chủ: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Kiểm tra quyền Quản trị viên
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen w-screen bg-[#0b0e14] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-3">Quyền truy cập bị từ chối</h2>
        <p className="text-neutral-400 text-sm max-w-md leading-relaxed mb-8">
          Tài khoản hiện tại <strong className="text-white font-semibold">({currentUser.email})</strong> không có vai trò Quản trị viên (Admin). Bạn không được phép truy cập trang điều khiển này.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onBackToApp}
            className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Quay lại Match
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-6 py-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm border border-neutral-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    );
  }

  // Cấp / Thu hồi tích xanh
  const handleToggleVerify = async (userId: string, userName: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${userId}/verify`, {}, { headers: getAuthHeaders() });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: res.data.is_verified } : u))
      );
      showToast(res.data.message || `Đã đổi trạng thái tích xanh cho ${userName}`);
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Khóa / Mở khóa tài khoản
  const handleToggleBan = async (userId: string, userName: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${userId}/ban`, {}, { headers: getAuthHeaders() });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_banned: res.data.is_banned } : u))
      );
      setReports((prev) =>
        prev.map((r) => (r.targetId === userId ? { ...r, targetBanned: res.data.is_banned } : r))
      );
      showToast(res.data.message || `Đã đổi trạng thái khóa tài khoản ${userName}`);
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Đổi vai trò Admin <-> User
  const handleToggleRole = async (userId: string, userName: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${userId}/role`, {}, { headers: getAuthHeaders() });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.role } : u))
      );
      showToast(res.data.message || `Đã cập nhật quyền cho ${userName}`);
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Xóa người dùng
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${userName}" và toàn bộ quan hệ trong Neo4j? Thao tác không thể hoàn tác.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`, { headers: getAuthHeaders() });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`🗑️ Đã xóa người dùng "${userName}" thành công.`);
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý tạo người dùng mới
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const interestArr = newUserForm.interests.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await axios.post(`${API_BASE}/admin/users`, {
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        age: Number(newUserForm.age),
        gender: newUserForm.gender,
        city: newUserForm.city,
        bio: newUserForm.bio,
        role: newUserForm.role,
        photos: [newUserForm.photoUrl],
        interests: interestArr
      }, { headers: getAuthHeaders() });

      showToast('🎉 ' + res.data.message);
      setIsCreateUserOpen(false);
      setNewUserForm({
        name: '',
        email: '',
        password: 'password123',
        age: 22,
        gender: 'FEMALE',
        city: 'Hồ Chí Minh',
        bio: 'Thành viên mới gia nhập Match.',
        role: 'user',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        interests: 'Cà phê, Du lịch, Âm nhạc'
      });
      loadData();
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý cập nhật thông tin người dùng
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await axios.put(`${API_BASE}/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        age: editingUser.age,
        gender: editingUser.gender,
        city: editingUser.city,
        bio: editingUser.bio,
        job: editingUser.job,
        company: editingUser.company,
        relationship_goal: editingUser.relationship_goal,
        role: editingUser.role,
        is_verified: editingUser.is_verified,
        is_banned: editingUser.is_banned
      }, { headers: getAuthHeaders() });

      showToast('✅ ' + res.data.message);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý đặt lại mật khẩu
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !newPasswordInput) return;
    try {
      const res = await axios.post(`${API_BASE}/admin/users/${passwordResetUser.id}/reset-password`, {
        newPassword: newPasswordInput
      }, { headers: getAuthHeaders() });

      showToast('🔑 ' + res.data.message);
      setPasswordResetUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Mở thanh tra kiểm duyệt tin nhắn trong phòng chat
  const handleInspectRoom = async (conv: ConversationItem) => {
    setInspectingRoom(conv);
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/conversations/${conv.roomId}/messages`, {
        headers: getAuthHeaders()
      });
      setRoomMessages(res.data || []);
    } catch (err: any) {
      showToast('❌ Lỗi lấy tin nhắn: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingMessages(false);
    }
  };

  // Xóa tin nhắn vi phạm
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Xác nhận xóa tin nhắn này khỏi phòng chat?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/messages/${msgId}`, { headers: getAuthHeaders() });
      setRoomMessages((prev) => prev.filter((m) => m.id !== msgId));
      showToast('🗑️ Đã xóa tin nhắn vi phạm thành công.');
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    }
  };

  // Ghép đôi thủ công
  const handleForceMatch = async () => {
    if (!forceUserA || !forceUserB) {
      showToast('⚠️ Vui lòng chọn đủ 2 người dùng.');
      return;
    }
    if (forceUserA === forceUserB) {
      showToast('⚠️ Không thể ghép đôi một người với chính họ.');
      return;
    }

    try {
      setMatchingInProgress(true);
      const res = await axios.post(`${API_BASE}/admin/force-match`, {
        userAId: forceUserA,
        userBId: forceUserB
      }, { headers: getAuthHeaders() });

      showToast('🎉 ' + res.data.message);
      setForceUserA('');
      setForceUserB('');
      loadData();
    } catch (err: any) {
      showToast('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setMatchingInProgress(false);
    }
  };

  // Xuất dữ liệu người dùng ra CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Tên', 'Email', 'Tuổi', 'Giới tính', 'Thành phố', 'Vai trò', 'Tích xanh', 'Bị khóa', 'Số Likes', 'Số Matches'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email || '',
      u.age || '',
      u.gender,
      `"${u.city || ''}"`,
      u.role || 'user',
      u.is_verified ? 'Có' : 'Không',
      u.is_banned ? 'Có' : 'Không',
      u.likesReceived || 0,
      u.matchesCount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `match_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Đã xuất báo cáo người dùng CSV thành công!');
  };

  // Lọc người dùng
  const filteredUsers = users.filter((u) => {
    const q = (searchQuery || sidebarSearch).toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q));

    const matchGender = !genderFilter || u.gender === genderFilter;

    let matchStatus = true;
    if (statusFilter === 'verified') matchStatus = Boolean(u.is_verified);
    if (statusFilter === 'banned') matchStatus = Boolean(u.is_banned);
    if (statusFilter === 'admin') matchStatus = u.role === 'admin';

    return matchSearch && matchGender && matchStatus;
  });

  const isDark = themeMode === 'dark';

  return (
    <div className={`min-h-screen w-screen font-sans select-none overflow-x-hidden flex transition-colors duration-300 ${
      isDark ? 'bg-[#090d16] text-neutral-100' : 'bg-[#eef2f6] text-slate-800'
    }`}>
      {/* =========================================================================
          1. FLOATING MODERN SIDEBAR (KHỚP VIDEO TIKTOK @snakecode0)
         ========================================================================= */}
      <aside className={`w-72 shrink-0 m-4 rounded-3xl flex flex-col justify-between p-5 border shadow-2xl transition-all duration-300 z-20 ${
        isDark
          ? 'bg-[#121824]/90 backdrop-blur-xl border-neutral-700/50 shadow-black/60'
          : 'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-slate-300/40'
      }`}>
        {/* PHẦN TRÊN CỦA SIDEBAR */}
        <div className="space-y-4">
          {/* 1.1 THÔNG TIN ADMIN PROFILE (Avatar, Name, Role) */}
          <div className="flex items-center justify-between pb-3 border-b border-inherit/40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentUser?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                  alt="Admin Avatar"
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-rose-500/50 shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-inherit" />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-xs font-extrabold truncate flex items-center gap-1">
                  <span>{currentUser?.name || 'Quản Trị Viên'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                  isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-600'
                }`}>
                  {currentUser?.role === 'admin' ? 'Admin Root' : 'Admin'}
                </span>
              </div>
            </div>

            <button
              onClick={onBackToApp}
              title="Vào giao diện Quẹt thẻ Match"
              className={`p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-rose-500" />
            </button>
          </div>

          {/* 1.2 Ô TÌM KIẾM SIDEBAR */}
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-3 ${
              isDark ? 'text-neutral-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search dashboard..."
              className={`w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-2xl border transition-all focus:outline-none ${
                isDark
                  ? 'bg-[#182030] border-neutral-700/60 text-white placeholder-neutral-500 focus:border-rose-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-rose-500'
              }`}
            />
          </div>

          {/* 1.3 DANH SÁCH MENU ĐIỀU HƯỚNG HIỆN ĐẠI (Menu Items with Badges) */}
          <nav className="space-y-1">
            {[
              {
                id: 'overview',
                label: 'Dashboard',
                sub: 'Tổng quan & KPIs',
                icon: LayoutDashboard,
                badge: stats ? `${stats.totalUsers} users` : undefined
              },
              {
                id: 'users',
                label: 'Customers',
                sub: 'Quản lý người dùng',
                icon: Users,
                badge: users.length > 0 ? users.length : undefined
              },
              {
                id: 'conversations',
                label: 'Conversations',
                sub: 'Giám sát tin nhắn',
                icon: MessageCircle,
                badge: conversations.length > 0 ? conversations.length : undefined
              },
              {
                id: 'reports',
                label: 'Tickets & Reports',
                sub: 'Kiểm duyệt vi phạm',
                icon: ShieldAlert,
                badge: reports.length > 0 ? reports.length : undefined,
                badgeColor: reports.length > 0 ? 'bg-rose-500 text-white' : undefined
              },
              {
                id: 'revenue',
                label: 'Revenue & VIP',
                sub: 'Tài chính & Doanh thu',
                icon: CreditCard,
                badge: 'VNĐ'
              },
              {
                id: 'broadcast',
                label: 'Live Broadcast',
                sub: 'Phát sóng toàn mạng',
                icon: Radio,
                badge: 'Realtime',
                badgeColor: 'bg-indigo-500 text-white'
              },
              {
                id: 'audit',
                label: 'Audit Trail',
                sub: 'Nhật ký can thiệp',
                icon: FileText,
                badge: 'Logs'
              },
              {
                id: 'config',
                label: 'System Config',
                sub: 'Cấu hình tham số AI',
                icon: Sliders,
                badge: 'Tuners'
              },
              {
                id: 'force_match',
                label: 'Force Match',
                sub: 'Ghép đôi đồ thị thủ công',
                icon: Zap,
                badge: 'Pro'
              },
              {
                id: 'system',
                label: 'Neo4j Database',
                sub: 'CSDL Đồ thị & Hệ thống',
                icon: Database,
                badge: stats ? `${stats.dbLatencyMs}ms` : 'AuraDB'
              }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group ${
                    isActive
                      ? isDark
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-sm'
                        : 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                      : isDark
                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-rose-500' : 'text-neutral-400 group-hover:text-rose-500'
                    }`} />
                    <div className="text-left">
                      <div className="font-extrabold">{item.label}</div>
                      <div className={`text-[10px] font-normal ${
                        isActive ? (isDark ? 'text-rose-300/80' : 'text-rose-500/80') : 'text-neutral-500'
                      }`}>
                        {item.sub}
                      </div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                      item.badgeColor || (
                        isActive
                          ? (isDark ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white')
                          : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-slate-200 text-slate-600')
                      )
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* 1.4 THANH CÔNG CỤ 4 NÚT VUÔNG BO GÓC DƯỚI CÙNG */}
        <div className="pt-4 border-t border-inherit/40 flex items-center justify-between gap-2">
          {/* Nút 1: Chuyển đổi Dark / Light Theme */}
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            title={isDark ? 'Chuyển sang Giao diện Sáng (Light)' : 'Chuyển sang Giao diện Tối (Dark)'}
            className={`flex-1 p-2.5 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
              isDark
                ? 'bg-[#182030] hover:bg-neutral-800 text-amber-400 border-neutral-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Nút 2: Làm mới dữ liệu */}
          <button
            onClick={loadData}
            disabled={loading}
            title="Làm mới dữ liệu từ CSDL Neo4j"
            className={`flex-1 p-2.5 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border disabled:opacity-50 ${
              isDark
                ? 'bg-[#182030] hover:bg-neutral-800 text-emerald-400 border-neutral-700/60'
                : 'bg-slate-100 hover:bg-slate-200 text-emerald-600 border-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút 3: Ghép đôi nhanh (Shortcut) */}
          <button
            onClick={() => setActiveTab('force_match')}
            title="Mở công cụ Ghép đôi thủ công"
            className={`flex-1 p-2.5 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
              activeTab === 'force_match'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                : isDark
                  ? 'bg-[#182030] hover:bg-neutral-800 text-rose-400 border-neutral-700/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-rose-600 border-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
          </button>

          {/* Nút 4: Đăng xuất (Logout) */}
          <button
            onClick={onLogout || onBackToApp}
            title="Đăng xuất khỏi hệ thống"
            className={`flex-1 p-2.5 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border ${
              isDark
                ? 'bg-[#182030] hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border-neutral-700/60'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border-slate-200'
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          2. KHU VỰC NỘI DUNG CHÍNH CỦA DASHBOARD (MAIN STAGE)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden p-4 pl-0">
        <div className={`flex-1 rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-[#0f141f]/90 backdrop-blur-xl border-neutral-700/50 shadow-black/60'
            : 'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-slate-300/40'
        }`}>
          {/* 2.1 HEADER CỦA BẢNG ĐIỀU KHIỂN */}
          <header className={`h-16 px-6 border-b flex items-center justify-between shrink-0 transition-colors ${
            isDark ? 'border-neutral-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-neutral-400">Admin</span>
              <span className="text-xs text-neutral-500">/</span>
              <span className="text-sm font-extrabold capitalize text-rose-500">
                {activeTab === 'overview' && 'Dashboard Overview & KPIs'}
                {activeTab === 'users' && 'User Management & Directory'}
                {activeTab === 'conversations' && 'Live Chat & Message Auditing'}
                {activeTab === 'reports' && 'Reports & Moderation Queue'}
                {activeTab === 'force_match' && 'Bilateral Force Match'}
                {activeTab === 'system' && 'Neo4j AuraDB & Infrastructure'}
                {activeTab === 'revenue' && 'Revenue & VIP Financial Analytics'}
                {activeTab === 'broadcast' && 'System-wide Real-time Announcement Broadcaster'}
                {activeTab === 'audit' && 'Administrative Security Audit Trail'}
                {activeTab === 'config' && 'AI Graph Engine & Global Platform Configuration'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Trạng thái Neo4j AuraDB Online */}
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Neo4j AuraDB 5.27</span>
                {stats && <span className="font-mono text-[10px] opacity-80">({stats.dbLatencyMs}ms)</span>}
              </div>

              {/* Nút Vào Match Web */}
              <button
                onClick={onBackToApp}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Vào Match Web</span>
              </button>
            </div>
          </header>

          {/* Toast Notification */}
          {actionMessage && (
            <div className="fixed top-8 right-8 z-50 px-5 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* 2.2 KHỐI NỘI DUNG CUỘN THEO TAB */}
          <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {/* ===================== TAB 1: TỔNG QUAN & KPIS ===================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-6xl mx-auto">
                {/* 6 Thẻ KPI hiện đại */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {[
                    { label: 'Tổng Users', val: stats?.totalUsers || 0, icon: Users, color: 'from-blue-500 to-indigo-500', trend: `${stats?.adminCount || 1} Admins` },
                    { label: 'Đã Xác Thực', val: stats?.verifiedCount || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-500', trend: 'Tích xanh' },
                    { label: 'Cặp Matches', val: stats?.totalMatches || 0, icon: Heart, color: 'from-rose-500 to-pink-500', trend: 'Mutual' },
                    { label: 'Lượt Thích', val: stats?.totalLikes || 0, icon: Flame, color: 'from-amber-500 to-orange-500', trend: 'Likes' },
                    { label: 'Tin Nhắn', val: stats?.totalMessages || 0, icon: MessageCircle, color: 'from-purple-500 to-violet-500', trend: 'Realtime' },
                    { label: 'Neo4j Latency', val: `${stats?.dbLatencyMs || 0}ms`, icon: Activity, color: 'from-cyan-500 to-blue-500', trend: 'AuraDB Cloud' }
                  ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-3xl border transition-all hover:scale-102 ${
                          isDark
                            ? 'bg-[#151c2c] border-neutral-800 shadow-md'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{kpi.label}</span>
                          <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-sm`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="text-xl font-black">{kpi.val}</div>
                        <div className="text-[10px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                          <span>•</span>
                          <span>{kpi.trend}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hàng 2: Nhóm Tuổi & Phân Bố Mục Tiêu Hẹn Hò */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Độ tuổi (Age Demographics) */}
                  <div className={`p-6 rounded-3xl border ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-500" />
                      <span>Phân Bố Độ Tuổi Thành Viên (Age Demographics)</span>
                    </h3>
                    <div className="space-y-3.5">
                      {Object.entries(stats?.ageDemographics || { '18-21': 6, '22-25': 18, '26-29': 5, '30+': 2 }).map(([ageRange, count]) => {
                        const total = stats?.totalUsers || 31;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={ageRange}>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>Tuổi {ageRange}</span>
                              <span className="text-neutral-400">{count} người ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mục tiêu hẹn hò (Relationship Goals) */}
                  <div className={`p-6 rounded-3xl border ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>Mục Tiêu Hẹn Hò (Relationship Goals)</span>
                    </h3>
                    <div className="space-y-3">
                      {(stats?.goalsDistribution && stats.goalsDistribution.length > 0 ? stats.goalsDistribution : [
                        { goal: '💘 Tìm người yêu lâu dài', count: 18 },
                        { goal: '🥂 Vừa lâu dài vừa ngắn hạn', count: 8 },
                        { goal: '☕ Tìm bạn mới / Trò chuyện', count: 4 }
                      ]).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                          <span className="truncate pr-2">{item.goal}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold shrink-0">
                            {item.count} người
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hàng 3: Tỷ lệ Nam/Nữ & Phân bố Thành phố */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Phân bố Giới tính */}
                  <div className={`p-6 rounded-3xl border ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>Tỷ Lệ Giới Tính Trên Đồ Thị</span>
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <span>Nam (MALE)</span>
                          </span>
                          <span>{stats?.maleCount || 0} ({stats?.totalUsers ? Math.round(((stats?.maleCount || 0) / stats.totalUsers) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                            style={{ width: `${stats?.totalUsers ? ((stats?.maleCount || 0) / stats.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="flex items-center gap-1.5 text-pink-400">
                            <span>Nữ (FEMALE)</span>
                          </span>
                          <span>{stats?.femaleCount || 0} ({stats?.totalUsers ? Math.round(((stats?.femaleCount || 0) / stats.totalUsers) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000"
                            style={{ width: `${stats?.totalUsers ? ((stats?.femaleCount || 0) / stats.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phân bố Thành phố */}
                  <div className={`p-6 rounded-3xl border ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Phân Bố Địa Lý & Thành Phố</span>
                    </h3>
                    <div className="space-y-2.5">
                      {(stats?.cityDistribution || []).map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-neutral-400">{c.city}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 rounded-full bg-neutral-800 overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${stats?.totalUsers ? (c.count / stats.totalUsers) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold w-6 text-right">{c.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hàng 4: Top Sở thích */}
                <div className={`p-6 rounded-3xl border ${
                  isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Top Sở Thích Được Liên Kết Đồ Thị Nhiều Nhất (:HAS_INTEREST)</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(stats?.topInterests || []).map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                          isDark ? 'bg-[#192236] border-neutral-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black">
                          {item.count} users
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 2: QUẢN LÝ NGƯỜI DÙNG ===================== */}
            {activeTab === 'users' && (
              <div className="space-y-5 max-w-6xl mx-auto">
                {/* Thanh công cụ tìm kiếm, lọc và thêm mới */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên, email, thành phố..."
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium border focus:outline-none focus:border-rose-500 ${
                        isDark ? 'bg-[#151c2c] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none ${
                        isDark ? 'bg-[#151c2c] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">Tất cả giới tính</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold border focus:outline-none ${
                        isDark ? 'bg-[#151c2c] border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="verified">Đã xác minh (Tích xanh)</option>
                      <option value="banned">Bị khóa (Banned)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>

                    {/* Nút Xuất CSV */}
                    <button
                      onClick={handleExportCSV}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                        isDark ? 'bg-[#182030] border-neutral-700 text-neutral-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                      title="Xuất dữ liệu người dùng ra file CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất CSV</span>
                    </button>

                    {/* Nút Thêm Người Dùng */}
                    <button
                      onClick={() => setIsCreateUserOpen(true)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm User</span>
                    </button>
                  </div>
                </div>

                {/* Bảng người dùng */}
                <div className={`rounded-3xl border overflow-hidden shadow-lg ${
                  isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                        isDark ? 'border-neutral-800 bg-[#121824] text-neutral-400' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}>
                        <th className="py-3 px-4">Người dùng</th>
                        <th className="py-3 px-4">Tuổi & Giới tính</th>
                        <th className="py-3 px-4">Thành phố</th>
                        <th className="py-3 px-4 text-center">Vai trò</th>
                        <th className="py-3 px-4 text-center">Likes Nhận</th>
                        <th className="py-3 px-4 text-center">Matches</th>
                        <th className="py-3 px-4 text-center">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit/20 text-xs font-medium">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className={`transition-colors ${
                          isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-slate-50'
                        }`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.photos?.[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                                alt={u.name}
                                className="w-10 h-10 rounded-xl object-cover ring-1 ring-inherit"
                              />
                              <div>
                                <div className="font-extrabold flex items-center gap-1">
                                  <span>{u.name}</span>
                                  {u.is_verified && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />}
                                  {u.is_banned && <Ban className="w-3.5 h-3.5 text-rose-500" />}
                                </div>
                                <div className="text-[11px] text-neutral-400">{u.email || u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold mr-1.5 ${
                              u.gender === 'MALE' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                            }`}>
                              {u.gender === 'MALE' ? 'Nam' : 'Nữ'}
                            </span>
                            <span>{u.age || 20}t</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400">{u.city || 'Chưa cập nhật'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-400">{u.likesReceived || 0}</td>
                          <td className="py-3 px-4 text-center font-bold text-rose-400">{u.matchesCount || 0}</td>
                          <td className="py-3 px-4 text-center">
                            {u.is_banned ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold">Bị Khóa</span>
                            ) : u.is_verified ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Xác minh</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-bold">Chuẩn</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Xem hồ sơ */}
                              <button
                                onClick={() => setSelectedUserForModal(u)}
                                title="Xem hồ sơ chi tiết"
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Sửa thông tin */}
                              <button
                                onClick={() => setEditingUser(u)}
                                title="Chỉnh sửa thông tin thành viên"
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Đổi quyền Admin <-> User */}
                              <button
                                onClick={() => handleToggleRole(u.id, u.name)}
                                title={u.role === 'admin' ? 'Hạ quyền xuống User' : 'Thăng cấp lên Admin'}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  u.role === 'admin'
                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                    : 'hover:bg-neutral-800 text-neutral-400 hover:text-amber-400'
                                }`}
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>

                              {/* Reset mật khẩu */}
                              <button
                                onClick={() => setPasswordResetUser(u)}
                                title="Đặt lại mật khẩu tài khoản"
                                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-cyan-400 cursor-pointer"
                              >
                                <Key className="w-4 h-4" />
                              </button>

                              {/* Tích xanh */}
                              <button
                                onClick={() => handleToggleVerify(u.id, u.name)}
                                title={u.is_verified ? 'Thu hồi tích xanh' : 'Cấp tích xanh xác thực'}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  u.is_verified
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    : 'hover:bg-neutral-800 text-neutral-400 hover:text-blue-400'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>

                              {/* Khóa/Mở tài khoản */}
                              <button
                                onClick={() => handleToggleBan(u.id, u.name)}
                                title={u.is_banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản vi phạm'}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  u.is_banned
                                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                    : 'hover:bg-neutral-800 text-neutral-400 hover:text-rose-400'
                                }`}
                              >
                                <Ban className="w-4 h-4" />
                              </button>

                              {/* Xóa người dùng */}
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                title="Xóa người dùng vĩnh viễn khỏi Neo4j"
                                className="p-1.5 rounded-lg hover:bg-rose-600/20 text-neutral-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===================== TAB 3: GIÁM SÁT HỘI THOẠI & TIN NHẮN ===================== */}
            {activeTab === 'conversations' && (
              <div className="space-y-5 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                      <span>Giám Sát Hội Thoại & Kiểm Duyệt Nội Dung (:ChatRoom)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Xem các phòng chat đang hoạt động và kiểm duyệt tin nhắn độc hại.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
                    {conversations.length} phòng chat
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conversations.map((conv) => (
                    <div
                      key={conv.roomId}
                      className={`p-4 rounded-3xl border flex items-center justify-between gap-3 transition-all hover:scale-101 ${
                        isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Cặp Avatar lồng nhau */}
                        <div className="relative w-12 h-10 shrink-0">
                          <img
                            src={conv.userA.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={conv.userA.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-800 absolute top-0 left-0"
                          />
                          <img
                            src={conv.userB.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                            alt={conv.userB.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-neutral-800 absolute bottom-0 right-0"
                          />
                        </div>

                        <div className="overflow-hidden">
                          <div className="text-xs font-bold truncate">
                            <span className="text-rose-400">{conv.userA.name}</span> & <span className="text-blue-400">{conv.userB.name}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                            "{conv.lastMessage}"
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-2">
                            <span>{conv.messageCount} tin nhắn</span>
                            <span>•</span>
                            <span>{new Date(conv.lastActive).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInspectRoom(conv)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/30 shrink-0 transition-all cursor-pointer"
                      >
                        Kiểm duyệt
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================== TAB 4: BÁO CÁO & KIỂM DUYỆT ===================== */}
            {activeTab === 'reports' && (
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      <span>Hàng Chờ Kiểm Duyệt Báo Cáo Vi Phạm (:BLOCKS)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Danh sách tài khoản bị người dùng báo cáo vi phạm tiêu chuẩn cộng đồng.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                    {reports.length} báo cáo
                  </span>
                </div>

                {reports.length === 0 ? (
                  <div className={`p-12 rounded-3xl border text-center ${
                    isDark ? 'bg-[#151c2c] border-neutral-800 text-neutral-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}>
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="font-bold text-sm">Hệ thống an toàn tuyệt đối!</h4>
                    <p className="text-xs mt-1">Chưa ghi nhận báo cáo hoặc chặn người dùng nào chưa xử lý.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((rep, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-3xl border flex items-center justify-between gap-4 ${
                          isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={rep.targetAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                            alt={rep.targetName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-rose-500/40"
                          />
                          <div>
                            <div className="text-xs font-extrabold flex items-center gap-2">
                              <span>Người bị báo cáo: <strong className="text-rose-400">{rep.targetName}</strong></span>
                              {rep.targetBanned && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">Đã Khóa</span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-300 mt-0.5">
                              Lý do: <span className="font-semibold text-amber-300">{rep.reason}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-1">
                              Báo cáo bởi: {rep.reporterName} • {new Date(rep.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleBan(rep.targetId, rep.targetName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              rep.targetBanned
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                            }`}
                          >
                            {rep.targetBanned ? 'Mở Khóa' : 'Khóa Ngay'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===================== TAB 5: GHÉP ĐÔI THỦ CÔNG ===================== */}
            {activeTab === 'force_match' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mx-auto mb-3 shadow-xl shadow-rose-500/20">
                    <Zap className="w-7 h-7 fill-white" />
                  </div>
                  <h3 className="text-lg font-black">Bilateral Force Match (Ghép Đôi Thủ Công)</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                    Tạo quan hệ <code className="text-rose-400">:MATCHED_WITH</code> hai chiều và phòng chat trực tiếp trên đồ thị Neo4j giữa 2 người dùng bất kỳ.
                  </p>
                </div>

                <div className={`p-6 rounded-3xl border space-y-5 ${
                  isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1.5">Chọn Người Dùng Thứ Nhất (User A)</label>
                    <select
                      value={forceUserA}
                      onChange={(e) => setForceUserA(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-bold border focus:outline-none focus:border-rose-500 ${
                        isDark ? 'bg-[#10141f] border-neutral-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">-- Chọn Người Dùng A --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.gender === 'MALE' ? 'Nam' : 'Nữ'}, {u.age}t, {u.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1.5">Chọn Người Dùng Thứ Hai (User B)</label>
                    <select
                      value={forceUserB}
                      onChange={(e) => setForceUserB(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-bold border focus:outline-none focus:border-rose-500 ${
                        isDark ? 'bg-[#10141f] border-neutral-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">-- Chọn Người Dùng B --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.gender === 'MALE' ? 'Nam' : 'Nữ'}, {u.age}t, {u.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleForceMatch}
                    disabled={matchingInProgress || !forceUserA || !forceUserB}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-102 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{matchingInProgress ? 'Đang kích hoạt trên Neo4j...' : 'Kích Hoạt Ghép Đôi Ngay'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ===================== TAB 6: HỆ THỐNG & NEO4J ===================== */}
                        {/* =========================================================================
                7. TAB DOANH THU & GIAO DỊCH VIP (REVENUE & FINANCIAL ANALYTICS)
               ========================================================================= */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                {/* 4 Thẻ KPI Tài Chính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`p-5 rounded-3xl border transition-all ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-neutral-400 text-xs font-bold">
                      <span>Doanh Thu Tháng (MRR)</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-2">
                      {(revenueData?.mrr || 18450000).toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold block mt-1">
                      ↑ +14.2% so với tháng trước
                    </span>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-all ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-neutral-400 text-xs font-bold">
                      <span>Tổng Doanh Thu Tích Lũy</span>
                      <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-2">
                      {(revenueData?.totalRevenue || 22350000).toLocaleString('vi-VN')} đ
                    </div>
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      Bao gồm Gold, Platinum, Boost
                    </span>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-all ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-neutral-400 text-xs font-bold">
                      <span>Thành Viên Match Gold</span>
                      <Sparkles className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-black text-rose-500 mt-2">
                      {revenueData?.goldSubscribers || 28} thành viên
                    </div>
                    <span className="text-[10px] text-rose-400 block mt-1">
                      Đang kích hoạt gói 1 tháng & 1 năm
                    </span>
                  </div>

                  <div className={`p-5 rounded-3xl border transition-all ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-neutral-400 text-xs font-bold">
                      <span>Tỷ Lệ Chuyển Đổi Nạp VIP</span>
                      <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-400 mt-2">
                      {revenueData?.conversionRate || '8.6%'}
                    </div>
                    <span className="text-[10px] text-purple-400 block mt-1">
                      Cao hơn 2.1% so với benchmark
                    </span>
                  </div>
                </div>

                {/* Bảng Nhật Ký Giao Dịch VIP */}
                <div className={`rounded-3xl border overflow-hidden shadow-sm ${
                  isDark ? 'bg-[#121824] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="p-5 border-b border-inherit/40 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Lịch Sử Giao Dịch & Mua Gói VIP Gần Đây</span>
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Ghi nhận thời gian thực từ MoMo QR, VNPay và thẻ ngân hàng
                      </p>
                    </div>
                    <button
                      onClick={fetchRevenue}
                      className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                        isDark ? 'bg-[#182030] text-neutral-400 border-neutral-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <tr>
                          <th className="p-4">Mã Giao Dịch</th>
                          <th className="p-4">Khách Hàng</th>
                          <th className="p-4">Gói VIP</th>
                          <th className="p-4">Số Tiền (VNĐ)</th>
                          <th className="p-4">Cổng Thanh Toán</th>
                          <th className="p-4">Trạng Thái</th>
                          <th className="p-4">Thời Gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-inherit/40">
                        {(revenueData?.transactions || []).map((txn) => (
                          <tr key={txn.id} className={isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-slate-50'}>
                            <td className="p-4 font-mono font-bold text-rose-400">{txn.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={txn.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                  alt={txn.userName}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                                <span className="font-bold">{txn.userName}</span>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-neutral-200">{txn.packageType}</td>
                            <td className="p-4 font-extrabold text-emerald-400">
                              {Number(txn.amount).toLocaleString('vi-VN')} đ
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-neutral-800 text-neutral-300">
                                {txn.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {txn.status || 'Thành công'}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-400 text-[11px]">
                              {new Date(txn.createdAt).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                8. TAB PHÁT SÓNG THÔNG BÁO (SYSTEM-WIDE LIVE BROADCASTER)
               ========================================================================= */}
            {activeTab === 'broadcast' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột Trái: Trình Tạo Thông Báo */}
                  <div className={`p-6 rounded-3xl border space-y-5 ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="pb-3 border-b border-inherit/40">
                      <h3 className="font-extrabold text-sm flex items-center gap-2">
                        <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <span>Bảng Điều Khiển Phát Sóng Thông Báo</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Thông báo sẽ lập tức nổ pop-up banner trên màn hình của tất cả người dùng đang online.
                      </p>
                    </div>

                    <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold block mb-1">Loại Thông Báo</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'EVENT', label: '🎉 Sự Kiện' },
                            { id: 'PROMO', label: '💎 Khuyến Mãi' },
                            { id: 'SYSTEM', label: '🛡️ Bảo Trì / Tin' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setBroadcastForm({ ...broadcastForm, type: t.id })}
                              className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                                broadcastForm.type === t.id
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                  : isDark
                                  ? 'bg-[#10141f] border-neutral-800 text-neutral-400 hover:text-white'
                                  : 'bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Tiêu Đề Thông Báo</label>
                        <input
                          type="text"
                          required
                          value={broadcastForm.title}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                          placeholder="VD: SỰ KIỆN MATCH GOLDEN HOUR"
                          className="w-full p-3 rounded-2xl border bg-inherit focus:outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Nội Dung Chi Tiết</label>
                        <textarea
                          rows={4}
                          required
                          value={broadcastForm.message}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                          placeholder="Nhập thông điệp cần truyền tải tới cộng đồng..."
                          className="w-full p-3 rounded-2xl border bg-inherit focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingBroadcast}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {sendingBroadcast ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Phát Sóng Ngay Toàn Hệ Thống</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Cột Phải: Xem Trước Giao Diện Người Dùng Sẽ Thấy (Live Preview) */}
                  <div className={`p-6 rounded-3xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                  }`}>
                    <div>
                      <div className="pb-3 border-b border-inherit/40 flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-400">Xem Trước Trực Tiếp (Mobile / Web)</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full">
                          Live UI Preview
                        </span>
                      </div>

                      <div className="mt-6 p-4 rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 text-white shadow-2xl border border-white/20">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5">📢</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm uppercase tracking-wide">
                                {broadcastForm.title || 'TIÊU ĐỀ THÔNG BÁO'}
                              </span>
                              <span className="text-[9px] font-black bg-black/40 px-2 py-0.5 rounded-full">
                                {broadcastForm.type}
                              </span>
                            </div>
                            <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
                              {broadcastForm.message || 'Nội dung thông báo mẫu hiển thị tại đây...'}
                            </p>
                            <span className="text-[9px] text-white/60 block mt-2">
                              Phát lúc: {new Date().toLocaleTimeString('vi-VN')} • Match Community
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400 mt-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kênh truyền thông: WebRTC / WebSocket Socket.io</span>
                      </div>
                      <p>Mỗi khi bấm nút, thông báo được đẩy qua event <code>system_broadcast</code> với độ trễ dưới 50ms.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                9. TAB NHẬT KÝ QUẢN TRỊ VIÊN (AUDIT TRAIL LOGS)
               ========================================================================= */}
            {activeTab === 'audit' && (
              <div className={`rounded-3xl border overflow-hidden shadow-sm ${
                isDark ? 'bg-[#121824] border-neutral-800' : 'bg-white border-slate-200'
              }`}>
                <div className="p-5 border-b border-inherit/40 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Nhật Ký Hành Động & Can Thiệp Quản Trị (Audit Logs)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Ghi nhận mọi thao tác phân quyền, cấp tích xanh, khóa tài khoản, can thiệp tin nhắn
                    </p>
                  </div>
                  <button
                    onClick={fetchAuditLogs}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới logs</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[11px] font-extrabold uppercase tracking-wider ${
                      isDark ? 'bg-[#182030] text-neutral-400 border-neutral-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <tr>
                        <th className="p-4">Mã Log</th>
                        <th className="p-4">Quản Trị Viên</th>
                        <th className="p-4">Hành Động Can Thiệp</th>
                        <th className="p-4">Đối Tượng Chịu Tác Động</th>
                        <th className="p-4">Địa Chỉ IP</th>
                        <th className="p-4">Thời Gian Ghi Nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-inherit/40">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className={isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-slate-50'}>
                          <td className="p-4 font-mono font-bold text-cyan-400">{log.id}</td>
                          <td className="p-4 font-bold text-neutral-200">{log.adminName}</td>
                          <td className="p-4 font-semibold text-rose-400">{log.action}</td>
                          <td className="p-4 font-mono text-neutral-300">{log.target}</td>
                          <td className="p-4 font-mono text-[11px] text-neutral-400">{log.ip}</td>
                          <td className="p-4 text-neutral-400 text-[11px]">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================================
                10. TAB CẤU HÌNH HỆ THỐNG & THAM SỐ THUẬT TOÁN (SYSTEM CONFIG)
               ========================================================================= */}
            {activeTab === 'config' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <form onSubmit={handleSaveConfig} className={`p-6 rounded-3xl border space-y-6 ${
                  isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-4 border-b border-inherit/40">
                    <div>
                      <h3 className="font-extrabold text-base flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-amber-400" />
                        <span>Cấu Hình Thuật Toán Gợi Ý & Quy Tắc Nền Tảng</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Hiệu chỉnh trọng số thuật toán Jaccard đồ thị Neo4j và giới hạn quẹt thẻ toàn hệ thống.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {savingConfig ? (
                        <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu Cấu Hình</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Trọng số thuật toán */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Trọng Số Thuật Toán Neo4j Recommendation Engine
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Trọng số Sở Thích Chung (Jaccard)</span>
                          <span className="text-rose-500 font-black">{systemConfig.wInterest}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={systemConfig.wInterest}
                          onChange={(e) => setSystemConfig({ ...systemConfig, wInterest: Number(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Trọng số Mục Tiêu Hẹn Hò</span>
                          <span className="text-rose-500 font-black">{systemConfig.wGoal}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={systemConfig.wGoal}
                          onChange={(e) => setSystemConfig({ ...systemConfig, wGoal: Number(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Trọng số Lối Sống & Thú Cưng</span>
                          <span className="text-rose-500 font-black">{systemConfig.wLifestyle}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={systemConfig.wLifestyle}
                          onChange={(e) => setSystemConfig({ ...systemConfig, wLifestyle: Number(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                      </div>

                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex justify-between font-bold mb-1.5">
                          <span>Trọng số Vị Trí & Cự Ly (Location)</span>
                          <span className="text-rose-500 font-black">{systemConfig.wLocation}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={systemConfig.wLocation}
                          onChange={(e) => setSystemConfig({ ...systemConfig, wLocation: Number(e.target.value) })}
                          className="w-full accent-rose-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Giới hạn quẹt thẻ & Tính năng */}
                  <div className="pt-4 border-t border-inherit/40 space-y-4">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Quy Tắc Quẹt Thẻ & Bộ Lọc An Toàn
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <label className="font-bold block mb-1">Số Lượt Thích Miễn Phí Mỗi Ngày (Free Swipes)</label>
                        <input
                          type="number"
                          min={10}
                          max={500}
                          value={systemConfig.freeDailySwipes}
                          onChange={(e) => setSystemConfig({ ...systemConfig, freeDailySwipes: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none focus:border-amber-400 font-bold"
                        />
                        <span className="text-[10px] text-neutral-400 mt-1 block">Tài khoản VIP được vô hạn lượt thích.</span>
                      </div>

                      <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                        isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-bold">Lọc Ảnh Khiêu Dâm AI (NSFW Shield)</span>
                            <input
                              type="checkbox"
                              checked={systemConfig.enableNsfwFilter}
                              onChange={(e) => setSystemConfig({ ...systemConfig, enableNsfwFilter: e.target.checked })}
                              className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-bold">Kích Hoạt Match Passport™ Toàn Cầu</span>
                            <input
                              type="checkbox"
                              checked={systemConfig.enablePassport}
                              onChange={(e) => setSystemConfig({ ...systemConfig, enablePassport: e.target.checked })}
                              className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-bold">Cho Phép Gọi Video Call 1-1 WebRTC</span>
                            <input
                              type="checkbox"
                              checked={systemConfig.enableVideoCall}
                              onChange={(e) => setSystemConfig({ ...systemConfig, enableVideoCall: e.target.checked })}
                              className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#151c2c] border-neutral-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-4 border-b border-inherit/40">
                    <div>
                      <h3 className="text-base font-extrabold flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-400" />
                        <span>Neo4j AuraDB (Cloud Enterprise Instance)</span>
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Kết nối bảo mật qua giao thức mã hóa neo4j+s://
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      Trực Tuyến
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">Độ Trễ Cypher Query</div>
                      <div className="text-xl font-black text-emerald-400 mt-1">{stats?.dbLatencyMs || 0} ms</div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">Tổng Số User Nodes</div>
                      <div className="text-xl font-black text-white mt-1">{stats?.totalUsers || 0} (:User)</div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#10141f] border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="text-[10px] text-neutral-400 font-bold uppercase">Tổng Quan Hệ Match</div>
                      <div className="text-xl font-black text-rose-500 mt-1">{stats?.totalMatches || 0} (:MATCHED_WITH)</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-inherit/40 flex items-center gap-3">
                    <button
                      onClick={loadData}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      ⚡ Quét và đo lường độ trễ tức thì
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ===================== MODAL 1: THÊM NGƯỜI DÙNG MỚI ===================== */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#131926] border-neutral-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit/40">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                <span>Thêm Thành Viên Mới Vào Đồ Thị Neo4j</span>
              </h3>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1 rounded-xl hover:bg-neutral-800 cursor-pointer text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    placeholder="VD: Nguyễn Lan Anh"
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="lananh@match.com"
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Tuổi</label>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={newUserForm.age}
                    onChange={(e) => setNewUserForm({ ...newUserForm, age: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Giới tính</label>
                  <select
                    value={newUserForm.gender}
                    onChange={(e) => setNewUserForm({ ...newUserForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  >
                    <option value="FEMALE">Nữ</option>
                    <option value="MALE">Nam</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Vai trò</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Thành phố</label>
                  <input
                    type="text"
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Mật khẩu ban đầu</label>
                  <input
                    type="text"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Link Ảnh đại diện</label>
                <input
                  type="url"
                  value={newUserForm.photoUrl}
                  onChange={(e) => setNewUserForm({ ...newUserForm, photoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tiểu sử (Bio)</label>
                <textarea
                  rows={2}
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm({ ...newUserForm, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Sở thích (ngăn cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newUserForm.interests}
                  onChange={(e) => setNewUserForm({ ...newUserForm, interests: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30"
                >
                  Tạo Thành Viên Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: CHỈNH SỬA THÔNG TIN USER ===================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#131926] border-neutral-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit/40">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>Chỉnh Sửa Thông Tin ({editingUser.name})</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-xl hover:bg-neutral-800 cursor-pointer text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Thành phố</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block mb-1">Tuổi</label>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={editingUser.age || 20}
                    onChange={(e) => setEditingUser({ ...editingUser, age: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Giới tính</label>
                  <select
                    value={editingUser.gender}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Vai trò</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Mục tiêu hẹn hò</label>
                <input
                  type="text"
                  value={editingUser.relationship_goal || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, relationship_goal: e.target.value })}
                  placeholder="VD: 💘 Tìm người yêu lâu dài"
                  className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tiểu sử</label>
                <textarea
                  rows={2}
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-inherit focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(editingUser.is_verified)}
                    onChange={(e) => setEditingUser({ ...editingUser, is_verified: e.target.checked })}
                    className="rounded"
                  />
                  <span>Tích xanh chính chủ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-400">
                  <input
                    type="checkbox"
                    checked={Boolean(editingUser.is_banned)}
                    onChange={(e) => setEditingUser({ ...editingUser, is_banned: e.target.checked })}
                    className="rounded"
                  />
                  <span>Khóa tài khoản</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold shadow-md"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: ĐẶT LẠI MẬT KHẨU ===================== */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-[#131926] border-neutral-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit/40">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Đặt Lại Mật Khẩu</span>
              </h3>
              <button onClick={() => setPasswordResetUser(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Nhập mật khẩu mới cho tài khoản <strong className="text-white">{passwordResetUser.name}</strong> ({passwordResetUser.email}):
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <input
                type="text"
                required
                minLength={6}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full p-2.5 rounded-xl border bg-inherit text-xs focus:outline-none focus:border-cyan-400"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Xác Nhận Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: KIỂM DUYỆT TIN NHẮN PHÒNG CHAT ===================== */}
      {inspectingRoom && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl h-[560px] rounded-3xl p-6 border shadow-2xl flex flex-col justify-between ${
            isDark ? 'bg-[#131926] border-neutral-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit/40 shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    Kiểm Duyệt Hội Thoại: {inspectingRoom.userA.name} & {inspectingRoom.userB.name}
                  </h3>
                  <div className="text-[11px] text-neutral-400">
                    Phòng chat ID: <code className="font-mono text-rose-400">{inspectingRoom.roomId}</code>
                  </div>
                </div>
              </div>
              <button onClick={() => setInspectingRoom(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar my-2">
              {loadingMessages ? (
                <div className="text-center py-12 text-xs text-neutral-400">Đang tải nhật ký tin nhắn...</div>
              ) : roomMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-neutral-400">Chưa có tin nhắn nào trong phòng này.</div>
              ) : (
                roomMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      isDark ? 'bg-[#182030] border-neutral-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span className="text-rose-400">{msg.senderName}</span>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            {new Date(msg.sentAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                        <div className="text-neutral-200 mt-0.5">{msg.content}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      title="Xóa tin nhắn vi phạm này"
                      className="p-1.5 rounded-lg hover:bg-rose-600/20 text-neutral-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-inherit/40 flex justify-end shrink-0">
              <button
                onClick={() => setInspectingRoom(null)}
                className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết hồ sơ */}
      <ProfileDetailModal
        isOpen={Boolean(selectedUserForModal)}
        profile={selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
      />
    </div>
  );
};

export default AdminDashboard;
