import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { UserProfile, ChatMessage } from '../types';
import {
  Send, ArrowLeft, MoreVertical, Heart, Smile, UserX, Ban, Info, User
} from 'lucide-react';
import { ProfileDetailModal } from './ProfileDetailModal';

interface ChatBoxProps {
  currentUser: UserProfile | null;
  partner: UserProfile;
  onBack: () => void;
  onUnmatched: (partnerId: string) => void;
  onLastMessageUpdate?: (partnerId: string, lastMessage: string, lastMessageTime: string) => void;
}

const POPULAR_GIFS = [
  'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif', // Hello wave
  'https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif', // Cute cat
  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif', // Cat typing
  'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif', // Cheers
  'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', // Coffee cheers
  'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif'  // Heart explosion
];

export const ChatBox: React.FC<ChatBoxProps> = ({
  currentUser,
  partner,
  onBack,
  onUnmatched,
  onLastMessageUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('tinder_token');
        const res = await axios.get(`http://localhost:5000/api/chat/messages/${partner.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        setMessages(res.data.messages || []);
      } catch (error) {
        console.error('Lỗi khi tải lịch sử tin nhắn:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();

    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      if (partner.chatRoomId) {
        socket.emit('join_room', partner.chatRoomId);
      }
    });

    socket.on('new_message', (newMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      onLastMessageUpdate?.(partner.id, newMsg.content, newMsg.sentAt || new Date().toISOString());
    });

    return () => {
      socket.disconnect();
    };
  }, [partner.id, partner.chatRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (contentToSend?: string, type: 'text' | 'gif' = 'text') => {
    const content = (contentToSend || input).trim();
    if (!content) return;

    if (!contentToSend) setInput('');
    setShowGifPicker(false);

    try {
      const token = localStorage.getItem('tinder_token');
      const res = await axios.post(
        'http://localhost:5000/api/chat/messages',
        {
          partnerId: partner.id,
          content
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const savedMessage: ChatMessage = { ...res.data, type };
      setMessages((prev) => [...prev, savedMessage]);
      onLastMessageUpdate?.(partner.id, content, new Date().toISOString());

      if (socketRef.current && res.data.roomId) {
        socketRef.current.emit('send_message', {
          roomId: res.data.roomId,
          message: savedMessage
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  // Tính năng hủy tương hợp (Unmatch)
  const handleUnmatch = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy tương hợp với ${partner.name}? Toàn bộ lịch sử trò chuyện và kết nối sẽ bị xóa vĩnh viễn.`)) return;

    try {
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/unmatch',
        { targetUserId: partner.id },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      onUnmatched(partner.id);
    } catch (error) {
      console.error('Lỗi khi hủy tương hợp:', error);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Bạn có chắc muốn chặn và báo cáo ${partner.name}? Hồ sơ của hai bạn sẽ biến mất khỏi nhau hoàn toàn.`)) return;

    try {
      const token = localStorage.getItem('tinder_token');
      await axios.post(
        'http://localhost:5000/api/block',
        { targetUserId: partner.id, reason: 'Chặn bởi người dùng' },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      onUnmatched(partner.id);
    } catch (error) {
      console.error('Lỗi khi chặn:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b0e11] relative">
      {/* Header */}
      <div className="p-3.5 bg-[#111418] border-b border-neutral-800 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* VÙNG AVATAR & TÊN - BẤM ĐỂ XEM HỒ SƠ CHI TIẾT */}
          <div
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 cursor-pointer group"
            title={`Bấm để xem hồ sơ của ${partner.name}`}
          >
            <div className="relative">
              <img
                src={partner.photos[0]}
                alt={partner.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500 group-hover:ring-rose-400 group-hover:scale-105 transition-all shadow-md"
              />
              {/* Chấm xanh trạng thái hoạt động */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-neutral-900 rounded-full"></span>
            </div>

            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-rose-400 transition-colors">
                {partner.name}, {partner.age}
                <span className="text-[10px] text-neutral-400 font-normal px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700/60 group-hover:border-rose-500/40">
                  Xem hồ sơ
                </span>
              </h3>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                Đang hoạt động trong 24h qua
              </span>
            </div>
          </div>
        </div>

        {/* Nút Xem hồ sơ (i) & Nút 3 chấm tùy chọn */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProfileModal(true)}
            title={`Xem hồ sơ chi tiết của ${partner.name}`}
            className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
          >
            <Info className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              title="Tùy chọn tương hợp"
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showActionMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50">
                <button
                  onClick={() => {
                    setShowActionMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-rose-400" /> Xem hồ sơ chi tiết
                </button>
                <div className="my-1 border-t border-neutral-800" />
                <button
                  onClick={handleUnmatch}
                  className="w-full px-4 py-2.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserX className="w-4 h-4" /> Hủy tương hợp (Unmatch)
                </button>
                <button
                  onClick={handleBlock}
                  className="w-full px-4 py-2.5 text-left text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-4 h-4" /> Chặn & Báo cáo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vùng tin nhắn */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {/* KHUNG THÔNG TIN TƯƠNG HỢP BO GÓC SANG TRỌNG (LUXURY ROUNDED MATCH CARD) */}
        <div className="max-w-md mx-auto my-4 p-6 rounded-3xl bg-gradient-to-b from-[#181c22] via-[#14171c] to-[#0e1014] border border-neutral-800 shadow-2xl text-center relative overflow-hidden">
          {/* Vầng sáng trang trí */}
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Cặp Avatar lồng vào nhau */}
          <div className="flex items-center justify-center -space-x-3 mb-4 relative z-10">
            <img
              src={currentUser?.photos[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt="You"
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#14171c] shadow-lg"
            />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md z-20">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <img
              src={partner.photos[0]}
              alt={partner.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#14171c] shadow-lg"
            />
          </div>

          {/* Tiêu đề & phụ đề */}
          <h3 className="text-xl font-extrabold text-white tracking-tight relative z-10">
            Bạn đã tương hợp với {partner.name}!
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed relative z-10">
            {partner.city || 'Hồ Chí Minh'} • Hai bạn đều thích nhau
          </p>

          {/* Các thẻ sở thích chung bo góc */}
          {partner.interests && partner.interests.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3 relative z-10">
              {partner.interests.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-800/80 border border-neutral-700/60 text-neutral-200"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Nút Xem hồ sơ */}
          <div className="mt-4 flex items-center justify-center gap-2 relative z-10">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 rounded-full bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold border border-neutral-700/80 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-rose-400" /> Xem hồ sơ chi tiết
            </button>
          </div>

          {/* Gợi ý mở đầu câu chuyện (Icebreakers) */}
          <div className="mt-5 pt-4 border-t border-neutral-800/80 text-left relative z-10">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              💡 Bấm để gửi lời chào mở đầu:
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                `👋 Chào ${partner.name}! Rất vui được tương hợp với cậu!`,
                `☕ Cậu có hay ghé mấy quán cà phê đẹp ở ${partner.city || 'Sài Gòn'} không?`,
                `✨ Cậu cũng thích ${partner.interests?.[0] || 'âm nhạc'} hả? Gu đỉnh thế!`
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt, 'text')}
                  className="text-left text-xs p-2.5 rounded-xl bg-neutral-900/80 hover:bg-rose-500/15 border border-neutral-800 hover:border-rose-500/40 text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <Send className="w-3 h-3 text-neutral-500 group-hover:text-rose-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-neutral-500">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-xs text-neutral-500">
            Chưa có tin nhắn nào. Hãy chọn một lời chào ở trên hoặc nhập tin nhắn bên dưới!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === (currentUser?.id || 'user_me');
            const isGif = msg.content.startsWith('http') && msg.content.includes('giphy');

            if (isGif) {
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="rounded-2xl overflow-hidden border border-neutral-800 shadow-xl max-w-xs group relative">
                    <img src={msg.content} alt="GIF" className="w-full max-h-56 object-cover" />
                    <span className="absolute bottom-1 right-2 text-[10px] bg-black/60 backdrop-blur-xs text-white/90 px-1.5 py-0.5 rounded-md font-mono">
                      {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-[#ea1d45] to-[#f42b58] text-white rounded-br-xs font-medium'
                      : 'bg-[#1c2128] text-neutral-100 rounded-bl-xs border border-neutral-800/80'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className={`text-[10px] block text-right mt-1 font-mono ${isMe ? 'text-white/70' : 'text-neutral-400'}`}>
                    {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* POPOVER KHO ẢNH ĐỘNG GIFS (GIPHY / TENOR INTEGRATION) */}
      {showGifPicker && (
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
          {POPULAR_GIFS.map((gifUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(gifUrl, 'gif')}
              className="rounded-xl overflow-hidden hover:opacity-80 transition-opacity aspect-video bg-neutral-800"
            >
              <img src={gifUrl} alt="GIF" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Input gửi tin nhắn */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 bg-[#111418] border-t border-neutral-800 flex items-center gap-2.5"
      >
        {/* Nút gửi GIF */}
        <button
          type="button"
          onClick={() => setShowGifPicker(!showGifPicker)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
            showGifPicker
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'border-neutral-700 text-neutral-400 hover:text-white'
          }`}
          title="Gửi ảnh động GIF"
        >
          GIF
        </button>

        <button
          type="button"
          onClick={() => setInput((prev) => prev + ' 😊')}
          className="p-2 text-neutral-400 hover:text-amber-400 transition-colors"
          title="Thêm biểu tượng cảm xúc"
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Nhắn tin cho ${partner.name}...`}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-neutral-500"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* MODAL XEM CHI TIẾT TOÀN BỘ HỒ SƠ PARTNER */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        profile={partner}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
