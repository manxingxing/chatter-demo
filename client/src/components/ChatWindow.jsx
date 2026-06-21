import { useState, useRef, useEffect, memo } from 'react'
import '../App.css'

/**
 * 聊天窗口组件
 * @param {string|null} activeConversationId - 当前激活的会话ID
 * @param {Array} messages - 消息列表
 * @param {string} userId - 当前用户ID
 * @param {Map} typingUsers - 正在输入的用户 Map<username, content>
 * @param {Function} onSend - 发送消息回调 (content: string) => void
 * @param {Function} onInputChange - 输入变化回调 (currentContent: string) => void（通知父组件正在输入）
 */
function ChatWindow({
  activeConversationId,
  messages,
  userId,
  typingUsers,
  onSend,
  onInputChange
}) {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const lastTypingEmitRef = useRef(0)  // throttle: 上次 emit typing 的时间戳

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 切换会话时清空输入框
  useEffect(() => {
    setInputMessage('')
  }, [activeConversationId])

  // 处理输入变化（throttle 100ms，避免每个字符都触发 typing 事件）
  const handleChange = (e) => {
    setInputMessage(e.target.value)
    const now = Date.now()
    if (now - lastTypingEmitRef.current >= 100) {
      lastTypingEmitRef.current = now
      onInputChange(e.target.value)
    }
  }

  // 处理发送
  const handleSend = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return
    onSend({
      conversationId: activeConversationId,
      content: inputMessage.trim(),
      senderId: userId
    })
    setInputMessage('')
  }

  return (
    <div className="chat-main">
      {/* 消息列表 */}
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

      {/* 输入提示 */}
      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers.entries()).map(([name, content]) => (
            <span key={name}>
              👤 {name} 正在输入{content ? `: ${content}` : '...'}
            </span>
          ))}
        </div>
      )}

      {/* 消息输入框——仅在有活跃会话时显示 */}
      {activeConversationId && (
        <form onSubmit={handleSend} className="message-form">
          <input
            type="text"
            placeholder="输入消息..."
            value={inputMessage}
            onChange={handleChange}
            autoComplete="off"
          />
          <button type="submit" disabled={!inputMessage.trim()}>
            发送
          </button>
        </form>
      )}
    </div>
  )
}

export default memo(ChatWindow)
