interface CodePanelProps {
  title: string;
  value: string;
  onCopy?: () => void | Promise<void>;
  onDownload?: () => void;
}

export function CodePanel({ title, value, onCopy, onDownload }: CodePanelProps) {
  return (
    <section className="workspace-panel overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between border-b border-white/6 bg-black/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="font-mono text-sm font-medium text-zinc-200">{title}</span>
        </div>
        <div className="flex gap-2">
          {onCopy ? (
            <button
              onClick={onCopy}
              className="workspace-button-secondary rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              Copy
            </button>
          ) : null}
          {onDownload ? (
            <button
              onClick={onDownload}
              className="workspace-button-secondary rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              Download
            </button>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto bg-zinc-950/70 p-6 font-mono text-sm leading-relaxed text-zinc-300">
        <pre className="whitespace-pre-wrap">{value}</pre>
      </div>
    </section>
  );
}
