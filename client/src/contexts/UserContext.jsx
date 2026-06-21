import { createContext, useContext } from 'react'

export const UserContext = createContext({})

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error('useUser 必须在 UserContext 内部使用')
  }
  return ctx
}
