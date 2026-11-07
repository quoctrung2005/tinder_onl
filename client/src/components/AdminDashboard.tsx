import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, Heart, MessageCircle, ShieldAlert, CheckCircle, Ban, Trash2,
  Eye, RefreshCw, Search, Database, Sparkles, ArrowLeft, Activity, Flame,
  Zap, Lock, Unlock, UserCheck
} from 'lucide-react';
import type { UserProfile } from '../types';
import { ProfileDetailModal } from './ProfileDetailModal';

interface AdminStats {
  totalUsers: number;
  maleCount: number;
  femaleCount: number;
  verifiedCount: number;
  bannedCount: number;
  totalMatches: number;
  totalLikes: number;
  totalPasses: number;
  totalReports: number;
  totalMessages: number;
  dbLatencyMs: number;
  topInterests: { name: string; count: number }[];
  cityDistribution: { city: string; count: number }[];
}

interface ReportItem {
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

interface AdminDashboardProps {
  onBackToApp: () => void;
}

const API_BASE = 'http://localhost:5000/api';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'force_match' | 'system'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'banned'>('all');
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserProfile | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form Ghép đôi thủ công
  const [forceUserA, setForceUserA] = useState<string>('');
  const [forceUserB, setForceUserB] = useState<string>('');
  const [matchingInProgress, setMatchingInProgress] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats`),
        axios.get(`${API_BASE}/admin/users`),
        axios.get(`${API_BASE}/admin/reports`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu Admin:', err);
      showToast('❌ Lỗi kết nối đến máy chủ API: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý Cấp / Thu hồi Tích xanh
  const handleToggleVerify = async (userId: string, userName: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${userId}/verify`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: res.data.is_verified } : u))
      );
      showToast(res.data.message || `Đã đổi trạng thái tích xanh cho ${userName}`);
    } catch (err: any) {
      showToast('❌ Lỗi khi cập nhật tích xanh: ' + (err.message || ''));
    }
  };

  // Xử lý Khóa / Mở khóa tài khoản
  const handleToggleBan = async (userId: string, userName: string) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${userId}/ban`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_banned: res.data.is_banned } : u))
      );
      setReports((prev) =>
        prev.map((r) => (r.targetId === userId ? { ...r, targetBanned: res.data.is_banned } : r))
      );
      showToast(res.data.message || `Đã đổi trạng thái khóa tài khoản ${userName}`);
    } catch (err: any) {
      showToast('❌ Lỗi khi khóa tài khoản: ' + (err.message || ''));
    }
  };

  // Xử lý Xóa người dùng
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${userName}" và toàn bộ quan hệ trong đồ thị Neo4j? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`🗑️ Đã xóa người dùng "${userName}" thành công.`);
    } catch (err: any) {
      showToast('❌ Lỗi khi xóa người dùng: ' + (err.message || ''));
    }
  };

  // Xử lý Ghép đôi cưỡng bức (Force Match)
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
      });
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

  // Lọc người dùng theo từ khóa tìm kiếm & bộ lọc
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q));

    const matchGender = !genderFilter || u.gender === genderFilter;

    let matchStatus = true;
    if (statusFilter === 'verified') matchStatus = Boolean(u.is_verified);
    if (statusFilter === 'banned') matchStatus = Boolean(u.is_banned);

    return matchSearch && matchGender && matchStatus;
  });

  return (
    <div className="min-h-screen w-screen bg-[#090b0e] text-neutral-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* 1. TOP HEADER CONSOLE */}
      <header className="h-16 px-6 bg-[#111418] border-b border-neutral-800 flex items-center justify-between shrink-0 shadow-lg z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-all hover:scale-102 cursor-pointer shadow-sm border border-neutral-700/60"
            title="Quay lại ứng dụng hẹn hò Tinder"
          >
            <ArrowLeft className="w-4 h-4 text-rose-500" />
            <span>Vào Tinder Web</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span>Tinder Admin Console</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-bold">
                  v2.5 Pro
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400">
                Hệ thống Quản trị & Giám sát Cơ sở Dữ liệu Đồ thị Neo4j AuraDB
              </p>
            </div>
          </div>
        </div>

        {/* Database Status & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Neo4j AuraDB Online</span>
            {stats && <span className="text-[10px] text-emerald-400/80 font-mono">({stats.dbLatencyMs}ms)</span>}
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Thông báo Toast Feedback */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. NAVIGATION TAB BAR */}
      <div className="px-6 border-b border-neutral-800 bg-[#0d1014] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: '📊 Tổng Quan & KPIs', count: stats?.totalUsers },
          { id: 'users', label: '👥 Quản Lý Người Dùng', count: users.length },
          { id: 'reports', label: '🛡️ Kiểm Duyệt & Báo Cáo', count: reports.length },
          { id: 'force_match', label: '⚡ Ghép Đôi Thủ Công', highlight: true },
          { id: 'system', label: '🔧 Trạng Thái Neo4j & Hệ Thống' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 text-xs font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-rose-500 text-white bg-rose-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab.id ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.highlight && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        ))}
      </div>

      {/* 3. NỘI DUNG CHÍNH (MAIN CONTENT) */}
      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#090b0e]">
        {/* ===================== TAB 1: TỔNG QUAN & KPIS ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* 6 Thẻ KPI nổi bật */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                {
                  label: 'Tổng Người Dùng',
                  value: stats?.totalUsers || 0,
                  sub: `${stats?.maleCount || 0} Nam • ${stats?.femaleCount || 0} Nữ`,
                  icon: Users,
                  color: 'from-blue-600/30 via-indigo-600/20 to-neutral-900',
                  border: 'border-blue-500/40',
                  iconColor: 'text-blue-400'
                },
                {
                  label: 'Lượt Ghép Đôi',
                  value: stats?.totalMatches || 0,
                  sub: 'Mối quan hệ 2 chiều',
                  icon: Heart,
                  color: 'from-rose-600/30 via-pink-600/20 to-neutral-900',
                  border: 'border-rose-500/40',
                  iconColor: 'text-rose-400'
                },
                {
                  label: 'Lượt Thích (Likes)',
                  value: stats?.totalLikes || 0,
                  sub: 'Quẹt phải trong CSDL',
                  icon: Flame,
                  color: 'from-amber-600/30 via-yellow-600/20 to-neutral-900',
                  border: 'border-amber-500/40',
                  iconColor: 'text-amber-400'
                },
                {
                  label: 'Lượt Bỏ Qua (Passes)',
                  value: stats?.totalPasses || 0,
                  sub: 'Quẹt trái Nope',
                  icon: Ban,
                  color: 'from-neutral-700/40 via-neutral-800/30 to-neutral-900',
                  border: 'border-neutral-700',
                  iconColor: 'text-neutral-400'
                },
                {
                  label: 'Tin Nhắn Đã Gửi',
                  value: stats?.totalMessages || 0,
                  sub: 'Thời gian thực Socket',
                  icon: MessageCircle,
                  color: 'from-emerald-600/30 via-teal-600/20 to-neutral-900',
                  border: 'border-emerald-500/40',
                  iconColor: 'text-emerald-400'
                },
                {
                  label: 'Báo Cáo / Chặn',
                  value: stats?.totalReports || 0,
                  sub: `${stats?.bannedCount || 0} tài khoản bị khóa`,
                  icon: ShieldAlert,
                  color: 'from-red-600/30 via-orange-600/20 to-neutral-900',
                  border: 'border-red-500/40',
                  iconColor: 'text-red-400'
                }
              ].map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-gradient-to-b ${card.color} border ${card.border} shadow-xl flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        {card.label}
                      </span>
                      <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">{card.value}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">{card.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Phân tích Đồ thị: Sở thích & Phân bố địa lý */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Sở Thích */}
              <div className="p-5 rounded-3xl bg-[#111418] border border-neutral-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Top Sở Thích Được Gắn Node Nhiều Nhất</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono">(:Interest)</span>
                </div>
                <div className="space-y-3">
                  {stats?.topInterests && stats.topInterests.length > 0 ? (
                    stats.topInterests.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-200">
                            #{idx + 1} {item.name}
                          </span>
                          <span className="text-neutral-400 font-mono">{item.count} người dùng</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
                            style={{
                              width: `${Math.min(100, (item.count / (stats.totalUsers || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 text-center py-6">Đang tải dữ liệu...</div>
                  )}
                </div>
              </div>

              {/* Phân bố Thành phố */}
              <div className="p-5 rounded-3xl bg-[#111418] border border-neutral-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>Mật Độ Người Dùng Theo Địa Phương</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono">Location Points</span>
                </div>
                <div className="space-y-3">
                  {stats?.cityDistribution && stats.cityDistribution.length > 0 ? (
                    stats.cityDistribution.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-200">📍 {item.city}</span>
                          <span className="text-neutral-400 font-mono">{item.count} tài khoản</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (item.count / (stats.totalUsers || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 text-center py-6">Đang tải dữ liệu...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: QUẢN LÝ NGƯỜI DÙNG ===================== */}
        {activeTab === 'users' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Thanh công cụ tìm kiếm và bộ lọc */}
            <div className="p-4 rounded-2xl bg-[#111418] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, email, thành phố..."
                    className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                {/* Lọc giới tính */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="">Tất cả Giới tính</option>
                  <option value="FEMALE">Chỉ Nữ</option>
                  <option value="MALE">Chỉ Nam</option>
                </select>

                {/* Lọc trạng thái */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-neutral-900 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">Tất cả Trạng thái</option>
                  <option value="verified">Đã có Tích xanh ✓</option>
                  <option value="banned">Tài khoản bị khóa 🔒</option>
                </select>
              </div>

              <div className="text-xs text-neutral-400 font-semibold">
                Hiển thị <strong className="text-white">{filteredUsers.length}</strong> / {users.length} tài khoản
              </div>
            </div>

            {/* Bảng danh sách người dùng */}
            <div className="rounded-2xl border border-neutral-800 bg-[#111418] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Người Dùng</th>
                      <th className="py-3 px-4">Tuổi & Giới tính</th>
                      <th className="py-3 px-4">Khu Vực</th>
                      <th className="py-3 px-4">Sức Hút (Likes / Match)</th>
                      <th className="py-3 px-4">Tích Xanh</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-neutral-800/40 transition-colors group"
                      >
                        {/* Người dùng (Avatar + Tên) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.photos[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-700 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.is_verified && (
                                  <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400 shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">{user.email || user.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Tuổi & Giới tính */}
                        <td className="py-3 px-4 text-neutral-300">
                          <span className="font-semibold">{user.age} tuổi</span> •{' '}
                          <span className={user.gender === 'FEMALE' ? 'text-pink-400' : 'text-blue-400'}>
                            {user.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                          </span>
                        </td>

                        {/* Khu vực */}
                        <td className="py-3 px-4 text-neutral-300">
                          📍 {user.city || 'Hồ Chí Minh'}
                        </td>

                        {/* Sức hút */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                              {user.likesReceived || 0} Likes
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                              {user.matchesCount || 0} Matches
                            </span>
                          </div>
                        </td>

                        {/* Tích xanh toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleVerify(user.id, user.name)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              user.is_verified
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                            }`}
                            title="Bấm để Cấp / Thu hồi Tích xanh"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{user.is_verified ? 'Đã duyệt' : 'Chưa có'}</span>
                          </button>
                        </td>

                        {/* Trạng thái khóa */}
                        <td className="py-3 px-4">
                          {user.is_banned ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3" /> Bị khóa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 w-max">
                              <Unlock className="w-3 h-3" /> Hoạt động
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Xem hồ sơ */}
                            <button
                              onClick={() => setSelectedUserForModal(user)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                              title="Xem chi tiết hồ sơ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Khóa / Mở khóa */}
                            <button
                              onClick={() => handleToggleBan(user.id, user.name)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.is_banned
                                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-amber-400'
                              }`}
                              title={user.is_banned ? 'Mở khóa tài khoản' : 'Khóa tài khoản vi phạm'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>

                            {/* Xóa người dùng */}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Xóa vĩnh viễn"
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
          </div>
        )}

        {/* ===================== TAB 3: KIỂM DUYỆT & BÁO CÁO ===================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="p-4 rounded-2xl bg-[#111418] border border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Danh Sách Người Dùng Bị Báo Cáo & Chặn</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Quản trị viên có thể xem xét lý do và thực hiện khóa tài khoản vi phạm ngay lập tức.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
                {reports.length} Báo cáo
              </span>
            </div>

            <div className="space-y-2.5">
              {reports.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-500 bg-[#111418] rounded-2xl border border-neutral-800">
                  🎉 Hiện không có báo cáo vi phạm nào! Cộng đồng đang hoạt động lành mạnh.
                </div>
              ) : (
                reports.map((report, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#111418] border border-neutral-800 flex flex-wrap items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Người báo cáo */}
                      <div className="flex items-center gap-2">
                        <img
                          src={report.reporterAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={report.reporterName}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-700"
                        />
                        <div className="text-xs">
                          <div className="text-neutral-400 text-[10px]">Người gửi báo cáo</div>
                          <div className="font-bold text-neutral-200">{report.reporterName}</div>
                        </div>
                      </div>

                      <span className="text-neutral-600 font-bold">➔</span>

                      {/* Đối tượng bị báo cáo */}
                      <div className="flex items-center gap-2">
                        <img
                          src={report.targetAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={report.targetName}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-red-500/60"
                        />
                        <div className="text-xs">
                          <div className="text-red-400 text-[10px] font-semibold">Tài khoản bị tố cáo</div>
                          <div className="font-bold text-white flex items-center gap-1">
                            <span>{report.targetName}</span>
                            {report.targetBanned && (
                              <span className="text-[10px] text-red-400 font-mono">(Đã khóa)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lý do */}
                    <div className="flex-1 min-w-[200px] text-xs">
                      <div className="text-neutral-400 text-[10px]">Lý do tố cáo:</div>
                      <div className="font-medium text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 inline-block mt-0.5">
                        ⚠️ {report.reason}
                      </div>
                    </div>

                    {/* Thao tác */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBan(report.targetId, report.targetName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          report.targetBanned
                            ? 'bg-neutral-800 text-neutral-300 hover:text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{report.targetBanned ? 'Mở khóa' : 'Khóa tài khoản này'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: GHÉP ĐÔI THỦ CÔNG (FORCE MATCH) ===================== */}
        {activeTab === 'force_match' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-[#181c22] via-[#14171c] to-[#0e1014] border border-neutral-800 shadow-2xl text-center relative overflow-hidden">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-500/20">
                <Zap className="w-7 h-7 fill-white" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Công Cụ Ghép Đôi Tức Thì (Force Match)</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
                Quản trị viên có thể chủ động kết nối 2 người dùng bất kỳ trong đồ thị Neo4j. Hệ thống sẽ tự động tạo quan hệ LIKE 2 chiều, tạo MATCHED_WITH và mở phòng chat chung.
              </p>

              {/* 2 Ô Chọn Người Dùng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-left">
                {/* Người Dùng A */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-rose-400" />
                    <span>Người dùng A:</span>
                  </label>
                  <select
                    value={forceUserA}
                    onChange={(e) => setForceUserA(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">-- Chọn tài khoản thứ nhất --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.age} tuổi - {u.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Người Dùng B */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-pink-400" />
                    <span>Người dùng B:</span>
                  </label>
                  <select
                    value={forceUserB}
                    onChange={(e) => setForceUserB(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">-- Chọn tài khoản thứ hai --</option>
                    {users
                      .filter((u) => u.id !== forceUserA)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.age} tuổi - {u.city})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Nút Kích Hoạt */}
              <button
                type="button"
                onClick={handleForceMatch}
                disabled={!forceUserA || !forceUserB || matchingInProgress}
                className="mt-6 w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-102 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>{matchingInProgress ? 'Đang thiết lập quan hệ trong Đồ thị Neo4j...' : 'Tạo Kết Nối Ghép Đôi Ngay'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: HỆ THỐNG & NEO4J ===================== */}
        {activeTab === 'system' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-[#111418] border border-neutral-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Cơ Sở Dữ Liệu Đồ Thị Neo4j AuraDB (Cloud)</h3>
                    <p className="text-xs text-neutral-400">Giao thức bảo mật neo4j+s:// • Phiên bản Neo4j 5.27 GQL</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Trực tuyến</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Độ Trễ Phản Hồi (Latency)</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">{stats?.dbLatencyMs || 0} ms</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Tổng Số Node Người Dùng</div>
                  <div className="text-lg font-black text-white mt-1">{stats?.totalUsers || 0} (:User)</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px] uppercase font-bold">Quan Hệ Ghép Đôi</div>
                  <div className="text-lg font-black text-rose-400 mt-1">{stats?.totalMatches || 0} (:MATCHED_WITH)</div>
                </div>
              </div>

              {/* Các hành động hệ thống */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Hành Động Khởi Tạo & Bảo Trì</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      if (!window.confirm('Đặt lại toàn bộ trạng thái quẹt thẻ của user_me để khám phá lại từ đầu?')) return;
                      try {
                        await axios.post(`${API_BASE}/reset`);
                        showToast('🔄 Đã đặt lại trạng thái quẹt thẻ thành công!');
                        loadData();
                      } catch (e: any) {
                        showToast('❌ Lỗi: ' + e.message);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700 transition-all cursor-pointer"
                  >
                    🔄 Đặt lại trạng thái Quẹt (Reset Swipes)
                  </button>

                  <button
                    onClick={loadData}
                    className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/30"
                  >
                    ⚡ Quét lại dữ liệu toàn hệ thống
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL XEM CHI TIẾT HỒ SƠ NGƯỜI DÙNG KHI BẤM ICON MẮT */}
      {selectedUserForModal && (
        <ProfileDetailModal
          isOpen={Boolean(selectedUserForModal)}
          profile={selectedUserForModal}
          onClose={() => setSelectedUserForModal(null)}
        />
      )}
    </div>
  );
};
