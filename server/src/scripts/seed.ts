import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDriver, closeNeo4j } from '../config/neo4j';

export const mockUsers = [
  // 1. Tài khoản của bạn
  {
    id: 'user_me',
    email: 'user@tinder.com',
    phone: '0901234567',
    password: 'password123',
    name: 'Trung Trần',
    age: 22,
    gender: 'MALE',
    pref_gender: ['FEMALE'],
    pref_min_age: 18,
    pref_max_age: 30,
    pref_max_distance: 50,
    is_verified: true,
    global_mode: false,
    blocked_contacts: [],
    job: 'Software Engineer',
    company: 'Tech Studio Sài Gòn',
    school: 'ĐH Bách Khoa',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Bạch Dương',
    pets: 'Nuôi mèo',
    workout: 'Thường xuyên',
    bio: 'Software Engineer 💻 Mê nghe nhạc Indie, uống cà phê sáng và chụp ảnh film ☕📸',
    city: 'Hồ Chí Minh',
    spotify_anthem: {
      title: 'Chuyện Rằng',
      artist: 'Thịnh Suy',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80'
    },
    spotify_top_artists: ['Thịnh Suy', 'Vũ.', 'The Cassette', 'Taylor Swift'],
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
    ],
    instagram_photos: [
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80'
    ],
    interests: ['Công nghệ', 'Cà phê', 'Du lịch', 'Âm nhạc', 'Nhiếp ảnh']
  },

  // 2. Meo 19 (Thẻ đang quẹt trong ảnh của bạn)
  {
    id: 'user_meo',
    email: 'meo@tinder.com',
    phone: '0912345678',
    password: 'password123',
    name: 'Meo',
    age: 19,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    pref_min_age: 19,
    pref_max_age: 26,
    pref_max_distance: 15,
    is_verified: true,
    is_online: true,
    job: 'Model & Sinh viên',
    company: 'Freelance Concept',
    school: 'ĐH Hoa Sen',
    relationship_goal: '🥂 Vừa lâu dài vừa ngắn hạn',
    zodiac: 'Cự Giải',
    pets: 'Nuôi mèo',
    workout: 'Hàng ngày',
    bio: 'Thích đi biển, nghe acoustic và uống cocktail ngắm hoàng hôn 🌅🍹 Hãy rủ mình đi cà phê nhé!',
    city: 'Hồ Chí Minh',
    spotify_anthem: {
      title: 'Until I Found You',
      artist: 'Stephen Sanchez',
      cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=300&q=80'
    },
    spotify_top_artists: ['Stephen Sanchez', 'Lana Del Rey', 'Billie Eilish'],
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ],
    instagram_photos: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=300&q=80'
    ],
    interests: ['Âm nhạc', 'Cà phê', 'Du lịch', 'Nhiếp ảnh', 'Mèo']
  },

  // 3. Tue Vy 20
  {
    id: 'user_tuevy',
    email: 'tuevy@tinder.com',
    password: 'password123',
    name: 'Tue Vy',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    is_online: true,
    job: 'Fashion Stylist',
    company: 'Vogue Concept',
    school: 'ĐH Kiến Trúc TP.HCM',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Thiên Bình',
    pets: 'Yêu động vật',
    workout: 'Thường xuyên',
    bio: 'Gu thời trang tối giản, nghiện chụp ảnh polaroid và thích những buổi hẹn hò yên tĩnh 🥐✨',
    city: 'Hồ Chí Minh',
    spotify_anthem: { title: 'Lover', artist: 'Taylor Swift', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' },
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Nghệ thuật', 'Cà phê', 'Nhiếp ảnh', 'Du lịch']
  },

  // 4. Phuong Anh 21
  {
    id: 'user_phuonganh',
    email: 'phuonganh@tinder.com',
    password: 'password123',
    name: 'Phương Anh',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    is_online: true,
    job: 'Marketing Executive',
    company: 'Agency Sài Gòn',
    school: 'ĐH Kinh Tế TP.HCM (UEH)',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Song Tử',
    pets: 'Nuôi chó',
    workout: 'Thỉnh thoảng',
    bio: 'Ban ngày chạy deadline, tối thích đi lượn phố ăn vặt hoặc ngồi pub nghe jazz 🍷🎷',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Âm nhạc', 'Ẩm thực', 'Cà phê', 'Netflix']
  },

  // 5. Quỳnh Chi 22
  {
    id: 'user_quynhchi',
    email: 'quynhchi@tinder.com',
    password: 'password123',
    name: 'Quỳnh Chi',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Content Creator',
    company: 'Tiktok Studio',
    school: 'ĐH RMIT',
    relationship_goal: '🎉 Hẹn hò vui vẻ ngắn hạn',
    zodiac: 'Sư Tử',
    pets: 'Nuôi mèo',
    workout: 'Hàng ngày',
    bio: 'Thích du lịch bụi bằng xe máy, mê trà sữa full topping và tìm bạn cùng đi concert 🎤🏍️',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Trà sữa', 'Du lịch', 'Âm nhạc', 'Nhạc Indie', 'Nhiếp ảnh']
  },

  // 6. Gia Kỳ 21
  {
    id: 'user_giaky',
    email: 'giaky@tinder.com',
    password: 'password123',
    name: 'Gia Kỳ',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Barista & Baker',
    company: 'The Coffee Lab',
    school: 'ĐH Tôn Đức Thắng',
    relationship_goal: '☕ Bạn mới trò chuyện',
    zodiac: 'Bảo Bình',
    pets: 'Nuôi mèo',
    workout: 'Thỉnh thoảng',
    bio: 'Biết pha cold brew và làm bánh sừng bò cực đỉnh 🥐 Bạn thích cà phê chua hay đậm vị?',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514315384763-ba401779410f?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Cà phê', 'Làm bánh', 'Nấu ăn', 'Đọc sách']
  },

  // 7. Thùy Vy ✨ 20
  {
    id: 'user_thuyvy',
    email: 'thuyvy@tinder.com',
    password: 'password123',
    name: 'Thùy Vy ✨',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Sinh viên Ngôn ngữ Anh',
    company: 'ĐH Ngoại Thương',
    school: 'FTU Cơ sở 2',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Song Ngư',
    pets: 'Yêu động vật',
    workout: 'Thường xuyên',
    bio: 'Bánh bèo thích xem hoạt hình Ghibli, nghe Taylor Swift và mê ăn đồ ngọt 🌸🧁',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Âm nhạc', 'Netflix', 'Trà sữa', 'Du lịch']
  },

  // 8. Bảo Châu (bchau) 21
  {
    id: 'user_bchau',
    email: 'bchau@tinder.com',
    password: 'password123',
    name: 'Bảo Châu',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Dancer & Choreographer',
    company: 'Dance Crew Sài Gòn',
    school: 'ĐH Văn Lang',
    relationship_goal: '🥂 Vừa lâu dài vừa ngắn hạn',
    zodiac: 'Nhân Mã',
    pets: 'Nuôi chó',
    workout: 'Hàng ngày',
    bio: 'Năng lượng tích cực ⚡ Thích nhảy hip-hop, đi cắm trại đồi cỏ và chụp ảnh film bắt trọn khoảnh khắc!',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Gym', 'Âm nhạc', 'Nhạc Indie', 'Đi phượt', 'Nhiếp ảnh']
  },

  // 9. Khánh Linh 22
  {
    id: 'user_khanhlinh',
    email: 'khanhlinh@tinder.com',
    password: 'password123',
    name: 'Khánh Linh',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'UI Designer',
    company: 'Figma Community',
    school: 'ĐH Quốc Tế (ĐHQG)',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Ma Kết',
    pets: 'Nuôi mèo',
    workout: 'Thỉnh thoảng',
    bio: 'Yêu cái đẹp, thích thiết kế giao diện và sưu tầm nến thơm 🕯️ Tìm bạn cùng đi xem triển lãm nghệ thuật.',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1530785602389-0759fbee8579?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Công nghệ', 'Nghệ thuật', 'Cà phê', 'Nhiếp ảnh']
  },

  // 10. Diệu Nhi 23
  {
    id: 'user_dieunhi',
    email: 'dieunhi@tinder.com',
    password: 'password123',
    name: 'Diệu Nhi',
    age: 23,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: false,
    job: 'Yoga Instructor',
    company: 'OM Studio',
    school: 'ĐH Sư Phạm TP.HCM',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Kim Ngưu',
    pets: 'Yêu động vật',
    workout: 'Hàng ngày',
    bio: 'Sống lành mạnh, thích ăn chay bán phần, leo núi và ngắm bình minh trên đỉnh Bidoup 🧘‍♀️🌲',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Yoga', 'Du lịch', 'Gym', 'Cà phê']
  },

  // 11. Minh Anh 20
  {
    id: 'user_minhanh',
    email: 'minhanh@tinder.com',
    password: 'password123',
    name: 'Minh Anh',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Sinh viên năm 2',
    company: 'ĐH Luật',
    school: 'ĐH Luật TP.HCM',
    relationship_goal: '🤔 Tùy duyên chưa rõ',
    zodiac: 'Bọ Cạp',
    pets: 'Không nuôi thú cưng',
    workout: 'Thỉnh thoảng',
    bio: 'Hướng nội nhưng thích nói nhiều với người hợp gu. Thích đọc tiểu thuyết trinh thám và nghe podcast đêm 🎧📖',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Đọc sách', 'Netflix', 'Cà phê', 'Âm nhạc']
  },

  // 12. Ngọc Ánh 21
  {
    id: 'user_ngocanh',
    email: 'ngocanh@tinder.com',
    password: 'password123',
    name: 'Ngọc Ánh',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Event Coordinator',
    company: 'Met Gala VN',
    school: 'ĐH Sân Khấu Điện Ảnh',
    relationship_goal: '🎉 Hẹn hò vui vẻ ngắn hạn',
    zodiac: 'Xử Nữ',
    pets: 'Nuôi chó',
    workout: 'Thường xuyên',
    bio: 'Mê sự sôi động, thích tổ chức tiệc tùng và đi nghe nhạc sống cuối tuần. Bạn có muốn đi cùng mình không? 🍸',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Âm nhạc', 'Du lịch', 'Nhiếp ảnh', 'Ẩm thực']
  },

  // 13. Tố Như 22 (Hà Nội)
  {
    id: 'user_tonhu',
    email: 'tonhu@tinder.com',
    password: 'password123',
    name: 'Tố Như',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Brand Manager',
    company: 'Unilever HN',
    school: 'ĐH Kinh Tế Quốc Dân',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Kim Ngưu',
    pets: 'Nuôi mèo',
    workout: 'Thường xuyên',
    bio: 'Thích mùa thu Hà Nội, đi dạo Hoàng Diệu và ăn cốm làng Vòng 🍂 Tìm người chân thành cùng đi xa.',
    city: 'Hà Nội',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Cà phê', 'Du lịch', 'Nhiếp ảnh', 'Nấu ăn']
  },

  // 14. Yến Nhi 20 (Đà Nẵng)
  {
    id: 'user_yennhi',
    email: 'yennhi@tinder.com',
    password: 'password123',
    name: 'Yến Nhi',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Sinh viên Du lịch',
    company: 'Furama Resort',
    school: 'ĐH Đà Nẵng',
    relationship_goal: '🥂 Vừa lâu dài vừa ngắn hạn',
    zodiac: 'Cự Giải',
    pets: 'Yêu động vật',
    workout: 'Hàng ngày',
    bio: 'Gái biển Đà Nẵng thích lướt sóng, ăn hải sản và chạy xe máy lên bán đảo Sơn Trà đón gió 🌊🛵',
    city: 'Đà Nẵng',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Du lịch', 'Âm nhạc', 'Gym', 'Cà phê']
  },

  // 15. Chloe Takahashi 22 (Tokyo - Hồ sơ Global Mode quốc tế)
  {
    id: 'user_chloe',
    email: 'chloe@tinder.com',
    password: 'password123',
    name: 'Chloe Takahashi',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Digital Artist',
    company: 'Sony Interactive',
    school: 'Waseda University',
    relationship_goal: '☕ Bạn mới trò chuyện',
    zodiac: 'Bảo Bình',
    pets: 'Nuôi mèo',
    workout: 'Thỉnh thoảng',
    bio: 'From Tokyo with love 🗼 Traveling to Vietnam soon! Want to meet local friends and try delicious Pho & Banh Mi.',
    city: 'Tokyo',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Nghệ thuật', 'Công nghệ', 'Du lịch', 'Âm nhạc']
  },

  // 16. Jessica Tan 23 (Singapore - Hồ sơ Global Mode quốc tế)
  {
    id: 'user_jessica',
    email: 'jessica@tinder.com',
    password: 'password123',
    name: 'Jessica Tan',
    age: 23,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    job: 'Fintech Analyst',
    company: 'DBS Bank',
    school: 'NUS Singapore',
    relationship_goal: '💘 Tìm người yêu lâu dài',
    zodiac: 'Sư Tử',
    pets: 'Nuôi chó',
    workout: 'Hàng ngày',
    bio: 'Finance by day, café hopper by weekend ☕ Let me know your favorite spots in Saigon & Hanoi!',
    city: 'Singapore',
    photos: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Công nghệ', 'Cà phê', 'Du lịch', 'Yoga']
  },

  // 17. Em bé 20 (Khớp screenshot của bạn)
  {
    id: 'user_embe',
    email: 'embe@tinder.com',
    password: 'password123',
    name: 'Em bé',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Thích được cưng chiều 🍓 Mê xem phim và ăn đồ ngọt',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Trà sữa', 'Âm nhạc', 'Netflix']
  },

  // 18. Q 21
  {
    id: 'user_q',
    email: 'q@tinder.com',
    password: 'password123',
    name: 'Q',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: false,
    bio: 'Quiet & Curious 🌙 Thích đọc sách cà phê',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Đọc sách', 'Cà phê', 'Nhiếp ảnh']
  },

  // 19. Toru 22
  {
    id: 'user_toru',
    email: 'toru@tinder.com',
    password: 'password123',
    name: 'Toru',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Mê biển và gió hoàng hôn 🌅',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Du lịch', 'Nhiếp ảnh', 'Cà phê']
  },

  // 20. đậu 20
  {
    id: 'user_dau',
    email: 'dau@tinder.com',
    password: 'password123',
    name: 'đậu',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Bé hạt đậu nhỏ thích trồng cây và nuôi mèo 🌿🐱',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Mèo', 'Nấu ăn', 'Cây cỏ']
  },

  // 21. buttercup 21
  {
    id: 'user_buttercup',
    email: 'buttercup@tinder.com',
    password: 'password123',
    name: 'buttercup',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Sweet like butter, warm like coffee ☕✨',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Làm bánh', 'Cà phê', 'Nhạc Indie']
  },

  // 22. Nhat Maii 21
  {
    id: 'user_nhatmaii',
    email: 'nhatmaii@tinder.com',
    password: 'password123',
    name: 'Nhat Maii',
    age: 21,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Sài Gòn hoa lệ và những chiều mưa 🌧️',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Cà phê', 'Du lịch', 'Nhiếp ảnh']
  },

  // 23. xịnh anh vơ 20
  {
    id: 'user_xinh',
    email: 'xinh@tinder.com',
    password: 'password123',
    name: 'xịnh anh vơ',
    age: 20,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Xinh xắn đáng yêu thế này sao không match? 🎀',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Trà sữa', 'Âm nhạc', 'Thời trang']
  },

  // 24. Quế Anh 22
  {
    id: 'user_queanh',
    email: 'queanh@tinder.com',
    password: 'password123',
    name: 'Quế Anh',
    age: 22,
    gender: 'FEMALE',
    pref_gender: ['MALE'],
    is_verified: true,
    bio: 'Cô gái Hà Nội vào Nam lập nghiệp 🌸 Tìm bạn tâm sự',
    city: 'Hồ Chí Minh',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    interests: ['Ẩm thực', 'Du lịch', 'Cà phê']
  }
];

async function seed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('🌱 Bắt đầu nạp 16+ hồ sơ đa dạng (Việt Nam & Quốc tế Global Mode) vào Neo4j...');

    await session.run(`
      CREATE CONSTRAINT user_id_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT user_email_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.email IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT interest_name_unique IF NOT EXISTS
      FOR (i:Interest) REQUIRE i.name IS UNIQUE
    `);

    await session.run(`MATCH (n) DETACH DELETE n`);

    for (const u of mockUsers) {
      const passwordHash = await bcrypt.hash(u.password, 10);

      await session.run(
        `
        MERGE (user:User {id: $id})
        SET user.email = $email,
            user.phone = $phone,
            user.password = $passwordHash,
            user.name = $name,
            user.age = $age,
            user.gender = $gender,
            user.pref_gender = $pref_gender,
            user.pref_min_age = $pref_min_age,
            user.pref_max_age = $pref_max_age,
            user.pref_max_distance = $pref_max_distance,
            user.job = $job,
            user.company = $company,
            user.school = $school,
            user.relationship_goal = $relationship_goal,
            user.zodiac = $zodiac,
            user.pets = $pets,
            user.workout = $workout,
            user.is_verified = $is_verified,
            user.global_mode = $global_mode,
            user.blocked_contacts = $blocked_contacts,
            user.spotify_anthem = $spotify_anthem,
            user.spotify_top_artists = $spotify_top_artists,
            user.instagram_photos = $instagram_photos,
            user.bio = $bio,
            user.city = $city,
            user.photos = $photos,
            user.created_at = datetime()
        WITH user
        UNWIND $interests AS interestName
        MERGE (interest:Interest {name: interestName})
        MERGE (user)-[:HAS_INTEREST]->(interest)
        `,
        {
          id: u.id,
          email: u.email,
          phone: u.phone || '',
          passwordHash,
          name: u.name,
          age: u.age,
          gender: u.gender,
          pref_gender: u.pref_gender,
          pref_min_age: u.pref_min_age || 18,
          pref_max_age: u.pref_max_age || 35,
          pref_max_distance: u.pref_max_distance || 50,
          job: u.job || 'Sinh viên / Tự do',
          company: u.company || 'TP. Hồ Chí Minh',
          school: u.school || 'Đại học Quốc gia',
          relationship_goal: u.relationship_goal || '💘 Tìm người yêu lâu dài',
          zodiac: u.zodiac || 'Bạch Dương',
          pets: u.pets || 'Yêu động vật',
          workout: u.workout || 'Thường xuyên',
          is_verified: u.is_verified !== undefined ? u.is_verified : true,
          global_mode: u.global_mode || false,
          blocked_contacts: u.blocked_contacts || [],
          spotify_anthem: u.spotify_anthem ? JSON.stringify(u.spotify_anthem) : null,
          spotify_top_artists: u.spotify_top_artists || [],
          instagram_photos: u.instagram_photos || [],
          bio: u.bio,
          city: u.city,
          photos: u.photos,
          interests: u.interests
        }
      );
    }
    console.log(`✨ Đã nạp thành công ${mockUsers.length} hồ sơ cực đa dạng!`);

    // Meo đã LIKE bạn trước
    await session.run(`
      MATCH (u:User {id: 'user_meo'}), (me:User {id: 'user_me'})
      MERGE (u)-[:LIKES {created_at: datetime(), is_super: false}]->(me)
    `);

    // 14 Tương hợp sẵn ở Sidebar (Khớp 100% 2 bức ảnh screenshot bạn gửi)
    const matchesToSeed = [
      { id: 'user_tuevy', msg: 'Chào bạn! Gu âm nhạc của bạn hay ghê ✨' },
      { id: 'user_embe', msg: '👋' },
      { id: 'user_q', msg: 'Chào bạn nhé!' },
      { id: 'user_toru', msg: 'Hi cậu!' },
      { id: 'user_giaky', msg: 'Chào bạn nhé!' },
      { id: 'user_phuonganh', msg: 'hi' },
      { id: 'user_quynhchi', msg: 'hí nhu anhhh' },
      { id: 'user_dau', msg: 'Hello bạn nhỏ 🌱' },
      { id: 'user_thuyvy', msg: 'Hii 👋' },
      { id: 'user_buttercup', msg: 'Hi there ✨' },
      { id: 'user_bchau', msg: 'Chào bạn nhé 💃' },
      { id: 'user_nhatmaii', msg: 'hi' },
      { id: 'user_xinh', msg: 'hí nhu anhhh' },
      { id: 'user_queanh', msg: 'Hii' }
    ];

    for (const m of matchesToSeed) {
      const roomId = `room_me_${m.id}`;
      const msgId = uuidv4();

      await session.run(`
        MATCH (me:User {id: 'user_me'}), (partner:User {id: $partnerId})
        MERGE (me)-[:MATCHED_WITH {matched_at: datetime(), active: true}]->(partner)
        MERGE (me)-[:PARTICIPATES_IN]->(room:ChatRoom {id: $roomId})<-[:PARTICIPATES_IN]-(partner)
        ON CREATE SET room.created_at = datetime(), room.last_active = datetime()
        
        CREATE (msg:Message {
          id: $msgId,
          content: $content,
          sent_at: datetime() - duration({minutes: 30}),
          read: true
        })
        CREATE (partner)-[:SENT]->(msg)
        CREATE (msg)-[:IN_ROOM]->(room)
      `, {
        partnerId: m.id,
        roomId,
        msgId,
        content: m.msg
      });
    }

    console.log('💬 Đã tạo 5 tương hợp mẫu ở Sidebar!');

  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
  } finally {
    await session.close();
    await closeNeo4j();
  }
}

seed();
