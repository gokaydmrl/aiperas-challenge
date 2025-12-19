"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useChatStore } from "@/src/stores/chatStore";

const CHAT_URL = "http://localhost:3001/chat";

type StreamingContextType = {
  triggerStream: (userMessage: string) => Promise<void>;
};

const StreamingContext = createContext<StreamingContextType | null>(null);

export const StreamingProvider = ({ children }: { children: ReactNode }) => {
  const {
    appendChunkToCurrentMessage,
    setStreamId,
    setLastChunkIndex,
    interruptStream,
    resumeStart,
    finishStream,
    isStreamInterrupted,
    streamId,
    lastChunkIndex,
    hasHydrated,
    isStreaming,
  } = useChatStore();

  const startConnection = async (body: any) => {
    try {
      await fetchEventSource(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),

        onmessage: (event) => {
          const data = JSON.parse(event.data);

          if (data.streamId) setStreamId(data.streamId);
          if (typeof data.index === "number") setLastChunkIndex(data.index);
          if (typeof data.chunk === "string") appendChunkToCurrentMessage(data.chunk);
          if (data.done) finishStream();
        },

        onerror: (err) => {
          console.error("SSE error", err);
          interruptStream();
          throw err;
        },
      });
    } catch {
      interruptStream();
    }
  };

  const triggerStream = async (userMessage: string) => {
    useChatStore.getState().startStreaming(userMessage);
    await startConnection({ message: userMessage });
  };

  const resumeStream = async (sId: string, lastIndex: number) => {
    resumeStart();
    await startConnection({
      streamId: sId,
      lastIndex,
    });
  };

  useEffect(() => {
    console.log("🔁 Resume loguuuuuuu", lastChunkIndex);

    if (lastChunkIndex > 0) {
      console.log("🔁 Resume başlıyor", { streamId, lastChunkIndex });
      resumeStream(streamId!, lastChunkIndex);
    }
  }, [hasHydrated]);

  return (
    <StreamingContext.Provider value={{ triggerStream }}>{children}</StreamingContext.Provider>
  );
};

export const useStreaming = () => {
  const ctx = useContext(StreamingContext);
  if (!ctx) throw new Error("useStreaming must be used inside provider");
  return ctx;
};
