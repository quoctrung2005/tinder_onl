import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDriver } from '../config/neo4j';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_tinder_jwt_key_2026';

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, name, age, gender, pref_gender, bio, city, photos, interests } = req.body;
  const session = getDriver().session();

  try {
    const checkUser = await session.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email }
    );
    if (checkUser.records.length > 0) {
      return res.status(400).json({ error: 'Email này đã được đăng ký!' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await session.run(`
      CREATE (u:User {
        id: $id,
        email: $email,
        password: $passwordHash,
        name: $name,
        age: $age,
        gender: $gender,
        pref_gender: $pref_gender,
        bio: $bio,
        city: $city,
        photos: $photos,
        pref_max_distance: 50,
        pref_min_age: 18,
        pref_max_age: 35,
        role: 'user',
        is_verified: false,
        global_mode: false,
        blocked_contacts: [],
        created_at: datetime()
      })
      WITH u
      UNWIND $interests AS interestName
      MERGE (i:Interest {name: interestName})
      MERGE (u)-[:HAS_INTEREST]->(i)
    `, {
      id: userId,
      email,
      passwordHash,
      name,
      age: Number(age) || 20,
      gender: gender || 'MALE',
      pref_gender: pref_gender || ['FEMALE'],
      bio: bio || '',
      city: city || 'Hồ Chí Minh',
      photos: photos && photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'],
      interests: interests || ['Cà phê', 'Du lịch']
    });

    const token = jwt.sign({ id: userId, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user: { id: userId, email, name, age, gender, photos, interests, role: 'user' }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const session = getDriver().session();

  try {
    const result = await session.run(`
      MATCH (u:User)
      WHERE u.email = $email OR ($email ENDS WITH '@match.com' AND u.email = replace($email, '@match.com', '@tinder.com'))
      OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
      WITH u, collect(DISTINCT i.name) AS interests
      RETURN u {.*, interests: interests} AS user
    `, { email });

    if (result.records.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    const user = result.records[0].get('user');
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
    }

    delete user.password;
    if (user.age && user.age.toNumber) user.age = user.age.toNumber();
    user.role = user.role || 'user';

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

// Đăng nhập với Google (Hỗ trợ cả Google ID Token thật & Google Profile)
export const googleAuth = async (req: AuthRequest, res: Response) => {
  const session = getDriver().session();

  try {
    let email = '';
    let name = '';
    let avatar = '';
    let googleId = '';

    // 1. Nếu frontend gửi credential từ Google Identity Services thật (id_token)
    if (req.body?.credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.credential}`);
        if (verifyRes.ok) {
          const payload: any = await verifyRes.json();
          email = payload.email;
          name = payload.name || payload.email.split('@')[0];
          avatar = payload.picture || '';
          googleId = `google_${payload.sub}`;
        } else {
          return res.status(400).json({ error: 'Token Google không hợp lệ hoặc đã hết hạn.' });
        }
      } catch (err: any) {
        console.error('Lỗi verify Google token:', err);
        return res.status(500).json({ error: 'Không thể xác thực với máy chủ Google.' });
      }
    } else if (req.body?.email) {
      // 2. Nếu người dùng chọn hoặc nhập tài khoản Google cụ thể
      email = req.body.email.trim().toLowerCase();
      name = req.body.name?.trim() || email.split('@')[0];
      avatar = req.body.avatar?.trim() || '';
      googleId = req.body.googleId || `google_${Buffer.from(email).toString('hex').slice(0, 16)}`;
    } else {
      // Tài khoản mặc định nếu không truyền thông tin
      email = 'google.user@tinder.com';
      name = 'Trung Nguyễn (Google)';
      googleId = 'user_google_account';
    }

    const defaultPhoto = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80';

    const result = await session.run(`
      MERGE (u:User {email: $email})
      ON CREATE SET
        u.id = $id,
        u.name = $name,
        u.age = 22,
        u.gender = "MALE",
        u.pref_gender = ["FEMALE"],
        u.bio = "Người dùng Tinder kết nối qua tài khoản Google 🚀",
        u.city = "Hồ Chí Minh",
        u.photos = [$photo],
        u.role = 'user',
        u.is_verified = true,
        u.global_mode = false,
        u.relationship_goal = "Tìm người yêu lâu dài",
        u.pets = "Mèo",
        u.workout = "Thường xuyên",
        u.created_at = datetime()
      ON MATCH SET
        u.name = CASE WHEN u.name IS NULL OR u.name = "" THEN $name ELSE u.name END,
        u.photos = CASE WHEN $avatar <> "" THEN [$avatar] ELSE u.photos END,
        u.role = coalesce(u.role, 'user'),
        u.is_verified = true
      WITH u
      UNWIND ["Cà phê", "Du lịch", "Âm nhạc", "Nhiếp ảnh", "Công nghệ", "Mèo"] AS intName
      MERGE (i:Interest {name: intName})
      MERGE (u)-[:HAS_INTEREST]->(i)
      WITH u
      OPTIONAL MATCH (u)-[:HAS_INTEREST]->(allInt:Interest)
      WITH u, collect(DISTINCT allInt.name) AS interests
      RETURN u {.*, interests: interests} AS user
    `, {
      email,
      name,
      id: googleId,
      photo: defaultPhoto,
      avatar
    });

    if (result.records.length === 0) {
      return res.status(500).json({ error: 'Không thể tạo hoặc lấy tài khoản Google.' });
    }

    const user = result.records[0].get('user');
    delete user.password;
    user.role = user.role || 'user';
    if (user.age && user.age.toNumber) user.age = user.age.toNumber();
    user.role = user.role || 'user';

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập Google thành công',
      token,
      user
    });
  } catch (error: any) {
    console.error('Lỗi Google Auth:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  const userId = req.userId || 'user_me';
  const session = getDriver().session();

  try {
    const result = await session.run(`
      MATCH (u:User {id: $userId})
      OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
      WITH u, collect(DISTINCT i.name) AS interests
      RETURN u {.*, interests: interests} AS user
    `, { userId });

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản' });
    }

    const user = result.records[0].get('user');
    delete user.password;
    user.role = user.role || 'user';
    if (user.age && user.age.toNumber) user.age = user.age.toNumber();
    if (user.pref_min_age && user.pref_min_age.toNumber) user.pref_min_age = user.pref_min_age.toNumber();
    if (user.pref_max_age && user.pref_max_age.toNumber) user.pref_max_age = user.pref_max_age.toNumber();
    if (user.pref_max_distance && user.pref_max_distance.toNumber) user.pref_max_distance = user.pref_max_distance.toNumber();

    // Parse JSON string fields if stored as string
    if (user.spotify_anthem && typeof user.spotify_anthem === 'string') {
      try { user.spotify_anthem = JSON.parse(user.spotify_anthem); } catch (e) {}
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
};
