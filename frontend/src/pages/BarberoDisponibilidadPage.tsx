import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { CalendarDays, Clock4, Phone, RefreshCw, Scissors } from "lucide-react";

import {
  getBarberoDisponibilidadResumen,
  listBarberosLite,
  type BarberoLite,
} from "@/api/barberos";
import type { BarberoDisponibilidadResumen } from "@/api/barberos/types";
import { BarberoHorarioManager } from "@/components/barberos/BarberoHorarioManager";
import {
  BarberoBloqueosManager,
  type BarberoBloqueosManagerHandle,
} from "@/components/barberos/BarberoBloqueosManager";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/stores/auth";

function formatHours(hours: number | undefined) {
  if (hours == null || Number.isNaN(hours)) return "—";
  if (hours === 0) return "0 h";
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} h`;
}

function formatInstant(value: string | null | undefined) {
  if (!value) return "Sin registros";
  return dayjs(value).local().format("DD MMM YYYY • HH:mm");
}

export default function BarberoDisponibilidadPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");
  const myBarberoId = user?.barberoId ?? null;

  const [barberos, setBarberos] = useState<BarberoLite[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(myBarberoId);
  const [resumen, setResumen] = useState<BarberoDisponibilidadResumen | null>(null);
  const [loading, setLoading] = useState(false);

  const bloqueosRef = useRef<BarberoBloqueosManagerHandle>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const list = await listBarberosLite();
        setBarberos(list);
        if (!myBarberoId && list.length > 0 && selectedId == null) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar la lista de barberos");
      }
    })();
  }, [isAdmin, myBarberoId, selectedId]);

  const fetchResumen = async (barberoId: number, silent = false) => {
    if (!barberoId) return;
    if (!silent) setLoading(true);
    try {
      const data = await getBarberoDisponibilidadResumen(barberoId);
      setResumen(data);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchResumen(selectedId);
    } else {
      setResumen(null);
    }
  }, [selectedId]);

  const metrics = resumen?.metrics;

  const servicioLabels = useMemo(() => {
    if (!resumen?.barbero.servicios?.length) return [];
    return resumen.barbero.servicios.map((s) => `${s.nombre}${s.duracionMin ? ` • ${s.duracionMin} min` : ""}`);
  }, [resumen?.barbero.servicios]);

  const handleRefresh = () => {
    if (selectedId) {
      fetchResumen(selectedId, true);
      bloqueosRef.current?.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-950 p-6 shadow-xl shadow-emerald-900/20 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
            {resumen?.barbero.avatarUrl ? (
              <img
                src={resumen.barbero.avatarUrl}
                alt={resumen.barbero.nombre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-emerald-200">
                {resumen?.barbero.nombre?.slice(0, 1) ?? "B"}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Disponibilidad</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {resumen?.barbero.nombre ?? "Selecciona un barbero"}
            </h1>
            {resumen?.barbero.descripcion ? (
              <p className="mt-1 max-w-2xl text-sm text-zinc-300">{resumen.barbero.descripcion}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              {resumen?.barbero.telefonoE164 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <Phone className="h-3.5 w-3.5" /> {resumen.barbero.telefonoE164}
                </span>
              ) : null}
              {servicioLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-200"
                >
                  <Scissors className="h-3.5 w-3.5" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {isAdmin ? (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-0 sm:w-64"
            >
              <option value="">Selecciona barbero…</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre} {b.activo ? "" : "(inactivo)"}
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="btn btn-ghost h-10 px-4 text-sm"
            onClick={handleRefresh}
            disabled={!selectedId}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar datos
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Días activos"
          value={metrics ? String(metrics.diasActivos) : "—"}
          description="Días con agenda disponible en la semana"
          icon={<CalendarDays className="h-5 w-5" />}
          tone="emerald"
          loading={loading}
        />
        <StatCard
          title="Horas semanales"
          value={formatHours(metrics?.horasSemana ?? undefined)}
          description="Total acumulado según horario base"
          icon={<Clock4 className="h-5 w-5" />}
          tone="cyan"
          loading={loading}
        />
        <StatCard
          title="Próxima cita"
          value={metrics?.proximaCita ? dayjs(metrics.proximaCita).local().format("DD MMM • HH:mm") : "Sin citas"}
          description={`${metrics?.citasProximas ?? 0} cita(s) pendientes`}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="violet"
          loading={loading}
        />
        <StatCard
          title="Bloqueos próximos"
          value={metrics ? String(metrics.bloquesProximos) : "0"}
          description={metrics?.proximoBloqueo ? `Próximo: ${dayjs(metrics.proximoBloqueo).local().format("DD MMM • HH:mm")}` : "Sin bloqueos"}
          icon={<Clock4 className="h-5 w-5" />}
          tone="amber"
          loading={loading}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,_2fr)_minmax(320px,_1fr)]">
        <div className="space-y-6">
          <BarberoHorarioManager
            barberoId={selectedId}
            initialHorario={resumen?.horario}
            onSaved={() => handleRefresh()}
            disabled={loading}
          />
          <BarberoBloqueosManager
            ref={bloqueosRef}
            barberoId={selectedId}
            onChanged={() => handleRefresh()}
            disabled={loading}
          />
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold text-white">Próximas citas</h3>
            <ul className="mt-4 space-y-3">
              {!resumen || resumen.proximasCitas.length === 0 ? (
                <li className="text-sm text-zinc-400">Sin citas próximas</li>
              ) : (
                resumen.proximasCitas.map((cita) => (
                  <li key={cita.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                    <p className="font-medium text-white">{cita.servicioNombre ?? "Servicio"}</p>
                    <p className="text-xs text-emerald-200">{formatInstant(cita.inicio)}</p>
                    <p className="mt-1 text-xs text-zinc-400">Cliente: {cita.clienteNombre}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-sm font-semibold text-white">Bloqueos próximos</h3>
            <ul className="mt-4 space-y-3">
              {!resumen || resumen.proximosBloqueos.length === 0 ? (
                <li className="text-sm text-zinc-400">Sin bloqueos próximos</li>
              ) : (
                resumen.proximosBloqueos.map((bloqueo) => (
                  <li key={bloqueo.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                    <p className="font-medium text-white">{formatInstant(bloqueo.inicio)}</p>
                    <p className="text-xs text-emerald-200">hasta {formatInstant(bloqueo.fin)}</p>
                    <p className="mt-1 text-xs text-zinc-400">{bloqueo.motivo ?? "Sin motivo"}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
