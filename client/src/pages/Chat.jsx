import { useState, useEffect, useRef, Activity, useEffectEvent } from 'react'
import { useLoaderData } from 'react-router-dom'
import io from 'socket.io-client'
import UserList from '../components/UserList'
import ConversationList from '../components/ConversationList'
import Messages from '../components/Messages'
import MessageInputer from '../components/MessageInputer'
import { useChatStore } from '../stores/chatStore'
import { useUser } from '../contexts/UserContext'
import { useToast } from '../contexts/ToastContext'
import { useMessages, useUnreadCount} from '../hooks/useMessages'
import { API, SOCKET_URL, authHeaders } from '../config'
import '../App.css'

function Chat() {
  // 从 UserContext 获取用户信息
  const { userId, username } = useUser()
  // 从本路由 chatLoader 获取会话列表
  const { conversations: initialConversations, users: initialUsers } = useLoaderData()

  console.log('Chat 页面加载:')
  console.log('  - username:', username)
  console.log('  - userId:', userId)

  const toast = useToast()
  const socketRef = useRef(null)
  const [activeTab, setActiveTab] = useState('conversations')  // 当前激活的标签: 'conversations' | 'contacts'

  const [conversations, setConversations] = useState(initialConversations)  // 会话列表
  const [activeConversationId, setActiveConversationId] = useState(null)  // 当前激活的会话

  const [users, setUsers] = useState(initialUsers)

  const typingTimeoutRef = useRef(null)
  const setTypingUser = useChatStore((s) => s.setTypingUser)
  const removeTypingUser = useChatStore((s) => s.removeTypingUser)

  // 消息缓存（由 useMessages hook 管理）
  const { messagesMap, refreshMessages, addMessage } = useMessages()
  const currentMessages = messagesMap[activeConversationId] || []
  // 未读计数（由 useUnreadCount hook 管理）
  const { unreadCounts, updateUnreadCount } = useUnreadCount()

  // 刷新会话列表
  const refreshConversations = async () => {
    try {
      const response = await fetch(API.conversations, { headers: authHeaders() })
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('❌ 刷新会话列表失败:', error)
    }
  }

  // 用 ref 实时追踪当前的会话 ID 和会话列表（供 socket 回调读取最新值）
  const conversationIdRef = useRef(activeConversationId)
  const conversationsRef = useRef(conversations)
  useEffect(() => {
    conversationIdRef.current = activeConversationId
  }, [activeConversationId])
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const activateConversation = useEffectEvent(async (conversationId) => {
    await refreshMessages(conversationId)
    updateUnreadCount(conversationId, 0)
  })

  // 切换会话时，重新拉取会话列表，清零未读数量
  useEffect(() => {
    if (activeConversationId) {
      activateConversation(activeConversationId)
    }
  }, [activeConversationId]);

  const setUserStatus = useEffectEvent(({userId, status}) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status } : user
      )
    )
  });

  // 连接 Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token')
    const newSocket = io(SOCKET_URL, { auth: { token } })
    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('✅ 已连接到服务器（已通过 JWT 鉴权）')
      setUserStatus({userId, status: 'online'})
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket 鉴权失败:', err.message)
      toast.error('WebSocket 连接失败')
    })

    // 用户上线/下线 → 刷新用户列表
    newSocket.on('user_status_changed', setUserStatus)

    // 断开连接
    newSocket.on('disconnect', () => {
      console.log('与服务器断开连接')
      setUserStatus({userId, status: 'offline'})
    })

    // 用户正在输入（仅当前会话，附带输入内容预览）
    newSocket.on('user_typing', (data) => {
      if (data.conversationId !== conversationIdRef.current) return
      setTypingUser(data.username, data.content)
    })

    // 用户停止输入
    newSocket.on('user_stop_typing', (data) => {
      if (data.conversationId !== conversationIdRef.current) return
      removeTypingUser(data.username)
    })

    // 会话打开
    newSocket.on('conversation_opened', ({ conversation }) => {
      console.log('✅ 会话已打开:', conversation.id)

      setConversations(prev =>
        prev.some(c => c.id === conversation.id) ? prev : [conversation, ...prev]
      )

      // 切换到会话 tab，设置活跃会话（消息由 useEffect 自动拉取）
      setActiveTab('conversations')
      setActiveConversationId(conversation.id)
    })

    // 收到新消息：追加到对应会话的消息列表
    newSocket.on('chat_message', (message) => {
      console.log('📨 收到新消息:', message)
      const convId = message.conversationId
      const isActive = convId === conversationIdRef.current

      // 追加到 messagesMap
      addMessage(convId, message)

      // 非活跃会话：递增未读计数
      if (!isActive) {
        updateUnreadCount(convId, (prev) => prev+1)
        try { new Notification('New Message', { body: message.content }) }
        catch {
          console.error('Failed to show notification')
        }
      }

      // 如果会话不存在，则刷新会话列表
      if (!conversationsRef.current.some(c => c.id === convId)) {
        refreshConversations()
      }
    })

    // 接收系统消息
    newSocket.on('system_message', (message) => {
      console.log('📨 收到新消息:', message)
      const convId = message.conversationId

      // 追加到 messagesMap
      addMessage(convId, message)
    })


    // 清理函数
    return () => {
      newSocket.disconnect()
    }
  }, [userId, addMessage, setTypingUser, removeTypingUser, updateUnreadCount, toast])

  // 发送消息
  const sendMessage = (message) => {
    if (!message || !message.content || !socketRef.current || !activeConversationId) return

    socketRef.current.emit('send_message', message)
    socketRef.current.emit('stop_typing', { conversationId: activeConversationId, userId })
  }

  // 通知正在输入（附带当前输入内容，供对方预览）
  const handleTyping = (content) => {
    if (!socketRef.current || !activeConversationId) return

    socketRef.current.emit('typing', { conversationId: activeConversationId, userId, content })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', { conversationId: activeConversationId, userId })
    }, 1000)
  }

  // 点击用户,打开或切换到该用户的会话
  const handleUserClick = (targetUserId) => {
    if (!socketRef.current || targetUserId === userId) return

    // 请求创建或获取会话
    socketRef.current.emit('request_conversation', { targetUserId })
  }

  return (
    <div className="chat-container">
      {/* 左侧边栏 - 带标签切换 */}
      <div className="sidebar">
        {/* 标签切换 */}
        <div className="sidebar-tabs">
          <button
            className={`tab-button ${activeTab === 'conversations' ? 'active' : ''}`}
            onClick={() => setActiveTab('conversations')}
          >
            💬 会话
          </button>
          <button
            className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            👥 通讯录
          </button>
        </div>

        <div className="sidebar-content">
          {/* 会话列表 */}
          <Activity mode={activeTab === 'conversations' ? 'visible' : 'hidden'}>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              unreadCounts={unreadCounts}
              onSelect={(conversationId) => setActiveConversationId(conversationId)}
            />
          </Activity>

          {/* 通讯录 - 在线用户列表 */}
          <Activity mode={activeTab === 'contacts' ? 'visible' : 'hidden'}>
            <UserList
              users={users}
              currentUserId={userId}
              onUserClick={handleUserClick}
            />
          </Activity>
        </div>
      </div>

      <div className="chat-main">
        <Messages
          userId={userId}
          activeConversationId={activeConversationId}
          messages={currentMessages}
        />

        {activeConversationId && (
          <MessageInputer
            key={activeConversationId}
            activeConversationId={activeConversationId}
            userId={userId}
            onSend={sendMessage}
            onInputChange={handleTyping}
          />
        )}
      </div>
    </div>
  )
}

export default Chat
