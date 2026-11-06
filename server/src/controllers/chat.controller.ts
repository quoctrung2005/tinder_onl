import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMessages = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { partnerId } = req.params;
  const session = getDriver().session();

  try {
    // Tìm phòng chat chung giữa 2 user trong đồ thị Neo4j
    const query = `
      MATCH (me:User {id: $userId})-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(partner:User {id: $partnerId})
      WITH room LIMIT 1
      OPTIONAL MATCH (sender:User)-[:SENT]->(msg:Message)-[:IN_ROOM]->(room)
      WITH room, msg, sender
      ORDER BY msg.sent_at ASC
      RETURN room.id AS roomId,
             collect(CASE WHEN msg IS NOT NULL THEN {
               id: msg.id,
               content: msg.content,
               senderId: sender.id,
               senderName: sender.name,
               sentAt: toString(msg.sent_at)
             } ELSE null END) AS messages
    `;

    const result = await session.run(query, { userId, partnerId });
    if (result.records.length === 0) {
      return res.json({ roomId: null, messages: [] });
    }

    const roomId = result.records[0].get('roomId');
    const rawMessages = result.records[0].get('messages') || [];
    const messages = rawMessages.filter((m: any) => m !== null);

    res.json({ roomId, messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const senderId = req.userId || 'user_me';
  const { partnerId, content } = req.body;
  const session = getDriver().session();
  const messageId = uuidv4();

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' });
  }

  try {
    // 1. Đảm bảo tồn tại ChatRoom giữa 2 người (không bao giờ tạo phòng trùng)
    // 2. Tạo Node :Message và các mối quan hệ [:SENT], [:IN_ROOM] trong Neo4j
    const query = `
      MATCH (me:User {id: $senderId}), (partner:User {id: $partnerId})
      OPTIONAL MATCH (me)-[:PARTICIPATES_IN]->(existingRoom:ChatRoom)<-[:PARTICIPATES_IN]-(partner)
      WITH me, partner, existingRoom
      FOREACH (_ IN CASE WHEN existingRoom IS NULL THEN [1] ELSE [] END |
        CREATE (newRoom:ChatRoom { id: $roomId, created_at: datetime(), last_active: datetime() })
        CREATE (me)-[:PARTICIPATES_IN]->(newRoom)
        CREATE (partner)-[:PARTICIPATES_IN]->(newRoom)
      )
      WITH me, partner
      MATCH (me)-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(partner)
      WITH me, room LIMIT 1
      
      CREATE (msg:Message {
        id: $messageId,
        content: $content,
        sent_at: datetime(),
        read: false
      })
      CREATE (me)-[:SENT]->(msg)
      CREATE (msg)-[:IN_ROOM]->(room)
      SET room.last_active = datetime()
      
      RETURN msg.id AS id,
             msg.content AS content,
             toString(msg.sent_at) AS sentAt,
             room.id AS roomId
    `;

    const result = await session.run(query, {
      senderId,
      partnerId,
      roomId: uuidv4(),
      messageId,
      content: content.trim()
    });

    const record = result.records[0];
    const newMsg = {
      id: record.get('id'),
      content: record.get('content'),
      senderId,
      sentAt: record.get('sentAt'),
      roomId: record.get('roomId')
    };

    res.status(201).json(newMsg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
