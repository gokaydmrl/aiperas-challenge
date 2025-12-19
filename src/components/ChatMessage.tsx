"use client";

import { Message } from "../hooks/useChat";
interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fadeIn`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 border border-slate-700/50`}>
        <div className="grid items-start gap-2">
          <div className="flex-1">
            <span className="text-lg font-bold">{isUser ? `You:` : "AI:"}</span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block w-1 h-4 ml-1 bg-amber-400 animate-pulse rounded-sm" />
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
