const userRepository = require('../repository/UserRepository')

class UserService {
  /**
   * 登录或注册用户
   */
  async loginOrCreate(userId, username) {
    // 检查用户是否存在
    let user = await userRepository.findById(userId)

    if (user) {
      // 更新用户名和状态
      user = await userRepository.createOrUpdateUser(userId, username, 'online')
      console.log(`✅ 用户登录: ${username} (ID: ${userId})`)
    } else {
      // 创建新用户
      user = await userRepository.createOrUpdateUser(userId, username, 'online')
      console.log(`🆕 新用户注册: ${username} (ID: ${userId})`)
    }

    return user
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username) {
    return await userRepository.findByUsername(username)
  }

  /**
   * 获取用户信息
   */
  async getUser(userId) {
    return await userRepository.findById(userId)
  }

  /**
   * 获取所有用户
   */
  async getAllUsers() {
    return await userRepository.findAll()
  }

  /**
   * 获取在线用户
   */
  async getOnlineUsers() {
    return await userRepository.findOnline()
  }

  /**
   * 更新用户状态
   */
  async updateStatus(userId, status) {
    const user = await userRepository.updateStatus(userId, status)

    if (user) {
      console.log(`📊 用户 ${user.username} 状态更新为: ${status}`)
    }

    return user
  }

  /**
   * 设置用户在线
   */
  async setOnline(userId) {
    return await this.updateStatus(userId, 'online')
  }

  /**
   * 设置用户离线
   */
  async setOffline(userId) {
    return await this.updateStatus(userId, 'offline')
  }

  /**
   * 搜索用户
   */
  async searchUsers(query) {
    return await userRepository.search(query)
  }

  /**
   * 批量获取用户
   */
  async getUsersByIds(userIds) {
    return await userRepository.findByIds(userIds)
  }

  /**
   * 删除用户
   */
  async deleteUser(userId) {
    const success = await userRepository.delete(userId)
    if (success) {
      console.log(`🗑️ 用户已删除: ${userId}`)
    }
    return success
  }

  /**
   * 获取用户数量
   */
  async getUserCount() {
    return await userRepository.count()
  }

  /**
   * 检查用户是否存在
   */
  async userExists(userId) {
    return await userRepository.exists(userId)
  }
}

module.exports = new UserService()
