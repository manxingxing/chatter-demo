const { eq, and, desc, asc, gt, limit } = require('drizzle-orm')
const { db } = require('../database/drizzle')
const { conversations, conversationParticipants, messages, users } = require('../database/schema')

class ConversationRepository {
  /**
   * 创建会话
   */
  async createConversation(conversationId, type, name = null) {
    const now = Date.now()

    await db.insert(conversations).values({
      id: conversationId,
      type,
      name,
      createdAt: now,
      lastMessageAt: now
    })

    return this.findConversation(conversationId)
  }

  /**
   * 查找会话
   */
  async findConversation(conversationId) {
    return await db.select().from(conversations).where(eq(conversations.id, conversationId)).get()
  }

  /**
   * 添加参与者
   */
  async addParticipant(conversationId, userId) {
    await db.insert(conversationParticipants).values({
      conversationId,
      userId,
      joinedAt: Date.now()
    }).onConflictDoNothing()
  }

  /**
   * 获取会话的参与者
   */
  async getParticipants(conversationId) {
    return await db.select({
      id: users.id,
      username: users.username,
      status: users.status,
      lastSeen: users.lastSeen,
      createdAt: users.createdAt
    })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conversationId))
  }

  /**
   * 获取用户的所有会话
   */
  async getUserConversations(userId) {
    return await db.select({
      id: conversations.id,
      type: conversations.type,
      name: conversations.name,
      createdAt: conversations.createdAt,
      lastMessageAt: conversations.lastMessageAt
    })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.lastMessageAt))
  }

  /**
   * 更新最后消息时间
   */
  async updateLastMessageTime(conversationId) {
    await db.update(conversations)
      .set({ lastMessageAt: Date.now() })
      .where(eq(conversations.id, conversationId))
  }

  /**
   * 保存消息
   */
  async saveMessage(messageId, conversationId, senderId, content) {
    const timestamp = Date.now()

    await db.insert(messages).values({
      id: messageId,
      conversationId,
      senderId,
      content,
      timestamp
    })

    // 更新会话的最后消息时间
    await this.updateLastMessageTime(conversationId)

    return this.findMessage(messageId)
  }

  /**
   * 查找消息
   */
  async findMessage(messageId) {
    return await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: users.username,
      content: messages.content,
      timestamp: messages.timestamp
    })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, messageId))
      .get()
  }

  /**
   * 获取会话的所有消息
   */
  async getMessages(conversationId) {
    return await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: users.username,
      content: messages.content,
      timestamp: messages.timestamp
    })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.timestamp))
  }

  /**
   * 获取最近的消息
   */
  async getRecentMessages(conversationId, limitCount = 50) {
    const result = await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: users.username,
      content: messages.content,
      timestamp: messages.timestamp
    })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.timestamp))
      .limit(limitCount)

    // 反转以按时间正序排列
    return result.reverse()
  }

  /**
   * 检查用户是否在会话中
   */
  async isParticipant(conversationId, userId) {
    const result = await db.select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ))
      .get()

    return !!result
  }

  /**
   * 获取比指定消息更新的所有消息（不限数量，按时间正序）
   * @param {string} messageId - 参考消息的 ID
   * @returns {Promise<Array>} 比参考消息更新的消息列表
   */
  async getMessagesSince(messageId) {
    const refMsg = await this.findMessage(messageId)
    if (!refMsg) return []

    return await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderName: users.username,
      content: messages.content,
      timestamp: messages.timestamp
    })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(
        eq(messages.conversationId, refMsg.conversationId),
        gt(messages.timestamp, refMsg.timestamp)
      ))
      .orderBy(asc(messages.timestamp))
  }

  /**
   * 删除会话
   */
  async deleteConversation(conversationId) {
    await db.delete(conversations).where(eq(conversations.id, conversationId))
  }
}

module.exports = new ConversationRepository()
