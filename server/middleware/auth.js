const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chatter-secret-key-change-in-production';

/**
 * JWT 鉴权中间件
 * 从 Authorization header 中提取 Bearer token，验证并解析出 userId
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      success: false,
      message: '未登录，请先登录'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
}

/**
 * 生成 JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, generateToken, JWT_SECRET };
