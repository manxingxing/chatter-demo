const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const userService = require('../service/UserService');

const router = Router();

// POST /api/login — 用户登录
router.post('/login', async (req, res) => {
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

module.exports = router;
