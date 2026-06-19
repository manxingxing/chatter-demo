const { Router } = require('express');
const userService = require('../service/UserService');

const router = Router();

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
