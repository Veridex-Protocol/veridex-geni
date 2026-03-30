interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
}

const toneClassName: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]",
  success: "text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  warning: "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  danger: "text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  primary: "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]",
};

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-zinc-800/80 bg-zinc-950/40 p-6 backdrop-blur-xl shadow-lg transition-all duration-500 hover:border-zinc-700 hover:bg-zinc-900/60 hover:-translate-y-1">
      <div className="absolute -inset-x-0 -top-10 h-20 bg-gradient-to-b from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</p>
      <p className={`relative z-10 mt-3 text-3xl font-light tracking-tight ${toneClassName[tone]}`}>
        {value}
      </p>
      {helper ? <p className="relative z-10 mt-3 text-xs text-zinc-500 font-mono tracking-tight">{helper}</p> : null}
    </div>
  );
}
