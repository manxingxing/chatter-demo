import { useRef, useEffect, memo } from 'react'
import '../App.css'

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * 消息列表 —— 纯展示组件
 * @param {string|null} activeConversationId - 当前激活的会话ID
 * @param {Array} messages - 消息列表
 * @param {string} userId - 当前用户ID
 */
function Messages({ activeConversationId, messages, userId }) {
  const messagesEndRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversationId, messages])

  return (
    <div className="messages-container">
      {!activeConversationId ? (
        <div className="empty-state">
          <p>👈 点击左侧用户开始聊天</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderId === userId ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <span className="message-username">{msg.senderName}</span>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default memo(Messages)
