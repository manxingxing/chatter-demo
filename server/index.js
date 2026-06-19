const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const setupSocketHandlers = require('./socket/handlers');
const userService = require('./service/UserService');
const conversationService = require('./service/ConversationService');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// API 路由：获取所有用户
app.get('/api/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// API 路由：获取用户的会话列表
app.get('/api/conversations', async (req, res) => {
  try {
    const { userId } = req.query;

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

// API 路由：获取比指定消息更新的所有消息（增量拉取）
app.get('/api/conversations/:id/messages/since/:messageId', async (req, res) => {
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

// API 路由：获取会话的最近消息
app.get('/api/conversations/:id/messages', async (req, res) => {
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

// API 路由：用户登录
app.post('/api/login', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户名'
      });
    }

    const trimmedUsername = username.trim();

    // 查找是否已存在该用户名的用户
    const existingUser = await userService.findByUsername(trimmedUsername);

    if (existingUser) {
      return res.json({
        success: true,
        user: existingUser,
        message: '登录成功'
      });
    }

    // 用户不存在，创建新用户
    const userId = uuidv4();
    const newUser = await userService.loginOrCreate(userId, trimmedUsername);

    res.json({
      success: true,
      user: newUser,
      message: '注册并登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 设置 Socket 处理器
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
