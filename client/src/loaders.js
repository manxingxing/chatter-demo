import { API, authHeaders } from './config'

// ─── Loader：后台 Layout 鉴权 ───
export async function userLoader() {
  const userId = localStorage.getItem('userId')
  const username = localStorage.getItem('username')
  const token = localStorage.getItem('token')

  if (!userId || !username || !token) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // 调用 /api/users/me 验证 token 有效性并获取用户信息
  const res = await fetch(API.me, { headers: authHeaders() })
  if (!res.ok) {
    throw new Response('Unauthorized', { status: 401 })
  }

  return { userId, username }
}

// ─── Loader：Chat 页面预加载会话列表 & 用户列表 ───
export async function chatLoader() {
  const [conversationsRes, usersRes] = await Promise.all([
    fetch(API.conversations, { headers: authHeaders() }),
    fetch(API.users, { headers: authHeaders() })
  ])

  const conversationsData = conversationsRes.ok ? await conversationsRes.json() : { conversations: [] }
  const usersData = usersRes.ok ? await usersRes.json() : { users: [] }

  return {
    conversations: conversationsData.conversations || [],
    users: usersData.users || []
  }
}
