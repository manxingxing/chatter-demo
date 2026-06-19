const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const conversationRoutes = require('./conversationRoutes');

/**
 * 统一挂载所有模块化路由到 Express 应用
 * @param {import('express').Express} app
 */
function setupRoutes(app) {
  app.use('/api', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
}

module.exports = setupRoutes;
