const jwt = require('jsonwebtoken')
const socketMapper = require('../models/SocketMapper')
const conversationService = require('../service/ConversationService')
const userService = require('../service/UserService')
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/auth')

// 会话参与者缓存 —— 避免 typing 等高频事件反复查 DB
const participantsCache = new Map()

function setupSocketHandlers(io) {
  // JWT 鉴权中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('未登录'))
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.userId = decoded.userId
      next()
    } catch {
      next(new Error('token 无效'))
    }
  })

  io.on('connection', async (socket) => {
    console.log(`🔌 新连接: ${socket.id.substring(0, 8)}... userId=${socket.userId}`)

    // 自动绑定用户
    const user = await userService.getUser(socket.userId)
    if (!user) {
      console.error('❌ 用户不存在:', socket.userId)
      socket.disconnect()
      return
    }

    await socketMapper.bind(socket.id, user.id, user.username)
    socket.join(`user_${user.id}`)
    console.log(`👤 ${user.username} 已上线`)

    // 通知其他用户上线
    socket.broadcast.emit('user_status_changed', {
      userId: user.id,
      username: user.username,
      status: 'online'
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

      // 返回会话信息
      socket.emit('conversation_opened', { conversation })
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
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        const currentUser = await socketMapper.getUserBySocket(socket.id)

        if (!currentUser) {
          socket.emit('error', { message: '未登录' })
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
      } catch (err) {
        console.error('send_message 处理失败:', err)
        socket.emit('error', { message: '消息发送失败' })
      }
    })
  })
}

module.exports = setupSocketHandlers
