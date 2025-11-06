import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarClock, CheckCircle2, Scissors, UserRound } from "lucide-react";

import { createCita } from "@/api/citas";
import type { CitaSaveReq } from "@/api/citas/types";
import { listBarberosLite, type BarberoLite } from "@/api/barberos";
import BookingDateStep from "@/components/booking/BookingDateStep";
import { listServicios, type ServicioDTO } from "@/api/servicios/services";
import { localInputToIso } from "@/lib/datetime";
import { useAuth } from "@/stores/auth";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function StepCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6 shadow-[0_18px_45px_-35px_rgba(16,185,129,0.6)]">
      <div className="mb-4 flex items-start gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          {step}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function BookingPage() {
  const navigate = useNavigate();
  const user = useAuth((state) => state.user);
  const roles = user?.roles ?? [];
  const puedeEditarDatosCliente = roles.includes("ADMIN") || roles.includes("BARBERO");
  const sessionNombre = (user?.nombre ?? "").trim();
  const sessionTel = (user?.telefonoE164 ?? "").trim();

  const [servicios, setServicios] = useState<ServicioDTO[]>([]);
  const [barberos, setBarberos] = useState<BarberoLite[]>([]);
  const [catalogosCargando, setCatalogosCargando] = useState(true);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);

  const [servicioId, setServicioId] = useState<number | "">("");
  const [barberoId, setBarberoId] = useState<number | "">("");
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hhmm, setHhmm] = useState<string>("");

  const [nombre, setNombre] = useState(sessionNombre);
  const [tel, setTel] = useState(sessionTel);
  const [submitting, setSubmitting] = useState(false);

  const allowNombreOverride = puedeEditarDatosCliente || !sessionNombre;
  const allowTelOverride = puedeEditarDatosCliente || !sessionTel;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCatalogosCargando(true);
      setCatalogosError(null);
      try {
        const [sv, bs] = await Promise.all([
          listServicios({ page: 0, size: 500, sort: "nombre,asc", soloActivos: true }),
          listBarberosLite(),
        ]);
        const serviciosData = ((sv as any).data?.content ?? (sv as any)?.content ?? []) as ServicioDTO[];
        if (!Array.isArray(serviciosData)) {
          throw new Error("Respuesta inesperada del catálogo de servicios");
        }
        if (mounted) {
          setServicios(serviciosData);
          setBarberos(Array.isArray(bs) ? bs : []);
        }
      } catch (error) {
        console.error(error);
        const message = "No se pudieron cargar los catálogos iniciales";
        if (mounted) setCatalogosError(message);
        toast.error(message);
      } finally {
        if (mounted) setCatalogosCargando(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setNombre((prev) => {
      if (!allowNombreOverride) return sessionNombre;
      if (!prev && sessionNombre) return sessionNombre;
      return prev;
    });
  }, [allowNombreOverride, sessionNombre]);

  useEffect(() => {
    setTel((prev) => {
      if (!allowTelOverride) return sessionTel;
      if (!prev && sessionTel) return sessionTel;
      return prev;
    });
  }, [allowTelOverride, sessionTel]);

  const selectedServicio = useMemo(
    () => (servicioId ? servicios.find((s) => s.id === servicioId) : undefined),
    [servicioId, servicios],
  );
  const selectedBarbero = useMemo(
    () => (barberoId ? barberos.find((b) => b.id === barberoId) : undefined),
    [barberoId, barberos],
  );

  const puedeConfirmar = Boolean(servicioId && barberoId && fecha && hhmm && (sessionNombre || nombre.trim()));
  const precioCentavos = selectedServicio?.precioCentavos ?? 0;
  const duracion = selectedServicio?.duracionMin ?? null;

  const reservar = async () => {
    if (submitting) return;
    try {
      if (!user) {
        toast.error("Debes iniciar sesión para reservar");
        return;
      }
      if (!servicioId || !barberoId) {
        toast.error("Selecciona servicio y barbero");
        return;
      }
      if (!fecha || !hhmm) {
        toast.error("Elige una fecha y horario disponibles");
        return;
      }

      const nombreTrim = nombre.trim();
      if (!sessionNombre && !nombreTrim) {
        toast.error("Ingresa tu nombre");
        return;
      }

      const iso = localInputToIso(`${fecha}T${hhmm}:00`);
      const body: CitaSaveReq = {
        barberoId: Number(barberoId),
        servicioId: Number(servicioId),
        inicio: iso,
        overrideDuracionMin: null,
        overridePrecioCentavos: null,
        notas: null,
      };

      if (nombreTrim && (!sessionNombre || nombreTrim !== sessionNombre)) {
        body.clienteNombre = nombreTrim;
      }

      const telTrim = tel.trim();
      if (telTrim && (!sessionTel || telTrim !== sessionTel)) {
        body.clienteTelE164 = telTrim;
      } else if (!telTrim && !sessionTel && allowTelOverride) {
        body.clienteTelE164 = null;
      }

      setSubmitting(true);
      await createCita(body);
      toast.success("Cita reservada correctamente");
      setHhmm("");
      setFecha(new Date().toISOString().slice(0, 10));
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message ?? error?.message ?? "No se pudo reservar";
      if (status === 412) {
        const faltantes = Array.isArray(error?.response?.data?.camposFaltantes)
          ? (error.response.data.camposFaltantes as string[])
          : undefined;
        const detalle = faltantes?.length ? `Faltan: ${faltantes.join(", ")}` : undefined;
        toast.error(detalle ? `Completa tu perfil. ${detalle}` : "Completa tu perfil antes de reservar");
        navigate("/perfil/completar", {
          replace: false,
          state: { from: { pathname: "/booking" }, faltantes },
        });
        return;
      }
      if (String(msg).toLowerCase().includes("empalm")) {
        toast.error("Ese horario se empalmó, intenta otro");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container space-y-8 py-8">
      <header className="space-y-2">
        <p className="text-sm text-emerald-300">Agenda sin fricción</p>
        <h1 className="text-3xl font-semibold text-white">Reserva tu próxima cita</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Elige servicio, barbero y horario en pocos pasos. Confirmaremos tu reserva y enviaremos recordatorios automáticos para que nadie olvide su cita.
        </p>
      </header>

      {catalogosError ? (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {catalogosError}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr,1.1fr]">
        <div className="space-y-5">
          <StepCard
            step={1}
            title="Selecciona el servicio"
            description="Define el tipo de atención que necesitas para calcular duración y precio."
          >
            <div>
              <label className="mb-1 block text-sm text-white/70" htmlFor="servicio">
                Servicio
              </label>
              <select
                id="servicio"
                value={servicioId}
                disabled={catalogosCargando}
                onChange={(e) => setServicioId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">— Selecciona —</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {selectedServicio?.descripcion ? (
                <p className="mt-2 flex items-center gap-2 text-xs text-white/60">
                  <Scissors className="h-4 w-4 text-emerald-300" />
                  {selectedServicio.descripcion}
                </p>
              ) : null}
            </div>
          </StepCard>

          <StepCard
            step={2}
            title="Elige al barbero"
            description="Selecciona quién atenderá la cita según disponibilidad y especialidad."
          >
            <div>
              <label className="mb-1 block text-sm text-white/70" htmlFor="barbero">
                Barbero
              </label>
              <select
                id="barbero"
                value={barberoId}
                disabled={catalogosCargando}
                onChange={(e) => setBarberoId(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">— Selecciona —</option>
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          </StepCard>

          <StepCard
            step={3}
            title="Define fecha y horario"
            description="Explora la agenda disponible en tiempo real y confirma el bloque ideal."
          >
            <BookingDateStep
              barberoId={Number(barberoId) || 0}
              servicioId={Number(servicioId) || 0}
              fecha={fecha}
              onFechaChange={setFecha}
              onPickSlot={setHhmm}
              selectedSlot={hhmm}
            />
            {hhmm ? (
              <p className="flex items-center gap-2 text-sm text-emerald-300">
                <CalendarClock className="h-4 w-4" /> Seleccionado: {fecha} · {hhmm}
              </p>
            ) : null}
          </StepCard>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <UserRound className="h-5 w-5 text-emerald-300" /> Tus datos
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Estos datos se usarán para confirmar y notificar la cita. Puedes actualizarlos desde tu perfil.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70" htmlFor="nombre">
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  readOnly={!allowNombreOverride && !!sessionNombre}
                  disabled={!allowNombreOverride && !!sessionNombre}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {!allowNombreOverride && sessionNombre ? (
                  <p className="mt-1 text-xs text-white/50">Se toma de tu perfil. Actualízalo desde "Completar perfil".</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/70" htmlFor="telefono">
                  Teléfono (formato E.164)
                </label>
                <input
                  id="telefono"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  readOnly={!allowTelOverride && !!sessionTel}
                  disabled={!allowTelOverride && !!sessionTel}
                  placeholder="+525512345678"
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {!allowTelOverride && sessionTel ? (
                  <p className="mt-1 text-xs text-white/50">Usaremos el teléfono verificado de tu perfil.</p>
                ) : (
                  <p className="mt-1 text-xs text-white/50">Incluye el prefijo internacional. Ejemplo: +525512345678.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-sm text-white/70">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" /> Resumen de la cita
            </h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start justify-between gap-4">
                <span className="text-white/60">Servicio</span>
                <span className="text-right text-white">{selectedServicio?.nombre ?? "—"}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span className="text-white/60">Profesional</span>
                <span className="text-right text-white">{selectedBarbero?.nombre ?? "—"}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span className="text-white/60">Duración</span>
                <span className="text-right text-white">{duracion ? `${duracion} min` : "—"}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span className="text-white/60">Horario</span>
                <span className="text-right text-white">{hhmm ? `${fecha} · ${hhmm}` : "—"}</span>
              </li>
              <li className="flex items-start justify-between gap-4 border-t border-white/10 pt-3 text-base font-semibold text-white">
                <span>Total</span>
                <span>{currencyFormatter.format(precioCentavos / 100)}</span>
              </li>
            </ul>
            <button
              onClick={reservar}
              disabled={!puedeConfirmar || submitting}
              className="mt-5 w-full rounded-xl border border-emerald-500 bg-emerald-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Reservando…" : "Confirmar cita"}
            </button>
            <p className="mt-2 text-xs text-white/50">
              Recibirás un correo y notificación SMS (si está disponible) con la confirmación.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
