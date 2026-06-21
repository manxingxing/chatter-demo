const { Router } = require('express');
const userService = require('../service/UserService');
const { generateToken } = require('../middleware/auth');

const router = Router();

// POST /api/login — 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户名'
      });
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请输入密码'
      });
    }

    const trimmedUsername = username.trim();

    // 使用密码验证登录
    const result = await userService.loginWithPassword(trimmedUsername, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    // 签发 JWT token
    const token = generateToken(result.user.id);

    res.json({
      success: true,
      token,
      user: {
        id: result.user.id,
        username: result.user.username,
        status: result.user.status
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// POST /api/register — 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户名'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少需要6个字符'
      });
    }

    const trimmedUsername = username.trim();

    const result = await userService.register(trimmedUsername, password);

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      user: {
        id: result.user.id,
        username: result.user.username
      },
      message: '注册成功，请登录'
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
