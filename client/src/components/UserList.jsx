import '../App.css'

/**
 * 用户列表组件 — 自行拉取用户数据，保证在线状态准确
 * @param {string} currentUserId - 当前用户ID
 * @param {Function} onUserClick - 用户点击回调函数 (userId, username) => void
 */
function UserList({ users, currentUserId, onUserClick }) {
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
