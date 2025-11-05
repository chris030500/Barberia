import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createCita, updateCita } from "@/api/citas";
import type { CitaDTO, CitaSaveReq } from "@/api/citas/types";
import { listBarberosLite, type BarberoLite } from "@/api/barberos";
import { listServicios } from "@/api/servicios/services";
import { getSlots, type SlotsResponse } from "@/api/agenda/agenda";
import { moneyMX } from "@/lib/money";

// helpers locales
function dateFromIsoLocal(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function hhmmFromIsoLocal(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function localDateAndTimeToIso(fechaYYYYMMDD: string, hhmm: string): string {
  return new Date(`${fechaYYYYMMDD}T${hhmm}:00`).toISOString();
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (c: CitaDTO) => void;
  editing?: CitaDTO | null;
};

type ServicioLite = {
  id: number;
  nombre: string;
  duracionMin: number;
  precioCentavos: number;
};

export default function CitaFormModal({ open, onClose, onSaved, editing }: Props) {
  const [barberos, setBarberos] = useState<BarberoLite[]>([]);
  const [servicios, setServicios] = useState<ServicioLite[]>([]);
  const [loading, setLoading] = useState(false);

  const [barberoId, setBarberoId] = useState<number | "">("");
  const [servicioId, setServicioId] = useState<number | "">("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelE164, setClienteTelE164] = useState("");

  // fecha + slot
  const [fecha, setFecha] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [overrideDuracionMin, setOverrideDuracionMin] = useState<number | "">("");
  const [overridePrecioCentavos, setOverridePrecioCentavos] = useState<number | "">("");
  const [notas, setNotas] = useState("");

  // cargar catálogos
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [bs, svPage] = await Promise.all([
          listBarberosLite(),
          listServicios({ page: 0, size: 500, sort: "nombre,asc", soloActivos: true }),
        ]);
        setBarberos(bs);
        setServicios(
          (svPage.content ?? []).map((s: any) => ({
            id: s.id,
            nombre: s.nombre,
            duracionMin: s.duracionMin,
            precioCentavos: s.precioCentavos,
          }))
        );
      } catch (e) {
        console.error(e);
        toast.error("No se pudo cargar catálogos");
      }
    })();
  }, [open]);

  // inicializar form
  useEffect(() => {
    if (!open) return;

    if (editing) {
      setBarberoId(editing.barberoId);
      setServicioId(editing.servicioId);
      setClienteNombre(editing.clienteNombre ?? "");
      setClienteTelE164(editing.clienteTelE164 ?? "");
      setFecha(dateFromIsoLocal(editing.inicio));
      setSlot(hhmmFromIsoLocal(editing.inicio));
      setOverrideDuracionMin("");
      setOverridePrecioCentavos("");
      setNotas(editing.notas ?? "");
    } else {
      setBarberoId("");
      setServicioId("");
      setClienteNombre("");
      setClienteTelE164("");
      const now = new Date();
      now.setSeconds(0, 0);
      const m = now.getMinutes();
      now.setMinutes(m - (m % 5));
      setFecha(dateFromIsoLocal(now.toISOString()));
      setSlot("");
      setOverrideDuracionMin("");
      setOverridePrecioCentavos("");
      setNotas("");
    }
  }, [open, editing]);

  const servicioSel = useMemo(
    () => servicios.find((s) => s.id === servicioId),
    [servicioId, servicios]
  );

  const precioPreview = useMemo(() => {
    const base = servicioSel?.precioCentavos ?? 0;
    const pv = typeof overridePrecioCentavos === "number" ? overridePrecioCentavos : base;
    return pv > 0 ? moneyMX(pv) : "—";
  }, [servicioSel, overridePrecioCentavos]);

  const durPreview = useMemo(() => {
    const base = servicioSel?.duracionMin ?? 0;
    const dv = typeof overrideDuracionMin === "number" ? overrideDuracionMin : base;
    return dv > 0 ? `${dv} min` : "—";
  }, [servicioSel, overrideDuracionMin]);

  // cargar slots
  useEffect(() => {
    const canFetch = !!barberoId && !!servicioId && !!fecha;
    if (!canFetch) {
      setSlots([]);
      setSlot("");
      return;
    }
    (async () => {
      setLoadingSlots(true);
      try {
        const data: SlotsResponse = await getSlots({
          barberoId: Number(barberoId),
          servicioId: Number(servicioId),
          fecha,
        });

        // admite tanto arreglo de strings ("HH:mm") como de objetos {inicio,fin}
        const disponibles: string[] = Array.isArray(data.slots)
          ? data.slots.map((s: any) => {
              if (typeof s === "string") return s;
              if (s?.inicio) return hhmmFromIsoLocal(s.inicio);
              return "";
            }).filter(Boolean)
          : [];

        setSlots(disponibles);
        setSlot((prev) => (prev && disponibles.includes(prev) ? prev : ""));
      } catch (e) {
        console.error(e);
        setSlots([]);
        setSlot("");
        toast.error("No se pudieron cargar horarios disponibles");
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [barberoId, servicioId, fecha]);

  // limpiar overrides al cambiar servicio
  useEffect(() => {
    setOverrideDuracionMin("");
    setOverridePrecioCentavos("");
  }, [servicioId]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberoId) return toast.error("Selecciona un barbero");
    if (!servicioId) return toast.error("Selecciona un servicio");
    if (!clienteNombre.trim()) return toast.error("Ingresa el nombre del cliente");
    if (!fecha) return toast.error("Selecciona la fecha");
    if (!slot) return toast.error("Selecciona un horario disponible");

    const body: CitaSaveReq = {
      barberoId: Number(barberoId),
      servicioId: Number(servicioId),
      clienteNombre: clienteNombre.trim(),
      clienteTelE164: clienteTelE164.trim() || null,
      inicio: localDateAndTimeToIso(fecha, slot),
      overrideDuracionMin: typeof overrideDuracionMin === "number" ? overrideDuracionMin : null,
      overridePrecioCentavos: typeof overridePrecioCentavos === "number" ? overridePrecioCentavos : null,
      notas: notas.trim() || null,
    };

    setLoading(true);
    try {
      const saved = editing
        ? await updateCita(editing.id, body)
        : await createCita(body);
      toast.success(editing ? "Cita actualizada" : "Cita creada");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        "No se pudo guardar la cita";
      if (String(msg).toLowerCase().includes("empalma") || String(msg).includes("ya tiene una cita")) {
        toast.error("Ese horario se empalma con otra cita del barbero.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl card-surface">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editing ? "Editar cita" : "Nueva cita"}</h3>
          <button onClick={onClose} className="btn btn-ghost h-9 px-3" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Barbero */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Barbero *</label>
            <select
              value={barberoId}
              onChange={(e) => setBarberoId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Servicio *</label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.duracionMin} min · {moneyMX(s.precioCentavos)}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Cliente *</label>
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Teléfono (E.164)</label>
              <input
                value={clienteTelE164}
                onChange={(e) => setClienteTelE164(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
                placeholder="+525512345678"
              />
            </div>
          </div>

          {/* Fecha + Slot */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Fecha *</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm text-zinc-400 mb-1">Horario *</label>
                {loadingSlots && <span className="text-xs text-zinc-500">Cargando…</span>}
              </div>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
                required
              >
                <option value="" disabled>
                  {slots.length ? "Selecciona…" : "No hay horarios disponibles"}
                </option>
                {slots.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Overrides + Previews */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Duración (min) <span className="text-zinc-600">(def: {servicioSel?.duracionMin ?? 0})</span>
              </label>
              <input
                type="number"
                min={1}
                placeholder={servicioSel ? `${servicioSel.duracionMin}` : "min"}
                value={typeof overrideDuracionMin === "number" ? overrideDuracionMin : ""}
                onChange={(e) => setOverrideDuracionMin(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              />
              <p className="mt-1 text-[11px] text-zinc-500">{durPreview}</p>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Precio (centavos) <span className="text-zinc-600">(def: {servicioSel?.precioCentavos ?? 0})</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder={servicioSel ? `${servicioSel.precioCentavos}` : "centavos"}
                value={typeof overridePrecioCentavos === "number" ? overridePrecioCentavos : ""}
                onChange={(e) => setOverridePrecioCentavos(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              />
              <p className="mt-1 text-[11px] text-zinc-500">{precioPreview}</p>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700 min-h-[72px]"
              placeholder="Preferencias, consideraciones…"
            />
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button disabled={loading || !slot} className="btn btn-brand">
              {loading ? "Guardando…" : editing ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}