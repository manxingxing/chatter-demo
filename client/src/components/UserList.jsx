import { useState, useEffect } from 'react'
import { API } from '../config'
import '../App.css'

/**
 * 用户列表组件 — 自行拉取用户数据，保证在线状态准确
 * @param {string} currentUserId - 当前用户ID
 * @param {Function} onUserClick - 用户点击回调函数 (userId, username) => void
 * @param {number} refreshKey - 递增此值触发重新拉取用户列表
 */
function UserList({ currentUserId, onUserClick, refreshKey }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await fetch(API.users)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (err) {
        console.error('获取用户列表失败:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="empty-list">
        <p>加载中...</p>
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="empty-list">
        <p>暂无用户</p>
      </div>
    )
  }

  return (
    <div className="user-list">
      {users.map((user) => {
        const isCurrentUser = user.id === currentUserId
        const isClickable = !isCurrentUser && onUserClick

        return (
          <div
            key={user.id}
            className={`user-item ${isCurrentUser ? 'current-user' : ''}`}
            onClick={() => {
              if (isClickable) {
                onUserClick(user.id, user.username)
              }
            }}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
          >
            <span
              className="user-status"
              style={{ color: user.status === 'online' ? '#4caf50' : user.status === 'away' ? '#ff9800' : '#ccc' }}
            >●</span>
            <span className="user-name">{user.username}</span>
            {isCurrentUser && <span className="current-badge">(我)</span>}
          </div>
        )
      })}
    </div>
  )
}

export default UserList
