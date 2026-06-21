import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import AppLayout from './components/AppLayout'
import { userLoader, chatLoader } from './loaders'

// ─── 错误边界组件 ───
export function ErrorBoundary({ error }) {
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

// ─── 路由配置 ───
export const routes = createBrowserRouter([
  {
    path: '/',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/app',
    element: <AppLayout />,
    id: 'app-layout',
    loader: userLoader,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/chat" replace />
      },
      {
        path: 'chat',
        element: <Chat />,
        loader: chatLoader
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])
