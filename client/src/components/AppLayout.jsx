import { useState, useRef, useEffect } from 'react'
import { Outlet, useLoaderData, useNavigate } from 'react-router-dom'
import { UserContext } from '../contexts/UserContext'
import '../App.css'

function AppLayout() {
  const { userId, username } = useLoaderData()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const avatarLetter = username ? username.charAt(0).toUpperCase() : '?'

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-logo" onClick={() => navigate('/app/chat')}>
          💬 Chatter
        </div>

        <div className="header-user" ref={menuRef} onClick={() => setMenuOpen(!menuOpen)}>
          <span className="header-avatar">{avatarLetter}</span>
          <span className="header-username">{username}</span>
          <span className="header-arrow">▾</span>

          {menuOpen && (
            <div className="header-dropdown">
              <div className="header-dropdown-item" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
                🚪 退出登录
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 页面内容区 */}
      <div className="app-content">
        <UserContext value={{ userId, username }}>
          <Outlet />
        </UserContext>
      </div>
    </div>
  )
}

export default AppLayout
