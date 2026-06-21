const bcrypt = require('bcrypt')
const userRepository = require('../repository/UserRepository')

const SALT_ROUNDS = 10

class UserService {
  /**
   * 注册新用户（含密码）
   */
  async register(username, password) {
    // 检查用户名是否已存在
    const existing = await userRepository.findByUsername(username)
    if (existing) {
      return { success: false, message: '用户名已存在' }
    }

    // bcrypt hash 已内置 salt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const { v4: uuidv4 } = require('uuid')
    const userId = uuidv4()
    const user = await userRepository.createUser(userId, username, passwordHash)

    console.log(`🆕 新用户注册: ${username} (ID: ${userId})`)
    return { success: true, user }
  }

  /**
   * 验证密码登录
   */
  async loginWithPassword(username, password) {
    const user = await userRepository.findByUsername(username)
    if (!user) {
      return { success: false, message: '用户名或密码错误' }
    }

    if (!user.passwordHash) {
      return { success: false, message: '该账号未设置密码，请先注册' }
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return { success: false, message: '用户名或密码错误' }
    }

    return { success: true, user }
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
