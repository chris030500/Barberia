import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlarmClock,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Clock4,
  LogOut,
  PhoneCall,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import Button from "@/components/Button";
import { QuickActionCard } from "@/components/ui/QuickActionCard";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardResumen } from "@/api/analytics/services";
import type {
  BarberoProximaCita,
  DashboardAdminMetrics,
  DashboardBarberoMetrics,
  DashboardClienteMetrics,
  DashboardResumen,
  DashboardRole,
} from "@/api/analytics/types";
import { useAuth } from "@/stores/auth";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function formatCurrency(centavos?: number | null) {
  if (!centavos || Number.isNaN(centavos)) return "$0";
  return currencyFormatter.format(centavos / 100);
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function formatTimeRange(proxima: BarberoProximaCita) {
  const inicio = new Date(proxima.inicio).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const fin = new Date(proxima.fin).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  return `${inicio} – ${fin}`;
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getDashboardResumen();
        if (mounted) setStats(data);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo cargar el panel");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const nombrePreferido = useMemo(() => {
    const raw = user?.nombre?.trim();
    if (raw) return raw.split(" ")[0];
    if (user?.username?.trim()) return user.username;
    if (user?.email?.trim()) return user.email.split("@")[0];
    return "invitado";
  }, [user?.nombre, user?.username, user?.email]);

  const role: DashboardRole = useMemo(() => {
    if (stats?.role) return stats.role;
    const roles = user?.roles ?? [];
    if (roles.includes("ADMIN")) return "ADMIN";
    if (roles.includes("BARBERO")) return "BARBERO";
    return "CLIENTE";
  }, [stats?.role, user?.roles]);

  return (
    <div className="app-container py-8 space-y-10">
      {role === "ADMIN" && stats?.admin ? (
        <AdminDashboard
          metrics={stats.admin}
          navigate={navigate}
          logout={logout}
          nombre={nombrePreferido}
          loading={loading}
        />
      ) : null}

      {role === "BARBERO" && stats?.barbero ? (
        <BarberoDashboardView
          metrics={stats.barbero}
          nombre={nombrePreferido}
          loading={loading}
          onIrAgenda={() => navigate("/citas")}
        />
      ) : null}

      {role === "CLIENTE" && stats?.cliente ? (
        <ClienteDashboardView
          metrics={stats.cliente}
          nombre={nombrePreferido}
          loading={loading}
          onReservar={() => navigate("/booking")}
          onPerfil={() => navigate("/perfil/completar")}
        />
      ) : null}

      {!stats && loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-36 rounded-2xl border border-white/5 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type AdminDashboardProps = {
  metrics: DashboardAdminMetrics;
  nombre: string;
  navigate: ReturnType<typeof useNavigate>;
  logout: () => Promise<void>;
  loading: boolean;
};

function AdminDashboard({ metrics, nombre, navigate, logout, loading }: AdminDashboardProps) {
  const cancelacionesSemana = metrics.citasCanceladasSemana;
  const reservasSemana = metrics.citasSemana || 1;
  const tasaCancelacion = Math.round((cancelacionesSemana / reservasSemana) * 100);

  const cards = [
    {
      title: "Citas de hoy",
      value: String(metrics.citasHoy),
      description: "Reservas confirmadas para el día en curso.",
      tone: "emerald" as const,
      icon: <CalendarCheck className="h-6 w-6" />,
    },
    {
      title: "Clientes activos",
      value: String(metrics.clientesActivos),
      description: "Perfiles listos para reservar.",
      tone: "cyan" as const,
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Ingresos del mes",
      value: formatCurrency(metrics.ingresosMesCentavos),
      description: "Citas completadas en el mes.",
      tone: "violet" as const,
      icon: <Wallet className="h-6 w-6" />,
      trend: metrics.variacionIngresosPorcentual,
      trendLabel: "vs mes anterior",
    },
  ];

  return (
    <Fragment>
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-600/10 via-slate-900 to-slate-950 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),transparent_60%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" /> Panel ejecutivo
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Hola {nombre}, tu barbería está brillando ✨
            </h1>
            <p className="max-w-2xl text-sm text-white/70">
              Visualiza el pulso del negocio en tiempo real y actúa rápido frente a cancelaciones, nuevas altas o picos de demanda.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button onClick={() => navigate("/citas")}>Ver agenda completa</Button>
              <Button variant="ghost" onClick={() => navigate("/servicios")}>Gestionar servicios</Button>
              <Button variant="ghost" className="gap-2 text-red-300 hover:text-red-200" onClick={logout}>
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-sm text-white/70 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Salud semanal</p>
            <div className="mt-3 grid grid-cols-2 gap-5">
              <div>
                <p className="text-4xl font-semibold text-white">{metrics.citasSemana}</p>
                <p className="text-xs text-white/50">Reservas confirmadas</p>
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{tasaCancelacion}%</p>
                <p className="text-xs text-white/50">Cancelaciones</p>
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{metrics.nuevosClientesSemana}</p>
                <p className="text-xs text-white/50">Clientes nuevos</p>
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{metrics.serviciosActivos}</p>
                <p className="text-xs text-white/50">Servicios activos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              tone={card.tone}
              icon={card.icon}
              loading={loading}
              trend={card.trend}
              trendLabel={card.trendLabel}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickActionCard
          to="/barberos"
          title="Optimiza tu equipo"
          description="Gestiona barberos, horarios y disponibilidad en un solo lugar."
          icon={<UserCheck className="h-5 w-5" />}
          tone="emerald"
        />
        <QuickActionCard
          to="/servicios"
          title="Actualiza servicios"
          description="Define precios, duración y especialidades de cada servicio."
          icon={<BarChart3 className="h-5 w-5" />}
          tone="cyan"
        />
        <QuickActionCard
          to="/citas"
          title="Agenda inteligente"
          description="Confirma, reprograma o cancela citas en segundos."
          icon={<CalendarRange className="h-5 w-5" />}
          tone="violet"
        />
        <QuickActionCard
          to="/perfil/completar"
          title="Configura tu marca"
          description="Mantén los datos corporativos al día para compartir con tu equipo."
          icon={<Sparkles className="h-5 w-5" />}
          tone="slate"
        />
      </section>
    </Fragment>
  );
}

type BarberoDashboardProps = {
  metrics: DashboardBarberoMetrics;
  nombre: string;
  loading: boolean;
  onIrAgenda: () => void;
};

function BarberoDashboardView({ metrics, nombre, loading, onIrAgenda }: BarberoDashboardProps) {
  return (
    <Fragment>
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-950 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.2),transparent_60%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 text-sm text-sky-200">
              <Clock4 className="h-4 w-4" /> Agenda personal
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Bienvenido, {nombre}. Hoy tienes {metrics.citasHoy} citas ✂️
            </h1>
            <p className="max-w-2xl text-sm text-white/70">
              Mantén tu jornada en orden, consulta los próximos clientes y revisa cuánto has generado en el mes.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button onClick={onIrAgenda}>Ver mi agenda</Button>
              <Button variant="ghost" onClick={() => onIrAgenda()}>Gestionar citas</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-sm text-white/70 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Resumen rápido</p>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Citas completadas (mes)</span>
                <span className="text-white text-lg font-semibold">{metrics.citasCompletadasMes}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Ingresos estimados</span>
                <span className="text-white text-lg font-semibold">{formatCurrency(metrics.ingresosMesCentavos)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Cancelaciones semana</span>
                <span className="text-white text-lg font-semibold">{metrics.citasCanceladasSemana}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Citas de hoy"
          value={String(metrics.citasHoy)}
          description="Clientes confirmados para tu jornada."
          tone="emerald"
          icon={<CalendarDays className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Citas esta semana"
          value={String(metrics.citasSemana)}
          description="Incluye reservas futuras ya confirmadas."
          tone="cyan"
          icon={<CalendarRange className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Ingresos proyectados"
          value={formatCurrency(metrics.ingresosMesCentavos)}
          description="Citas completadas en el mes."
          tone="violet"
          icon={<TrendingUp className="h-6 w-6" />}
          loading={loading}
        />
      </section>

      <section className="rounded-3xl border border-white/5 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Próximas citas</h2>
            <p className="text-sm text-white/60">Las siguientes tres reservas agendadas para ti.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {metrics.proximasCitas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
              Sin citas próximas. ¡Aprovecha para descansar o promover tus servicios!
            </div>
          ) : (
            metrics.proximasCitas.map((cita) => (
              <div
                key={cita.citaId}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-white/60">{formatDateTime(cita.inicio)}</p>
                  <p className="text-lg font-semibold text-white">{cita.cliente}</p>
                  <p className="text-sm text-white/70">{cita.servicio}</p>
                </div>
                <div className="rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1 text-xs text-sky-200">
                  {formatTimeRange(cita)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </Fragment>
  );
}

type ClienteDashboardProps = {
  metrics: DashboardClienteMetrics;
  nombre: string;
  loading: boolean;
  onReservar: () => void;
  onPerfil: () => void;
};

function ClienteDashboardView({ metrics, nombre, loading, onReservar, onPerfil }: ClienteDashboardProps) {
  const proxima = metrics.proximaCita;
  const ultima = metrics.ultimaCita;

  return (
    <Fragment>
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-950 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.16),transparent_65%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" /> Experiencia personalizada
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Hola {nombre}, {proxima ? "tu próxima cita está lista" : "agenda tu siguiente look"}
            </h1>
            <p className="max-w-2xl text-sm text-white/70">
              Gestiona tus reservas, mantén tu perfil actualizado y recibe recordatorios automáticos para no perder ningún turno.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button onClick={onReservar}>
                {proxima ? "Ver disponibilidad" : "Reservar cita"}
              </Button>
              {!metrics.perfilCompleto ? (
                <Button variant="ghost" onClick={onPerfil} className="gap-2 text-amber-200 hover:text-amber-100">
                  <PhoneCall className="h-4 w-4" /> Completar perfil
                </Button>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 text-sm text-white/70 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Mi historial</p>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Reservas activas</span>
                <span className="text-white text-lg font-semibold">{metrics.citasPendientes}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Citas completadas</span>
                <span className="text-white text-lg font-semibold">{metrics.citasHistoricas}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/60">Teléfono verificado</span>
                <span className="text-white text-lg font-semibold">{metrics.telefonoVerificado ? "Sí" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Reservas activas"
          value={String(metrics.citasPendientes)}
          description="Citas agendadas pendientes de atención."
          tone="emerald"
          icon={<AlarmClock className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Citas completadas"
          value={String(metrics.citasHistoricas)}
          description="Historial total de visitas en la barbería."
          tone="cyan"
          icon={<CalendarCheck className="h-6 w-6" />}
          loading={loading}
        />
        <StatCard
          title="Perfil completo"
          value={metrics.perfilCompleto ? "Sí" : "No"}
          description={metrics.perfilCompleto ? "Recibirás notificaciones sin contratiempos." : "Necesitamos tus datos para confirmar citas."}
          tone={metrics.perfilCompleto ? "violet" : "amber"}
          icon={<UserCheck className="h-6 w-6" />}
          loading={loading}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-lg font-semibold text-white">Próxima cita</h2>
          <p className="text-sm text-white/60">Detalles de tu siguiente reservación confirmada.</p>
          <div className="mt-4">
            {proxima ? (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-5 text-white">
                <p className="text-sm text-white/70">{formatDateTime(proxima.inicio)}</p>
                <h3 className="mt-1 text-xl font-semibold">{proxima.servicio}</h3>
                <p className="text-sm text-white/70">Con {proxima.barbero}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                Aún no tienes citas activas. Agenda ahora y recibe recordatorios automáticos.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Última visita</h2>
          <p className="text-sm text-white/60">Consulta el servicio más reciente realizado.</p>
          <div className="mt-4">
            {ultima ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-white">
                <p className="text-sm text-white/60">{formatDateTime(ultima.inicio)}</p>
                <h3 className="mt-1 text-lg font-semibold">{ultima.servicio}</h3>
                <p className="text-sm text-white/70">Atendido por {ultima.barbero}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                Aún no registramos servicios completados. Agenda tu primera cita para comenzar tu historial.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickActionCard
          to="/booking"
          title="Reserva en segundos"
          description="Elige servicio, profesional y horario disponible."
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="emerald"
        />
        <QuickActionCard
          to="/perfil/completar"
          title="Actualiza tu contacto"
          description="Mantén tu teléfono verificado para recibir avisos."
          icon={<PhoneCall className="h-5 w-5" />}
          tone="cyan"
        />
        <QuickActionCard
          to="/citas"
          title="Gestiona tus citas"
          description="Consulta historial y cancelaciones desde un lugar."
          icon={<CalendarRange className="h-5 w-5" />}
          tone="violet"
        />
      </section>
    </Fragment>
  );
}
