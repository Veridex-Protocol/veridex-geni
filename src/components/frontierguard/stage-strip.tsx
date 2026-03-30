import type { MissionStage } from "@/lib/frontierguard/types";

interface StageStripProps {
  stages: MissionStage[];
}

function getStageClasses(status: MissionStage["status"]): string {
  if (status === "completed") {
    return "border border-emerald-500/25 bg-emerald-500/18 text-emerald-300";
  }
  if (status === "active") {
    return "border border-cyan-500/30 bg-cyan-500/20 text-cyan-300 ring-4 ring-cyan-500/10";
  }
  if (status === "blocked") {
    return "border border-red-500/30 bg-red-500/18 text-red-300";
  }
  return "border border-white/6 bg-zinc-900 text-zinc-500";
}

export function StageStrip({ stages }: StageStripProps) {
  return (
    <div className="relative grid grid-cols-7 gap-3 lg:gap-4">
      <div className="absolute left-[8%] right-[8%] top-5 h-px bg-white/8"></div>
      {stages.map((stage) => (
        <div key={stage.key} className="relative z-10 flex flex-col items-center gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${getStageClasses(stage.status)}`}>
            {stage.status === "completed" ? (
              <span className="material-symbols-outlined text-base">check</span>
            ) : stage.status === "active" ? (
              <span className="material-symbols-outlined text-base">play_arrow</span>
            ) : stage.status === "blocked" ? (
              <span className="material-symbols-outlined text-base">warning</span>
            ) : (
              <span>{stage.label.slice(0, 1)}</span>
            )}
          </div>
          <div className="text-center">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
                stage.status === "active"
                  ? "text-cyan-300"
                  : stage.status === "blocked"
                    ? "text-red-300"
                    : stage.status === "completed"
                      ? "text-emerald-300"
                      : "text-zinc-500"
              }`}
            >
              {stage.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
