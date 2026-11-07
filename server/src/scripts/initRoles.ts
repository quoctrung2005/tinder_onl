import bcrypt from 'bcryptjs';
import { getDriver, closeNeo4j } from '../config/neo4j';

async function initRoles() {
  const session = getDriver().session();
  try {
    console.log('🔄 Đang khởi tạo và chuẩn hóa Phân quyền (Roles) trong Neo4j...');

    // 1. Cập nhật tất cả User chưa có role thành 'user'
    await session.run(`
      MATCH (u:User)
      WHERE u.role IS NULL OR u.role = ''
      SET u.role = 'user'
    `);
    console.log('✅ Đã gán role="user" cho tất cả người dùng hiện có.');

    // 2. Tạo hoặc cập nhật tài khoản Admin chính thống: admin@tinder.com / admin123
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    await session.run(`
      MERGE (a:User {email: 'admin@tinder.com'})
      ON CREATE SET
        a.id = 'admin_root',
        a.name = 'Quản Trị Viên (Admin)',
        a.password = $passwordHash,
        a.age = 28,
        a.gender = 'MALE',
        a.pref_gender = ['FEMALE', 'MALE'],
        a.city = 'Hồ Chí Minh',
        a.bio = 'Tài khoản Quản trị viên cấp cao Match Dating Platform 🛡️',
        a.role = 'admin',
        a.is_verified = true,
        a.is_banned = false,
        a.photos = ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
        a.created_at = datetime()
      ON MATCH SET
        a.password = $passwordHash,
        a.role = 'admin',
        a.name = 'Quản Trị Viên (Admin)',
        a.is_verified = true
      RETURN a.id, a.email, a.role
    `, { passwordHash: adminPasswordHash });

    console.log('✅ Tài khoản Admin đã sẵn sàng:');
    console.log('   - Email: admin@tinder.com');
    console.log('   - Password: admin123');
    console.log('   - Role: admin');

    // 3. Kiểm tra danh sách User và Role
    const checkRes = await session.run(`
      MATCH (u:User)
      RETURN u.name AS name, u.email AS email, u.role AS role
      ORDER BY u.role ASC, u.name ASC
      LIMIT 15
    `);

    console.log('\n📋 Mẫu danh sách người dùng & phân quyền:');
    checkRes.records.forEach((r) => {
      console.log(`- [${r.get('role').toUpperCase()}] ${r.get('name')} (${r.get('email')})`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo roles:', error);
  } finally {
    await session.close();
    await closeNeo4j();
  }
}

initRoles();
