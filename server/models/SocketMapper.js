const userService = require('../service/UserService')

class SocketUserMapper {
  constructor() {
    this.socketToUser = new Map()  // socketId -> userId
    this.userToSocket = new Map()  // userId -> socketId
  }

  /**
   * 绑定 Socket 和用户
   */
  async bind(socketId, userId, username) {
    // 如果用户之前有旧的Socket连接,先清理
    const oldSocketId = this.userToSocket.get(userId)
    if (oldSocketId && oldSocketId !== socketId) {
      this.unbind(oldSocketId)
    }

    // 建立新的映射
    this.socketToUser.set(socketId, userId)
    this.userToSocket.set(userId, socketId)

    // 创建或更新用户(自动设置为在线)
    await userService.loginOrCreate(userId, username)

    console.log(`✅ Socket ${socketId.substring(0, 8)}... 绑定到用户 ${username}(${userId})`)
  }

  /**
   * 解绑 Socket
   */
  async unbind(socketId) {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null

    // 清除映射
    this.socketToUser.delete(socketId)
    this.userToSocket.delete(userId)

    // 更新用户状态为离线
    await userService.setOffline(userId)

    console.log(`❌ Socket ${socketId.substring(0, 8)}... 已解绑,用户 ${userId} 离线`)
    return userId
  }

  /**
   * 通过 Socket ID 获取用户 ID
   */
  getUserIdBySocket(socketId) {
    return this.socketToUser.get(socketId)
  }

  /**
   * 通过 Socket ID 获取 User 实例
   */
  async getUserBySocket(socketId) {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null
    return await userService.getUser(userId)
  }

  /**
   * 通过用户 ID 获取 Socket ID
   */
  getSocketByUser(userId) {
    return this.userToSocket.get(userId)
  }

  /**
   * 检查用户是否在线
   */
  isOnline(userId) {
    return this.userToSocket.has(userId)
  }

  /**
   * 获取所有在线用户ID
   */
  getOnlineUserIds() {
    return Array.from(this.userToSocket.keys())
  }

  /**
   * 获取所有在线用户的 User 实例
   */
  async getOnlineUsers() {
    const onlineUserIds = this.getOnlineUserIds()
    const users = []
    for (const userId of onlineUserIds) {
      const user = await userService.getUser(userId)
      if (user) {
        users.push(user)
      }
    }
    return users
  }

  /**
   * 获取在线用户数量
   */
  getOnlineCount() {
    return this.userToSocket.size
  }

  /**
   * 批量获取用户的 Socket ID
   */
  getSocketsByUsers(userIds) {
    return userIds
      .map(userId => this.userToSocket.get(userId))
      .filter(socketId => socketId !== undefined)
  }

  /**
   * 获取映射统计信息
   */
  getStats() {
    return {
      totalMappings: this.socketToUser.size,
      onlineUsers: this.userToSocket.size
    }
  }
}

module.exports = new SocketUserMapper()
