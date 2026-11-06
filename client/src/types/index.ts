export interface ScoreBreakdown {
  interestPoints: number;
  commonCount: number;
  totalUniqueCount?: number;
  jaccardPercent?: number;
  goalPoints: number;
  sameGoal: boolean;
  candidateGoal?: string;
  myGoal?: string;
  lifestylePoints: number;
  samePets?: boolean;
  sameWorkout?: boolean;
  locationPoints: number;
  sameCity?: boolean;
  candidateCity?: string;
  myCity?: string;
  hasLikedYou?: boolean;
  reasonText: string;
  weightsUsed?: {
    interest: number;
    goal: number;
    lifestyle: number;
    location: number;
  };
}

export interface SpotifyAnthem {
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  city: string;
  photos: string[];
  
  job?: string;
  company?: string;
  school?: string;

  // Tính năng Tinder Web Nâng cao
  is_verified?: boolean;                  // Tích xanh chính chủ
  spotify_anthem?: SpotifyAnthem;         // Bài hát chủ đề Spotify
  spotify_top_artists?: string[];        // Các nghệ sĩ hàng đầu
  instagram_photos?: string[];            // Album kết nối Instagram
  global_mode?: boolean;                  // Chế độ toàn cầu
  blocked_contacts?: string[];            // Danh sách chặn số điện thoại/email
  is_online?: boolean;                    // Trạng thái online
  last_active_text?: string;              // "Vừa mới online"

  relationship_goal?: string;
  zodiac?: string;
  pets?: string;
  workout?: string;

  interests?: string[];
  commonInterests?: string[];
  compatibilityScore?: number;
  scoreBreakdown?: ScoreBreakdown;

  pref_gender?: string[];
  pref_min_age?: number;
  pref_max_age?: number;
  pref_max_distance?: number;

  lastMessage?: string;
  lastMessageTime?: string;
  chatRoomId?: string;
}

export interface SwipeResponse {
  success: boolean;
  action: 'LIKE' | 'PASS' | 'SUPER_LIKE';
  isMatch: boolean;
  matchedUser?: UserProfile;
  chatRoomId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  type?: 'text' | 'gif';
  sentAt: string;
}
