const { drizzle } = require('drizzle-orm/better-sqlite3')
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// 确保 data 目录存在
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 创建 SQLite 数据库连接
const sqlite = new Database(path.join(dataDir, 'chatter.db'))

// 启用 WAL 模式
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// 创建 Drizzle 实例
const db = drizzle(sqlite)

console.log('✅ Drizzle ORM 已初始化')

module.exports = { db, sqlite }
