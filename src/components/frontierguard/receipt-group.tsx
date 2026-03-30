"use client";

import type { ReactNode } from "react";

export function ReceiptGroup({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="workspace-panel rounded-[28px] p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}
