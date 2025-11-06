import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarCheck, CalendarRange, LogOut, Sparkles, Users, Wallet } from "lucide-react";

import Button from "@/components/Button";
import { QuickActionCard } from "@/components/ui/QuickActionCard";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardResumen } from "@/api/analytics/services";
import type { DashboardResumen } from "@/api/analytics/types";
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
        toast.error("No se pudo cargar el resumen del día");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const nombre = useMemo(() => {
    const raw = user?.nombre?.trim();
    if (raw) return raw.split(" ")[0];
    if (user?.username) return user.username;
    return "usuario";
  }, [user?.nombre, user?.username]);

  type CardConfig = {
    title: string;
    value: string;
    description: string;
    tone: "emerald" | "cyan" | "violet";
    icon: JSX.Element;
    trend?: number | null;
    trendLabel?: string;
  };

  const statsCards: CardConfig[] = useMemo(() => [
    {
      title: "Citas de hoy",
      value: stats ? String(stats.citasHoy) : "--",
      description: "Reservas confirmadas para el día en curso.",
      tone: "emerald",
      icon: <CalendarCheck className="h-6 w-6" />,
    },
    {
      title: "Clientes activos",
      value: stats ? String(stats.clientesActivos) : "--",
      description: "Clientes con perfil completo listos para reservar.",
      tone: "cyan",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "Ingresos del mes",
      value: stats ? formatCurrency(stats.ingresosMesCentavos) : "--",
      description: "Total facturado por citas completadas este mes.",
      tone: "violet",
      icon: <Wallet className="h-6 w-6" />,
      trend: stats?.variacionIngresosPorcentual ?? null,
      trendLabel: "vs. mes anterior",
    },
  ], [stats]);

  const cancelacionesSemana = stats?.citasCanceladasSemana ?? 0;
  const reservasSemana = stats?.citasSemana ?? 0;
  const tasaCancelacion = reservasSemana === 0 ? 0 : Math.round((cancelacionesSemana / reservasSemana) * 100);

  return (
    <div className="app-container py-8 space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-slate-900 p-8">
        <div className="absolute -left-20 -top-24 h-60 w-60 rounded-full bg-emerald-500/30 blur-3xl" aria-hidden />
        <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              Agenda inteligente para barberías modernas
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              Hola {nombre} 👋
            </h1>
            <p className="max-w-xl text-base text-white/70">
              Controla tus citas, mantén tu agenda saludable y ofrece una experiencia impecable a cada cliente con recordatorios automáticos y datos accionables.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => navigate("/booking")}>
                Reservar nueva cita
              </Button>
              <Button variant="ghost" onClick={() => navigate("/citas")}>Ver agenda</Button>
              <Button variant="ghost" onClick={logout} className="gap-2 text-red-300 hover:text-red-200">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-5 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Salud de la semana</p>
            <div className="mt-3 flex items-end gap-4">
              <div>
                <p className="text-4xl font-semibold text-white">{reservasSemana || "--"}</p>
                <p className="text-xs text-white/50">Reservas confirmadas</p>
              </div>
              <div className="h-14 w-px bg-white/10" aria-hidden />
              <div>
                <p className="text-2xl font-medium text-white">{tasaCancelacion}%</p>
                <p className="text-xs text-white/50">Cancelaciones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              tone={card.tone}
              icon={card.icon}
              loading={loading}
              trend={card.trend as number | null | undefined}
              trendLabel={card.trendLabel}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickActionCard
          to="/booking"
          title="Agendar en segundos"
          description="Selecciona servicio, barbero y horario disponible en una sola vista."
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="emerald"
        />
        <QuickActionCard
          to="/citas"
          title="Revisa tu agenda"
          description="Confirma, edita o cancela citas desde una vista centralizada."
          icon={<CalendarRange className="h-5 w-5" />}
          tone="cyan"
        />
        <QuickActionCard
          to="/perfil/completar"
          title="Mantén tu perfil al día"
          description="Actualiza datos de contacto para garantizar notificaciones sin fricción."
          icon={<Sparkles className="h-5 w-5" />}
          tone="violet"
        />
      </section>
    </div>
  );
}
