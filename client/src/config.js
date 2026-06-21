const API_BASE = 'http://localhost:3000'

export const API = {
  users:        `${API_BASE}/api/users`,
  login:        `${API_BASE}/api/login`,
  register:     `${API_BASE}/api/register`,
  conversations: (userId) => `${API_BASE}/api/conversations?userId=${userId}`,
  messages:      (convId) => `${API_BASE}/api/conversations/${convId}/messages?limit=50`,
  messagesSince: (convId, msgId) => `${API_BASE}/api/conversations/${convId}/messages/since/${msgId}`,
}

export const SOCKET_URL = API_BASE

/**
 * 获取带 JWT 鉴权的请求头
 */
export function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}
