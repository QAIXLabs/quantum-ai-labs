import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from './api'

/** Older lines are dropped; only the last 12 are sent as context anyway. */
const MAX_MESSAGES = 40

type TerminalState = {
  messages: ChatMessage[]
  add: (message: ChatMessage) => void
  /** Drops the last message (a question whose reply failed), so roles keep alternating. */
  pop: () => void
  clear: () => void
}

/** The terminal conversation, kept in this browser only (no accounts). */
export const useTerminalHistory = create<TerminalState>()(
  persist(
    (set) => ({
      messages: [],
      add: (message) => set((s) => ({ messages: [...s.messages, message].slice(-MAX_MESSAGES) })),
      pop: () => set((s) => ({ messages: s.messages.slice(0, -1) })),
      clear: () => set({ messages: [] }),
    }),
    { name: 'quantumlabs:agent', version: 1 },
  ),
)
