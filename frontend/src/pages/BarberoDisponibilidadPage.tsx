import { useState } from "react";
import { useAuth } from "@/stores/auth";
import BarberoHorarioPage from "./BarberoHorario";
import BarberoBloqueosPage from "./BarberoBloqueos";

type TabKey = "horario" | "bloqueos";

export default function BarberoDisponibilidadPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("horario");

  const tabs: { key: TabKey; label: string; badge?: string }[] = [
    { key: "horario",  label: "Horario semanal" },
    { key: "bloqueos", label: "Bloqueos" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Disponibilidad del barbero</h1>
          <p className="text-sm text-zinc-500">
            Configura tus horarios base y administra bloqueos/ausencias.
          </p>
        </div>
        <div className="text-xs rounded-full border border-emerald-700/40 bg-emerald-900/20 px-3 py-1 text-emerald-300">
          {user?.roles?.includes("ADMIN") ? "ADMIN" : user?.roles?.[0] ?? "USUARIO"}
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full rounded-2xl border border-zinc-800 bg-neutral-900/40 p-1">
        <div className="flex items-center gap-1">
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  "relative flex-1 rounded-xl px-4 py-2 text-sm transition",
                  active
                    ? "bg-neutral-800/80 text-white shadow-inner"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-neutral-800/40"
                ].join(" ")}
              >
                {t.label}
                {t.badge && (
                  <span className="ml-2 text-[10px] rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className="rounded-2xl border border-zinc-800 bg-neutral-900/30 p-4 md:p-6"
        role="tabpanel"
        aria-labelledby={tab}
      >
        {tab === "horario" && <BarberoHorarioPage />}
        {tab === "bloqueos" && <BarberoBloqueosPage />}
      </div>
    </div>
  );
}