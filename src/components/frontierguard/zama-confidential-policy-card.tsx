"use client";

import type { ConfidentialPolicy } from "@/lib/frontierguard/types";

export function ZamaConfidentialPolicyCard({ policy }: { policy: ConfidentialPolicy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Zama Rail</p>
          <h3 className="mt-2 text-lg font-bold">Confidential Policy Vault</h3>
        </div>
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500">
          {policy.status}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{policy.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Policy Handle</p>
          <p className="mt-2 break-all">{policy.policyHandle ?? "Pending"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">ACL Grant</p>
          <p className="mt-2 break-all">{policy.aclGrantId ?? "Pending"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {policy.encryptedFields.map((field) => (
          <span key={field} className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-500">
            {field}
          </span>
        ))}
      </div>
    </div>
  );
}
