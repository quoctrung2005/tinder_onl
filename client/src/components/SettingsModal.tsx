import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X, Sliders, UserX, Plus, Check, ChevronRight,
  Eye, Languages, Moon, GraduationCap, BedDouble, MessageCircle, Heart, Dog, Wine
} from 'lucide-react';
import type { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdatePreferences: (pref: any) => void;
  onLogout: () => void;
}

const AVAILABLE_INTERESTS = [
  'Cà phê', 'Du lịch', 'Mèo', 'Nuôi chó', 'Âm nhạc', 'Nhiếp ảnh',
  'Công nghệ', 'Netflix', 'Đọc sách', 'Yoga', 'Gym', 'Nấu ăn', 'Nghệ thuật'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdatePreferences
}) => {
  // 1. CÁC TIÊU CHÍ TRONG ẢNH 1
  const [city] = useState(user.city || 'Hồ Chí Minh');
  const [maxDistance, setMaxDistance] = useState<number>(user.pref_max_distance || 159);
  const [onlyDistanceLimit, setOnlyDistanceLimit] = useState<boolean>(true);
  const [prefGender, setPrefGender] = useState<string[]>(user.pref_gender || ['FEMALE']);
  const [minAge, setMinAge] = useState<number>(user.pref_min_age || 18);
  const [maxAge, setMaxAge] = useState<number>(user.pref_max_age || 29);
  const [onlyAgeLimit, setOnlyAgeLimit] = useState<boolean>(false);
  const [globalMode, setGlobalMode] = useState<boolean>(Boolean(user.global_mode ?? true));
  const [language, setLanguage] = useState<string>('Tiếng Việt');

  // 2. CÁC TIÊU CHÍ TRONG ẢNH 2 (ĐỂ XÉT ĐỘ TƯƠNG HỢP VÀ BỘ LỌC)
  const [minPhotos, setMinPhotos] = useState<number>(1);
  const [requireBio, setRequireBio] = useState<boolean>(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests || ['Cà phê', 'Du lịch', 'Mèo']);
  const [relationshipGoal, setRelationshipGoal] = useState<string>(user.relationship_goal || '💘 Tìm người yêu lâu dài');
  const [zodiac, setZodiac] = useState<string>(user.zodiac || 'Thiên Bình');
  const [education, setEducation] = useState<string>('Đại học');
  const [familyPlans, setFamilyPlans] = useState<string>('Đang suy nghĩ');
  const [communicationStyle, setCommunicationStyle] = useState<string>('Nhắn tin suốt ngày');
  const [loveLanguage, setLoveLanguage] = useState<string>('Thời gian bên nhau');
  const [pets, setPets] = useState<string>(user.pets || 'Nuôi mèo');
  const [drinking, setDrinking] = useState<string>('Cuối tuần cùng bạn bè');

  // Danh sách chặn
  const [blockedContacts, setBlockedContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchBlocked = async () => {
      try {
        const token = localStorage.getItem('tinder_token');
        const res = await axios.get('http://localhost:5000/api/users/blocked-contacts', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setBlockedContacts(res.data || []);
      } catch (err) {
        console.error('Lỗi lấy danh sách chặn:', err);
      }
    };
    fetchBlocked();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddBlockedContact = async () => {
    if (!newContact.trim()) return;
    const contact = newContact.trim();
    try {
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/users/block-contact',
        { contact },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setBlockedContacts((prev) => [...prev, contact]);
      setNewContact('');
    } catch (err) {
      console.error('Lỗi thêm chặn contact:', err);
    }
  };

  const handleToggleInterest = (it: string) => {
    if (selectedInterests.includes(it)) {
      setSelectedInterests(selectedInterests.filter((x) => x !== it));
    } else {
      setSelectedInterests([...selectedInterests, it]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const prefPayload = {
      pref_gender: prefGender,
      pref_min_age: minAge,
      pref_max_age: maxAge,
      pref_max_distance: maxDistance,
      only_distance_limit: onlyDistanceLimit,
      only_age_limit: onlyAgeLimit,
      global_mode: globalMode,
      min_photos: minPhotos,
      require_bio: requireBio,
      relationship_goal: relationshipGoal,
      zodiac,
      education,
      family_plans: familyPlans,
      communication_style: communicationStyle,
      love_language: loveLanguage,
      pets,
      drinking,
      interests: selectedInterests
    };

    try {
      const token = localStorage.getItem('tinder_token');
      await axios.put(
        'http://localhost:5000/api/users/preferences',
        prefPayload,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      // Cập nhật lên App cha để nạp lại feed ngay lập tức với điểm tương hợp mới
      onUpdatePreferences(prefPayload);
      onClose();
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt khám phá:', error);
      alert('Không thể lưu cài đặt, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-[#111418] border border-neutral-800 rounded-3xl text-white relative shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-[#111418] sticky top-0 z-20">
          <h2 className="text-base font-extrabold flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-rose-500" /> Cài đặt Khám phá & Tiêu chí Tương hợp
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung danh sách cài đặt chuẩn khớp 100% Ảnh 1 & Ảnh 2 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-neutral-900 text-sm">
          
          {/* ===================== PHẦN 1: THEO ẢNH 1 ===================== */}
          
          {/* 1. Địa điểm */}
          <div className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors cursor-pointer">
            <span className="font-bold text-neutral-200">Địa điểm</span>
            <span className="text-neutral-400 text-xs flex items-center gap-1 font-medium">
              {city} <ChevronRight className="w-4 h-4 text-neutral-500" />
            </span>
          </div>

          {/* 2. Khoảng cách Ưu tiên (159 km slider) */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200">Khoảng cách Ưu tiên</span>
              <span className="text-neutral-200 font-bold text-xs">{maxDistance} km</span>
            </div>
            {/* Thanh trượt đỏ chuẩn Tinder */}
            <input
              type="range"
              min={5}
              max={200}
              step={1}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3. Chỉ hiện người trong giới hạn này */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-medium text-neutral-200 text-xs">Chỉ hiện người trong giới hạn này</span>
            <button
              type="button"
              onClick={() => setOnlyDistanceLimit(!onlyDistanceLimit)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                onlyDistanceLimit ? 'bg-rose-600 justify-end' : 'bg-neutral-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 4. Quan Tâm Tới */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200">Quan Tâm Tới</span>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              {[
                { label: 'Nữ', val: ['FEMALE'] },
                { label: 'Nam', val: ['MALE'] },
                { label: 'Mọi người', val: ['MALE', 'FEMALE'] }
              ].map((g) => {
                const isSel = JSON.stringify(prefGender) === JSON.stringify(g.val);
                return (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setPrefGender(g.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSel ? 'bg-rose-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Độ tuổi Ưu tiên (18 - 29) */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200">Độ tuổi Ưu tiên</span>
              <span className="text-neutral-200 font-bold text-xs">{minAge} - {maxAge}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block mb-1">Tối thiểu: {minAge} tuổi</span>
                <input
                  type="range"
                  min={18}
                  max={maxAge}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block mb-1">Tối đa: {maxAge} tuổi</span>
                <input
                  type="range"
                  min={minAge}
                  max={55}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 6. Chỉ hiện người trong giới hạn này (Tuổi) */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-medium text-neutral-200 text-xs">Chỉ hiện người trong giới hạn này</span>
            <button
              type="button"
              onClick={() => setOnlyAgeLimit(!onlyAgeLimit)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                onlyAgeLimit ? 'bg-rose-600 justify-end' : 'bg-neutral-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 7. Toàn cầu */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200">Toàn cầu</span>
              <button
                type="button"
                onClick={() => setGlobalMode(!globalMode)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                  globalMode ? 'bg-rose-600 justify-end' : 'bg-neutral-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Mở ra chế độ toàn cầu sẽ tạo cơ hội để bạn gặp gỡ mọi người khắp nơi trên thế giới sau khi đã hết tương hợp tiềm năng ở xung quanh.
            </p>
          </div>

          {/* 8. Ngôn ngữ ưu tiên */}
          <div className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-colors cursor-pointer">
            <span className="font-bold text-neutral-200">Ngôn ngữ ưu tiên</span>
            <span className="text-neutral-400 text-xs flex items-center gap-1 font-medium">
              {language} <ChevronRight className="w-4 h-4 text-neutral-500" />
            </span>
          </div>

          {/* KIỂM SOÁT MỨC ĐỘ HIỂN THỊ CỦA TÔI */}
          <div className="p-4 space-y-1 bg-neutral-950/60">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400 block">
              KIỂM SOÁT MỨC ĐỘ HIỂN THỊ CỦA TÔI
            </span>
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="font-bold text-xs text-white">Tiêu chuẩn</h4>
                <p className="text-[11px] text-neutral-400">Hồ sơ của bạn sẽ hiển thị trong bộ thẻ tương hợp</p>
              </div>
              <Check className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          {/* ===================== PHẦN 2: THEO ẢNH 2 (TIÊU CHÍ XÉT TƯƠNG HỢP) ===================== */}

          {/* 9. Số Ảnh tối thiểu (1) */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200">Số Ảnh tối thiểu</span>
              <span className="text-neutral-200 font-bold text-xs">{minPhotos}</span>
            </div>
            <input
              type="range"
              min={1}
              max={6}
              step={1}
              value={minPhotos}
              onChange={(e) => setMinPhotos(Number(e.target.value))}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 10. Có Tiểu Sử */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200">Có Tiểu Sử</span>
            <button
              type="button"
              onClick={() => setRequireBio(!requireBio)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                requireBio ? 'bg-rose-600 justify-end' : 'bg-neutral-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* 11. Sở Thích (Multi-select) */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-200">Sở Thích ({selectedInterests.length})</span>
              <span className="text-rose-400 text-xs font-bold">Xét tương hợp đồ thị 35%</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleInterest(item)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 12. 👁️ Đang tìm kiếm */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-400" /> Đang tìm kiếm
            </span>
            <select
              value={relationshipGoal}
              onChange={(e) => setRelationshipGoal(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="💘 Tìm người yêu lâu dài">Tìm người yêu lâu dài</option>
              <option value="🥂 Vừa lâu dài vừa ngắn hạn">Vừa lâu dài vừa ngắn hạn</option>
              <option value="🎉 Hẹn hò vui vẻ">Hẹn hò vui vẻ</option>
              <option value="☕ Bạn mới trò chuyện">Bạn mới trò chuyện</option>
              <option value="🤔 Tùy duyên chưa rõ">Tùy duyên chưa rõ</option>
            </select>
          </div>

          {/* 13. 🈳 Thêm ngôn ngữ */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Languages className="w-4 h-4 text-neutral-400" /> Thêm ngôn ngữ
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
              <option value="Tiếng Hàn">Tiếng Hàn</option>
              <option value="Tiếng Nhật">Tiếng Nhật</option>
            </select>
          </div>

          {/* 14. 🌙 Cung Hoàng Đạo */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Moon className="w-4 h-4 text-neutral-400" /> Cung Hoàng Đạo
            </span>
            <select
              value={zodiac}
              onChange={(e) => setZodiac(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {[
                'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
                'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
                'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
              ].map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {/* 15. 🎓 Giáo dục */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-neutral-400" /> Giáo dục
            </span>
            <select
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Đại học">Đại học</option>
              <option value="Cao đẳng">Cao đẳng</option>
              <option value="Thạc sĩ">Thạc sĩ</option>
              <option value="Tiến sĩ">Tiến sĩ</option>
            </select>
          </div>

          {/* 16. 🛏️ Gia đình tương lai */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-neutral-400" /> Gia đình tương lai
            </span>
            <select
              value={familyPlans}
              onChange={(e) => setFamilyPlans(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Muốn có con">Muốn có con</option>
              <option value="Chưa muốn có con">Chưa muốn có con</option>
              <option value="Đang suy nghĩ">Đang suy nghĩ</option>
              <option value="Không muốn có con">Không muốn có con</option>
            </select>
          </div>

          {/* 17. 💬 Phong cách giao tiếp */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-neutral-400" /> Phong cách giao tiếp
            </span>
            <select
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Nhắn tin suốt ngày">Nhắn tin suốt ngày</option>
              <option value="Gọi điện thoại">Gọi điện thoại</option>
              <option value="Gặp mặt trực tiếp">Gặp mặt trực tiếp</option>
              <option value="Ít online">Ít online</option>
            </select>
          </div>

          {/* 18. 💌 Ngôn ngữ tình yêu */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Heart className="w-4 h-4 text-neutral-400" /> Ngôn ngữ tình yêu
            </span>
            <select
              value={loveLanguage}
              onChange={(e) => setLoveLanguage(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Thời gian bên nhau">Thời gian bên nhau</option>
              <option value="Lời khen ngợi">Lời khen ngợi</option>
              <option value="Hành động chăm sóc">Hành động chăm sóc</option>
              <option value="Quà tặng">Quà tặng</option>
              <option value="Cử chỉ thân mật">Cử chỉ thân mật</option>
            </select>
          </div>

          {/* 19. 🐾 Thú cưng */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Dog className="w-4 h-4 text-neutral-400" /> Thú cưng
            </span>
            <select
              value={pets}
              onChange={(e) => setPets(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Nuôi mèo">Nuôi mèo</option>
              <option value="Nuôi chó">Nuôi chó</option>
              <option value="Cả chó và mèo">Cả chó và mèo</option>
              <option value="Không nuôi thú cưng">Không nuôi thú cưng</option>
            </select>
          </div>

          {/* 20. 🍺 Về việc uống bia rượu */}
          <div className="p-4 flex items-center justify-between">
            <span className="font-bold text-neutral-200 flex items-center gap-2">
              <Wine className="w-4 h-4 text-neutral-400" /> Về việc uống bia rượu
            </span>
            <select
              value={drinking}
              onChange={(e) => setDrinking(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="Cuối tuần cùng bạn bè">Cuối tuần cùng bạn bè</option>
              <option value="Dịp đặc biệt">Dịp đặc biệt</option>
              <option value="Không bao giờ">Không bao giờ</option>
              <option value="Thường xuyên">Thường xuyên</option>
            </select>
          </div>

          {/* 21. Quản lý danh sách chặn (Block Contacts) */}
          <div className="p-4 space-y-3 bg-neutral-900/60">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <UserX className="w-4 h-4" /> Quản lý danh sách chặn (Block Contacts)
            </div>
            <p className="text-[11px] text-neutral-400">
              Nhập email hoặc SĐT người quen để Tinder không hiển thị hồ sơ của nhau.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập SĐT hoặc email cần chặn..."
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="flex-1 bg-[#16191f] border border-neutral-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 text-white"
              />
              <button
                type="button"
                onClick={handleAddBlockedContact}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Chặn
              </button>
            </div>
            {blockedContacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {blockedContacts.map((c, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-950/60 border border-red-800/60 text-red-300">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Footer */}
        <div className="p-4 border-t border-neutral-800 bg-[#111418] sticky bottom-0 z-20">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            {saving ? 'Đang lưu cài đặt...' : 'Áp Dụng Tiêu Chí & Tính Điểm Tương Hợp'}
          </button>
        </div>
      </div>
    </div>
  );
};
