import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getFeed = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  // Nhận các tham số cấu hình từ UI (Khoảng cách, Độ tuổi, Tiêu chí tương hợp)
  const wInterest = req.query.wInterest !== undefined ? Number(req.query.wInterest) : 35;
  const wGoal = req.query.wGoal !== undefined ? Number(req.query.wGoal) : 25;
  const wLifestyle = req.query.wLifestyle !== undefined ? Number(req.query.wLifestyle) : 20;
  const wLocation = req.query.wLocation !== undefined ? Number(req.query.wLocation) : 20;
  const minScore = req.query.minScore !== undefined ? Number(req.query.minScore) : 0;
  
  const customMinAge = req.query.minAge ? Number(req.query.minAge) : null;
  const customMaxAge = req.query.maxAge ? Number(req.query.maxAge) : null;
  const minPhotos = req.query.minPhotos ? Number(req.query.minPhotos) : 1;
  const requireBio = req.query.requireBio === 'true';

  try {
    // Thuật toán Gợi ý Tương hợp Đa Tiêu Chí toàn diện
    const query = `
      MATCH (me:User {id: $userId})
      MATCH (candidate:User)
      WHERE candidate.id <> me.id
        AND candidate.gender IN me.pref_gender
        AND candidate.age >= coalesce($customMinAge, me.pref_min_age, 18)
        AND candidate.age <= coalesce($customMaxAge, me.pref_max_age, 50)
        AND size(coalesce(candidate.photos, [])) >= $minPhotos
        AND ($requireBio = false OR (candidate.bio IS NOT NULL AND size(trim(candidate.bio)) > 0))
        AND NOT (me)-[:LIKES|PASSES|BLOCKS]->(candidate)
        AND NOT (candidate)-[:BLOCKS]->(me)
        AND NOT (me)-[:MATCHED_WITH]-(candidate)
        // Lọc danh bạ bị chặn (Block Contacts)
        AND NOT (candidate.email IN coalesce(me.blocked_contacts, []))
        AND NOT (coalesce(candidate.phone, '') IN coalesce(me.blocked_contacts, []))
        // Chế độ toàn cầu (Global Mode)
        AND (coalesce(me.global_mode, false) = true OR candidate.city = me.city OR candidate.city IN ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'])

      // 1. Khai phá các Node Sở thích chung trong Đồ thị Neo4j
      OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(c_int:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(m_int:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
      
      WITH me, candidate,
           collect(DISTINCT c_int.name) AS candidateInterests,
           collect(DISTINCT common.name) AS commonInterests,
           count(DISTINCT common) AS commonCount,
           count(DISTINCT c_int) + count(DISTINCT m_int) - count(DISTINCT common) AS totalUniqueCount

      // Tính điểm Jaccard Index: J(me, candidate) = (|A ∩ B| / |A ∪ B|) * wInterest
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount,
           CASE 
             WHEN totalUniqueCount > 0 THEN round(($wInterest * 1.0) * (commonCount * 1.35) / totalUniqueCount, 1)
             ELSE ($wInterest * 0.25) 
           END AS rawInterestPoints
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount,
           CASE WHEN rawInterestPoints > ($wInterest * 1.0) THEN ($wInterest * 1.0) ELSE rawInterestPoints END AS interestPoints

      // 2. Chấm điểm Mục đích hẹn hò (Đang tìm kiếm) theo trọng số $wGoal
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount, interestPoints,
           CASE 
             WHEN candidate.relationship_goal IS NOT NULL AND me.relationship_goal IS NOT NULL AND (
               candidate.relationship_goal = me.relationship_goal OR
               candidate.relationship_goal CONTAINS me.relationship_goal OR
               me.relationship_goal CONTAINS candidate.relationship_goal OR
               (candidate.relationship_goal CONTAINS 'lâu dài' AND me.relationship_goal CONTAINS 'lâu dài')
             ) THEN ($wGoal * 1.0)
             ELSE ($wGoal * 0.35)
           END AS goalPoints

      // 3. Chấm điểm Phong cách sống & Cung Hoàng Đạo & Thú cưng theo $wLifestyle
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount, interestPoints, goalPoints,
           CASE 
             WHEN candidate.pets IS NOT NULL AND (candidate.pets = me.pets OR candidate.pets CONTAINS 'Mèo' OR candidate.pets CONTAINS 'Chó') THEN ($wLifestyle * 0.6)
             ELSE ($wLifestyle * 0.2)
           END +
           CASE
             WHEN candidate.zodiac IS NOT NULL AND me.zodiac IS NOT NULL AND (
               candidate.zodiac = me.zodiac OR
               (candidate.zodiac IN ['Bạch Dương', 'Sư Tử', 'Nhân Mã'] AND me.zodiac IN ['Song Tử', 'Thiên Bình', 'Bảo Bình']) OR
               (candidate.zodiac IN ['Kim Ngưu', 'Xử Nữ', 'Ma Kết'] AND me.zodiac IN ['Cự Giải', 'Bọ Cạp', 'Song Ngư'])
             ) THEN ($wLifestyle * 0.4)
             ELSE ($wLifestyle * 0.15)
           END AS lifestylePoints

      // 4. Chấm điểm Vị trí địa lý theo trọng số $wLocation
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount, interestPoints, goalPoints, lifestylePoints,
           CASE 
             WHEN candidate.city = me.city THEN ($wLocation * 1.0)
             ELSE ($wLocation * 0.45)
           END AS locationPoints,
           CASE WHEN EXISTS((candidate)-[:LIKES]->(me)) THEN 1 ELSE 0 END AS hasLikedYou

      // Tổng hợp điểm số tương hợp chuẩn hóa (0 - 100%)
      WITH me, candidate, candidateInterests, commonInterests, commonCount, totalUniqueCount,
           interestPoints, goalPoints, lifestylePoints, locationPoints,
           round(interestPoints + goalPoints + lifestylePoints + locationPoints) AS totalScore,
           hasLikedYou
      WHERE totalScore >= $minScore

      RETURN candidate {
        .*,
        interests: candidateInterests,
        commonInterests: commonInterests,
        compatibilityScore: totalScore,
        scoreBreakdown: {
          interestPoints: interestPoints,
          commonCount: commonCount,
          totalUniqueCount: totalUniqueCount,
          jaccardPercent: CASE WHEN totalUniqueCount > 0 THEN round(100.0 * commonCount / totalUniqueCount, 1) ELSE 0.0 END,
          goalPoints: goalPoints,
          sameGoal: (candidate.relationship_goal = me.relationship_goal),
          candidateGoal: candidate.relationship_goal,
          myGoal: me.relationship_goal,
          lifestylePoints: lifestylePoints,
          samePets: (candidate.pets = me.pets),
          sameWorkout: (candidate.workout = me.workout),
          locationPoints: locationPoints,
          sameCity: (candidate.city = me.city),
          candidateCity: candidate.city,
          myCity: me.city,
          hasLikedYou: (hasLikedYou = 1),
          weightsUsed: {
            interest: $wInterest,
            goal: $wGoal,
            lifestyle: $wLifestyle,
            location: $wLocation
          },
          reasonText: 'Tương hợp ' + toString(totalScore) + '% với ' + toString(commonCount) + ' sở thích chung'
        }
      } AS profile
      ORDER BY hasLikedYou DESC, totalScore DESC, candidate.created_at DESC
      LIMIT 35
    `;

    const result = await session.run(query, {
      userId,
      wInterest,
      wGoal,
      wLifestyle,
      wLocation,
      minScore,
      customMinAge,
      customMaxAge,
      minPhotos,
      requireBio
    });
    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (val.toNumber && typeof val.toNumber === 'function') return val.toNumber();
      if (val.low !== undefined) return val.low;
      return Number(val) || 0;
    };

    const profiles = result.records.map(record => {
      const p = record.get('profile');
      delete p.password;
      if (p.age) p.age = toNum(p.age);
      if (p.compatibilityScore !== undefined) p.compatibilityScore = toNum(p.compatibilityScore);
      if (p.scoreBreakdown) {
        const sb = p.scoreBreakdown;
        if (sb.commonCount !== undefined) sb.commonCount = toNum(sb.commonCount);
        if (sb.totalUniqueCount !== undefined) sb.totalUniqueCount = toNum(sb.totalUniqueCount);
        if (sb.interestPoints !== undefined) sb.interestPoints = toNum(sb.interestPoints);
        if (sb.goalPoints !== undefined) sb.goalPoints = toNum(sb.goalPoints);
        if (sb.lifestylePoints !== undefined) sb.lifestylePoints = toNum(sb.lifestylePoints);
        if (sb.locationPoints !== undefined) sb.locationPoints = toNum(sb.locationPoints);
        if (sb.jaccardPercent !== undefined) sb.jaccardPercent = toNum(sb.jaccardPercent);
      }
      if (p.spotify_anthem && typeof p.spotify_anthem === 'string') {
        try { p.spotify_anthem = JSON.parse(p.spotify_anthem); } catch (e) {}
      }
      return p;
    });

    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const handleSwipe = async (req: AuthRequest, res: Response) => {
  const fromUserId = req.userId || req.body.fromUserId || 'user_me';
  const { toUserId, action } = req.body;
  const session = getDriver().session();

  try {
    if (action === 'PASS') {
      await session.run(`
        MATCH (me:User {id: $fromUserId}), (target:User {id: $toUserId})
        MERGE (me)-[r:PASSES]->(target)
        SET r.created_at = datetime()
      `, { fromUserId, toUserId });

      return res.json({ success: true, action: 'PASS', isMatch: false });
    }

    if (action === 'LIKE' || action === 'SUPER_LIKE') {
      const isSuper = action === 'SUPER_LIKE';
      const forceMatch = Boolean(req.body.forceMatch);

      // 1. Kiểm tra xem 2 người ĐÃ TƯƠNG HỢP TRƯỚC ĐÓ CHƯA (tránh tuyệt đối tương hợp trùng)
      const existingMatchCheck = await session.run(`
        MATCH (me:User {id: $fromUserId})-[m:MATCHED_WITH]-(target:User {id: $toUserId})
        WHERE m.active = true
        OPTIONAL MATCH (me)-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(target)
        OPTIONAL MATCH (target)-[:HAS_INTEREST]->(i:Interest)
        WITH target, coalesce(room.id, 'room_' + target.id) AS chatRoomId, collect(DISTINCT i.name) AS interests
        RETURN target {
          .*,
          interests: interests,
          matchedAt: toString(datetime()),
          chatRoomId: chatRoomId,
          lastMessage: 'Vừa tương hợp! Hãy gửi lời chào 😊',
          lastMessageTime: toString(datetime())
        } AS targetUser, chatRoomId
        LIMIT 1
      `, { fromUserId, toUserId });

      if (existingMatchCheck.records.length > 0) {
        const targetUser = existingMatchCheck.records[0].get('targetUser');
        const chatRoomId = existingMatchCheck.records[0].get('chatRoomId');
        delete targetUser.password;
        if (targetUser.age && targetUser.age.toNumber) targetUser.age = targetUser.age.toNumber();
        return res.json({
          success: true,
          action,
          isMatch: true,
          alreadyMatched: true,
          matchedUser: targetUser,
          chatRoomId
        });
      }

      // 2. Ghi nhận lượt quẹt LIKE / SUPER_LIKE của người dùng
      await session.run(`
        MATCH (me:User {id: $fromUserId}), (target:User {id: $toUserId})
        MERGE (me)-[r:LIKES]->(target)
        SET r.created_at = datetime(), r.is_super = $isSuper
      `, { fromUserId, toUserId, isSuper });

      // 3. Kiểm tra xem target đã like me chưa
      const targetLikeCheck = await session.run(`
        MATCH (target:User {id: $toUserId})-[r:LIKES]->(me:User {id: $fromUserId})
        RETURN r
      `, { fromUserId, toUserId });

      const hasTargetLikedMe = targetLikeCheck.records.length > 0;
      
      // Điều kiện ghép đôi:
      // - Khi ấn "Match ngay" từ Likes You (forceMatch = true)
      // - Khi đối phương đã thích mình
      // - Khi dùng Super Like
      // - Tỉ lệ ghép đôi 85% khi quẹt trên bảng tin
      const shouldMatch = forceMatch || hasTargetLikedMe || isSuper || (Math.random() < 0.85);

      if (shouldMatch) {
        // Đảm bảo quan hệ hai chiều LIKES trong Neo4j
        await session.run(`
          MATCH (target:User {id: $toUserId}), (me:User {id: $fromUserId})
          MERGE (target)-[r:LIKES]->(me)
          ON CREATE SET r.created_at = datetime(), r.is_super = false
        `, { fromUserId, toUserId });

        // Tạo quan hệ MATCHED_WITH và ChatRoom duy nhất (ngăn chặn tuyệt đối trùng lặp)
        const matchResult = await session.run(`
          MATCH (me:User {id: $fromUserId}), (target:User {id: $toUserId})
          OPTIONAL MATCH (me)-[existing:MATCHED_WITH]-(target)
          WITH me, target, existing
          FOREACH (_ IN CASE WHEN existing IS NULL THEN [1] ELSE [] END |
            CREATE (me)-[:MATCHED_WITH { matched_at: datetime(), active: true }]->(target)
          )
          FOREACH (_ IN CASE WHEN existing IS NOT NULL THEN [1] ELSE [] END |
            SET existing.active = true, existing.matched_at = coalesce(existing.matched_at, datetime())
          )
          
          WITH me, target
          OPTIONAL MATCH (me)-[:PARTICIPATES_IN]->(existingRoom:ChatRoom)<-[:PARTICIPATES_IN]-(target)
          WITH me, target, existingRoom
          FOREACH (_ IN CASE WHEN existingRoom IS NULL THEN [1] ELSE [] END |
            CREATE (newRoom:ChatRoom { id: $roomId, created_at: datetime(), last_active: datetime() })
            CREATE (me)-[:PARTICIPATES_IN]->(newRoom)
            CREATE (target)-[:PARTICIPATES_IN]->(newRoom)
          )
          
          WITH me, target
          MATCH (me)-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(target)
          OPTIONAL MATCH (target)-[:HAS_INTEREST]->(i:Interest)
          WITH target, room, collect(DISTINCT i.name) AS interests
          RETURN target {
            .*,
            interests: interests,
            matchedAt: toString(datetime()),
            chatRoomId: room.id,
            lastMessage: 'Vừa tương hợp! Hãy gửi lời chào 😊',
            lastMessageTime: toString(datetime())
          } AS targetUser, room.id AS chatRoomId
          LIMIT 1
        `, { fromUserId, toUserId, roomId: uuidv4() });

        const matchedUser = matchResult.records[0].get('targetUser');
        const chatRoomId = matchResult.records[0].get('chatRoomId');
        delete matchedUser.password;
        if (matchedUser.age && matchedUser.age.toNumber) {
          matchedUser.age = matchedUser.age.toNumber();
        }

        // Bắn Socket.io thông báo real-time
        try {
          const io = req.app.get('io');
          if (io) {
            io.to(`user_${fromUserId}`).emit('new_match', { matchedUser, chatRoomId });
            io.to(`user_${toUserId}`).emit('new_match', { matchedUser, chatRoomId });
            io.emit(`match_${fromUserId}`, { matchedUser, chatRoomId });
            io.emit(`match_${toUserId}`, { matchedUser, chatRoomId });
          }
        } catch (socketErr) {
          // Bỏ qua lỗi socket nếu có
        }

        return res.json({
          success: true,
          action,
          isMatch: true,
          matchedUser,
          chatRoomId
        });
      }

      return res.json({
        success: true,
        action,
        isMatch: false,
        matchedUser: null,
        chatRoomId: null
      });
    }

    res.status(400).json({ error: 'Hành động không hợp lệ' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const rewindSwipe = async (req: AuthRequest, res: Response) => {
  const fromUserId = req.userId || 'user_me';
  const { targetUserId } = req.body;
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (me:User {id: $fromUserId})-[r:LIKES|PASSES]->(target:User {id: $targetUserId})
      DELETE r
      WITH me, target
      OPTIONAL MATCH (me)-[m:MATCHED_WITH]-(target)
      DELETE m
    `, { fromUserId, targetUserId });

    res.json({ success: true, message: 'Đã hoàn tác lượt quẹt thành công!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const resetFeed = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (me:User {id: $userId})-[r:PASSES|LIKES]->()
      DELETE r
    `, { userId });

    await session.run(`
      MATCH (u:User {id: 'user_meo'}), (me:User {id: $userId})
      MERGE (u)-[:LIKES {created_at: datetime(), is_super: false}]->(me)
    `, { userId });

    res.json({ success: true, message: 'Đã đặt lại trạng thái quẹt thẻ thành công!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// ĐẶC QUYỀN TINDER GOLD: DANH SÁCH NHỮNG NGƯỜI ĐÃ THÍCH BẠN (LIKES YOU)
export const getLikesYou = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    const toNum = (val: any) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return val;
      if (val.toNumber && typeof val.toNumber === 'function') return val.toNumber();
      return Number(val) || 0;
    };

    // 1. Tìm các ứng viên đã gửi nút LIKE / SUPER_LIKE cho người dùng hiện tại
    const query = `
      MATCH (me:User {id: $userId})
      MATCH (candidate:User)-[r:LIKES]->(me)
      WHERE candidate.id <> me.id
        AND NOT (me)-[:MATCHED_WITH]-(candidate)
        AND NOT (me)-[:PASSES]->(candidate)
      OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(c_int:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
      WITH me, candidate, r,
           collect(DISTINCT c_int.name) AS candidateInterests,
           collect(DISTINCT common.name) AS commonInterests,
           count(DISTINCT common) AS commonCount
      RETURN candidate {
        .*,
        interests: candidateInterests,
        commonInterests: commonInterests,
        compatibilityScore: coalesce(candidate.compatibilityScore, 85 + (commonCount * 3)),
        likedAt: r.created_at,
        isSuperLike: coalesce(r.is_super, false)
      } AS profile
      ORDER BY r.created_at DESC
      LIMIT 50
    `;
    const result = await session.run(query, { userId });
    let profiles = result.records.map((record) => {
      const p = record.get('profile');
      delete p.password;
      if (p.age) p.age = toNum(p.age);
      if (p.compatibilityScore !== undefined) p.compatibilityScore = toNum(p.compatibilityScore);
      return p;
    });

    // 2. Nếu chưa có nhiều lượt like trong DB, tự động đưa các ứng viên hấp dẫn vào để trải nghiệm trọn vẹn Tinder Gold
    if (profiles.length < 8) {
      const existingIds = profiles.map((p) => p.id);
      const fallbackQuery = `
        MATCH (me:User {id: $userId})
        MATCH (candidate:User)
        WHERE candidate.id <> me.id
          AND NOT candidate.id IN $existingIds
          AND NOT (me)-[:MATCHED_WITH]-(candidate)
          AND NOT (me)-[:PASSES]->(candidate)
        OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(c_int:Interest)
        OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
        WITH me, candidate,
             collect(DISTINCT c_int.name) AS candidateInterests,
             collect(DISTINCT common.name) AS commonInterests,
             count(DISTINCT common) AS commonCount
        RETURN candidate {
          .*,
          interests: candidateInterests,
          commonInterests: commonInterests,
          compatibilityScore: 84 + (commonCount * 3),
          isSuperLike: (candidate.id = 'user_meo' OR candidate.id = 'user_quynhchi' OR candidate.id = 'user_giaky')
        } AS profile
        LIMIT 14
      `;
      const fallbackResult = await session.run(fallbackQuery, { userId, existingIds });
      const fallbackProfiles = fallbackResult.records.map((record) => {
        const p = record.get('profile');
        delete p.password;
        if (p.age) p.age = toNum(p.age);
        if (p.compatibilityScore !== undefined) p.compatibilityScore = toNum(p.compatibilityScore);
        return p;
      });
      profiles = [...profiles, ...fallbackProfiles];
    }

    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
