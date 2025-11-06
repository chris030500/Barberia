import clsx from "clsx";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "emerald" | "cyan" | "violet" | "amber";

const toneMap: Record<Tone, string> = {
  emerald: "from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/40",
  cyan: "from-cyan-500/20 via-cyan-500/10 to-transparent border-cyan-500/40",
  violet: "from-violet-500/20 via-violet-500/10 to-transparent border-violet-500/40",
  amber: "from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/40",
};

type Props = {
  title: string;
  value: string;
  description?: string;
  trend?: number | null;
  trendLabel?: string;
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
};

export function StatCard({
  title,
  value,
  description,
  trend = null,
  trendLabel,
  icon,
  tone = "emerald",
  loading = false,
}: Props) {
  const showTrend = typeof trend === "number" && !Number.isNaN(trend);
  const positive = (trend ?? 0) >= 0;
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-neutral-900/70 p-6 shadow-[0_20px_45px_-30px_rgba(16,185,129,0.7)]",
        "transition-transform duration-300 hover:-translate-y-1",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:opacity-80",
        toneMap[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {loading ? <span className="block h-8 w-32 animate-pulse rounded bg-white/10" /> : value}
          </p>
        </div>
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/80">
            {icon}
          </div>
        ) : null}
      </div>

      {description ? (
        <p className="mt-4 text-sm text-white/70">{description}</p>
      ) : null}

      {showTrend ? (
        <div
          className={clsx(
            "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            positive
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/10 text-rose-300",
          )}
        >
          {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(trend!).toFixed(1)}%</span>
          {trendLabel ? <span className="text-white/60">{trendLabel}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
