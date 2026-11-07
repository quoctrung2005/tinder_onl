import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import type { UserProfile, ChatMessage } from '../types';
import {
  Send, ArrowLeft, MoreVertical, Heart, Smile, UserX, Ban, Info, User,
  Phone, Video, Mic, CheckCheck, Sparkles, Volume2
} from 'lucide-react';
import { ProfileDetailModal } from './ProfileDetailModal';
import { VideoCallModal } from './VideoCallModal';

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

  // Cuộc gọi Video & Thoại WebRTC
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(true);

  // Chỉ báo đang soạn tin (Typing Indicator)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);

  // Ghi âm tin nhắn thoại (Voice Note)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

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
      setIsPartnerTyping(false);
    });

    socket.on('user_typing', (data: any) => {
      if (data.senderId === partner.id) {
        setIsPartnerTyping(true);
      }
    });

    socket.on('user_stop_typing', (data: any) => {
      if (data.senderId === partner.id) {
        setIsPartnerTyping(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [partner.id, partner.chatRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  // Xử lý gửi tin nhắn
  const handleSend = async (contentToSend?: string, type: 'text' | 'gif' = 'text') => {
    const content = (contentToSend || input).trim();
    if (!content) return;

    if (!contentToSend) setInput('');
    setShowGifPicker(false);

    // Dừng báo hiệu typing
    if (socketRef.current && partner.chatRoomId) {
      socketRef.current.emit('stop_typing', {
        roomId: partner.chatRoomId,
        senderId: currentUser?.id
      });
    }

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

  // Phát tín hiệu typing khi người dùng gõ phím
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (socketRef.current && partner.chatRoomId) {
      socketRef.current.emit('typing', {
        roomId: partner.chatRoomId,
        senderId: currentUser?.id,
        senderName: currentUser?.name
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && partner.chatRoomId) {
          socketRef.current.emit('stop_typing', {
            roomId: partner.chatRoomId,
            senderId: currentUser?.id
          });
        }
      }, 1500);
    }
  };

  // Bắt đầu ghi âm tin nhắn thoại (Voice Note)
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Dừng & Gửi tin nhắn thoại
  const finishVoiceRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    const secs = recordingSeconds || 3;
    const voiceText = `🎤 [Tin nhắn thoại 00:${secs < 10 ? '0' : ''}${secs}]`;
    handleSend(voiceText, 'text');
    setRecordingSeconds(0);
  };

  const cancelVoiceRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Mở cuộc gọi video / thoại
  const startCall = (videoMode: boolean) => {
    setIsVideoMode(videoMode);
    setIsVideoCallOpen(true);
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
    <div className="flex-1 flex flex-col h-screen bg-[#0b0e11] relative select-none">
      {/* 1. TOP HEADER KHUNG CHAT */}
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
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-neutral-900 rounded-full" />
            </div>

            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-rose-400 transition-colors">
                {partner.name}, {partner.age}
                <span className="text-[10px] text-neutral-400 font-normal px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700/60 group-hover:border-rose-500/40">
                  Xem hồ sơ
                </span>
              </h3>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                Đang hoạt động trực tuyến
              </span>
            </div>
          </div>
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG HEADER: CUỘC GỌI THOẠI, VIDEO CALL, INFO, OPTIONS */}
        <div className="flex items-center gap-1.5">
          {/* Nút Gọi Thoại (Voice Call) */}
          <button
            onClick={() => startCall(false)}
            title={`Gọi thoại với ${partner.name}`}
            className="p-2.5 hover:bg-neutral-800 text-emerald-400 hover:text-emerald-300 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>

          {/* Nút Gọi Video WebRTC (Face-to-Face Video Call) */}
          <button
            onClick={() => startCall(true)}
            title={`Gọi video trực tiếp với ${partner.name}`}
            className="p-2.5 hover:bg-neutral-800 text-rose-500 hover:text-rose-400 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Nút Xem hồ sơ (i) */}
          <button
            onClick={() => setShowProfileModal(true)}
            title={`Xem hồ sơ chi tiết của ${partner.name}`}
            className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Nút 3 chấm tùy chọn */}
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

      {/* 2. VÙNG HIỂN THỊ TIN NHẮN */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {/* KHUNG THÔNG TIN TƯƠNG HỢP SANG TRỌNG (LUXURY MATCH CARD) */}
        <div className="max-w-md mx-auto my-4 p-6 rounded-3xl bg-gradient-to-b from-[#181c22] via-[#14171c] to-[#0e1014] border border-neutral-800 shadow-2xl text-center relative overflow-hidden">
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

          <h3 className="text-xl font-extrabold text-white tracking-tight relative z-10">
            Bạn đã tương hợp với {partner.name}!
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed relative z-10">
            {partner.city || 'Hồ Chí Minh'} • Đồ thị gợi ý độ tương hợp cao
          </p>

          {/* Gợi ý mở đầu câu chuyện (Icebreakers) */}
          <div className="mt-4 pt-4 border-t border-neutral-800/80 text-left relative z-10">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gợi ý mở lời (1-Click Icebreaker)</span>
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                `Chào ${partner.name}! Mình thấy bạn thích ${partner.interests?.[0] || 'Du lịch'}, đi cà phê tán gẫu nhé? ☕`,
                `Gu âm nhạc của bạn đỉnh thật đấy! Bài hát Spotify của bạn rất hợp gu mình 🎵`,
                `Chào bạn! Cuối tuần này bạn có kế hoạch đi đâu chưa? ✨`
              ].map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(starter)}
                  className="text-left text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-2 rounded-xl border border-neutral-800/80 transition-all hover:scale-101 active:scale-98 cursor-pointer"
                >
                  "{starter}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách các tin nhắn đã gửi */}
        {loading ? (
          <div className="text-center py-8 text-xs text-neutral-500">Đang tải lịch sử trò chuyện...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id || msg.senderId === 'user_me';
            const isVoice = msg.content.includes('[Tin nhắn thoại');

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-[#ea1d45] to-[#f42b58] text-white rounded-br-xs font-medium'
                      : 'bg-[#1c2128] text-neutral-100 rounded-bl-xs border border-neutral-800/80'
                  }`}
                >
                  {isVoice ? (
                    <div className="flex items-center gap-2.5 py-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMe ? 'bg-white/20' : 'bg-rose-500/20 text-rose-400'}`}>
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold">{msg.content}</div>
                        <div className="text-[10px] opacity-80">Nhấn để nghe tin nhắn thoại</div>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 font-mono ${isMe ? 'text-white/70' : 'text-neutral-400'}`}>
                    <span>{msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}</span>
                    {isMe && <span title="Đã xem"><CheckCheck className="w-3.5 h-3.5 text-blue-300" /></span>}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Bong bóng báo "Đối phương đang gõ tin nhắn..." */}
        {isPartnerTyping && (
          <div className="flex justify-start items-center gap-2 px-3 py-1 text-xs text-neutral-400 italic">
            <div className="flex items-center gap-1 bg-[#1c2128] px-3 py-1.5 rounded-full border border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce delay-200" />
              <span className="ml-1 text-[11px] font-semibold text-neutral-300">{partner.name} đang soạn tin...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. POPOVER KHO ẢNH ĐỘNG GIFS */}
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

      {/* 4. THANH GHI ÂM TIN NHẮN THOẠI (KHI ĐANG GHI ÂM) */}
      {isRecording && (
        <div className="p-3 bg-[#161a22] border-t border-rose-500/40 flex items-center justify-between text-white animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-rose-400">Đang ghi âm tin nhắn thoại...</span>
            <span className="font-mono text-xs font-bold bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-700">
              00:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={finishVoiceRecording}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Gửi Ngay
            </button>
          </div>
        </div>
      )}

      {/* 5. INPUT GỬI TIN NHẮN CHÍNH */}
      {!isRecording && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#111418] border-t border-neutral-800 flex items-center gap-2"
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

          {/* Nút biểu tượng cảm xúc Emoji */}
          <button
            type="button"
            onClick={() => setInput((prev) => prev + ' 😊')}
            className="p-2 text-neutral-400 hover:text-amber-400 transition-colors"
            title="Thêm biểu tượng cảm xúc"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Ô nhập tin nhắn */}
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={`Nhắn tin cho ${partner.name}...`}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-full px-5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-neutral-500"
          />

          {/* Nút Ghi âm Tin nhắn thoại */}
          <button
            type="button"
            onClick={startVoiceRecording}
            className="p-2 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Ghi âm tin nhắn thoại (Voice Note)"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Nút Gửi */}
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* MODAL GỌI VIDEO & THOẠI WEBRTC */}
      <VideoCallModal
        isOpen={isVideoCallOpen}
        partner={partner}
        currentUser={currentUser}
        isVideoCall={isVideoMode}
        onClose={() => setIsVideoCallOpen(false)}
      />

      {/* MODAL XEM CHI TIẾT TOÀN BỘ HỒ SƠ PARTNER */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        profile={partner}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
