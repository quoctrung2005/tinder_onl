import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  X, Plus, Check, ToggleLeft, ToggleRight, CheckCircle,
  Music, ShieldCheck, Sliders, Globe, UserX
} from 'lucide-react';
import type { UserProfile, SpotifyAnthem } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdate: (updatedUser: UserProfile) => void;
}

const RELATIONSHIP_GOALS = [
  { id: 'long_term', label: '💘 Tìm người yêu lâu dài', desc: 'Hy vọng tìm được tri kỷ gắn bó lâu bền' },
  { id: 'long_short', label: '🥂 Vừa lâu dài vừa ngắn hạn', desc: 'Sẵn sàng cho cả tình yêu hoặc trải nghiệm' },
  { id: 'short_fun', label: '🎉 Hẹn hò vui vẻ ngắn hạn', desc: 'Tìm kiếm những buổi hẹn thú vị, tự do' },
  { id: 'new_friends', label: '☕ Bạn mới trò chuyện', desc: 'Mở rộng vòng kết nối bạn bè mới' },
  { id: 'figuring_out', label: '🤔 Tùy duyên chưa rõ', desc: 'Để mọi thứ diễn ra tự nhiên nhất' },
];

const ZODIAC_SIGNS = [
  'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
  'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
  'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
];

const PET_OPTIONS = ['Nuôi chó', 'Nuôi mèo', 'Yêu động vật', 'Không nuôi thú cưng'];
const WORKOUT_OPTIONS = ['Hàng ngày', 'Thường xuyên', 'Thỉnh thoảng', 'Không tập'];

const AVAILABLE_INTERESTS = [
  'Âm nhạc', 'Nhạc Indie', 'Cà phê', 'Trà sữa', 'Du lịch',
  'Đi phượt', 'Nhiếp ảnh', 'Nghệ thuật', 'Công nghệ', 'Netflix',
  'Đọc sách', 'Yoga', 'Gym', 'Làm bánh', 'Nấu ăn', 'Mèo', 'Nuôi chó'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdate
}) => {
  const [photos, setPhotos] = useState<string[]>(user.photos || []);
  const [bio, setBio] = useState(user.bio || '');
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city || 'Hồ Chí Minh');
  const [job, setJob] = useState(user.job || '');
  const [company, setCompany] = useState(user.company || '');
  const [school, setSchool] = useState(user.school || '');
  const [relationshipGoal, setRelationshipGoal] = useState(user.relationship_goal || '💘 Tìm người yêu lâu dài');
  const [zodiac, setZodiac] = useState(user.zodiac || '');
  const [pets, setPets] = useState(user.pets || '');
  const [workout, setWorkout] = useState(user.workout || '');
  const [interests, setInterests] = useState<string[]>(user.interests || []);
  const [isVerified, setIsVerified] = useState(user.is_verified || false);
  const [smartPhotos, setSmartPhotos] = useState(true);
  const [hideAge, setHideAge] = useState(false);
  const [hideDistance, setHideDistance] = useState(false);
  const [saving, setSaving] = useState(false);

  // Spotify & Instagram
  const [anthemTitle, setAnthemTitle] = useState(user.spotify_anthem?.title || 'Chuyện Rằng');
  const [anthemArtist, setAnthemArtist] = useState(user.spotify_anthem?.artist || 'Thịnh Suy');
  const [instagramConnected, setInstagramConnected] = useState(Boolean(user.instagram_photos && user.instagram_photos.length > 0));

  // Cài đặt Tìm kiếm (Discovery Settings) & Danh sách chặn (Block Contacts)
  const [prefGender, setPrefGender] = useState<string[]>(user.pref_gender || ['FEMALE']);
  const [minAge, setMinAge] = useState<number>(user.pref_min_age || 18);
  const [maxAge, setMaxAge] = useState<number>(user.pref_max_age || 35);
  const [maxDistance, setMaxDistance] = useState<number>(user.pref_max_distance || 50);
  const [globalMode, setGlobalMode] = useState<boolean>(Boolean(user.global_mode));
  const [blockedContacts, setBlockedContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');

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
        console.error('Lỗi lấy blocked contacts:', err);
      }
    };
    fetchBlocked();
  }, [isOpen]);

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
      console.error('Lỗi block contact:', err);
    }
  };

  // Webcam Verification
  const [showWebcam, setShowWebcam] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  if (!isOpen) return null;

  // Bật Webcam chụp ảnh xác minh tích xanh
  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Không thể truy cập webcam:', err);
      // Mô phỏng xác minh nếu máy không có camera
      setTimeout(() => {
        setIsVerified(true);
        setShowWebcam(false);
        alert('🎉 Đã xác minh khuôn mặt selfie thành công! Hồ sơ nhận dấu Tích Xanh chính chủ.');
      }, 1000);
    }
  };

  const captureAndVerify = async () => {
    setVerifying(true);
    // Dừng camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/users/verify-photo',
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setIsVerified(true);
      setShowWebcam(false);
      alert('🎉 Chúc mừng! Bạn đã nhận dấu Tích Xanh xác thực chính chủ trên Tinder.');
    } catch (error) {
      console.error('Lỗi verify:', error);
    } finally {
      setVerifying(false);
    }
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

  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length <= 1) {
      alert('Hồ sơ cần ít nhất 1 ảnh đại diện!');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((i) => i !== tag));
    } else {
      if (interests.length >= 8) return alert('Tối đa 8 sở thích!');
      setInterests([...interests, tag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('tinder_token');

      const spotifyObj: SpotifyAnthem = {
        title: anthemTitle,
        artist: anthemArtist,
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'
      };

      const instaPhotos = instagramConnected ? [
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80'
      ] : [];

      await Promise.all([
        axios.put(
          'http://localhost:5000/api/users/profile',
          {
            name,
            bio,
            city,
            photos,
            job,
            company,
            school,
            relationship_goal: relationshipGoal,
            zodiac,
            pets,
            workout,
            interests,
            spotify_anthem: spotifyObj,
            instagram_photos: instaPhotos
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ),
        axios.put(
          'http://localhost:5000/api/users/preferences',
          {
            pref_gender: prefGender,
            pref_min_age: minAge,
            pref_max_age: maxAge,
            pref_max_distance: maxDistance,
            global_mode: globalMode
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
      ]);

      onUpdate({
        ...user,
        name,
        bio,
        city,
        photos,
        job,
        company,
        school,
        relationship_goal: relationshipGoal,
        zodiac,
        pets,
        workout,
        interests,
        is_verified: isVerified,
        spotify_anthem: spotifyObj,
        instagram_photos: instaPhotos,
        pref_gender: prefGender,
        pref_min_age: minAge,
        pref_max_age: maxAge,
        pref_max_distance: maxDistance,
        global_mode: globalMode
      });
      onClose();
    } catch (error) {
      console.error('Lỗi lưu hồ sơ:', error);
      alert('Không thể lưu hồ sơ, vui lòng kiểm tra lại kết nối!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#111418] border border-neutral-800 rounded-3xl text-white relative shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-[#111418] sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Sửa hồ sơ</h2>
            {isVerified && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-full border border-sky-400/30">
                <CheckCircle className="w-3.5 h-3.5 fill-sky-400 text-[#111418]" /> Đã xác thực
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Xong'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung cuộn chính */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar text-neutral-200">
          {/* 1. XÁC THỰC TÍCH XANH QUA WEBCAM */}
          <div className="p-4 bg-gradient-to-r from-sky-950/40 via-blue-950/20 to-neutral-900 rounded-2xl border border-sky-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Xác thực hình ảnh (Tích xanh Tinder)
                  {isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />}
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {isVerified
                    ? 'Hồ sơ của bạn đã được xác minh chính chủ.'
                    : 'Chụp ảnh selfie qua webcam máy tính để nhận tích xanh uy tín.'}
                </p>
              </div>
            </div>

            {!isVerified ? (
              <button
                type="button"
                onClick={startWebcam}
                className="px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-neutral-900 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
              >
                Xác thực ngay
              </button>
            ) : (
              <span className="text-xs font-bold text-sky-400">Đã kích hoạt</span>
            )}
          </div>

          {/* Modal Webcam selfie */}
          {showWebcam && (
            <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-700 text-center space-y-3">
              <h4 className="text-xs font-bold text-white">Hãy tạo dáng nhìn thẳng vào camera máy tính:</h4>
              <div className="w-64 h-48 mx-auto bg-black rounded-xl overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWebcam(false)}
                  className="px-4 py-1.5 rounded-full border border-neutral-700 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={captureAndVerify}
                  disabled={verifying}
                  className="px-5 py-1.5 rounded-full bg-sky-500 text-neutral-900 font-bold text-xs"
                >
                  {verifying ? 'Đang xác thực...' : 'Chụp ảnh & Nhận tích xanh'}
                </button>
              </div>
            </div>
          )}

          {/* 2. LƯỚI 9 Ô ẢNH CHUẨN TINDER 3x3 */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Ảnh hồ sơ ({photos.length}/9)
              </label>
              <span className="text-[11px] text-neutral-400">
                Bấm vào ô để chọn ảnh từ máy tính
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, index) => {
                const photoUrl = photos[index];
                return (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className={`relative aspect-3/4 rounded-2xl overflow-hidden cursor-pointer transition-all border group ${
                      photoUrl
                        ? 'border-neutral-700 bg-neutral-900 shadow-md'
                        : 'border-dashed border-neutral-700 hover:border-rose-500 bg-neutral-900/50 flex flex-col items-center justify-center'
                    }`}
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={`Slot ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-white flex items-center justify-center">
                          {index + 1}
                        </span>
                        <button
                          onClick={(e) => handleRemovePhoto(index, e)}
                          title="Xóa ảnh này"
                          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-neutral-900/80 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-rose-500/20 text-rose-500 flex items-center justify-center mb-1 transition-colors">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300">
                          Thêm ảnh
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3.5 p-3.5 bg-neutral-900/90 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Ảnh thông minh (Smart Photos)</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Tinder tự động đưa ảnh có tỷ lệ quẹt phải cao nhất lên làm ảnh bìa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSmartPhotos(!smartPhotos)}
                className="text-rose-500 focus:outline-none"
              >
                {smartPhotos ? (
                  <ToggleRight className="w-8 h-8 fill-rose-500 text-neutral-900" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-neutral-600" />
                )}
              </button>
            </div>
          </div>

          {/* 3. KẾT NỐI SPOTIFY (BÀI HÁT CHỦ ĐỀ) */}
          <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Music className="w-4 h-4" /> Kết nối Spotify (Bài hát chủ đề)
            </div>
            <p className="text-[11px] text-neutral-400">
              Chọn bài hát đại diện cho tâm trạng của bạn để đối phương dễ tìm điểm chung:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Tên bài hát</span>
                <input
                  type="text"
                  value={anthemTitle}
                  onChange={(e) => setAnthemTitle(e.target.value)}
                  placeholder="VD: Chuyện Rằng, Lover..."
                  className="w-full bg-[#16191f] border border-neutral-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Tên nghệ sĩ / Ca sĩ</span>
                <input
                  type="text"
                  value={anthemArtist}
                  onChange={(e) => setAnthemArtist(e.target.value)}
                  placeholder="VD: Thịnh Suy, Vũ..."
                  className="w-full bg-[#16191f] border border-neutral-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. KẾT NỐI INSTAGRAM */}
          <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Kết nối Instagram</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Hiển thị lưới các ảnh gần nhất từ trang Instagram lên hồ sơ Tinder.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setInstagramConnected(!instagramConnected)}
              className="text-rose-500 focus:outline-none"
            >
              {instagramConnected ? (
                <ToggleRight className="w-8 h-8 fill-rose-500 text-neutral-900" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-600" />
              )}
            </button>
          </div>

          {/* 5. HỌ VÀ TÊN & BIO */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Họ và tên hiển thị
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Về tôi
              </label>
              <span className="text-[11px] text-neutral-500">{bio.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Viết một đoạn giới thiệu ngắn về sở thích, gu âm nhạc hoặc tính cách của bạn..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-rose-500 leading-relaxed resize-none transition-colors"
            />
          </div>

          {/* 6. MỤC ĐÍCH HẸN HÒ */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Mục đích hẹn hò
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RELATIONSHIP_GOALS.map((goal) => {
                const isSelected = relationshipGoal === goal.label;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setRelationshipGoal(goal.label)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                    }`}
                  >
                    <div>
                      <h5 className="font-semibold text-xs">{goal.label}</h5>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{goal.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. SỞ THÍCH */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Sở thích ({interests.length}/8)
              </label>
              <span className="text-[11px] text-neutral-400 font-medium">Chọn tối đa 8</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleInterest(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-500 text-white font-semibold shadow-sm'
                        : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LỐI SỐNG & TÍNH CÁCH */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Lối sống & Thói quen
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Cung hoàng đạo</span>
                <select
                  value={zodiac}
                  onChange={(e) => setZodiac(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-rose-500 text-neutral-200"
                >
                  <option value="">Chọn cung</option>
                  {ZODIAC_SIGNS.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Thú cưng</span>
                <select
                  value={pets}
                  onChange={(e) => setPets(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-rose-500 text-neutral-200"
                >
                  <option value="">Chọn thú cưng</option>
                  {PET_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Tập luyện</span>
                <select
                  value={workout}
                  onChange={(e) => setWorkout(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-rose-500 text-neutral-200"
                >
                  <option value="">Chọn thói quen</option>
                  {WORKOUT_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 8. CÔNG VIỆC & HỌC VẤN */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Công việc & Học vấn
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Nghề nghiệp / Chức danh</span>
                <input
                  type="text"
                  placeholder="VD: Software Engineer"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Công ty / Tổ chức</span>
                <input
                  type="text"
                  placeholder="VD: FPT, VNG..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Trường Đại học</span>
                <input
                  type="text"
                  placeholder="VD: ĐH Bách Khoa"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Sống tại thành phố</span>
                <input
                  type="text"
                  placeholder="Hồ Chí Minh"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* 9. KIỂM SOÁT THÔNG TIN HIỂN THỊ */}
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Kiểm soát thông tin hiển thị (Tính năng VIP)
            </label>

            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-300">Ẩn tuổi của tôi</span>
              <button
                type="button"
                onClick={() => setHideAge(!hideAge)}
                className="text-rose-500 focus:outline-none"
              >
                {hideAge ? (
                  <ToggleRight className="w-7 h-7 fill-rose-500 text-neutral-900" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800">
              <span className="text-neutral-300">Ẩn khoảng cách của tôi</span>
              <button
                type="button"
                onClick={() => setHideDistance(!hideDistance)}
                className="text-rose-500 focus:outline-none"
              >
                {hideDistance ? (
                  <ToggleRight className="w-7 h-7 fill-rose-500 text-neutral-900" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>
          </div>

          {/* 10. CÀI ĐẶT TÌM KIẾM ĐỐI TƯỢNG (DISCOVERY SETTINGS) */}
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-200 block">
                Cài đặt Tìm Kiếm (Khám Phá)
              </label>
            </div>

            {/* Giới tính */}
            <div>
              <span className="text-[11px] text-neutral-400 block mb-2">Tôi muốn tìm kiếm:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FEMALE', label: 'Nữ' },
                  { id: 'MALE', label: 'Nam' },
                  { id: 'ALL', label: 'Mọi người' }
                ].map((item) => {
                  const isSelected = item.id === 'ALL'
                    ? prefGender.includes('FEMALE') && prefGender.includes('MALE')
                    : prefGender.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'ALL') {
                          setPrefGender(['FEMALE', 'MALE']);
                        } else {
                          setPrefGender([item.id]);
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/10 border-rose-500 text-rose-300'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khoảng cách tối đa */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-neutral-300">Khoảng cách tối đa</span>
                <span className="font-bold text-rose-400">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="160"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Độ tuổi mong muốn */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-neutral-300">Độ tuổi mong muốn</span>
                <span className="font-bold text-rose-400">{minAge} - {maxAge} tuổi</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="18"
                  max={maxAge}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <input
                  type="range"
                  min={minAge}
                  max="60"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Chế độ Toàn cầu */}
            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Chế độ Toàn cầu</span>
                </div>
                <span className="text-[10px] text-neutral-400">Xem hồ sơ vượt ra ngoài bán kính khoảng cách</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalMode(!globalMode)}
                className="text-rose-500 focus:outline-none"
              >
                {globalMode ? (
                  <ToggleRight className="w-7 h-7 fill-rose-500 text-neutral-900" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-neutral-600" />
                )}
              </button>
            </div>
          </div>

          {/* 11. QUẢN LÝ DANH SÁCH CHẶN (BLOCK CONTACTS) */}
          <div className="p-4 bg-neutral-900/90 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-red-500" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-200 block">
                Chặn Danh Bạ & Liên Hệ
              </label>
            </div>
            <p className="text-[11px] text-neutral-400">
              Nhập số điện thoại hoặc email của người quen, người yêu cũ để Tinder không bao giờ hiển thị hồ sơ của họ cho bạn và ngược lại.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập SĐT hoặc Email muốn chặn..."
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddBlockedContact}
                disabled={!newContact.trim()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-rose-400 font-bold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
              >
                Chặn
              </button>
            </div>

            {blockedContacts.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                  Đang chặn ({blockedContacts.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                  {blockedContacts.map((contact, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 flex items-center gap-1.5"
                    >
                      <span>{contact}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end gap-3 bg-[#111418] sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-neutral-700 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
