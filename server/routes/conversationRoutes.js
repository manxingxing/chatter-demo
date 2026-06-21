const { Router } = require('express');
const conversationService = require('../service/ConversationService');
const userService = require('../service/UserService');

const router = Router();

// GET /api/conversations — 获取用户的会话列表
router.get('/', async (req, res) => {
  try {
    const userId  = req.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少 userId 参数'
      });
    }

    // 检查用户是否存在
    const user = await userService.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户的所有会话（包含详细信息）
    const conversations = await conversationService.getUserConversationsWithDetails(userId);

    res.json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// GET /api/conversations/:id/messages/since/:messageId — 增量拉取消息
router.get('/:id/messages/since/:messageId', async (req, res) => {
  try {
    const { id, messageId } = req.params;

    const conversation = await conversationService.getConversation(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    const messages = await conversationService.getMessagesSince(messageId);

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('获取增量消息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// GET /api/conversations/:id/messages — 获取会话的最近消息
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const conversation = await conversationService.getConversation(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      });
    }

    const messages = await conversationService.getMessageHistory(id, Number(limit));

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
