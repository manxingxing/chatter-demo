import { useState, useEffect, useMemo } from 'react'
import { API, authHeaders } from '../config'

// -------------------- 常量 & 工具 --------------------

const MSG_CACHE_KEY = (uid) => `chatter_messages_${uid}`
const UNREAD_CACHE_KEY = (uid) => `chatter_unread_${uid}`
const MAX_MSGS_PER_CONV = 200
const MAX_TOTAL_MSGS = 2000

/** 裁剪 messagesMap，防止 localStorage 超限 */
const trimMessagesMap = (map) => {
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

// -------------------- Hook --------------------

/**
 * 管理每个会话的消息缓存 & 未读计数
 * @param {string} userId
 * @param {string|null} activeConversationId
 */
export default function useMessages(userId, activeConversationId) {
  // 每个会话的消息列表: { [convId]: Message[] }
  const [messagesMap, setMessagesMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MSG_CACHE_KEY(userId)) || '{}') }
    catch { return {} }
  })

  // 未读计数: { [convId]: number }
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(UNREAD_CACHE_KEY(userId)) || '{}') }
    catch { return {} }
  })

  // ---------- localStorage 持久化 ----------

  useEffect(() => {
    const trimmed = trimMessagesMap(messagesMap)
    localStorage.setItem(MSG_CACHE_KEY(userId), JSON.stringify(trimmed))
  }, [messagesMap, userId])

  useEffect(() => {
    localStorage.setItem(UNREAD_CACHE_KEY(userId), JSON.stringify(unreadCounts))
  }, [unreadCounts, userId])

  // ---------- 进入会话：清除未读 + 增量拉取消息 ----------

  useEffect(() => {
    if (!activeConversationId) return

    // 清除当前会话的未读计数
    setUnreadCounts(prev =>
      (prev[activeConversationId] || 0) > 0
        ? { ...prev, [activeConversationId]: 0 }
        : prev
    )

    const fetchAndMerge = async () => {
      try {
        // 读取当前缓存，决定走增量还是全量
        const cached = messagesMap[activeConversationId] || []
        const lastCachedMsg = cached.length > 0 ? cached[cached.length - 1] : null

        const url = lastCachedMsg
          ? API.messagesSince(activeConversationId, lastCachedMsg.id)
          : API.messages(activeConversationId)

        const response = await fetch(url, { headers: authHeaders() })
        if (!response.ok) return
        const data = await response.json()
        const incoming = data.messages || []

        setMessagesMap(prev => {
          const prevCached = prev[activeConversationId] || []
          if (lastCachedMsg) {
            // 增量：直接追加
            return { ...prev, [activeConversationId]: [...prevCached, ...incoming] }
          }
          // 全量：去重 + 按时间排序
          const serverIds = new Set(incoming.map(m => m.id))
          const merged = [
            ...prevCached.filter(m => !serverIds.has(m.id)),
            ...incoming
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          return { ...prev, [activeConversationId]: merged }
        })
      } catch (error) {
        console.error('❌ 加载消息失败:', error)
      }
    }

    fetchAndMerge()
  }, [activeConversationId])

  // ---------- 派生当前会话消息 ----------

  const currentMessages = useMemo(() =>
    activeConversationId ? messagesMap[activeConversationId] || [] : [],
    [messagesMap, activeConversationId]
  )

  return {
    messagesMap,
    setMessagesMap,
    unreadCounts,
    setUnreadCounts,
    currentMessages,
  }
}
