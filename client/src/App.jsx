import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import { API, authHeaders } from './config'

// Loader: 在进入 chat 路由前验证用户身份并预加载数据
const chatLoader = async () => {
  const userId = localStorage.getItem('userId')
  const username = localStorage.getItem('username')

  if (!userId || !username) {
    throw new Response('Unauthorized', { status: 401 })
  }

  // 预加载会话列表
  const conversationsRes = await fetch(API.conversations(userId), { headers: authHeaders() })
  const conversationsData = conversationsRes.ok ? await conversationsRes.json() : { conversations: [] }

  return {
    userId,
    username,
    conversations: conversationsData.conversations || []
  }
}

// 错误边界组件
function ErrorBoundary({ error }) {
  const navigate = useNavigate()

  if (error?.status === 401) {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>出错了</h2>
      <p>{error?.message || '加载失败'}</p>
      <button onClick={() => window.location.reload()}>重试</button>
    </div>
  )
}

// 创建路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/chat',
    element: <Chat />,
    loader: chatLoader,
    errorElement: <ErrorBoundary />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
