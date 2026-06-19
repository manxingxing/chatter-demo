const socketMapper = require('../models/SocketMapper')
const conversationService = require('../service/ConversationService')
const { v4: uuidv4 } = require('uuid');

// 会话参与者缓存 —— 避免 typing 等高频事件反复查 DB
const participantsCache = new Map()

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 新连接: ${socket.id.substring(0, 8)}...`)

    // 用户登录
    socket.on('user_login', async ({ userId, username }) => {
      console.log(`📝 收到登录请求: userId=${userId}, username=${username}`)

      // 验证参数
      if (!userId || !username) {
        console.error('❌ 登录失败: userId 或 username 为空')
        socket.emit('error', { message: 'userId 和 username 不能为空' })
        return
      }

      // 绑定 Socket 和用户(自动创建/更新User实例并设置在线)
      await socketMapper.bind(socket.id, userId, username)

      const user = await socketMapper.getUserBySocket(socket.id)

      if (!user) {
        console.error('❌ 绑定失败: 无法获取用户信息')
        socket.emit('error', { message: '用户绑定失败' })
        return
      }

      console.log(`👤 ${user.username} 已登录`)

      // 每个用户加入自己的个人房间，用于接收消息
      socket.join(`user_${userId}`)
      console.log(`🏠 用户 ${user.username} 加入个人房间: user_${userId}`)

      // 通知其他用户上线
      socket.broadcast.emit('user_status_changed', {
        userId: user.id,
        username: user.username,
        status: 'online'
      })
    })

    // 断开连接
    socket.on('disconnect', async () => {
      const disconnectedUser = await socketMapper.getUserBySocket(socket.id)
      const userId = await socketMapper.unbind(socket.id)

      if (userId && disconnectedUser) {
        console.log(`👋 ${disconnectedUser.username} 已断开连接`)

        // 通知其他用户下线
        socket.broadcast.emit('user_status_changed', {
          userId: disconnectedUser.id,
          username: disconnectedUser.username,
          status: 'offline'
        })

        socket.leave(`user_${userId}`)
      }
    })

    // 请求或创建 1-1 会话
    socket.on('request_conversation', async ({ targetUserId }) => {
      const currentUser = await socketMapper.getUserBySocket(socket.id)

      if (!currentUser) {
        socket.emit('error', { message: '未登录' })
        return
      }

      // 获取或创建会话(自动处理重复问题)
      const conversation = await conversationService.getOrCreateOneOnOne(
        currentUser.id,
        targetUserId
      )

      // 预热参与者缓存（后续 typing 事件直接命中，0 次 DB 查询）
      participantsCache.set(conversation.id, conversation.participants)

      // 加载历史消息
      const messages = await conversationService.getMessageHistory(conversation.id, 50)

      // 返回会话信息
      socket.emit('conversation_opened', {
        conversation,
        messages
      })
    })

    // 正在输入
    socket.on('typing', async ({ conversationId, userId, content }) => {
      const currentUser = await socketMapper.getUserBySocket(socket.id)
      if (!currentUser || !conversationId) return

      // 优先读缓存，miss 时查 DB 并回填
      let participants = participantsCache.get(conversationId)
      if (!participants) {
        const conversation = await conversationService.getConversationWithParticipants(conversationId)
        if (!conversation) return
        participants = conversation.participants
        participantsCache.set(conversationId, participants)
      }

      // 通知会话中其他参与者（附带输入内容，供对方预览）
      participants.forEach(participantId => {
        if (participantId !== currentUser.id) {
          io.to(`user_${participantId}`).emit('user_typing', {
            conversationId,
            userId: currentUser.id,
            username: currentUser.username,
            content: content || ''
          })
        }
      })
    })

    // 停止输入
    socket.on('stop_typing', async ({ conversationId, userId }) => {
      const currentUser = await socketMapper.getUserBySocket(socket.id)
      if (!currentUser || !conversationId) return

      let participants = participantsCache.get(conversationId)
      if (!participants) {
        const conversation = await conversationService.getConversationWithParticipants(conversationId)
        if (!conversation) return
        participants = conversation.participants
        participantsCache.set(conversationId, participants)
      }

      participants.forEach(participantId => {
        if (participantId !== currentUser.id) {
          io.to(`user_${participantId}`).emit('user_stop_typing', {
            conversationId,
            userId: currentUser.id,
            username: currentUser.username
          })
        }
      })
    })

    // 发送消息
    socket.on('send_message', async ({ conversationId, content, senderId }) => {
      const currentUser = await socketMapper.getUserBySocket(socket.id)

      if (!currentUser) {
        socket.emit('error', { message: '未登录' })
        return
      }

      if (senderId && currentUser.id !== senderId) {
        socket.emit('error', { message: '无权发送此消息' })
        return
      }

      const conversation = await conversationService.getConversationWithParticipants(conversationId)

      if (!conversation) {
        socket.emit('error', { message: '会话不存在' })
        return
      }

      // 验证用户是否在会话中
      if (!conversation.participants.includes(currentUser.id)) {
        socket.emit('error', { message: '无权访问此会话' })
        return
      }

      // 创建消息
      // 保存消息到数据库
      const message = await conversationService.saveMessage(
        uuidv4(),
        conversationId,
        currentUser.id,
        content
      )

      // 发送给会话中的所有参与者（通过他们的个人房间）
      conversation.participants.forEach(participantId => {
        // 不发送给发送者自己（可选，前端可以决定是否显示）
        if (participantId !== currentUser.id) {
          io.to(`user_${participantId}`).emit('chat_message', message)
        }
      })

      // 也发送给发送者（用于确认和多端同步）
      socket.emit('chat_message', message)
    })
  })
}

module.exports = setupSocketHandlers
