"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/src/hooks/useChat";
import { ChatMessage } from "@/src/components/ChatMessage";
import { ChatInput } from "@/src/components/ChatInput";
import { StreamingIndicator } from "@/src/components/StreamingIndicator";
import Header from "../components/Header";

export default function Home() {
  const { messages, isStreaming, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"></div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <StreamingIndicator />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>{" "}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
