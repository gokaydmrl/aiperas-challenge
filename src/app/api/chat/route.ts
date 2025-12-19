export const dynamic = "force-dynamic";

const LONG_MESSAGE = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi 
ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit 
in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
deserunt mollit anim id est laborum.

Bu mesaj tam olarak 20 saniye boyunca akacak.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi 
ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit 
in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
deserunt mollit anim id est laborum.

AI düşünüyor gibi yapmıyor, gerçekten yavaş yazıyor 😎
`.trim();

function generateChunks(): string[] {
  const totalSeconds = 20;
  const chunkSize = Math.ceil(LONG_MESSAGE.length / totalSeconds);
  const chunks: string[] = [];

  for (let i = 0; i < LONG_MESSAGE.length; i += chunkSize) {
    chunks.push(LONG_MESSAGE.slice(i, i + chunkSize));
  }

  return chunks;
}

interface ChatRequest {
  message: string;
  startIndex?: number;
}

export async function POST(request: Request) {
  const body: ChatRequest = await request.json();
  const startIndex = body.startIndex ?? 0;

  const chunks = generateChunks();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let currentIndex = startIndex;

      const interval = setInterval(() => {
        if (currentIndex < chunks.length) {
          const chunk = chunks[currentIndex];
          const data = JSON.stringify({
            chunk,
            index: currentIndex,
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          currentIndex++;
        } else {
          const doneData = JSON.stringify({
            done: true,
            message: "🧠 Stream tamamlandı.",
          });

          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
