import React, { useState } from 'react';
import axios from 'axios';
import { X, Globe, MapPin, Search, Check, Sparkles, Navigation, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';

interface PassportModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onLocationUpdated: (newCity: string, newCountry: string) => void;
}

interface Destination {
  city: string;
  country: string;
  flag: string;
  description: string;
  badge?: string;
}

const POPULAR_DESTINATIONS: Destination[] = [
  { city: 'Hà Nội', country: 'Việt Nam', flag: '🇻🇳', description: 'Thủ đô nghìn năm văn hiến, phố cổ & hồ Gươm', badge: 'Gợi ý' },
  { city: 'Hồ Chí Minh', country: 'Việt Nam', flag: '🇻🇳', description: 'Trung tâm kinh tế sôi động & nightlife', badge: 'Sôi động' },
  { city: 'Đà Nẵng', country: 'Việt Nam', flag: '🇻🇳', description: 'Thành phố biển đáng sống & cầu Rồng' },
  { city: 'Đà Lạt', country: 'Việt Nam', flag: '🇻🇳', description: 'Xứ sở sương mù & cà phê chill' },
  { city: 'Tokyo', country: 'Nhật Bản', flag: '🇯🇵', description: 'Thủ phủ ánh đèn neon Shibuya & Shinjuku', badge: 'Quốc tế' },
  { city: 'Seoul', country: 'Hàn Quốc', flag: '🇰🇷', description: 'Trái tim thời trang, K-Pop & ẩm thực Hongdae' },
  { city: 'Paris', country: 'Pháp', flag: '🇫🇷', description: 'Kinh đô ánh sáng & lãng mạn bậc nhất' },
  { city: 'London', country: 'Vương Quốc Anh', flag: '🇬🇧', description: 'Thành phố cổ kính bên dòng sông Thames' },
  { city: 'New York', country: 'Hoa Kỳ', flag: '🇺🇸', description: 'Quảng trường Times Square náo nhiệt' },
  { city: 'Bangkok', country: 'Thái Lan', flag: '🇹🇭', description: 'Thiên đường du lịch ẩm thực & mua sắm' },
  { city: 'Singapore', country: 'Singapore', flag: '🇸🇬', description: 'Đảo quốc sư tử hiện đại xanh mát' },
  { city: 'Sydney', country: 'Úc', flag: '🇦🇺', description: 'Cảng biển Bondi & nhà hát Opera House' }
];

export const PassportModal: React.FC<PassportModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLocationUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [customCity, setCustomCity] = useState('');
  const [customCountry, setCustomCountry] = useState('Việt Nam');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentCity = currentUser?.city || 'Hồ Chí Minh';

  const filteredDestinations = POPULAR_DESTINATIONS.filter(
    (d) =>
      d.city.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      d.country.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleApplyPassport = async (cityToApply: string, countryToApply: string) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/users/passport',
        { city: cityToApply, country: countryToApply },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuccessMessage(`Đã dịch chuyển tới ${cityToApply}, ${countryToApply}!`);
      onLocationUpdated(cityToApply, countryToApply);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi khi kích hoạt Passport:', err);
      const msg = err.message === 'Network Error'
        ? 'Không thể kết nối máy chủ Match (Port 5000). Đang tự động kết nối lại, vui lòng thử lại sau giây lát!'
        : (err.response?.data?.error || err.message || 'Lỗi khi cập nhật vị trí');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#141923] border border-neutral-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header với hiệu ứng gradient Hộ chiếu */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-6 h-6 text-cyan-300 animate-spin-slow" />
            <span className="text-[11px] font-black tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full">
              Match Passport™
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            Hộ Chiếu Toàn Cầu
          </h2>
          <p className="text-xs text-white/80 mt-1">
            Dịch chuyển hồ sơ đến bất kỳ đâu để kết bạn & hẹn hò trước khi đặt chân tới!
          </p>

          {/* Vị trí hiện tại */}
          <div className="mt-3 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3.5 py-2 rounded-2xl border border-white/10 text-xs">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-white/70">Vị trí hiện tại:</span>
            <span className="font-extrabold text-white">{currentCity}</span>
            <span className="ml-auto flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        </div>

        {/* Nội dung danh sách điểm đến */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-white">
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/60 text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Ô tìm kiếm thành phố */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thành phố, quốc gia..."
              className="w-full bg-[#1e2533] border border-neutral-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Danh sách thành phố phổ biến */}
          <div>
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Điểm đến thịnh hành</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredDestinations.map((dest) => {
                const isSelected = selectedDestination?.city === dest.city;
                const isCurrent = currentCity.toLowerCase() === dest.city.toLowerCase();

                return (
                  <button
                    key={dest.city}
                    onClick={() => {
                      setSelectedDestination(dest);
                      setCustomCity(dest.city);
                      setCustomCountry(dest.country);
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                        : isCurrent
                        ? 'bg-rose-500/10 border-rose-500/40 text-neutral-200'
                        : 'bg-[#1a212e] border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-[#20293a]'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{dest.flag}</span>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-white truncate">
                          {dest.city}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded">
                            Ở đây
                          </span>
                        )}
                        {dest.badge && !isCurrent && (
                          <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                            {dest.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                        {dest.country} • {dest.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tùy chỉnh vị trí bất kỳ */}
          <div className="pt-2 border-t border-neutral-800">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Hoặc nhập địa điểm tùy thích
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tên thành phố (VD: Đà Lạt)"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="bg-[#1e2533] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Quốc gia (VD: Việt Nam)"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                className="bg-[#1e2533] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Nút kích hoạt vị trí mới */}
        <div className="p-4 bg-[#11151e] border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            onClick={() => handleApplyPassport('Hồ Chí Minh', 'Việt Nam')}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Về vị trí gốc</span>
          </button>

          <button
            onClick={() => {
              const city = customCity.trim() || selectedDestination?.city;
              const country = customCountry.trim() || selectedDestination?.country || 'Việt Nam';
              if (!city) {
                alert('Vui lòng chọn hoặc nhập tên thành phố muốn dịch chuyển đến.');
                return;
              }
              handleApplyPassport(city, country);
            }}
            disabled={loading || (!customCity.trim() && !selectedDestination)}
            className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Globe className="w-4 h-4" />
                <span>Kích hoạt Match Passport™</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
