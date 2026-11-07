import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

// 1. Thống kê tổng quan Đồ thị Neo4j & KPIs hệ thống Tinder
export const getAdminStats = async (req: Request, res: Response) => {
  const session = getDriver().session();
  const startTime = Date.now();

  try {
    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (val.toNumber && typeof val.toNumber === 'function') return val.toNumber();
      if (val.low !== undefined) return val.low;
      return Number(val) || 0;
    };

    // Đếm tổng số lượng nodes và relationships
    const statsQuery = `
      MATCH (u:User)
      WITH count(u) AS totalUsers,
           count(CASE WHEN u.gender = 'MALE' THEN 1 END) AS maleCount,
           count(CASE WHEN u.gender = 'FEMALE' THEN 1 END) AS femaleCount,
           count(CASE WHEN u.is_verified = true THEN 1 END) AS verifiedCount,
           count(CASE WHEN u.is_banned = true THEN 1 END) AS bannedCount
      
      OPTIONAL MATCH ()-[m:MATCHED_WITH]-()
      WITH totalUsers, maleCount, femaleCount, verifiedCount, bannedCount, count(m)/2 AS totalMatches
      
      OPTIONAL MATCH ()-[l:LIKES]->()
      WITH totalUsers, maleCount, femaleCount, verifiedCount, bannedCount, totalMatches, count(l) AS totalLikes
      
      OPTIONAL MATCH ()-[p:PASSES]->()
      WITH totalUsers, maleCount, femaleCount, verifiedCount, bannedCount, totalMatches, totalLikes, count(p) AS totalPasses
      
      OPTIONAL MATCH ()-[b:BLOCKS]->()
      WITH totalUsers, maleCount, femaleCount, verifiedCount, bannedCount, totalMatches, totalLikes, totalPasses, count(b) AS totalReports
      
      OPTIONAL MATCH (msg:Message)
      RETURN totalUsers, maleCount, femaleCount, verifiedCount, bannedCount,
             totalMatches, totalLikes, totalPasses, totalReports, count(msg) AS totalMessages
    `;

    // Top sở thích thịnh hành
    const interestsQuery = `
      MATCH (i:Interest)<-[:HAS_INTEREST]-(u:User)
      RETURN i.name AS name, count(u) AS userCount
      ORDER BY userCount DESC
      LIMIT 8
    `;

    // Phân bố người dùng theo thành phố
    const cityQuery = `
      MATCH (u:User)
      WHERE u.city IS NOT NULL AND size(trim(u.city)) > 0
      RETURN u.city AS city, count(u) AS count
      ORDER BY count DESC
      LIMIT 6
    `;

    const statsRes = await session.run(statsQuery);
    const interestsRes = await session.run(interestsQuery);
    const cityRes = await session.run(cityQuery);

    const latency = Date.now() - startTime;
    const r = statsRes.records[0];

    const stats = {
      totalUsers: toNum(r.get('totalUsers')),
      maleCount: toNum(r.get('maleCount')),
      femaleCount: toNum(r.get('femaleCount')),
      verifiedCount: toNum(r.get('verifiedCount')),
      bannedCount: toNum(r.get('bannedCount')),
      totalMatches: toNum(r.get('totalMatches')),
      totalLikes: toNum(r.get('totalLikes')),
      totalPasses: toNum(r.get('totalPasses')),
      totalReports: toNum(r.get('totalReports')),
      totalMessages: toNum(r.get('totalMessages')),
      dbLatencyMs: latency,
      topInterests: interestsRes.records.map((rec) => ({
        name: rec.get('name'),
        count: toNum(rec.get('userCount'))
      })),
      cityDistribution: cityRes.records.map((rec) => ({
        city: rec.get('city'),
        count: toNum(rec.get('count'))
      }))
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Lỗi lấy thống kê Admin:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 2. Danh sách toàn bộ Người dùng & tìm kiếm / lọc
export const getAdminUsers = async (req: Request, res: Response) => {
  const session = getDriver().session();
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const gender = typeof req.query.gender === 'string' ? req.query.gender : '';

  try {
    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (val.toNumber && typeof val.toNumber === 'function') return val.toNumber();
      return Number(val) || 0;
    };

    const query = `
      MATCH (u:User)
      WHERE ($search = '' OR toLower(u.name) CONTAINS toLower($search) OR toLower(coalesce(u.email, '')) CONTAINS toLower($search) OR toLower(coalesce(u.city, '')) CONTAINS toLower($search))
        AND ($gender = '' OR u.gender = $gender)
      
      OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
      OPTIONAL MATCH (u)<-[:LIKES]-(fan:User)
      OPTIONAL MATCH (u)-[m:MATCHED_WITH]-(partner:User)
      WHERE m.active = true
      
      WITH u,
           collect(DISTINCT i.name) AS interests,
           count(DISTINCT fan) AS likesReceived,
           count(DISTINCT partner) AS matchesCount
      
      RETURN u {
        .*,
        interests: interests,
        likesReceived: likesReceived,
        matchesCount: matchesCount,
        created_at: toString(coalesce(u.created_at, datetime()))
      } AS user
      ORDER BY user.matchesCount DESC, user.likesReceived DESC, u.name ASC
      LIMIT 100
    `;

    const result = await session.run(query, { search, gender });
    const users = result.records.map((record) => {
      const u = record.get('user');
      delete u.password;
      if (u.age) u.age = toNum(u.age);
      if (u.likesReceived !== undefined) u.likesReceived = toNum(u.likesReceived);
      if (u.matchesCount !== undefined) u.matchesCount = toNum(u.matchesCount);
      return u;
    });

    res.json(users);
  } catch (error: any) {
    console.error('Lỗi lấy danh sách người dùng Admin:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 3. Cấp / Thu hồi Tích xanh xác thực (Toggle Verification Badge)
export const toggleUserVerification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = getDriver().session();

  try {
    const result = await session.run(`
      MATCH (u:User {id: $id})
      SET u.is_verified = coalesce(NOT u.is_verified, true)
      RETURN u.id AS id, u.name AS name, u.is_verified AS is_verified
    `, { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const rec = result.records[0];
    res.json({
      success: true,
      id: rec.get('id'),
      name: rec.get('name'),
      is_verified: rec.get('is_verified'),
      message: `Đã ${rec.get('is_verified') ? 'cấp' : 'thu hồi'} tích xanh cho ${rec.get('name')}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 4. Khóa / Mở khóa tài khoản (Toggle Ban Status)
export const toggleUserBan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = getDriver().session();

  try {
    const result = await session.run(`
      MATCH (u:User {id: $id})
      SET u.is_banned = coalesce(NOT u.is_banned, true)
      RETURN u.id AS id, u.name AS name, u.is_banned AS is_banned
    `, { id });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const rec = result.records[0];
    res.json({
      success: true,
      id: rec.get('id'),
      name: rec.get('name'),
      is_banned: rec.get('is_banned'),
      message: `Đã ${rec.get('is_banned') ? 'khóa' : 'mở khóa'} tài khoản ${rec.get('name')}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 5. Xóa người dùng và toàn bộ quan hệ trong đồ thị (Detach Delete)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (u:User {id: $id})
      DETACH DELETE u
    `, { id });

    res.json({ success: true, message: 'Đã xóa người dùng và các quan hệ liên quan thành công.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 6. Danh sách các Báo cáo & Người dùng bị Chặn
export const getAdminReports = async (req: Request, res: Response) => {
  const session = getDriver().session();

  try {
    const query = `
      MATCH (reporter:User)-[b:BLOCKS]->(target:User)
      RETURN {
        reporterId: reporter.id,
        reporterName: reporter.name,
        reporterAvatar: head(coalesce(reporter.photos, [])),
        targetId: target.id,
        targetName: target.name,
        targetAvatar: head(coalesce(target.photos, [])),
        targetBanned: coalesce(target.is_banned, false),
        reason: coalesce(b.reason, 'Không phù hợp tiêu chuẩn cộng đồng'),
        createdAt: toString(coalesce(b.created_at, datetime()))
      } AS report
      ORDER BY report.createdAt DESC
      LIMIT 50
    `;

    const result = await session.run(query);
    const reports = result.records.map((r) => r.get('report'));
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// 7. Admin Force Match: Ghép đôi thủ công tức thì giữa 2 người dùng bất kỳ
export const forceMatchUsers = async (req: Request, res: Response) => {
  const { userAId, userBId } = req.body;
  if (!userAId || !userBId || userAId === userBId) {
    return res.status(400).json({ error: 'Vui lòng cung cấp 2 ID người dùng khác nhau.' });
  }

  const session = getDriver().session();
  const roomId = uuidv4();

  try {
    const result = await session.run(`
      MATCH (a:User {id: $userAId}), (b:User {id: $userBId})
      
      // Tạo quan hệ LIKES hai chiều
      MERGE (a)-[la:LIKES]->(b)
      SET la.created_at = datetime()
      MERGE (b)-[lb:LIKES]->(a)
      SET lb.created_at = datetime()
      
      // Tạo quan hệ MATCHED_WITH
      OPTIONAL MATCH (a)-[existing:MATCHED_WITH]-(b)
      WITH a, b, existing
      FOREACH (_ IN CASE WHEN existing IS NULL THEN [1] ELSE [] END |
        CREATE (a)-[:MATCHED_WITH { matched_at: datetime(), active: true }]->(b)
      )
      FOREACH (_ IN CASE WHEN existing IS NOT NULL THEN [1] ELSE [] END |
        SET existing.active = true
      )
      
      // Tạo ChatRoom
      WITH a, b
      OPTIONAL MATCH (a)-[:PARTICIPATES_IN]->(existingRoom:ChatRoom)<-[:PARTICIPATES_IN]-(b)
      WITH a, b, existingRoom
      FOREACH (_ IN CASE WHEN existingRoom IS NULL THEN [1] ELSE [] END |
        CREATE (newRoom:ChatRoom { id: $roomId, created_at: datetime(), last_active: datetime() })
        CREATE (a)-[:PARTICIPATES_IN]->(newRoom)
        CREATE (b)-[:PARTICIPATES_IN]->(newRoom)
      )
      
      WITH a, b
      MATCH (a)-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(b)
      RETURN a.name AS userAName, b.name AS userBName, room.id AS chatRoomId
      LIMIT 1
    `, { userAId, userBId, roomId });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy một trong 2 người dùng.' });
    }

    const rec = result.records[0];
    const userAName = rec.get('userAName');
    const userBName = rec.get('userBName');
    const chatRoomId = rec.get('chatRoomId');

    res.json({
      success: true,
      message: `Đã kết nối ghép đôi thành công giữa ${userAName} và ${userBName}!`,
      chatRoomId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
