import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API } from '../config'
import { useToast } from '../contexts/ToastContext'
import '../App.css'

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }

    if (password.length < 6) {
      toast.error('密码至少需要6个字符')
      return
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(API.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username.trim(), password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '注册失败')
      }

      toast.success('注册成功！即将跳转到登录页...')

      // 1.5 秒后跳转到登录页
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (err) {
      console.error('❌ 注册错误:', err)
      toast.error(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>💬 Chatter</h1>
        <p>创建新账号</p>
        <form onSubmit={handleRegister}>
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
            placeholder="请输入密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!username.trim() || !password || !confirmPassword || loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-link">
          已有账号？<Link to="/">返回登录</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
