import { useState, useRef, memo } from 'react'
import { useChatStore } from '../stores/chatStore'
import '../App.css'

/**
 * 消息输入组件（含打字提示）
 * @param {string} activeConversationId - 当前激活的会话ID
 * @param {string} userId - 当前用户ID
 * @param {Function} onSend - 发送消息回调 ({ conversationId, content, senderId }) => void
 * @param {Function} onInputChange - 输入变化回调 (currentContent: string) => void
 *
 * 父组件用 key={activeConversationId} 挂载本组件，切换会话时 React
 * 会自动卸载/重建，从而自然清空 inputMessage，无需 useEffect。
 */
function MessageInputer({ activeConversationId, userId, onSend, onInputChange }) {
  const [inputMessage, setInputMessage] = useState('')
  const lastTypingEmitRef = useRef(0)

  // 从 store 订阅 typingUsers，仅此组件重渲染
  const typingUsers = useChatStore((s) => s.typingUsers)

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
    <div className="message-inputer">
      {/* 输入提示 */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="typing-indicator">
          {Object.entries(typingUsers).map(([name, content]) => (
            <span key={name}>
              👤 {name} 正在输入{content ? `: ${content}` : '...'}
            </span>
          ))}
        </div>
      )}

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
    </div>
  )
}

export default memo(MessageInputer)
