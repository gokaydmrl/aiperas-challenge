"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface StoredSession {
  userMessage: string;
  chunks: string[];
  lastIndex: number;
  isComplete: boolean;
  timestamp: number;
}

const STORAGE_KEY = "chatSession";
const SESSION_EXPIRY = 5 * 60 * 1000; // 5 minutes

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function saveSession(session: StoredSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const session: StoredSession = JSON.parse(stored);

    if (Date.now() - session.timestamp > SESSION_EXPIRY) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function clearStoredSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false);
  const assistantMessageIdRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const HEARTBEAT_TIMEOUT = 15_000; // 15s
  const HEARTBEAT_CHECK_INTERVAL = 3_000;

  const lastChunkTimeRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<number | null>(null);

  const connectStream = useCallback(async (userMessage: string, startIndex: number = 0) => {
    setIsStreaming(true);

    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          startIndex,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error("Failed to connect to stream");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);

              if (data.done) {
                const session = loadSession();
                if (session) {
                  session.isComplete = true;
                  saveSession(session);
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageIdRef.current ? { ...msg, isStreaming: false } : msg
                  )
                );
                setIsStreaming(false);
              } else if (data.chunk !== undefined) {
                const session = loadSession();
                lastChunkTimeRef.current = Date.now();

                if (session) {
                  if (data.index < session.lastIndex) {
                    return;
                  }

                  session.chunks[data.index] = data.chunk;
                  session.lastIndex = data.index;
                  session.timestamp = Date.now();
                  saveSession(session);
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageIdRef.current
                      ? { ...msg, content: msg.content + data.chunk }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error("Stream failed:", error);
              setIsStreaming(false);
            } finally {
              isConnectingRef.current = false;
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Stream error:", error);
        setIsStreaming(false);
      }
    }
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const session = loadSession();
    if (!session) return;

    const assistantId = generateId();
    assistantMessageIdRef.current = assistantId;

    const restoredMessages: Message[] = [
      {
        id: generateId(),
        role: "user",
        content: session.userMessage,
      },
      {
        id: assistantId,
        role: "assistant",
        content: session.chunks.join(""),
        isStreaming: !session.isComplete,
      },
    ];

    setMessages(restoredMessages);

    if (!session.isComplete) {
      const startIndex = session.lastIndex + 1;
      connectStream(session.userMessage, startIndex);
    }
  }, [connectStream]);

  useEffect(() => {
    if (!isStreaming) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    heartbeatIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - lastChunkTimeRef.current;

      if (elapsed > HEARTBEAT_TIMEOUT) {
        console.warn("Heartbeat timeout — aborting stream");

        abortControllerRef.current?.abort();

        setIsStreaming(false);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageIdRef.current ? { ...m, isStreaming: false } : m
          )
        );
      }
    }, HEARTBEAT_CHECK_INTERVAL);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isStreaming]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming || !content.trim()) return;
      clearStoredSession();

      const assistantId = generateId();
      assistantMessageIdRef.current = assistantId;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
      };

      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const session: StoredSession = {
        userMessage: content.trim(),
        chunks: [],
        lastIndex: -1,
        isComplete: false,
        timestamp: Date.now(),
      };
      saveSession(session);

      connectStream(content.trim(), 0);
    },
    [isStreaming, connectStream]
  );

  return {
    messages,
    isStreaming,
    sendMessage,
  };
}
