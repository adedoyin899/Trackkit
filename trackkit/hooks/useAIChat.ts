"use client";

import { useState } from "react";
import { useChatStore, type ChatMessage } from "@/lib/chat-store";
import { buildAIContext } from "@/lib/ai-context";

interface SendMessageOptions {
  focusProductId?: string;
  timeRange?: "day" | "week" | "month";
}

export function useAIChat() {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const clearChat = useChatStore((s) => s.clearChat);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string, options: SendMessageOptions = {}) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const context = buildAIContext(options.focusProductId);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          context: {
            focusProductId: options.focusProductId,
            timeRange: options.timeRange ?? "week",
            products: context.products,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.error === "Sign in to use the AI Assistant"
            ? "Sign in (Settings tab) to use the AI Assistant."
            : data.error || "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
          confidence: 0,
          isError: true,
        });
        return;
      }

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        confidence: data.confidence,
        isError: data.confidence === 0,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Couldn't reach the AI Assistant. Check your connection and try again.",
        timestamp: new Date().toISOString(),
        confidence: 0,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading,
  };
}
