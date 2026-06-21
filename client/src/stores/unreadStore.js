import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUnreadStore = create(
  persist(
    (set) => ({
      unreadCounts: {},

      updateUnreadCount: (conversationId, count) =>
        set((state) => {
          if (typeof count === 'function') {
            const prevCount = Math.max(state.unreadCounts[conversationId] || 0, 0)
            return {
              unreadCounts: {
                ...state.unreadCounts,
                [conversationId]: count(prevCount)
              }
            }
          }
          return {
            unreadCounts: {
              ...state.unreadCounts,
              [conversationId]: count
            }
          }
        }),
    }),
    {
      name: 'chatter-unread',
      partialize: (state) => ({ unreadCounts: state.unreadCounts }),
    }
  )
)
