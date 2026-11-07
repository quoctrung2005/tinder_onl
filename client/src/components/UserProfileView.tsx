import React, { useState, useRef } from 'react';
import axios from 'axios';
import type { UserProfile } from '../types';
import {
  Check, ChevronLeft, ChevronRight, ArrowLeft, Plus, X,
  ArrowUp, ArrowDown, Briefcase, GraduationCap, Home
} from 'lucide-react';

interface UserProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onBackToSwipe: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onUpdateUser,
  onBackToSwipe
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false); // Bấm mũi tên ↑ để mở rộng chi tiết phong cách sống
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dữ liệu hồ sơ người dùng (Khớp ảnh chụp Trung 21)
  const [name, setName] = useState(user.name);
  const [age] = useState(user.age || 21);
  const [photos, setPhotos] = useState<string[]>(user.photos && user.photos.length > 0 ? user.photos : [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80'
  ]);
  const [bio, setBio] = useState(user.bio || '');
  const [job, setJob] = useState(user.job || 'Sinh viên');
  const [company, setCompany] = useState(user.company || 'Đại học');
  const [school, setSchool] = useState(user.school || 'Huit');
  const [city, setCity] = useState(user.city || 'Hồ Chí Minh');
  const [gender, setGender] = useState(user.gender || 'MALE');
  const [sexualOrientation, setSexualOrientation] = useState('Dị tính');

  // Lối sống & Thói quen (Khớp ảnh 0e06598b.jpg)
  const [workout, setWorkout] = useState(user.workout || 'Thường xuyên');
  const [lifestyleGoingOut, setLifestyleGoingOut] = useState('Không dành cho mình...');
  const [lifestyleWeekend, setLifestyleWeekend] = useState('Không hút thuốc');
  const [lifestylePhone, setLifestylePhone] = useState('Thời gian bên nhau');

  // Kiểm soát hồ sơ (Match Plus badge)
  const [hideAge, setHideAge] = useState(false);
  const [hideDistance, setHideDistance] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photoIndex < photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    }
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    }
  };

  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (activeSlot !== null && activeSlot < photos.length) {
        const newPhotos = [...photos];
        newPhotos[activeSlot] = base64Url;
        setPhotos(newPhotos);
      } else {
        setPhotos((prev) => [...prev, base64Url]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length <= 1) {
      alert('Hồ sơ cần ít nhất 1 ảnh đại diện!');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
    if (photoIndex >= photos.length - 1 && photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('tinder_token');
      await axios.put(
        'http://localhost:5000/api/users/profile',
        {
          name,
          bio,
          city,
          photos,
          job,
          company,
          school,
          gender,
          sexual_orientation: sexualOrientation,
          lifestyle_going_out: lifestyleGoingOut,
          lifestyle_weekend: lifestyleWeekend,
          lifestyle_phone: lifestylePhone,
          hide_age: hideAge,
          hide_distance: hideDistance,
          workout
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const updated: UserProfile = {
        ...user,
        name,
        bio,
        city,
        photos,
        job,
        company,
        school,
        gender,
        workout
      };

      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      setActiveTab('preview');
    } catch (err) {
      console.error('Lỗi khi lưu profile:', err);
      alert('Có lỗi khi lưu hồ sơ, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 h-screen bg-[#000000] flex flex-col items-center justify-center p-3 sm:p-5 relative select-none overflow-hidden font-sans">
      {/* Nút quay lại Quẹt thẻ ở góc trên */}
      <button
        onClick={onBackToSwipe}
        className="absolute top-4 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
        title="Quay lại khám phá quẹt thẻ"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-semibold">Khám phá</span>
      </button>

      {/* THÔNG BÁO LƯU THÀNH CÔNG */}
      {savedSuccess && (
        <div className="absolute top-5 z-40 px-5 py-2.5 rounded-full bg-emerald-600/90 text-white font-bold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Đã lưu thay đổi hồ sơ thành công!</span>
        </div>
      )}

      {/* KHUNG TRUNG TÂM CHUẨN TINDER */}
      <div className="relative w-full max-w-[420px] h-[90vh] max-h-[640px] bg-[#111418] rounded-3xl overflow-hidden border border-neutral-800/80 shadow-2xl flex flex-col">
        {/* 2 TAB Ở ĐỈNH: [ Chỉnh sửa ] | [ Xem trước ] (Khớp 100% hình 1, 2, 3, 5, 6, 7) */}
        <div className="h-12 border-b border-neutral-800/80 bg-[#16181d] flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 h-full text-sm font-bold transition-all relative flex items-center justify-center cursor-pointer ${
              activeTab === 'edit'
                ? 'text-[#ea1d45] border-b-2 border-[#ea1d45]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 h-full text-sm font-bold transition-all relative flex items-center justify-center cursor-pointer ${
              activeTab === 'preview'
                ? 'text-[#ea1d45] border-b-2 border-[#ea1d45]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Xem trước
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: XEM TRƯỚC (Khớp 100% hình edd24bdb.jpg & 0e06598b.jpg) */}
        {/* ========================================================= */}
        {activeTab === 'preview' && (
          <div className="flex-1 relative bg-neutral-950 overflow-hidden flex flex-col justify-between">
            {/* Thanh vạch tiến trình ảnh ở đỉnh */}
            <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-30 pointer-events-none">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                    idx === photoIndex ? 'bg-white shadow-md' : 'bg-black/50 backdrop-blur-xs'
                  }`}
                />
              ))}
            </div>

            {/* Ảnh đại diện chính */}
            <div className="relative w-full h-full bg-neutral-950 overflow-hidden">
              <img
                src={photos[photoIndex]}
                alt={name}
                className="w-full h-full object-cover"
              />

              {/* Vùng bấm tàng hình nửa trái / nửa phải để lướt ảnh */}
              <div className="absolute inset-0 z-10 flex">
                <div onClick={prevPhoto} className="w-1/2 h-3/4 cursor-pointer" />
                <div onClick={nextPhoto} className="w-1/2 h-3/4 cursor-pointer" />
              </div>

              {/* Mũi tên tròn 2 bên mép ảnh: < và > (Khớp hình 7) */}
              {photoIndex > 0 && (
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-sm flex items-center justify-center text-white z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {photoIndex < photos.length - 1 && (
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-sm flex items-center justify-center text-white z-20 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Gradient phủ mờ đen dưới đáy */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

              {/* THÔNG TIN HỒ SƠ PHỦ TRÊN ẢNH */}
              <div className="absolute bottom-5 left-5 right-5 z-20 text-white space-y-2 pointer-events-auto">
                {/* TÊN + TUỔI + TÍCH XANH + NÚT MŨI TÊN BẬT CHI TIẾT (Khớp 100% hình 7: edd24bdb.jpg) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
                      {name} {!hideAge && age}
                    </h2>
                    <div className="w-6 h-6 rounded-full bg-sky-400 flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  </div>

                  {/* NÚT MŨI TÊN BẬT/TẮT CHI TIẾT (Khớp chính xác nút mũi tên người dùng yêu cầu!) */}
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? 'Thu gọn thông tin' : 'Bật xem chi tiết phong cách sống'}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-all active:scale-90 cursor-pointer text-white"
                  >
                    {isExpanded ? (
                      <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    )}
                  </button>
                </div>

                {/* TRẠNG THÁI 1: THU GỌN (Khớp 100% hình 7 edd24bdb.jpg) */}
                {!isExpanded ? (
                  <div className="space-y-1 text-xs text-neutral-200 font-medium drop-shadow-sm pt-0.5">
                    {job && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span>{job} {company ? `tại ${company}` : ''}</span>
                      </div>
                    )}
                    {school && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span>{school}</span>
                      </div>
                    )}
                    {city && (
                      <div className="flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span>Sống tại {city}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* TRẠNG THÁI 2: ĐÃ BẬT MŨI TÊN LÊN (Khớp 100% hình 0e06598b.jpg) */
                  <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Dòng tiêu đề: Thông tin cơ bản & Phong cách sống */}
                    <div className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>Thông tin cơ bản & Phong cách sống</span>
                    </div>

                    {/* Các thẻ Pill phong cách sống (Khớp chính xác hình 0e06598b.jpg) */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {workout && (
                        <span className="px-3 py-1 rounded-full bg-black/65 border border-neutral-700/60 text-neutral-200 flex items-center gap-1.5 backdrop-blur-xs">
                          🏋️ {workout}
                        </span>
                      )}
                      {lifestyleGoingOut && (
                        <span className="px-3 py-1 rounded-full bg-black/65 border border-neutral-700/60 text-neutral-200 flex items-center gap-1.5 backdrop-blur-xs">
                          🍷 {lifestyleGoingOut}
                        </span>
                      )}
                      {lifestyleWeekend && (
                        <span className="px-3 py-1 rounded-full bg-black/65 border border-neutral-700/60 text-neutral-200 flex items-center gap-1.5 backdrop-blur-xs">
                          🚭 {lifestyleWeekend}
                        </span>
                      )}
                      {lifestylePhone && (
                        <span className="px-3 py-1 rounded-full bg-black/65 border border-neutral-700/60 text-neutral-200 flex items-center gap-1.5 backdrop-blur-xs">
                          💬 {lifestylePhone}
                        </span>
                      )}
                    </div>

                    {/* Nút Hiển thị thêm & Chuyển sang sửa */}
                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className="px-3.5 py-1 rounded-full border border-white/60 hover:border-white text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {showMoreDetails ? 'Thu gọn' : 'Hiển thị thêm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('edit')}
                        className="flex-1 py-1 px-3 rounded-full bg-white hover:bg-neutral-200 text-neutral-900 font-bold text-xs text-center transition-all cursor-pointer shadow-md"
                      >
                        Sửa Thông Tin (96%)
                      </button>
                    </div>

                    {/* Chi tiết mở rộng khi bấm Hiển thị thêm */}
                    {showMoreDetails && (
                      <div className="pt-2 text-xs space-y-1 text-neutral-300 bg-black/80 p-3 rounded-2xl border border-neutral-800 backdrop-blur-md">
                        {job && <p>💼 {job} {company ? `tại ${company}` : ''}</p>}
                        {school && <p>🎓 {school}</p>}
                        {city && <p>🏠 Sống tại {city}</p>}
                        {bio && <p className="italic text-neutral-200 mt-1">"{bio}"</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CHỈNH SỬA (Khớp 100% hình 1, 2, 5) */}
        {/* ========================================================= */}
        {activeTab === 'edit' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-white relative bg-[#111418]">
            {/* 1. LƯỚI 9 Ô ẢNH CHUẨN TINDER */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Ảnh đại diện ({photos.length}/9)
                </span>
                <span className="text-[10px] text-neutral-500">Bấm ô để thêm hoặc thay đổi ảnh</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                  const photoUrl = photos[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSlotClick(idx)}
                      className={`aspect-3/4 rounded-2xl relative overflow-hidden border transition-all cursor-pointer ${
                        photoUrl
                          ? 'border-neutral-800 hover:border-rose-500'
                          : 'border-dashed border-neutral-700 hover:border-rose-500/80 bg-neutral-900/60 flex items-center justify-center'
                      }`}
                    >
                      {photoUrl ? (
                        <>
                          <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => handleRemovePhoto(idx, e)}
                            className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-black text-white hover:text-rose-400 transition-colors shadow-md cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="p-2 rounded-full bg-rose-500/10 text-rose-500">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* TÊN HIỂN THỊ */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Tên hiển thị
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* 2. GIỚI THIỆU VỀ TÔI (BIO) */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Giới thiệu về tôi
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Viết một vài dòng giới thiệu về bản thân..."
                rows={3}
                maxLength={500}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              />
              <div className="text-right text-[10px] text-neutral-500">{bio.length}/500</div>
            </div>

            {/* 3. PHONG CÁCH SỐNG (Khớp hình 2 & 5) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Phong cách sống & Lối sống
              </span>

              {/* Tập luyện */}
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <span className="text-xs font-semibold text-neutral-300">Tập Luyện</span>
                <input
                  type="text"
                  value={workout}
                  onChange={(e) => setWorkout(e.target.value)}
                  placeholder="Thường xuyên..."
                  className="bg-transparent text-right text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-1/2"
                />
              </div>

              {/* Chuyện Đi Chơi */}
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <span className="text-xs font-semibold text-neutral-300">Chuyện Đi Chơi</span>
                <input
                  type="text"
                  value={lifestyleGoingOut}
                  onChange={(e) => setLifestyleGoingOut(e.target.value)}
                  placeholder="giao du bạn bè, bar club..."
                  className="bg-transparent text-right text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-1/2"
                />
              </div>

              {/* Cuối Tuần */}
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <span className="text-xs font-semibold text-neutral-300">Cuối Tuần</span>
                <input
                  type="text"
                  value={lifestyleWeekend}
                  onChange={(e) => setLifestyleWeekend(e.target.value)}
                  placeholder="nạp lại năng lượng..."
                  className="bg-transparent text-right text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-1/2"
                />
              </div>

              {/* Dùng Điện Thoại */}
              <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <span className="text-xs font-semibold text-neutral-300">Dùng Điện Thoại</span>
                <input
                  type="text"
                  value={lifestylePhone}
                  onChange={(e) => setLifestylePhone(e.target.value)}
                  placeholder="rep cực nhanh, 24/7..."
                  className="bg-transparent text-right text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-1/2"
                />
              </div>
            </div>

            {/* 4. KIỂM SOÁT HỒ SƠ CỦA BẠN */}
            <div className="p-3.5 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  KIỂM SOÁT HỒ SƠ CỦA BẠN
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-neutral-300">Ẩn tuổi của tôi</span>
                <button
                  type="button"
                  onClick={() => setHideAge(!hideAge)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    hideAge ? 'bg-[#ea1d45] justify-end' : 'bg-neutral-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                </button>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800">
                <span className="text-neutral-300">Ẩn Phạm Vi của tôi</span>
                <button
                  type="button"
                  onClick={() => setHideDistance(!hideDistance)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    hideDistance ? 'bg-[#ea1d45] justify-end' : 'bg-neutral-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                </button>
              </div>
            </div>

            {/* 5. GIỚI TÍNH & KHUYNH HƯỚNG TÍNH DỤC (Khớp hình 1 & 2) */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  GIỚI TÍNH
                </span>
                <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none w-full cursor-pointer"
                  >
                    <option value="MALE" className="bg-neutral-900">Nam</option>
                    <option value="FEMALE" className="bg-neutral-900">Nữ</option>
                    <option value="OTHER" className="bg-neutral-900">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  KHUYNH HƯỚNG TÍNH DỤC
                </span>
                <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 flex justify-between items-center">
                  <select
                    value={sexualOrientation}
                    onChange={(e) => setSexualOrientation(e.target.value)}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none w-full cursor-pointer"
                  >
                    <option value="Dị tính" className="bg-neutral-900">Dị tính</option>
                    <option value="Đồng tính" className="bg-neutral-900">Đồng tính</option>
                    <option value="Song tính" className="bg-neutral-900">Song tính</option>
                    <option value="Toàn tính" className="bg-neutral-900">Toàn tính</option>
                    <option value="Vô tính" className="bg-neutral-900">Vô tính</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 6. CHỨC DANH, CÔNG TY, TRƯỜNG, ĐANG SỐNG TẠI (Khớp hình 5) */}
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  CHỨC DANH
                </span>
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  placeholder="Sinh viên"
                  className="w-full p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  CÔNG TY
                </span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Đại học"
                  className="w-full p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  TRƯỜNG
                </span>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="Huit"
                  className="w-full p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  ĐANG SỐNG TẠI
                </span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Hồ Chí Minh"
                  className="w-full p-3 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Khoảng trống để không bị nút Lưu che */}
            <div className="h-14" />
          </div>
        )}

        {/* NÚT LƯU TRẮNG DƯỚI ĐÁY (Khớp 100% hình 1, 2, 5) */}
        {activeTab === 'edit' && (
          <div className="p-3 border-t border-neutral-800 bg-[#16181d] flex justify-center sticky bottom-0 z-30">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full max-w-[180px] py-2.5 rounded-full bg-white hover:bg-neutral-200 text-neutral-900 font-extrabold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
