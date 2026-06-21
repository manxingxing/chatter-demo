import { create } from 'zustand'

/**
 * 聊天状态 Store —— 解耦 WebSocket 高频事件
 * 用普通对象替代 Map，确保 Zustand 浅比较能正确工作
 */
export const useChatStore = create((set) => ({
  // 正在输入的用户  { [username]: content }
  typingUsers: {},

  setTypingUser: (username, content) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [username]: content || '' }
    })),

  removeTypingUser: (username) =>
    set((state) => {
      const next = { ...state.typingUsers }
      delete next[username]
      return { typingUsers: next }
    }),
}))
