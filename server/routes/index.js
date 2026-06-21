const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const conversationRoutes = require('./conversationRoutes');
const { authMiddleware } = require('../middleware/auth');

/**
 * 统一挂载所有模块化路由到 Express 应用
 * @param {import('express').Express} app
 */
function setupRoutes(app) {
  // 公开路由（无须鉴权）
  app.use('/api', authRoutes);

  // 以下路由需要 JWT 鉴权
  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/conversations', authMiddleware, conversationRoutes);
}

module.exports = setupRoutes;
