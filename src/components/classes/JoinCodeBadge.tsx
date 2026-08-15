import { useState } from "react";

export function JoinCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — ignore, code is still visible to read/copy manually
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="클릭하여 복사"
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 font-mono text-xs tracking-widest text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {code}
      <span className="text-zinc-400">{copied ? "복사됨" : "복사"}</span>
    </button>
  );
}
