import { Response } from 'express';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getMatches = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    const query = `
      MATCH (me:User {id: $userId})-[m:MATCHED_WITH]-(partner:User)
      WHERE m.active = true AND partner.id <> me.id
      
      OPTIONAL MATCH (partner)-[:HAS_INTEREST]->(i:Interest)
      OPTIONAL MATCH (me)-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(partner)
      OPTIONAL MATCH (msg:Message)-[:IN_ROOM]->(room)
      
      WITH partner,
           max(m.matched_at) AS latestMatchTime,
           head(collect(DISTINCT room.id)) AS roomId,
           collect(DISTINCT i.name) AS interests,
           msg
      ORDER BY msg.sent_at DESC
      
      WITH partner,
           latestMatchTime,
           coalesce(roomId, 'room_' + partner.id) AS chatRoomId,
           interests,
           head(collect(msg)) AS lastMsg

      RETURN partner {
        .*,
        matchedAt: toString(coalesce(latestMatchTime, datetime())),
        chatRoomId: chatRoomId,
        interests: interests,
        lastMessage: CASE WHEN lastMsg IS NOT NULL THEN lastMsg.content ELSE 'Vừa tương hợp! Hãy gửi lời chào 😊' END,
        lastMessageTime: CASE WHEN lastMsg IS NOT NULL THEN toString(lastMsg.sent_at) ELSE toString(coalesce(latestMatchTime, datetime())) END
      } AS matchUser
      ORDER BY matchUser.lastMessageTime DESC, matchUser.matchedAt DESC
    `;

    const result = await session.run(query, { userId });
    const seenIds = new Set<string>();
    const matches: any[] = [];

    for (const record of result.records) {
      const u = record.get('matchUser');
      if (!u || !u.id || seenIds.has(u.id)) continue;
      seenIds.add(u.id);
      delete u.password;
      if (u.age && u.age.toNumber) u.age = u.age.toNumber();
      matches.push(u);
    }

    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const unmatchUser = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { targetUserId } = req.body;
  const session = getDriver().session();

  try {
    // Xóa quan hệ MATCHED_WITH và LIKES
    await session.run(`
      MATCH (me:User {id: $userId})-[m:MATCHED_WITH]-(target:User {id: $targetUserId})
      DELETE m
      WITH me, target
      OPTIONAL MATCH (me)-[l:LIKES]->(target)
      DELETE l
    `, { userId, targetUserId });

    res.json({ success: true, message: 'Đã hủy tương hợp thành công.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { targetUserId, reason } = req.body;
  const session = getDriver().session();

  try {
    // Tạo quan hệ BLOCKS và xóa bỏ toàn bộ quan hệ MATCHED_WITH, LIKES
    await session.run(`
      MATCH (me:User {id: $userId}), (target:User {id: $targetUserId})
      MERGE (me)-[b:BLOCKS]->(target)
      SET b.created_at = datetime(), b.reason = $reason
      WITH me, target
      OPTIONAL MATCH (me)-[m:MATCHED_WITH]-(target)
      DELETE m
      WITH me, target
      OPTIONAL MATCH (me)-[l1:LIKES]->(target)
      OPTIONAL MATCH (target)-[l2:LIKES]->(me)
      DELETE l1, l2
    `, { userId, targetUserId, reason: reason || 'Nội dung không phù hợp' });

    res.json({ success: true, message: 'Đã chặn người dùng này thành công.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
