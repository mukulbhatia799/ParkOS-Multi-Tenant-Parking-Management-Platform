import { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  success: "bg-green-50 text-status-good border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-status-critical border-red-200",
  neutral: "bg-slate-100 text-slate-500 border-slate-200",
  info: "bg-accent-50 text-accent-700 border-accent-200",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
