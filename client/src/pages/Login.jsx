import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../config'
import '../App.css'

function Login() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    try {
      // 调用后端登录 API
      const response = await fetch(API.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username.trim() })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '登录失败')
      }

      // 从响应中获取用户信息
      const { user } = data

      // 将 userId 和用户名存储到 localStorage
      localStorage.setItem('userId', user.id)
      localStorage.setItem('username', user.username)

      console.log('✅ 登录成功:', user)
      console.log('✅ userId 已存储到 localStorage:', user.id)

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
          <button type="submit" disabled={!username.trim() || loading}>
            {loading ? '登录中...' : '加入聊天'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
