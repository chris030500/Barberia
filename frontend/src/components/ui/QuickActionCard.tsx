import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Tone = "emerald" | "cyan" | "violet" | "slate";

const toneStyles: Record<Tone, string> = {
  emerald: "hover:border-emerald-400/60 hover:bg-emerald-500/10",
  cyan: "hover:border-cyan-400/60 hover:bg-cyan-500/10",
  violet: "hover:border-violet-400/60 hover:bg-violet-500/10",
  slate: "hover:border-white/20 hover:bg-white/5",
};

type Props = {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone?: Tone;
};

export function QuickActionCard({ to, title, description, icon, tone = "slate" }: Props) {
  return (
    <Link
      to={to}
      className={clsx(
        "group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        toneStyles[tone],
      )}
    >
      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 group-hover:text-white">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-medium text-white">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-sm text-white/60 group-hover:block">
        →
      </span>
    </Link>
  );
}
