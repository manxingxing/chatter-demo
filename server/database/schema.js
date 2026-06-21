import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash'),
  status: text('status').notNull().default('offline'),
  lastSeen: integer('last_seen'),
  createdAt: integer('created_at').notNull().default(Date.now())
})

// 会话表
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'one-on-one' | 'group'
  name: text('name'),
  createdAt: integer('created_at').notNull().default(Date.now()),
  lastMessageAt: integer('last_message_at').notNull().default(Date.now())
})

// 会话参与者表
export const conversationParticipants = sqliteTable('conversation_participants', {
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: integer('joined_at').notNull().default(Date.now())
}, (table) => {
  return {
    pk: {
      columns: [table.conversationId, table.userId]
    }
  }
})

// 消息表
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestamp: integer('timestamp').notNull().default(Date.now())
})
