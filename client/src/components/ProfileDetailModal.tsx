import React, { useState } from 'react';
import {
  X, CheckCircle, Home, MapPin, Briefcase, GraduationCap,
  ChevronLeft, ChevronRight, Music, Heart
} from 'lucide-react';
import type { UserProfile } from '../types';

interface ProfileDetailModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSendMessage?: () => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSendMessage
}) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!isOpen || !profile) return null;

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
  ];

  const nextPhoto = () => {
    if (photoIndex < photos.length - 1) {
      setPhotoIndex(photoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex(photoIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-[#111418] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col text-white">
        {/* Nút đóng góc phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
          title="Đóng hồ sơ"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* 1. KHU VỰC ẢNH VÀ SLIDER TIẾN TRÌNH */}
        <div className="relative w-full h-[360px] sm:h-[420px] bg-neutral-900 shrink-0">
          <img
            src={photos[photoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
          />

          {/* Thanh vạch tiến trình ảnh ở đỉnh */}
          <div className="absolute top-3 left-4 right-14 flex gap-1.5 z-30">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                  idx === photoIndex ? 'bg-white shadow-md' : 'bg-black/50 backdrop-blur-xs'
                }`}
              />
            ))}
          </div>

          {/* Chevrons trái/phải */}
          {photoIndex > 0 && (
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white z-30 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {photoIndex < photos.length - 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm flex items-center justify-center text-white z-30 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Gradient đen đáy ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111418] via-transparent to-transparent pointer-events-none" />

          {/* Tên & Tuổi đè lên mép dưới ảnh */}
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between z-20">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
                  {profile.name}
                </h2>
                <span className="text-2xl font-light text-neutral-200">{profile.age}</span>
                {profile.is_verified && (
                  <CheckCircle className="w-5 h-5 text-sky-400 fill-sky-400 shrink-0 shadow-sm" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium mt-1">
                <Home className="w-3.5 h-3.5 text-neutral-400" />
                <span>Sống tại {profile.city || 'Hồ Chí Minh'}</span>
                <span>•</span>
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cách xa 6 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. KHU VỰC THÔNG TIN CHI TIẾT CUỘN */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar bg-[#111418]">
          {/* Nghề nghiệp & Học vấn */}
          {(profile.job || profile.school) && (
            <div className="space-y-2 text-xs text-neutral-200">
              {profile.job && (
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {profile.job} {profile.company ? `tại ${profile.company}` : ''}
                  </span>
                </div>
              )}
              {profile.school && (
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{profile.school}</span>
                </div>
              )}
            </div>
          )}

          {/* Bio / Giới thiệu */}
          {profile.bio && (
            <div>
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Giới thiệu
              </h4>
              <p className="text-neutral-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Mục đích hẹn hò */}
          {profile.relationship_goal && (
            <div>
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Mục đích hẹn hò
              </h4>
              <div className="px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold inline-flex items-center gap-2">
                <span>{profile.relationship_goal}</span>
              </div>
            </div>
          )}

          {/* Lối sống & Thói quen */}
          {(profile.zodiac || profile.pets || profile.workout) && (
            <div>
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Thông tin cơ bản & Lối sống
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile.zodiac && (
                  <span className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                    ✨ {profile.zodiac}
                  </span>
                )}
                {profile.pets && (
                  <span className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                    🐾 {profile.pets}
                  </span>
                )}
                {profile.workout && (
                  <span className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1.5">
                    💪 Tập luyện: {profile.workout}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Bài hát chủ đề Spotify (Spotify Anthem) */}
          {profile.spotify_anthem && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" /> Bài hát chủ đề Spotify
                </span>
                <span className="text-[10px] text-neutral-400">Spotify Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={profile.spotify_anthem.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'}
                  alt="Anthem"
                  className="w-12 h-12 rounded-xl object-cover shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-white truncate">{profile.spotify_anthem.title}</h5>
                  <p className="text-xs text-neutral-300 truncate">{profile.spotify_anthem.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* Album ảnh Instagram gần nhất */}
          {profile.instagram_photos && profile.instagram_photos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  📷 Ảnh gần đây trên Instagram
                </h4>
                <span className="text-[10px] text-pink-400 font-semibold">@connected</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {profile.instagram_photos.slice(0, 6).map((imgUrl, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                    <img
                      src={imgUrl}
                      alt="Instagram"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sở thích */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Sở thích ({profile.interests.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((it) => (
                  <span
                    key={it}
                    className="px-3 py-1 rounded-full text-xs bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. NÚT HÀNH ĐỘNG DƯỚI ĐÁY */}
        <div className="p-4 border-t border-neutral-800 bg-[#16191f] flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            Đóng
          </button>
          {onSendMessage && (
            <button
              onClick={() => {
                onClose();
                onSendMessage();
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" /> Nhắn tin ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
