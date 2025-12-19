"use client";

import { useState } from "react";
import { useChatStore } from "@/src/stores/chatStore";
import { useStreaming } from "@/src/lib/StreamingProvider";
import useStore from "../stores/useStore";
export default function ChatPage() {
  const [input, setInput] = useState("");
  const store = useStore(useChatStore, (state) => ({
    messages: state.messages,
    isStreaming: state.isStreaming,
    hasHydrated: state.hasHydrated,
  }));

  const { triggerStream } = useStreaming();
  if (!store) return null; // or loading UI

  const { messages, isStreaming, hasHydrated } = store;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const msg = input;
    setInput("");
    await triggerStream(msg);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {hasHydrated &&
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "1rem" }}>
              <strong>{msg.role === "user" ? "Sen" : "AI"}:</strong>
              <p>{msg.content}</p>
              {msg.role === "assistant" &&
                isStreaming &&
                messages[messages.length - 1].id === msg.id && <span>|</span>}
            </div>
          ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", padding: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          style={{ flex: 1 }}
        />
        <button disabled={isStreaming}>Gönder</button>
      </form>
    </div>
  );
}
