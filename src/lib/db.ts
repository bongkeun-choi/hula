import { createClient, Client } from '@libsql/client';

// Turso 환경 변수가 있으면 Turso 클라우드로, 없으면 로컬 파일 SQLite로 자동 동작
const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db: Client = createClient({
  url,
  authToken,
});

let isInitialized = false;

// 데이터베이스 테이블 초기화 (최초 실행 시 자동 테이블 생성)
export async function initDb() {
  if (isInitialized) return;
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        nickname TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        chips INTEGER DEFAULT 10000,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        hoolas INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS game_records (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        winner_id TEXT,
        win_type TEXT,
        points INTEGER,
        chips_won INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    isInitialized = true;
  } catch (error) {
    console.error('Failed to init DB tables:', error);
  }
}
