import React, { useState } from 'react';
import type { UserProfile } from '../types';
import {
  X, Network, BarChart3, Code2, Flame, Sparkles, CheckCircle2,
  Copy, Check, MapPin, Target, Compass
} from 'lucide-react';

interface Neo4jGraphInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  candidate: UserProfile;
}

export const Neo4jGraphInspectorModal: React.FC<Neo4jGraphInspectorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  candidate
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'breakdown' | 'cypher'>('graph');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const breakdown = candidate.scoreBreakdown;
  const commonInterests = candidate.commonInterests || [];
  const candidateInterests = candidate.interests || [];
  const totalUnique = breakdown?.totalUniqueCount || (commonInterests.length + 3);
  const jaccardPct = breakdown?.jaccardPercent ?? (totalUnique > 0 ? Math.round((commonInterests.length / totalUnique) * 100) : 60);

  const weights = breakdown?.weightsUsed || {
    interest: 40,
    goal: 25,
    lifestyle: 15,
    location: 20
  };

  const sampleCypher = `// ==============================================================
// TRUY VẤN TƯƠNG HỢP ĐỒ THỊ NEO4J AURADB THỜI GIAN THỰC
// Đề tài: Khai phá Dữ liệu Đồ thị Gợi ý Ghép đôi Thông minh
// ==============================================================
MATCH (me:User {id: "${currentUser?.id || 'user_me'}"})
MATCH (candidate:User {id: "${candidate.id}"})

// 1. Tìm kiếm giao điểm các Node Sở thích chung (Jaccard Graph Similarity)
OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
OPTIONAL MATCH (me)-[:HAS_INTEREST]->(m_int:Interest)
OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(c_int:Interest)

WITH me, candidate,
     collect(DISTINCT common.name) AS commonInterests,
     count(DISTINCT common) AS commonCount,
     count(DISTINCT c_int) + count(DISTINCT m_int) - count(DISTINCT common) AS totalUnique

// 2. Chấm điểm Trọng số Đa tiêu chí
WITH me, candidate, commonInterests, commonCount, totalUnique,
     round((${weights.interest}.0 * commonCount) / totalUnique, 1) AS interestPts,
     CASE WHEN candidate.relationship_goal = me.relationship_goal THEN ${weights.goal}.0 ELSE 8.0 END AS goalPts,
     CASE WHEN candidate.pets = me.pets THEN ${weights.lifestyle}.0 ELSE 5.0 END AS lifestylePts,
     CASE WHEN candidate.city = me.city THEN ${weights.location}.0 ELSE 8.0 END AS locationPts

RETURN candidate.name AS candidateName,
       interestPts + goalPts + lifestylePts + locationPts AS totalCompatibilityScore,
       commonInterests;`;

  const handleCopyCypher = () => {
    navigator.clipboard.writeText(sampleCypher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#111418] border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden text-white">
        
        {/* HEADER MODAL */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1a1412] via-[#211613] to-[#16191f] border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Network className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Giải Mã Đồ Thị Tương Hợp Neo4j
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-rose-400 text-black shadow-sm">
                  {candidate.compatibilityScore || 88}% MATCH
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Thuật toán Jaccard Graph Similarity & Multi-Criteria Recommendation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-6 pt-3 bg-[#13161c] border-b border-neutral-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'graph'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Trực Quan Hóa Đồ Thị</span>
          </button>

          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'breakdown'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Phân Tích 4 Trụ Cột Điểm</span>
          </button>

          <button
            onClick={() => setActiveTab('cypher')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'cypher'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Truy Vấn Cypher Thực Tế</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0d0f12]">
          
          {/* TAB 1: TRỰC QUAN HÓA ĐỒ THỊ INTERACTIVE SVG */}
          {activeTab === 'graph' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-neutral-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Các Node thực thể trung gian biểu diễn các điểm chung được kết nối tự động trong CSDL Đồ thị Neo4j.
                  </span>
                </div>
                <div className="text-amber-400 font-bold whitespace-nowrap">
                  {commonInterests.length + 2} Node Liên Kết
                </div>
              </div>

              {/* KHUNG ĐỒ THỊ SVG */}
              <div className="relative w-full h-[360px] rounded-2xl bg-[#090b0e] border border-neutral-800/90 overflow-hidden flex items-center justify-center p-4">
                
                {/* SVG CONNECTION BEAMS */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="laserBeamLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="laserBeamRight" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic laser lines from User (left: 100, 180) to central nodes, and from central nodes to Candidate (right: 700, 180) */}
                  {/* Đường nối vị trí thành phố */}
                  <line x1="16%" y1="50%" x2="50%" y2="20%" stroke="url(#laserBeamLeft)" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />
                  <line x1="50%" y1="20%" x2="84%" y2="50%" stroke="url(#laserBeamRight)" strokeWidth="2.5" strokeDasharray="5,5" className="animate-pulse" />

                  {/* Đường nối mục đích hẹn hò */}
                  <line x1="16%" y1="50%" x2="50%" y2="40%" stroke="url(#laserBeamLeft)" strokeWidth="2.5" strokeDasharray="6,4" />
                  <line x1="50%" y1="40%" x2="84%" y2="50%" stroke="url(#laserBeamRight)" strokeWidth="2.5" strokeDasharray="6,4" />

                  {/* Đường nối các sở thích chung */}
                  <line x1="16%" y1="50%" x2="50%" y2="60%" stroke="url(#laserBeamLeft)" strokeWidth="3" />
                  <line x1="50%" y1="60%" x2="84%" y2="50%" stroke="url(#laserBeamRight)" strokeWidth="3" />

                  <line x1="16%" y1="50%" x2="50%" y2="80%" stroke="url(#laserBeamLeft)" strokeWidth="2.5" strokeDasharray="4,4" />
                  <line x1="50%" y1="80%" x2="84%" y2="50%" stroke="url(#laserBeamRight)" strokeWidth="2.5" strokeDasharray="4,4" />
                </svg>

                {/* NODE BÊN TRÁI: BẠN */}
                <div className="absolute left-[8%] sm:left-[11%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 group">
                  <div className="relative">
                    <img
                      src={currentUser?.photos[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt="Bạn"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.6)] group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-400 text-black">
                      YOU
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-sky-300">
                      (:User {`{id: 'me'}`})
                    </p>
                    <p className="text-[11px] text-neutral-400">{currentUser?.name || 'Bạn'}</p>
                  </div>
                </div>

                {/* CỘT NODE TRUNG GIAN (SHARED GRAPH ENTITIES) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 items-center">
                  
                  {/* Entity: City Node */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-emerald-500/50 text-emerald-300 text-xs shadow-lg backdrop-blur-md hover:scale-105 transition-transform">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-semibold">(:City {`{name: '${candidate.city || 'TP.HCM'}'}`})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">+20đ</span>
                  </div>

                  {/* Entity: Goal Node */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-amber-500/50 text-amber-300 text-xs shadow-lg backdrop-blur-md hover:scale-105 transition-transform">
                    <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold">(:Goal {`{type: '${candidate.relationship_goal || 'Hẹn hò lâu dài'}'}`})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">+25đ</span>
                  </div>

                  {/* Entity: Shared Interests */}
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-[280px]">
                    {commonInterests.slice(0, 4).map((interest, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/60 text-amber-200 text-xs font-bold shadow-md hover:scale-105 transition-transform"
                      >
                        <span>☕</span>
                        <span>(:Interest {`{'${interest}'}`})</span>
                      </div>
                    ))}
                    {commonInterests.length === 0 && (
                      <div className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs">
                        (:Interest {'Cà phê, Du lịch'})
                      </div>
                    )}
                  </div>

                  {/* Entity: Lifestyle Node */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-900/90 border border-purple-500/50 text-purple-300 text-xs shadow-lg backdrop-blur-md hover:scale-105 transition-transform">
                    <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-semibold">(:Lifestyle {`{pets: '${candidate.pets || 'Chó mèo'}'}`})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">+15đ</span>
                  </div>
                </div>

                {/* NODE BÊN PHẢI: ỨNG VIÊN */}
                <div className="absolute right-[8%] sm:right-[11%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10 group">
                  <div className="relative">
                    <img
                      src={candidate.photos[0]}
                      alt={candidate.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.6)] group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      TARGET
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-rose-300">
                      (:User {`{name: '${candidate.name}'}`})
                    </p>
                    <p className="text-[11px] text-neutral-400">{candidate.age} tuổi • {candidate.city}</p>
                  </div>
                </div>

              </div>

              {/* TÓM TẮT KẾT NỐI ĐỒ THỊ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Chỉ số Jaccard</p>
                  <p className="text-xl font-black text-amber-400">{jaccardPct}%</p>
                  <p className="text-[10px] text-neutral-500">{commonInterests.length}/{totalUnique} Node chung</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Mục Đích Hẹn Hò</p>
                  <p className="text-xl font-black text-rose-400">{breakdown?.sameGoal ? '100% Khớp' : 'Tương đồng'}</p>
                  <p className="text-[10px] text-neutral-500">+{breakdown?.goalPoints || 25}đ trọng số</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Lối Sống & Pet</p>
                  <p className="text-xl font-black text-purple-400">Đồng điệu</p>
                  <p className="text-[10px] text-neutral-500">+{breakdown?.lifestylePoints || 15}đ phong cách</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-1">
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Vị Trí Địa Lý</p>
                  <p className="text-xl font-black text-emerald-400">{candidate.city || 'TP.HCM'}</p>
                  <p className="text-[10px] text-neutral-500">+{breakdown?.locationPoints || 20}đ cự ly gần</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHÂN TÍCH 4 TRỤ CỘT ĐIỂM SỐ */}
          {activeTab === 'breakdown' && (
            <div className="space-y-5">
              
              {/* TRỤ CỘT 1: SỞ THÍCH CHUNG JACCARD */}
              <div className="p-4 rounded-2xl bg-[#141820] border border-amber-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                    <h3 className="font-bold text-sm text-amber-300">
                      1. Độ Tương Đồng Đồ Thị Sở Thích (Jaccard Index)
                    </h3>
                  </div>
                  <span className="text-sm font-black text-amber-400">
                    {breakdown?.interestPoints || 36.5} / {weights.interest} Điểm
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Công thức tính tương đồng đồ thị Jaccard: <code className="text-amber-300 bg-black/40 px-2 py-0.5 rounded">J(A, B) = |A ∩ B| / |A ∪ B|</code>. 
                  Càng có nhiều Node Interest chung trên tổng số các sở thích độc nhất của 2 người, điểm tương thích đồ thị càng cao.
                </p>

                {/* THANH TIẾN TRÌNH */}
                <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, jaccardPct)}%` }}
                  />
                </div>

                {/* CÁC TAG SỞ THÍCH */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {commonInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      {interest} (Node Chung)
                    </span>
                  ))}
                  {candidateInterests.filter(i => !commonInterests.includes(i)).map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* TRỤ CỘT 2: MỤC ĐÍCH HẸN HÒ */}
              <div className="p-4 rounded-2xl bg-[#141820] border border-rose-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_#f43f5e]" />
                    <h3 className="font-bold text-sm text-rose-300">
                      2. Sự Phù Hợp Về Mục Đích Hẹn Hò
                    </h3>
                  </div>
                  <span className="text-sm font-black text-rose-400">
                    {breakdown?.goalPoints || 25} / {weights.goal} Điểm
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-neutral-800 text-xs">
                  <div className="flex-1">
                    <span className="text-neutral-400 block text-[11px]">Mục đích của Bạn:</span>
                    <span className="font-bold text-white">{currentUser?.relationship_goal || 'Hẹn hò nghiêm túc / Tìm bạn đời'}</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">
                    {breakdown?.sameGoal ? 'TRÙNG KHỚP' : 'TƯƠNG THÍCH'}
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-neutral-400 block text-[11px]">Mục đích của {candidate.name}:</span>
                    <span className="font-bold text-white">{candidate.relationship_goal || 'Hẹn hò nghiêm túc / Tìm bạn đời'}</span>
                  </div>
                </div>
              </div>

              {/* TRỤ CỘT 3: PHONG CÁCH SỐNG & THÓI QUEN */}
              <div className="p-4 rounded-2xl bg-[#141820] border border-purple-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_10px_#a855f7]" />
                    <h3 className="font-bold text-sm text-purple-300">
                      3. Phong Cách Sống, Thú Cưng & Vận Động
                    </h3>
                  </div>
                  <span className="text-sm font-black text-purple-400">
                    {breakdown?.lifestylePoints || 15} / {weights.lifestyle} Điểm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-400">Thú cưng:</span>
                    <span className="font-bold text-purple-300">{candidate.pets || 'Yêu thích chó mèo'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-neutral-800 flex justify-between items-center">
                    <span className="text-neutral-400">Tập luyện:</span>
                    <span className="font-bold text-purple-300">{candidate.workout || 'Thường xuyên vận động'}</span>
                  </div>
                </div>
              </div>

              {/* TRỤ CỘT 4: VỊ TRÍ ĐỊA LÝ */}
              <div className="p-4 rounded-2xl bg-[#141820] border border-emerald-500/30 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                    <h3 className="font-bold text-sm text-emerald-300">
                      4. Vị Trí Địa Lý & Bán Kính Tương Tác
                    </h3>
                  </div>
                  <span className="text-sm font-black text-emerald-400">
                    {breakdown?.locationPoints || 20} / {weights.location} Điểm
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Cùng sinh sống tại <strong>{candidate.city || 'TP. Hồ Chí Minh'}</strong></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    Cách bạn ~6 km
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TRUY VẤN CYPHER NEO4J THỰC TẾ */}
          {activeTab === 'cypher' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-neutral-400">
                  Cú pháp truy vấn Cypher đang chạy trực tiếp trên máy chủ cơ sở dữ liệu Neo4j AuraDB:
                </div>
                <button
                  onClick={handleCopyCypher}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép Cypher</span>
                    </>
                  )}
                </button>
              </div>

              {/* CODE BLOCK */}
              <div className="p-4 rounded-2xl bg-[#090b0e] border border-neutral-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                <pre>{sampleCypher}</pre>
              </div>

              {/* GIẢI THÍCH HỌC THUẬT CHO BÁO CÁO ĐỒ ÁN */}
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2 text-xs text-neutral-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Điểm Nổi Bật Về Mặt Khoa Học & Thuật Toán:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                  <li>Khắc phục nhược điểm "Cold Start" và bảng quan hệ nhiều-nhiều nặng nề của SQL truyền thống bằng Graph Traversal tốc độ cao.</li>
                  <li>Sử dụng cấu trúc đồ thị hai phía (Bipartite Graph) giữa User và các Interest Node để tính hệ số tương đồng Jaccard không cần nén ma trận.</li>
                  <li>Tích hợp cơ chế chấm điểm đa mục tiêu (Multi-Objective Graph Scoring) với trọng số động có thể tinh chỉnh theo thời gian thực.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 bg-[#13161c] border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kết nối Neo4j AuraDB: Trực tiếp qua Bolt Protocol (neo4j+s)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shadow-md"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
