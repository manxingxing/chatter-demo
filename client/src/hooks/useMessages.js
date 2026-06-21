import { useMessageStore } from '../stores/messageStore'
import { useUnreadStore } from '../stores/unreadStore'

/**
 * 消息缓存（messageStore 薄封装）
 * 数据持久化由 persist 中间件自动处理
 */
export function useMessages() {
  const messagesMap    = useMessageStore((s) => s.messagesMap)
  const addMessage     = useMessageStore((s) => s.addMessage)
  const refreshMessages = useMessageStore((s) => s.refreshMessages)
  return { messagesMap, refreshMessages, addMessage }
}

/**
 * 未读计数（messageStore 薄封装）
 */
export function useUnreadCount() {
  const unreadCounts     = useUnreadStore((s) => s.unreadCounts)
  const updateUnreadCount = useUnreadStore((s) => s.updateUnreadCount)
  return { unreadCounts, updateUnreadCount }
}
