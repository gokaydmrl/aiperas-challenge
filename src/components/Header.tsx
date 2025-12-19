import { useChat } from "../hooks/useChat";
export default function Header() {
  const { isStreaming } = useChat();
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-100">aiperas</h1>
            <p className="text-xs text-slate-400">
              {isStreaming ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  Streaming...
                </span>
              ) : (
                "Resumable Chat"
              )}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
