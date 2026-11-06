import { initNeo4j, getDriver, closeNeo4j } from '../config/neo4j';

async function verify() {
  try {
    await initNeo4j();
    const session = getDriver().session();

    console.log('\n================ KIỂM TRA HỆ THỐNG ================');
    
    // 1. Kiểm tra tài khoản user_me
    console.log('1. Kiểm tra thông tin tài khoản user_me:');
    const meRes = await session.run(`
      MATCH (u:User {id: 'user_me'})
      OPTIONAL MATCH (u)-[:HAS_INTEREST]->(i:Interest)
      WITH u, collect(i.name) AS interests
      RETURN u {.*, interests: interests} AS user
    `);
    const me = meRes.records[0]?.get('user');
    console.log(`   👉 Tên: ${me?.name}, Tuổi: ${me?.age}, Sở thích: [${me?.interests?.join(', ')}]`);

    // 2. Kiểm tra Feed gợi ý quẹt thẻ
    console.log('\n2. Kiểm tra danh sách hồ sơ gợi ý (Feed):');
    const feedRes = await session.run(`
      MATCH (me:User {id: 'user_me'})
      MATCH (candidate:User)
      WHERE candidate.id <> me.id
        AND candidate.gender IN me.pref_gender
        AND NOT (me)-[:LIKES|PASSES|BLOCKS]->(candidate)
      OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(i:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
      WITH candidate, collect(DISTINCT i.name) AS interests, collect(DISTINCT common.name) AS commonInterests
      RETURN candidate {
        .*,
        interests: interests,
        commonInterests: commonInterests
      } AS profile
      LIMIT 20
    `);
    console.log(`   👉 Số lượng hồ sơ sẵn sàng quẹt: ${feedRes.records.length}`);
    feedRes.records.forEach((r, idx) => {
      const p = r.get('profile');
      console.log(`      (${idx + 1}) ${p.name} (${p.age} tuổi) - TP: ${p.city} - Sở thích chung: [${p.commonInterests?.join(', ')}]`);
    });

    // 3. Kiểm tra kịch bản Mai Phương thích trước
    console.log('\n3. Kiểm tra kịch bản ghép đôi định sẵn:');
    const likeCheck = await session.run(`
      MATCH (target:User {id: 'user_1'})-[r:LIKES]->(me:User {id: 'user_me'})
      RETURN target.name AS name, r.created_at AS time
    `);
    if (likeCheck.records.length > 0) {
      console.log(`   👉 Kịch bản CHUẨN: ${likeCheck.records[0].get('name')} ĐÃ LIKE user_me -> Quẹt phải sẽ lập tức MATCH!`);
    } else {
      console.log('   ⚠️ Chưa có lượt thích nào từ user_1.');
    }

    console.log('====================================================\n');
    await session.close();
  } catch (error) {
    console.error('Lỗi khi verify:', error);
  } finally {
    await closeNeo4j();
    process.exit(0);
  }
}

verify();
