// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// export type MessageRole = "user" | "assistant";

// export interface Message {
//   id: string;
//   role: MessageRole;
//   content: string;
// }

// interface ChatStore {
//   messages: Message[];
//   isStreaming: boolean;
//   currentStreamingMessageId: string | null;
//   streamId: string | null;
//   lastChunkIndex: number;
//   isStreamInterrupted: boolean;
//   hasHydrated: boolean; // Rehydration durumunu takip etmek için

//   // Eylemler
//   startStreaming: (userMessage: string) => void;
//   appendChunkToCurrentMessage: (chunk: string) => void;
//   setLastChunkIndex: (index: number) => void;
//   setStreamId: (id: string | null) => void;
//   interruptStream: () => void;
//   resumeStart: () => void;
//   finishStream: () => void;
// }

// const createId = () => Math.random().toString(36).substring(7);

// export const useChatStore = create<ChatStore>()(
//   persist(
//     (set, get) => ({
//       messages: [],
//       isStreaming: false,
//       currentStreamingMessageId: null,
//       streamId: null,
//       lastChunkIndex: -1,
//       isStreamInterrupted: false,
//       hasHydrated: false,

//       startStreaming: (userMessage) => {
//         const userMsg: Message = { id: createId(), role: "user", content: userMessage };
//         const aiMsg: Message = { id: createId(), role: "assistant", content: "" };

//         set((state) => ({
//           messages: [...state.messages, userMsg, aiMsg],
//           isStreaming: true,
//           isStreamInterrupted: false, // Yeni stream başlarken kesinti bayrağını sıfırla
//           streamId: null,
//           lastChunkIndex: -1,
//           currentStreamingMessageId: aiMsg.id,
//         }));
//       },

//       appendChunkToCurrentMessage: (chunk) => {
//         const { currentStreamingMessageId, messages } = get();
//         if (!currentStreamingMessageId) return;
//         set({
//           messages: messages.map((msg) =>
//             msg.id === currentStreamingMessageId ? { ...msg, content: msg.content + chunk } : msg
//           ),
//         });
//       },

//       setLastChunkIndex: (index) => set({ lastChunkIndex: index }),
//       setStreamId: (id) => set({ streamId: id }),

//       // BU FONKSİYON ÇOK ÖNEMLİ
//       interruptStream: () => {
//         console.log("Store: Stream kesintiye uğradı. Durum ZORUNLA localStorage'a yazılıyor.");
//         const currentState = get();

//         // 1. Zustand state'ini normal şekilde güncelle
//         set({ isStreaming: false, isStreamInterrupted: true });

//         // 2. KRİTİK: Persist'in asenkron işlemini beklemeden, durumu manuel olarak senkronize et.
//         // Bu, tarayıcı kapatılmadan önce verinin kaydedilmesini garantiler.
//         const stateToSave = {
//           ...currentState,
//           isStreaming: false,
//           isStreamInterrupted: true,
//         };
//         localStorage.setItem("chat-history", JSON.stringify(stateToSave));
//         console.log(
//           "Store: isStreamInterrupted durumu manuel olarak kaydedildi:",
//           stateToSave.isStreamInterrupted
//         );
//       },

//       resumeStart: () => set({ isStreaming: true, isStreamInterrupted: false }),
//       finishStream: () =>
//         set({
//           isStreaming: false,
//           isStreamInterrupted: false,
//           currentStreamingMessageId: null,
//           streamId: null,
//           lastChunkIndex: -1,
//         }),
//     }),
//     {
//       name: "chat-history",
//       // Rehydration tamamlandığında bayrağı güncelle
//       onRehydrateStorage: () => (state) => {
//         console.log("Store: Rehydration tamamlandı.");
//         state!.hasHydrated = true;
//       },
//     }
//   )
// );
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  currentStreamingMessageId: string | null;
  streamId: string | null;
  lastChunkIndex: number;
  isStreamInterrupted: boolean;
  hasHydrated: boolean;

  startStreaming: (userMessage: string) => void;
  appendChunkToCurrentMessage: (chunk: string) => void;
  setLastChunkIndex: (index: number) => void;
  setStreamId: (id: string | null) => void;
  interruptStream: () => void;
  resumeStart: () => void;
  finishStream: () => void;
  setHasHydrated: (value: boolean) => void;
}

const createId = () => crypto.randomUUID();

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      currentStreamingMessageId: null,
      streamId: null,
      lastChunkIndex: -1,
      isStreamInterrupted: false,
      hasHydrated: false,

      startStreaming: (userMessage) => {
        const userMsg: Message = {
          id: createId(),
          role: "user",
          content: userMessage,
        };

        const aiMsg: Message = {
          id: createId(),
          role: "assistant",
          content: "",
        };

        set((state) => ({
          messages: [...state.messages, userMsg, aiMsg],
          isStreaming: true,
          isStreamInterrupted: false,
          streamId: null,
          lastChunkIndex: -1,
          currentStreamingMessageId: aiMsg.id,
        }));
      },
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      appendChunkToCurrentMessage: (chunk) => {
        const { currentStreamingMessageId, messages } = get();
        if (!currentStreamingMessageId) return;

        set({
          messages: messages.map((msg) =>
            msg.id === currentStreamingMessageId ? { ...msg, content: msg.content + chunk } : msg
          ),
        });
      },

      setLastChunkIndex: (index) => set({ lastChunkIndex: index }),
      setStreamId: (id) => set({ streamId: id }),

      interruptStream: () => {
        const currentState = get();

        set({
          isStreaming: false,
          isStreamInterrupted: true,
        });

        // 🔥 force sync persist
        localStorage.setItem(
          "chat-history",
          JSON.stringify({
            ...currentState,
            isStreaming: false,
            isStreamInterrupted: true,
          })
        );
      },

      resumeStart: () =>
        set({
          isStreaming: true,
          isStreamInterrupted: false,
        }),

      finishStream: () =>
        set({
          isStreaming: false,
          isStreamInterrupted: false,
          currentStreamingMessageId: null,
          streamId: null,
          lastChunkIndex: -1,
        }),
    }),
    {
      name: "chat-history",
      version: 0,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
