const { sql } = require('drizzle-orm')
const { db, sqlite } = require('./drizzle')

console.log('🔧 开始数据库迁移...')

// 创建表
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'offline',
    last_seen INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  )
`)

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    last_message_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
  )
`)

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  )
`)

// 创建索引
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`)
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)`)
sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id)`)

console.log('✅ 数据库迁移完成')
