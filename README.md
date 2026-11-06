# 🔥 Match Web  - Fullstack Dating Platform with Neo4j Graph Database

> **Ứng dụng hẹn hò trực tuyến chuẩn Tinder Web** được xây dựng bằng kiến trúc Fullstack hiện đại kết hợp Cơ sở dữ liệu Đồ thị **Neo4j AuraDB (Cloud)**, Real-time Engine **Socket.io**, **Node.js/Express (TypeScript)** và Frontend **React 19, Tailwind CSS v4, Framer Motion**.

---

## 📌 1. TỔNG QUAN & CÔNG NGHỆ SỬ DỤNG

Dự án tái hiện chính xác trải nghiệm người dùng của **Tinder Web** (`tinder.com`), giải quyết bài toán cốt lõi của mạng xã hội hẹn hò: **Quản lý mạng lưới quan hệ đa chiều, phân tích độ tương hợp dựa trên thuật toán đồ thị và ghép đôi hai chiều (Bilateral Matching) tức thì.**

### 🛠️ Ngăn xếp công nghệ (Tech Stack)

#### 🎨 Frontend (Client)
- **Framework:** **React 19** + **TypeScript**
- **Công cụ đóng gói (Bundler):** **Vite 8** (Tốc độ khởi động và HMR cực nhanh)
- **Thiết kế giao diện (Styling):** **Tailwind CSS v4** (Tối ưu dark theme `#0b0e11`, `#111418`)
- **Hiệu ứng & Cử chỉ vật lý (Motion & Animation):**
  - **Framer Motion:** Cử chỉ kéo thả quẹt thẻ 35 độ, tem LIKE 💚 / NOPE ❌ / SUPER LIKE ⭐ xuất hiện theo lực kéo.
  - **GSAP:** Hiệu ứng nổ pháo hoa hạt Antigravity và chuyển động 3D của Modal chúc mừng Match.
  - **Đồng bộ nút bấm với cử chỉ vuốt:** 5 nút bên dưới tự động phóng to và phát sáng rực rỡ theo hướng tay kéo thẻ.
- **Bộ Icon:** **Lucide-React**
- **Giao tiếp mạng:** **Axios** (REST API) & **Socket.io-client** (Real-time events).
- **Thanh cuộn tùy biến (Custom Scrollbar):** Thiết kế thanh cuộn 5px bo tròn trong suốt sang trọng, loại bỏ hoàn toàn thanh cuộn mặc định thô của Windows.

#### ⚙️ Backend (Server)
- **Nền tảng:** **Node.js** + **Express** + **TypeScript**
- **Kiến trúc:** Layered Architecture (Controllers, Middlewares, Routes, Configs).
- **Thời gian thực (Real-time):** **Socket.io** (Phát tin nhắn 1-1 tức thì, trạng thái online và thông báo Match real-time).
- **Bảo mật & Xác thực:**
  - **JWT (JSON Web Token)** với thời hạn 7 ngày.
  - **Bcryptjs:** Băm mật khẩu một chiều an toàn.
  - **Google OAuth 2.0 Integration:** Hỗ trợ đăng nhập Google ID token và tài khoản Google.
- **Idempotent Matching Engine:** Đảm bảo quan hệ ghép đôi và ChatRoom là duy nhất, ngăn chặn tuyệt đối tình trạng tương hợp trùng lặp.

#### 🌐 Cơ sở dữ liệu Đồ thị (Graph Database)
- **Hệ quản trị CSDL:** **Neo4j AuraDB Cloud** (Neo4j 5.27 GQL).
- **Driver kết nối:** `neo4j-driver` qua giao thức mã hóa bảo mật `neo4j+s://`.
- **Ngôn ngữ truy vấn:** **Cypher Query Language**.

---

## 🧮 2. MÔ HÌNH ĐỒ THỊ & THUẬT TOÁN TƯƠNG HỢP

### 2.1. Cấu trúc Node & Quan hệ (Graph Schema)
```cypher
(:User)-[:HAS_INTEREST]->(:Interest)
(:User)-[:LIKES {created_at, is_super}]->(:User)
(:User)-[:PASSES {created_at}]->(:User)
(:User)-[:MATCHED_WITH {matched_at, active}]->(:User)
(:User)-[:BLOCKS {created_at, reason}]->(:User)
(:User)-[:PARTICIPATES_IN]->(:ChatRoom)
(:User)-[:SENT]->(:Message)-[:IN_ROOM]->(:ChatRoom)
```

### 2.2. Thuật toán Tính điểm Tương hợp Đa Tiêu Chí (Multi-Criteria Scoring)
Điểm số tương hợp chuẩn hóa từ **0% đến 100%** được tính toán trực tiếp trong câu lệnh Cypher:

$$\text{Total Score} = \text{Score}_{\text{Jaccard}} (35\%) + \text{Score}_{\text{Goal}} (25\%) + \text{Score}_{\text{Lifestyle}} (20\%) + \text{Score}_{\text{Location}} (20\%)$$

1. **Sở thích chung qua Đồ thị (Jaccard Index - 35%):**
   $$J(A, B) = \frac{|\text{Interests}(A) \cap \text{Interests}(B)|}{|\text{Interests}(A) \cup \text{Interests}(B)|} \times 35$$
2. **Mục đích hẹn hò đồng điệu (Relationship Goal - 25%):** Khớp mục đích nghiêm túc, lâu dài hoặc tìm bạn mới.
3. **Lối sống & Thói quen (Lifestyle & Zodiac - 20%):** Khớp cung hoàng đạo tương hợp (Lửa - Khí, Đất - Nước), thói quen nuôi thú cưng (chó/mèo) và tập luyện thể thao.
4. **Khoảng cách địa lý & Chế độ Toàn cầu (Location & Global Mode - 20%):** Ưu tiên cùng thành phố hoặc mở rộng toàn cầu.

---

## 🌟 3. CÁC TÍNH NĂNG NỔI BẬT ĐÃ HOÀN THIỆN

### 🎯 1. Bảng tin Quẹt thẻ & Phím tắt Máy tính
- **5 nút hành động từ tính:** Hoàn tác (Rewind 🔄), Bỏ qua (Nope ❌), Siêu thích (Super Like ⭐), Thích (Like ❤️), Tăng tốc (Boost ⚡).
- **Hệ thống phím tắt chuyên nghiệp:**
  - `→` hoặc `L`: Thích (Like)
  - `←` hoặc `H`: Bỏ qua (Nope)
  - `↑` hoặc `S`: Siêu thích (Super Like)
  - `↓` hoặc `Space`: Mở hồ sơ chi tiết
  - `Backspace` hoặc `Enter`: Hoàn tác lượt quẹt (Rewind)
  - `N` / `M`: Xem ảnh tiếp theo / ảnh trước đó

### 💚 2. Đặc quyền Tinder Gold™: "Ai Đã Thích Bạn" (Likes You)
- **Thẻ vàng linh hoạt:** Hiển thị **chính xác số lượt thích thực tế** của người dùng (ví dụ: `14 Lượt Thích`).
- **Huy hiệu thông báo:** Hiển thị badge số người thích trên thanh điều hướng.
- **Xem ảnh rõ nét (Unblurred):** Xem trước toàn bộ ứng viên đã thích mình kèm điểm tương hợp.
- **Match ngay lập tức:** Bấm nút trái tim xanh lá để ghép đôi tức thì, tự động cập nhật danh sách và giảm số đếm theo thời gian thực.

### 💬 3. Hộp trò chuyện & Tin nhắn Real-time
- **Khung thông tin Tương hợp sang trọng (Luxury Match Card):** Cặp avatar lồng nhau, danh sách sở thích chung và **3 câu gợi ý mở đầu (Icebreakers)** gửi lời chào chỉ với 1 click.
- **Hỗ trợ ảnh động GIPHY:** Gửi GIF sinh động kèm hiệu ứng mượt mà, không viền thừa.
- **Real-time 2 chiều:** Sử dụng Socket.io đồng bộ tức thì, tự động đẩy người vừa nhắn lên đầu danh sách chat.
- **An toàn & Riêng tư:** Hỗ trợ tính năng **Hủy tương hợp (Unmatch)** và **Chặn & Báo cáo (Block)**.

### ⚙️ 4. Cài đặt Tiêu chí Tìm kiếm (Settings Modal)
- **Khớp 100% các tiêu chí thực tế:**
  - Thanh trượt Khoảng cách ưu tiên (tối đa 160 km) & công tắc giới hạn nghiêm ngặt.
  - Bộ chọn Độ tuổi ưu tiên (18 - 29 tuổi).
  - Công tắc Bật/Tắt Chế độ Toàn cầu (Global Mode).
  - Số ảnh tối thiểu (1 - 6 ảnh) và Yêu cầu phải có tiểu sử (Require Bio).
  - Chọn Sở thích, Cung hoàng đạo, Mục đích hẹn hò, Trình độ học vấn, Kế hoạch gia đình, Phong cách giao tiếp, Ngôn ngữ tình yêu, Thú cưng, Thói quen uống bia rượu.
  - Quản lý danh bạ bị chặn (Block Contacts).

### 👤 5. Quản lý & Chỉnh sửa Hồ sơ (Profile)
- Lưới tải ảnh (hỗ trợ đọc ảnh máy tính bằng Base64).
- Tích xanh xác thực danh tính.
- Tích hợp bài hát chủ đề Spotify (Spotify Anthem).
- Tích hợp lưới album ảnh gần đây từ Instagram.

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### 📋 Yêu cầu hệ thống
- **Node.js:** Phiên bản `>= 18.0.0` (Khuyên dùng Node 20 hoặc Node 22).
- **npm** hoặc **yarn** / **pnpm**.
- Tài khoản CSDL đồ thị **Neo4j AuraDB** miễn phí (hoặc Neo4j Desktop cục bộ).

---

### Bước 1: Tải mã nguồn về máy
```bash
git clone https://github.com/quoctrung2005/tinder_onl.git
cd tinder_onl
```

---

### Bước 2: Cài đặt và Khởi chạy Backend (Port 5000)

1. Di chuyển vào thư mục server:
   ```bash
   cd server
   npm install
   ```

2. Tạo file cấu hình môi trường `.env`:
   Tạo file `.env` trong thư mục `server/` dựa theo mẫu `.env.example`:
   ```env
   PORT=5000
   JWT_SECRET=super_secret_tinder_jwt_key_2026

   # Thông tin kết nối Neo4j AuraDB
   NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_database_password
   ```

3. Nạp dữ liệu mẫu ban đầu vào Neo4j (Mock Users, Interests, Relationships):
   ```bash
   npm run seed
   ```

4. Khởi động Server:
   - **Chế độ phát triển (Development):**
     ```bash
     npm run dev
     ```
   - **Chế độ sản xuất (Production Build):**
     ```bash
     npm run build
     npm start
     ```
   > Server sẽ chạy tại: `http://localhost:5000`

---

### Bước 3: Cài đặt và Khởi chạy Frontend (Port 3000)

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục client:
   ```bash
   cd ../client
   npm install
   ```

2. Khởi chạy Client với Vite:
   ```bash
   npm run dev
   ```
   > Ứng dụng web sẽ chạy tại: `http://localhost:3000`

---

### Bước 4: Trải nghiệm ứng dụng

1. Truy cập vào `http://localhost:3000` trên trình duyệt.
2. Bạn có thể chọn:
   - **1-Click Đăng nhập Demo** với tài khoản có sẵn: `user@tinder.com` / `password123`.
   - Hoặc bấm **Đăng nhập với Google** để tạo hồ sơ cá nhân mới.
3. Bắt đầu quẹt thẻ, kết nối với những người tương hợp và trò chuyện ngay lập tức!

---

## 📁 5. CẤU TRÚC DỰ ÁN

```text
tinder_onl/
├── client/                     # Mã nguồn Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Các components giao diện Tinder
│   │   │   ├── AntigravityCanvas.tsx   # Hiệu ứng hạt vật lý bay lơ lửng
│   │   │   ├── CardStack.tsx           # Bảng quẹt thẻ & 5 nút điều khiển
│   │   │   ├── TinderCard.tsx          # Thẻ hồ sơ, cử chỉ kéo thả, tem LIKE/NOPE
│   │   │   ├── ChatBox.tsx             # Hộp chat real-time, GIF, Icebreakers
│   │   │   ├── LikesYouView.tsx        # Màn hình đặc quyền Tinder Gold
│   │   │   ├── SettingsModal.tsx       # Bộ cài đặt tiêu chí tương hợp đa năng
│   │   │   ├── Sidebar.tsx             # Cột bên trái: Các tương hợp & Tin nhắn
│   │   │   ├── TinderLanding.tsx       # Màn hình chào mừng chuẩn Tinder
│   │   │   ├── UserProfileView.tsx     # Xem và chỉnh sửa trang cá nhân
│   │   │   └── ...
│   │   ├── types.ts            # Định nghĩa kiểu dữ liệu TypeScript
│   │   ├── index.css           # Cấu hình Tailwind CSS & Custom Scrollbars
│   │   └── App.tsx             # Điều phối State chính của ứng dụng
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Mã nguồn Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Cấu hình kết nối Neo4j AuraDB
│   │   ├── controllers/        # Xử lý logic Swipe, Match, Chat, User, Auth
│   │   ├── middlewares/        # Xác thực Token JWT
│   │   ├── routes/             # Định tuyến API RESTful
│   │   ├── scripts/            # Script nạp dữ liệu Seed vào Neo4j
│   │   └── index.ts            # Điểm khởi chạy server và Socket.io
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore                  # Bỏ qua node_modules, .env, build output
└── README.md                   # Tài liệu hướng dẫn đồ án
```

---

## 👨‍💻 TÁC GIẢ & THÔNG TIN ĐỒ ÁN

- **Tác giả:** Quốc Trung ([@quoctrung2005](https://github.com/quoctrung2005))
- **Đồ án:** Xây dựng ứng dụng hẹn hò trực tuyến Tinder Web tích hợp Cơ sở dữ liệu Đồ thị Neo4j.
- **Năm thực hiện:** 2026.
