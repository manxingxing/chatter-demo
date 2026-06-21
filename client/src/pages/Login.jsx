import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API } from '../config'
import '../App.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setLoading(true)
    setError('')

    try {
      // 调用后端登录 API
      const response = await fetch(API.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username.trim(), password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '登录失败')
      }

      // 从响应中获取用户信息和 token
      const { user, token } = data

      // 存储到 localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('userId', user.id)
      localStorage.setItem('username', user.username)

      console.log('✅ 登录成功:', user)

      // 跳转到聊天页面
      navigate('/chat')
    } catch (err) {
      console.error('❌ 登录错误:', err)
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>💬 Chatter</h1>
        <p>欢迎使用实时聊天应用</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="请输入您的昵称"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
            disabled={loading}
          />
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!username.trim() || !password || loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-link">
          还没有账号？<Link to="/register">立即注册</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
