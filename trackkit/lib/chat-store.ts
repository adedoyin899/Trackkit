import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  confidence?: number;
  isError?: boolean;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

/** Separate from useTrackkitStore since chat history can grow large and
 * has nothing to do with app settings/tab state. Kept in its own
 * localStorage key so clearing chat never touches the rest of the app's
 * persisted state. */
export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      clearChat: () => set({ messages: [] }),
    }),
    {
      name: "trackkit-ai-chat",
    },
  ),
);
