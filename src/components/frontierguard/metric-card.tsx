interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "success" | "warning" | "danger" | "primary";
}

const toneClassName: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-white",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
  primary: "text-cyan-400",
};

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div className="workspace-panel workspace-hover rounded-2xl p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClassName[tone]}`}>{value}</p>
      {helper ? <p className="mt-2 text-xs text-zinc-500">{helper}</p> : null}
    </div>
  );
}
