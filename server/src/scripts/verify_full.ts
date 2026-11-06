import { initNeo4j, getDriver, closeNeo4j } from '../config/neo4j';

async function testFull() {
  await initNeo4j();
  const session = getDriver().session();

  try {
    console.log('\n--- 1. Kiểm tra Người dùng & Điểm tương đồng Jaccard (Feed) ---');
    const query = `
      MATCH (me:User {id: 'user_me'})
      MATCH (candidate:User)
      WHERE candidate.id <> me.id
        AND candidate.gender IN me.pref_gender
        AND candidate.age >= coalesce(me.pref_min_age, 18)
        AND candidate.age <= coalesce(me.pref_max_age, 50)
        AND NOT (me)-[:LIKES|PASSES|BLOCKS]->(candidate)
        AND NOT (candidate)-[:BLOCKS]->(me)
      
      OPTIONAL MATCH (candidate)-[:HAS_INTEREST]->(c_int:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(m_int:Interest)
      OPTIONAL MATCH (me)-[:HAS_INTEREST]->(common:Interest)<-[:HAS_INTEREST]-(candidate)
      
      WITH candidate,
           collect(DISTINCT c_int.name) AS candidateInterests,
           collect(DISTINCT common.name) AS commonInterests,
           count(DISTINCT common) AS commonCount,
           count(DISTINCT c_int) + count(DISTINCT m_int) - count(DISTINCT common) AS totalUniqueCount

      WITH candidate,
           candidateInterests,
           commonInterests,
           CASE 
             WHEN totalUniqueCount > 0 THEN round(100.0 * commonCount / totalUniqueCount, 1)
             ELSE 0.0 
           END AS compatibilityScore

      RETURN candidate.name AS name,
             candidate.age AS age,
             compatibilityScore,
             commonInterests
      ORDER BY compatibilityScore DESC
    `;

    const res = await session.run(query);
    console.log(`Số ứng viên gợi ý: ${res.records.length}`);
    res.records.forEach((r) => {
      console.log(` 👉 ${r.get('name')} (${r.get('age')}t) - Điểm hợp gu: ${r.get('compatibilityScore')}% - Sở thích chung: [${r.get('commonInterests').join(', ')}]`);
    });

    console.log('\n--- 2. Kiểm tra Phòng chat & Tin nhắn mẫu trong Neo4j ---');
    const chatRes = await session.run(`
      MATCH (me:User {id: 'user_me'})-[:PARTICIPATES_IN]->(room:ChatRoom)<-[:PARTICIPATES_IN]-(partner:User)
      MATCH (sender:User)-[:SENT]->(m:Message)-[:IN_ROOM]->(room)
      RETURN partner.name AS partner, sender.name AS sender, m.content AS content, toString(m.sent_at) AS time
      ORDER BY m.sent_at ASC
    `);
    console.log(`Số tin nhắn tìm thấy trong Graph: ${chatRes.records.length}`);
    chatRes.records.forEach((r) => {
      console.log(` [${r.get('time')}] ${r.get('sender')}: "${r.get('content')}"`);
    });

  } finally {
    await session.close();
    await closeNeo4j();
    process.exit(0);
  }
}

testFull();
