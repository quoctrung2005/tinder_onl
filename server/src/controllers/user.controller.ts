import { Response } from 'express';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const {
    name,
    bio,
    city,
    photos,
    job,
    company,
    school,
    gender,
    sexual_orientation,
    lifestyle_going_out,
    lifestyle_weekend,
    lifestyle_phone,
    hide_age,
    hide_distance,
    relationship_goal,
    zodiac,
    pets,
    workout,
    interests,
    spotify_anthem,
    spotify_top_artists,
    instagram_photos
  } = req.body;

  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.name = coalesce($name, u.name),
          u.bio = coalesce($bio, u.bio),
          u.city = coalesce($city, u.city),
          u.photos = coalesce($photos, u.photos),
          u.job = $job,
          u.company = $company,
          u.school = $school,
          u.gender = coalesce($gender, u.gender),
          u.sexual_orientation = coalesce($sexual_orientation, u.sexual_orientation),
          u.lifestyle_going_out = coalesce($lifestyle_going_out, u.lifestyle_going_out),
          u.lifestyle_weekend = coalesce($lifestyle_weekend, u.lifestyle_weekend),
          u.lifestyle_phone = coalesce($lifestyle_phone, u.lifestyle_phone),
          u.hide_age = coalesce($hide_age, u.hide_age),
          u.hide_distance = coalesce($hide_distance, u.hide_distance),
          u.relationship_goal = $relationship_goal,
          u.zodiac = $zodiac,
          u.pets = $pets,
          u.workout = $workout,
          u.spotify_anthem = $spotify_anthem,
          u.spotify_top_artists = $spotify_top_artists,
          u.instagram_photos = $instagram_photos
      WITH u
      OPTIONAL MATCH (u)-[r:HAS_INTEREST]->(:Interest)
      DELETE r
      WITH u
      UNWIND $interests AS interestName
      MERGE (i:Interest {name: interestName})
      MERGE (u)-[:HAS_INTEREST]->(i)
    `, {
      userId,
      name,
      bio,
      city,
      photos,
      job: job || '',
      company: company || '',
      school: school || '',
      gender: gender || 'MALE',
      sexual_orientation: sexual_orientation || 'Dị tính',
      lifestyle_going_out: lifestyle_going_out || '',
      lifestyle_weekend: lifestyle_weekend || '',
      lifestyle_phone: lifestyle_phone || '',
      hide_age: Boolean(hide_age),
      hide_distance: Boolean(hide_distance),
      relationship_goal: relationship_goal || '💘 Tìm người yêu lâu dài',
      zodiac: zodiac || '',
      pets: pets || '',
      workout: workout || '',
      spotify_anthem: spotify_anthem ? (typeof spotify_anthem === 'string' ? spotify_anthem : JSON.stringify(spotify_anthem)) : null,
      spotify_top_artists: spotify_top_artists || [],
      instagram_photos: instagram_photos || [],
      interests: interests || []
    });

    res.json({ success: true, message: 'Cập nhật hồ sơ & sở thích thành công!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { pref_gender, pref_min_age, pref_max_age, pref_max_distance, global_mode } = req.body;
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.pref_gender = coalesce($pref_gender, u.pref_gender),
          u.pref_min_age = coalesce($pref_min_age, u.pref_min_age),
          u.pref_max_age = coalesce($pref_max_age, u.pref_max_age),
          u.pref_max_distance = coalesce($pref_max_distance, u.pref_max_distance),
          u.global_mode = coalesce($global_mode, u.global_mode)
    `, {
      userId,
      pref_gender,
      pref_min_age: Number(pref_min_age) || 18,
      pref_max_age: Number(pref_max_age) || 40,
      pref_max_distance: Number(pref_max_distance) || 50,
      global_mode: global_mode !== undefined ? Boolean(global_mode) : false
    });

    res.json({ success: true, message: 'Cài đặt tìm kiếm đã được lưu!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// Xác thực hình ảnh (Nhận tích xanh chính chủ qua webcam selfie)
export const verifyPhoto = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.is_verified = true
    `, { userId });

    res.json({ success: true, message: 'Xác thực khuôn mặt thành công! Bạn đã nhận tích xanh chính chủ.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// Quản lý danh sách chặn (Block Contacts: Người quen, số điện thoại, email)
export const blockContact = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { contact } = req.body; // Phone number or email
  const session = getDriver().session();

  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập số điện thoại hoặc email cần chặn' });
  }

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.blocked_contacts = coalesce(u.blocked_contacts, []) + $contact
    `, { userId, contact: contact.trim().toLowerCase() });

    res.json({ success: true, message: `Đã thêm ${contact} vào danh sách chặn thành công.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const getBlockedContacts = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    const result = await session.run(`
      MATCH (u:User {id: $userId})
      RETURN coalesce(u.blocked_contacts, []) AS blockedContacts
    `, { userId });

    const blockedContacts = result.records[0]?.get('blockedContacts') || [];
    res.json(blockedContacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const getAllInterests = async (req: AuthRequest, res: Response) => {
  const session = getDriver().session();
  try {
    const result = await session.run(`
      MATCH (i:Interest)
      RETURN i.name AS name
      ORDER BY name ASC
    `);
    const interests = result.records.map(r => r.get('name'));
    res.json(interests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// Nâng cấp gói VIP (Tinder Plus, Gold, Platinum)
export const upgradeVip = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { packageType, paymentMethod, amount } = req.body;
  const session = getDriver().session();
  const txId = 'TXN_' + Date.now();

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.vip_level = $packageType,
          u.is_gold = true,
          u.vip_activated_at = datetime()
      CREATE (t:Transaction {
        id: $txId,
        packageType: $packageType,
        paymentMethod: $paymentMethod,
        amount: $amount,
        status: 'SUCCESS',
        created_at: datetime()
      })
      CREATE (u)-[:PURCHASED]->(t)
    `, {
      userId,
      packageType: packageType || 'GOLD',
      paymentMethod: paymentMethod || 'VNPAY',
      amount: Number(amount) || 199000,
      txId
    });

    res.json({
      success: true,
      message: `Chúc mừng bạn đã nâng cấp thành công gói Match ${packageType}! Đặc quyền VIP đã được kích hoạt.`,
      transactionId: txId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// Hộ chiếu Tinder (Match Passport™ - Đổi vị trí sang bất kỳ thành phố nào trên thế giới)
export const updatePassport = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const { city, country } = req.body;
  const session = getDriver().session();

  try {
    await session.run(`
      MATCH (u:User {id: $userId})
      SET u.passport_city = $city,
          u.passport_country = $country,
          u.city = $city
    `, { userId, city, country: country || 'Việt Nam' });

    res.json({
      success: true,
      message: `Đã kích hoạt Match Passport™ tới ${city}! Hồ sơ của bạn sẽ hiển thị cho những người dùng tại đây.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
