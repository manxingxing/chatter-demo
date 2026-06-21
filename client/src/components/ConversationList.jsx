import '../App.css'

/**
 * 会话列表组件
 * @param {Array} conversations - 会话列表
 * @param {string|null} activeConversationId - 当前激活的会话ID
 * @param {Object} unreadCounts - 未读计数 { [conversationId]: number }
 * @param {Function} onSelect - 选择会话回调 (conversationId) => void
 */
function ConversationList({ conversations, activeConversationId, unreadCounts, onSelect }) {
  if (conversations.length === 0) {
    return (
      <div className="conversation-list">
        <div className="empty-list">
          <p>暂无会话</p>
          <small>点击在线用户开始聊天</small>
        </div>
      </div>
    )
  }

  return (
    <div className="conversation-list">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
          onClick={() => onSelect(conv.id)}
        >
          <span className="conversation-avatar">
            {conv.type === 'one-on-one' ? '👤' : '👥'}
          </span>
          <span className="conversation-name">
            {conv.displayName}
          </span>

          { (unreadCounts[conv.id] || 0) > 0 && (
            <span className="unread-badge">{unreadCounts[conv.id]}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default ConversationList
