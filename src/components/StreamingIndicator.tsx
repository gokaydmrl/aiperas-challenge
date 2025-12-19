"use client";

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm px-4 py-2">
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
