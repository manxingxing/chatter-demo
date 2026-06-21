import { useNavigate } from 'react-router-dom'

// ─── 错误边界组件 ───
export default function ErrorBoundary({ error }) {
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
