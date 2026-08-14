"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChatCircle,
  PaperPlaneRight,
  Sparkle,
  Trash,
  SignIn,
  Warning,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { useAIChat } from "@/hooks/useAIChat";

const SUGGESTED_PROMPTS = [
  "Which products need restocking?",
  "How's my profit margin?",
  "What sold the most this week?",
  "What should I buy this week?",
];

export function AIChat() {
  const { user } = useAuth();
  const { messages, sendMessage, clearChat, isLoading } = useAIChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!user) {
    return (
      <div className="rounded-cards bg-white p-8 text-center shadow-subtle-3">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-black text-white">
          <Sparkle weight="fill" size={22} />
        </span>
        <h2 className="text-[17px] font-semibold text-heading-charcoal">AI Assistant</h2>
        <p className="mt-1.5 text-[13px] text-muted-gray">
          Sign in to ask questions about your sales, margins, and restock timing.
        </p>
        <Link
          href="/auth/login"
          className="mt-4 inline-flex items-center gap-1.5 rounded-buttons bg-ink-black px-4 py-2.5 text-[14px] font-semibold text-white hover:opacity-90"
        >
          <SignIn /> Sign in
        </Link>
      </div>
    );
  }

  const handleSend = (text: string) => {
    if (isLoading) return;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col rounded-cards bg-white shadow-subtle-3">
      <div className="flex items-center justify-between border-b border-stone-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkle weight="fill" size={18} className="text-ember-orange" />
          <h2 className="text-[16px] font-semibold text-heading-charcoal">AI Assistant</h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            aria-label="Clear chat history"
            className="flex items-center gap-1 text-[12px] font-medium text-muted-gray hover:text-[var(--color-alert-red)]"
          >
            <Trash size={14} /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink-black text-white">
                <ChatCircle size={14} />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-cream-canvas px-3.5 py-2.5 text-[14px] text-body-brown">
                Hi! Ask me about your sales, margins, or reorder strategy.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-stone-surface bg-white px-3 py-1.5 text-[12px] font-medium text-body-brown hover:bg-cream-canvas"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <span
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                m.role === "user" ? "bg-[var(--color-link-blue)] text-white" : "bg-ink-black text-white"
              }`}
            >
              {m.role === "user" ? (
                <span className="text-[11px] font-bold">
                  {(user.shopName ?? user.phoneNumber ?? user.email ?? "?").charAt(0).toUpperCase()}
                </span>
              ) : (
                <ChatCircle size={14} />
              )}
            </span>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] ${
                m.role === "user"
                  ? "rounded-tr-sm bg-[var(--color-link-blue)] text-white"
                  : m.isError
                  ? "rounded-tl-sm bg-red-50 text-[var(--color-alert-red)] flex items-start gap-1.5"
                  : "rounded-tl-sm bg-cream-canvas text-body-brown"
              }`}
            >
              {m.isError && m.role === "assistant" && (
                <Warning size={16} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{m.content}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink-black text-white">
              <ChatCircle size={14} />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-cream-canvas px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-gray [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-gray [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-gray" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 border-t border-stone-surface p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something…"
          disabled={isLoading}
          className="flex-1 rounded-full border border-stone-surface bg-cream-canvas px-4 py-2.5 text-[14px] outline-none focus:border-[var(--color-link-blue)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ink-black text-white disabled:opacity-30"
        >
          <PaperPlaneRight weight="fill" size={16} />
        </button>
      </form>
    </div>
  );
}
