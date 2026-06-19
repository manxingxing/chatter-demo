const conversationRepository = require('../repository/ConversationRepository')

class ConversationService {

  // 静态方法:生成 1-1 会话 ID
  static generateOneOnOneId(userId1, userId2) {
    const sorted = [userId1, userId2].sort()
    return `dm_${sorted[0]}_${sorted[1]}`
  }

  // 静态方法:生成群聊 ID
  static generateGroupId() {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取或创建 1-1 会话
   */
  async getOrCreateOneOnOne(userId1, userId2) {
    const convId = ConversationService.generateOneOnOneId(userId1, userId2)

    // 检查会话是否存在
    let conversation = await conversationRepository.findConversation(convId)

    if (!conversation) {
      // 创建新会话
      conversation = await conversationRepository.createConversation(convId, 'one-on-one')

      // 添加参与者
      await conversationRepository.addParticipant(convId, userId1)
      await conversationRepository.addParticipant(convId, userId2)

      console.log(`💬 创建 1-1 会话: ${convId}`)
    }

    // 获取参与者列表
    const participants = await conversationRepository.getParticipants(convId)

    // 构建显示名称
    let displayName
    if (conversation.type === 'one-on-one') {
      const otherUser = participants.find(p => p.id !== userId1 && p.id !== userId2)
      // 对于请求者来说，对方是 targetUserId
      const otherUserId = participants.find(p => p.id !== userId1)?.id || userId2
      const otherUserObj = participants.find(p => p.id === otherUserId)
      displayName = otherUserObj ? otherUserObj.username : '未知用户'
    } else {
      displayName = conversation.name || '未命名群聊'
    }

    return {
      ...conversation,
      participants: participants.map(p => p.id), // 只返回 ID 数组
      displayName
    }
  }

  /**
   * 创建群聊
   */
  async createGroup(participants, name) {
    const convId = ConversationService.generateGroupId()

    // 创建会话
    const conversation = await conversationRepository.createConversation(convId, 'group', name)

    // 添加所有参与者
    for (const userId of participants) {
      await conversationRepository.addParticipant(convId, userId)
    }

    console.log(`👥 创建群聊: ${name} (${convId})`)

    return conversation
  }

  /**
   * 获取会话
   */
  async getConversation(conversationId) {
    return await conversationRepository.findConversation(conversationId)
  }

  /**
   * 获取会话详情（包含参与者）
   */
  async getConversationWithParticipants(conversationId) {
    const conversation = await conversationRepository.findConversation(conversationId)

    if (!conversation) {
      return null
    }

    // 获取参与者列表
    const participants = await conversationRepository.getParticipants(conversationId)

    return {
      ...conversation,
      participants: participants.map(p => p.id)
    }
  }

  /**
   * 获取用户的会话列表（包含详细信息）
   */
  async getUserConversationsWithDetails(userId) {
    const conversations = await conversationRepository.getUserConversations(userId)

    // 为每个会话获取参与者
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await conversationRepository.getParticipants(conv.id)

        // 获取显示名称
        let displayName
        if (conv.type === 'one-on-one') {
          const otherUser = participants.find(p => p.id !== userId)
          displayName = otherUser ? otherUser.username : '未知用户'
        } else {
          displayName = conv.name || '未命名群聊'
        }

        return {
          ...conv,
          participants,
          displayName
        }
      })
    )

    return conversationsWithDetails
  }

  /**
   * 获取会话的参与者
   */
  async getParticipants(conversationId) {
    return await conversationRepository.getParticipants(conversationId)
  }

  /**
   * 更新最后消息时间
   */
  async updateLastMessageTime(conversationId) {
    await conversationRepository.updateLastMessageTime(conversationId)
  }

  /**
   * 保存消息
   */
  async saveMessage(messageId, conversationId, senderId, content) {
    const message = await conversationRepository.saveMessage(messageId, conversationId, senderId, content)
    console.log(`💾 消息已保存: ${messageId}`)
    return message
  }

  /**
   * 获取会话的消息历史
   */
  async getMessageHistory(conversationId, limit = 50) {
    return await conversationRepository.getRecentMessages(conversationId, limit)
  }

  /**
   * 获取比指定消息更新的所有消息（增量拉取）
   */
  async getMessagesSince(messageId) {
    return await conversationRepository.getMessagesSince(messageId)
  }

  /**
   * 检查用户是否在会话中
   */
  async isParticipant(conversationId, userId) {
    return await conversationRepository.isParticipant(conversationId, userId)
  }

  /**
   * 删除会话
   */
  async deleteConversation(conversationId) {
    await conversationRepository.deleteConversation(conversationId)
    console.log(`🗑️ 会话已删除: ${conversationId}`)
  }
}

module.exports = new ConversationService()
