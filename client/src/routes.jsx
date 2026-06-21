import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import AppLayout from './components/AppLayout'
import { userLoader, chatLoader } from './loaders'
import ErrorBoundary from './components/ErrorBoundary'

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
