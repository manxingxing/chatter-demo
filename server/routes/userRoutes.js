const { Router } = require('express');
const userService = require('../service/UserService');

const router = Router();

// GET /api/users/me — 获取当前登录用户信息
router.get('/me', async (req, res) => {
  try {
    const user = await userService.getUser(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        status: user.status,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取当前用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// GET /api/users — 获取所有用户
router.get('/', async (req, res) => {
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

module.exports = router;
