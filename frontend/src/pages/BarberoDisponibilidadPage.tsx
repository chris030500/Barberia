import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  CalendarDays,
  Clock4,
  Phone,
  RefreshCw,
  Scissors,
  Sparkles,
} from "lucide-react";

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

  const loadingSkeleton = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );

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
    <div className="relative mx-auto max-w-7xl space-y-10 px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%)]" />
      <header className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-neutral-950 via-neutral-900/80 to-neutral-950 p-6 shadow-2xl shadow-emerald-900/30">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 rotate-6 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15),_transparent_65%)] opacity-60 lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-1">
              {resumen?.barbero.avatarUrl ? (
                <img
                  src={resumen.barbero.avatarUrl}
                  alt={resumen.barbero.nombre}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-900/70 text-3xl font-semibold text-emerald-200">
                  {resumen?.barbero.nombre?.slice(0, 1) ?? "B"}
                </div>
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                <Sparkles className="h-3 w-3" /> Módulo de barberos
              </span>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                {resumen?.barbero.nombre ?? "Selecciona un barbero"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Gestiona horarios, bloqueos y disponibilidad semanal con una vista moderna y simplificada.
              </p>
              {resumen?.barbero.descripcion ? (
                <p className="mt-2 max-w-2xl text-xs text-zinc-400">{resumen.barbero.descripcion}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                {resumen?.barbero.telefonoE164 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white">
                    <Phone className="h-4 w-4" /> {resumen.barbero.telefonoE164}
                  </span>
                ) : null}
                {servicioLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-emerald-100"
                  >
                    <Scissors className="h-3.5 w-3.5" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            {isAdmin ? (
              <label className="w-full text-sm text-zinc-300 lg:w-72">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Gestionar barbero</span>
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-xl border border-white/10 bg-neutral-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-0"
                >
                  <option value="">Selecciona barbero…</option>
                  {barberos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} {b.activo ? "" : "(inactivo)"}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                className="btn btn-ghost h-10 px-4 text-sm"
                onClick={() => bloqueosRef.current?.openCreate()}
                disabled={!selectedId}
              >
                <CalendarCheck className="mr-2 h-4 w-4" /> Nuevo bloqueo
              </button>
              <button
                className="btn btn-brand h-10 px-4 text-sm"
                onClick={handleRefresh}
                disabled={!selectedId}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Actualizar datos
              </button>
            </div>
          </div>
        </div>
      </header>

      {loading && !resumen ? (
        loadingSkeleton
      ) : (
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
            description={
              metrics?.proximoBloqueo
                ? `Próximo: ${dayjs(metrics.proximoBloqueo).local().format("DD MMM • HH:mm")}`
                : "Sin bloqueos"
            }
            icon={<Clock4 className="h-5 w-5" />}
            tone="amber"
            loading={loading}
          />
        </section>
      )}

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
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Próximas citas</h3>
              <span className="text-xs text-emerald-200">
                {metrics?.citasProximas ?? 0} agendadas
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {!resumen || resumen.proximasCitas.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-zinc-400">
                  Sin citas próximas
                </li>
              ) : (
                resumen.proximasCitas.map((cita, index) => (
                  <li
                    key={cita.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-900/40 to-neutral-900/80 p-4 text-sm text-white/80"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{cita.servicioNombre ?? "Servicio"}</p>
                        <p className="text-xs text-emerald-200">{formatInstant(cita.inicio)}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">#{index + 1}</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">Cliente: {cita.clienteNombre}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-sm font-semibold text-white">Bloqueos próximos</h3>
            <ul className="mt-4 space-y-3">
              {!resumen || resumen.proximosBloqueos.length === 0 ? (
                <li className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-center text-sm text-zinc-400">
                  Sin bloqueos próximos
                </li>
              ) : (
                resumen.proximosBloqueos.map((bloqueo) => (
                  <li
                    key={bloqueo.id}
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-900/40 to-neutral-900/80 p-4 text-sm text-white/80"
                  >
                    <p className="font-medium text-white">{formatInstant(bloqueo.inicio)}</p>
                    <p className="text-xs text-emerald-200">hasta {formatInstant(bloqueo.fin)}</p>
                    <p className="mt-1 text-xs text-zinc-400">{bloqueo.motivo ?? "Sin motivo"}</p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-sm text-emerald-100">
            <h3 className="text-sm font-semibold text-white">Consejo rápido</h3>
            <p className="mt-2 text-sm text-emerald-50/80">
              Mantén actualizado el horario semanal para evitar huecos y usa los bloqueos para comunicar vacaciones o ausencias en segundos.
            </p>
            <div className="mt-4 space-y-2 text-xs text-emerald-100/70">
              {[
                "Duplica horarios con un clic desde \"Copiar lunes\"",
                "Activa recordatorios creando bloqueos con anticipación",
                "Comparte el enlace del barbero con tus clientes habituales",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
