import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listServicios, type ServicioDTO } from "@/api/servicios/services";
import { listBarberosLite, type BarberoLite } from "@/api/barberos";
import BookingDateStep from "@/components/booking/BookingDateStep";
import { createCita } from "@/api/citas";
import type { CitaSaveReq } from "@/api/citas/types";
import toast from "react-hot-toast";
import { localInputToIso } from "@/lib/datetime";
import { useAuth } from "@/stores/auth";

export default function BookingPage() {
  const [servicios, setServicios] = useState<ServicioDTO[]>([]);
  const [barberos, setBarberos] = useState<BarberoLite[]>([]);
  const [servicioId, setServicioId] = useState<number | "">("");
  const [barberoId, setBarberoId] = useState<number | "">("");
  const [fecha, setFecha] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [hhmm, setHhmm] = useState<string>("");

  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const roles = user?.roles ?? [];
  const puedeEditarDatosCliente = roles.includes("ADMIN") || roles.includes("BARBERO");
  const sessionNombre = (user?.nombre ?? "").trim();
  const sessionTel = (user?.telefonoE164 ?? "").trim();

  // cliente
  const [nombre, setNombre] = useState(sessionNombre);
  const [tel, setTel] = useState(sessionTel);
  const [submitting, setSubmitting] = useState(false);

  const allowNombreOverride = puedeEditarDatosCliente || !sessionNombre;
  const allowTelOverride = puedeEditarDatosCliente || !sessionTel;

  useEffect(() => {
    (async () => {
      try {
        const [sv, bs] = await Promise.all([
          listServicios({
            page: 0,
            size: 500,
            sort: "nombre,asc",
            soloActivos: true,
          }),
          listBarberosLite(),
        ]);
        const arr = ((sv as any).data?.content ??
          (sv as any)?.content ??
          []) as ServicioDTO[];
        setServicios(arr);
        setBarberos(bs);
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar catálogos");
      }
    })();
  }, []);

  useEffect(() => {
    setNombre((prev) => {
      if (!allowNombreOverride) {
        return sessionNombre;
      }
      if (!prev && sessionNombre) {
        return sessionNombre;
      }
      return prev;
    });
  }, [allowNombreOverride, sessionNombre]);

  useEffect(() => {
    setTel((prev) => {
      if (!allowTelOverride) {
        return sessionTel;
      }
      if (!prev && sessionTel) {
        return sessionTel;
      }
      return prev;
    });
  }, [allowTelOverride, sessionTel]);

  const onPickSlot = (hhmmSel: string) => setHhmm(hhmmSel);

  const reservar = async () => {
    if (submitting) return;
    try {
      if (!user) return toast.error("Debes iniciar sesión para reservar");
      if (!servicioId) return toast.error("Selecciona un servicio");
      if (!barberoId) return toast.error("Selecciona un barbero");
      if (!fecha || !hhmm) return toast.error("Selecciona un horario");

      const nombreTrim = nombre.trim();
      if (!sessionNombre && !nombreTrim) {
        return toast.error("Ingresa tu nombre");
      }

      const iso = localInputToIso(`${fecha}T${hhmm}:00`);
      const body: CitaSaveReq = {
        barberoId: Number(barberoId),
        servicioId: Number(servicioId),
        inicio: iso,
        overrideDuracionMin: null,
        overridePrecioCentavos: null,
        notas: null
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
      toast.success("Cita reservada");
      // redirige o muestra confirmación
      setHhmm("");
      setFecha(new Date().toISOString().slice(0, 10));
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? e?.message ?? "No se pudo reservar";
      if (status === 412) {
        const faltantes = Array.isArray(e?.response?.data?.camposFaltantes)
          ? (e.response.data.camposFaltantes as string[])
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
    <div className="app-container py-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface">
          <h2 className="card-title mb-4">Reservar cita</h2>

          {/* Servicio */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Servicio</label>
            <select
              value={servicioId}
              onChange={(e) =>
                setServicioId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Barbero */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Barbero</label>
            <select
              value={barberoId}
              onChange={(e) =>
                setBarberoId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y slots */}
          {!!servicioId && !!barberoId && (
            <div className="mb-4">
              <BookingDateStep
                barberoId={Number(barberoId)}
                servicioId={Number(servicioId)}
                fecha={fecha}
                onFechaChange={setFecha}
                onPickSlot={onPickSlot}
              />
              {hhmm && (
                <p className="mt-2 text-sm text-emerald-400">
                  Seleccionado: {fecha} {hhmm}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card-surface">
          <h2 className="card-title mb-4">Tus datos</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nombre *</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                readOnly={!allowNombreOverride && !!sessionNombre}
                disabled={!allowNombreOverride && !!sessionNombre}
                placeholder="Tu nombre"
              />
              {!allowNombreOverride && sessionNombre && (
                <p className="mt-1 text-xs text-zinc-500">
                  Este dato proviene de tu perfil. Actualízalo en tu cuenta si necesitas cambiarlo.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Teléfono (E.164)</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                readOnly={!allowTelOverride && !!sessionTel}
                disabled={!allowTelOverride && !!sessionTel}
                placeholder="+5255..."
              />
              {!allowTelOverride && sessionTel && (
                <p className="mt-1 text-xs text-zinc-500">
                  Usaremos el teléfono de tu perfil para enviarte recordatorios.
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={reservar}
                className="btn btn-brand disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? "Reservando..." : "Reservar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
