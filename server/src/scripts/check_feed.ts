import { getDriver, closeNeo4j } from '../config/neo4j';

async function check() {
  const session = getDriver().session();
  try {
    const users = await session.run('MATCH (u:User) RETURN count(u) AS count');
    console.log('Total users in DB:', users.records[0].get('count').toNumber());

    const me = await session.run('MATCH (u:User {id: "user_me"}) RETURN u');
    if (me.records.length === 0) {
      console.log('User "user_me" DOES NOT EXIST!');
    } else {
      console.log('User "user_me" found:', me.records[0].get('u').properties.name);
    }

    // Check matches
    const matches = await session.run(`
      MATCH (me:User {id: "user_me"})-[m:MATCHED_WITH]-(partner:User)
      RETURN partner.name AS name, m.active AS active
    `);
    console.log('Matches count:', matches.records.length);
    matches.records.forEach(r => console.log('Match:', r.get('name'), 'active:', r.get('active')));

    // Test Feed Query
    const feedQuery = `
      MATCH (me:User {id: $userId})
      MATCH (candidate:User)
      WHERE candidate.id <> me.id
        AND candidate.gender IN me.pref_gender
        AND candidate.age >= coalesce(me.pref_min_age, 18)
        AND candidate.age <= coalesce(me.pref_max_age, 50)
        AND NOT (me)-[:LIKES|PASSES|BLOCKS]->(candidate)
        AND NOT (candidate)-[:BLOCKS]->(me)
        AND NOT (candidate.email IN coalesce(me.blocked_contacts, []))
        AND NOT (coalesce(candidate.phone, '') IN coalesce(me.blocked_contacts, []))
        AND (coalesce(me.global_mode, false) = true OR candidate.city = me.city OR candidate.city IN ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'])
      RETURN candidate.id AS id, candidate.name AS name, candidate.city AS city
    `;
    const feedRes = await session.run(feedQuery, { userId: 'user_me' });
    console.log('Feed count:', feedRes.records.length);
    feedRes.records.forEach(r => console.log('Candidate:', r.get('id'), r.get('name'), r.get('city')));

  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    await session.close();
    await closeNeo4j();
  }
}

check();
