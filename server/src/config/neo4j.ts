import neo4j, { Driver } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'neo4j+s://demo.databases.neo4j.io';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || '';

let driver: Driver;

export const initNeo4j = async (): Promise<Driver> => {
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const serverInfo = await driver.getServerInfo();
    console.log('✅ Kết nối thành công đến Neo4j AuraDB!');
    console.log(`📡 Địa chỉ Neo4j: ${serverInfo.address} (${serverInfo.agent})`);
    return driver;
  } catch (error) {
    console.error('❌ Lỗi kết nối Neo4j AuraDB:', error);
    throw error;
  }
};

export const getDriver = (): Driver => {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
};

export const closeNeo4j = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    console.log('🔌 Đã đóng kết nối Neo4j.');
  }
};
