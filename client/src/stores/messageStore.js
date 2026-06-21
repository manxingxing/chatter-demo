import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API, authHeaders } from '../config'

// -------------------- 常量 --------------------

const MAX_MSGS_PER_CONV = 200
const MAX_TOTAL_MSGS = 2000

/** 裁剪 messagesMap，防止 localStorage 超限 */
function trimMessagesMap(map) {
  const trimmed = {}
  let total = 0
  for (const [convId, msgs] of Object.entries(map)) {
    const kept = msgs.length > MAX_MSGS_PER_CONV
      ? msgs.slice(msgs.length - MAX_MSGS_PER_CONV)
      : msgs
    trimmed[convId] = kept
    total += kept.length
  }
  if (total > MAX_TOTAL_MSGS) {
    const sorted = Object.entries(trimmed)
      .sort((a, b) => b[1].length - a[1].length)
    let excess = total - MAX_TOTAL_MSGS
    for (const [convId, msgs] of sorted) {
      if (excess <= 0) break
      const cut = Math.min(msgs.length - 10, excess)
      if (cut <= 0) continue
      trimmed[convId] = msgs.slice(cut)
      excess -= cut
    }
  }
  return trimmed
}

// -------------------- Store --------------------

export const useMessageStore = create(
  persist(
    (set) => ({
      // === 消息缓存 ===
      messagesMap: {},

      addMessage: (convId, message) =>
        set((state) => ({
          messagesMap: {
            ...state.messagesMap,
            [convId]: [...(state.messagesMap[convId] || []), message]
          }
        })),

      refreshMessages: async (conversationId) => {
        try {
          const state = useMessageStore.getState()
          const cached = state.messagesMap[conversationId] || []
          const lastCachedMsg = cached.length > 0 ? cached[cached.length - 1] : null

          const url = lastCachedMsg
            ? API.messagesSince(conversationId, lastCachedMsg.id)
            : API.messages(conversationId)

          const response = await fetch(url, { headers: authHeaders() })
          if (!response.ok) return

          const data = await response.json()
          const incoming = data.messages || []

          if (lastCachedMsg) {
            // 增量：直接追加
            set((state) => ({
              messagesMap: {
                ...state.messagesMap,
                [conversationId]: [...(state.messagesMap[conversationId] || []), ...incoming]
              }
            }))
          } else {
            // 全量：去重 + 按时间排序
            const serverIds = new Set(incoming.map(m => m.id))
            const merged = [
              ...cached.filter(m => !serverIds.has(m.id)),
              ...incoming
            ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

            set((state) => ({
              messagesMap: { ...state.messagesMap, [conversationId]: merged }
            }))
          }
        } catch (error) {
          console.error('❌ 加载消息失败:', error)
        }
      },
    }),
    {
      name: 'chatter-messages',
      partialize: (state) => ({
        messagesMap: trimMessagesMap(state.messagesMap),
      }),
    }
  )
)
