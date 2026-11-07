import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initNeo4j } from './config/neo4j';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import swipeRoutes from './routes/swipe.routes';
import matchRoutes from './routes/match.routes';
import chatRoutes from './routes/chat.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', swipeRoutes);
app.use('/api', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Compatibility route cho GET /api/users/me
app.use('/api/users/me', authRoutes);

// Socket.io Real-time Event Handling
io.on('connection', (socket) => {
  console.log(`⚡ Client kết nối Socket: ${socket.id}`);

  // Tham gia phòng cá nhân (để nhận notification khi có Match mới & Cuộc gọi đến)
  socket.on('join_user', (userId: string) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User [${userId}] đã join phòng riêng.`);
  });

  // Tham gia phòng chat 1-1 cụ thể
  socket.on('join_room', (roomId: string) => {
    socket.join(`room_${roomId}`);
    console.log(`💬 Socket [${socket.id}] đã join phòng chat [${roomId}].`);
  });

  // Nhận và phát tin nhắn thời gian thực
  socket.on('send_message', (data: { roomId: string; message: any }) => {
    io.to(`room_${data.roomId}`).emit('new_message', data.message);
  });

  // Sự kiện "Đang soạn tin nhắn..." (Typing indicator)
  socket.on('typing', (data: { roomId: string; senderId: string; senderName: string }) => {
    socket.to(`room_${data.roomId}`).emit('user_typing', data);
  });

  socket.on('stop_typing', (data: { roomId: string; senderId: string }) => {
    socket.to(`room_${data.roomId}`).emit('user_stop_typing', data);
  });

  // WebRTC Video / Voice Call Signaling (Báo hiệu cuộc gọi thoại & video)
  socket.on('call_partner', (data: { partnerId: string; caller: any; isVideo: boolean; offer?: any }) => {
    console.log(`📞 Cuộc gọi từ [${data.caller.name}] đến đối phương [${data.partnerId}]`);
    io.to(`user_${data.partnerId}`).emit('incoming_call', data);
  });

  socket.on('accept_call', (data: { callerId: string; partner: any; answer?: any }) => {
    io.to(`user_${data.callerId}`).emit('call_accepted', data);
  });

  socket.on('reject_call', (data: { callerId: string }) => {
    io.to(`user_${data.callerId}`).emit('call_rejected');
  });

  socket.on('end_call', (data: { targetUserId: string }) => {
    io.to(`user_${data.targetUserId}`).emit('call_ended');
  });

  socket.on('ice_candidate', (data: { targetUserId: string; candidate: any }) => {
    io.to(`user_${data.targetUserId}`).emit('ice_candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client ngắt kết nối: ${socket.id}`);
  });
});

// Khởi động server
httpServer.listen(PORT, async () => {
  console.log(`🚀 Tinder Server đang chạy tại: http://localhost:${PORT}`);
  try {
    await initNeo4j();
  } catch (err) {
    console.warn('⚠️ Lỗi kết nối Neo4j, hãy kiểm tra lại file server/.env');
  }
});
