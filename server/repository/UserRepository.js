const { eq, like, inArray, desc, asc } = require('drizzle-orm')
const { db } = require('../database/drizzle')
const { users } = require('../database/schema')

class UserRepository {
  /**
   * 创建新用户（含密码）
   */
  async createUser(userId, username, passwordHash, status = 'offline') {
    await db.insert(users).values({
      id: userId,
      username,
      passwordHash,
      status,
      lastSeen: Date.now()
    })
    return this.findById(userId)
  }

  /**
   * 根据ID查找用户
   */
  async findById(userId) {
    const result = await db.select().from(users).where(eq(users.id, userId)).get()
    return result || null
  }

  /**
   * 根据用户名查找（不区分大小写）
   */
  async findByUsername(username) {
    const result = await db.select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .get()
    return result || null
  }

  /**
   * 获取所有用户
   */
  async findAll() {
    return await db.select().from(users).orderBy(desc(users.createdAt))
  }

  /**
   * 获取在线用户
   */
  async findOnline() {
    return await db.select()
      .from(users)
      .where(eq(users.status, 'online'))
      .orderBy(desc(users.lastSeen))
  }

  /**
   * 搜索用户（模糊匹配）
   */
  async search(query) {
    return await db.select()
      .from(users)
      .where(like(users.username, `%${query}%`))
      .orderBy(asc(users.username))
  }

  /**
   * 批量获取用户
   */
  async findByIds(userIds) {
    if (!userIds || userIds.length === 0) return []

    return await db.select()
      .from(users)
      .where(inArray(users.id, userIds))
  }

  /**
   * 更新用户状态
   */
  async updateStatus(userId, status) {
    await db.update(users)
      .set({ status, lastSeen: Date.now() })
      .where(eq(users.id, userId))

    return this.findById(userId)
  }

  /**
   * 删除用户
   */
  async delete(userId) {
    const result = await db.delete(users).where(eq(users.id, userId))
    return result.changes > 0
  }

  /**
   * 检查用户是否存在
   */
  async exists(userId) {
    const user = await this.findById(userId)
    return !!user
  }

  /**
   * 获取用户数量
   */
  async count() {
    const result = await db.select({ count: users.id }).from(users)
    return result.length
  }
}

module.exports = new UserRepository()
