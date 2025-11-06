import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import toast from "react-hot-toast";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import {
  createBloqueo,
  deleteBloqueo,
  listBloqueos,
  type Bloqueo,
} from "@/api/horario/bloqueos";

dayjs.extend(utc);

type RangeKey = "today" | "week" | "month";

const rangeOptions: { key: RangeKey; label: string; days: number }[] = [
  { key: "today", label: "Hoy", days: 1 },
  { key: "week", label: "7 días", days: 7 },
  { key: "month", label: "30 días", days: 30 },
];

type ModalState = {
  open: boolean;
  inicio: string;
  fin: string;
  motivo: string;
};

const defaultModal = (): ModalState => ({
  open: false,
  inicio: "",
  fin: "",
  motivo: "",
});

export type BarberoBloqueosManagerHandle = {
  openCreate: () => void;
  refresh: () => void;
};

type Props = {
  barberoId: number | null;
  onChanged?: () => void;
  disabled?: boolean;
};

export const BarberoBloqueosManager = forwardRef<BarberoBloqueosManagerHandle, Props>(
  ({ barberoId, onChanged, disabled }, ref) => {
    const [range, setRange] = useState<RangeKey>("week");
    const [rows, setRows] = useState<Bloqueo[]>([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<ModalState>(defaultModal);
    const [saving, setSaving] = useState(false);

    const isDisabled = !barberoId || disabled;

    const period = useMemo(() => {
      const now = dayjs();
      const start = now.startOf("day");
      const end = start.add(rangeOptions.find((r) => r.key === range)?.days ?? 7, "day");
      return { desde: start.toDate().toISOString(), hasta: end.toDate().toISOString() };
    }, [range]);

    const refresh = async () => {
      if (!barberoId) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const data = await listBloqueos(barberoId, period);
        setRows(data);
      } catch (err) {
        console.error(err);
        toast.error("No se pudo cargar los bloqueos");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [barberoId, range]);

    const openCreate = () => {
      if (!barberoId) {
        toast.error("Selecciona un barbero");
        return;
      }
      const start = dayjs().second(0).millisecond(0);
      setModal({
        open: true,
        inicio: start.toISOString().slice(0, 16),
        fin: start.add(1, "hour").toISOString().slice(0, 16),
        motivo: "",
      });
    };

    useImperativeHandle(ref, () => ({
      openCreate,
      refresh,
    }));

    const closeModal = () => setModal(defaultModal());

    const submitModal = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!barberoId) return;
      if (!modal.inicio || !modal.fin) {
        toast.error("Completa inicio y fin");
        return;
      }
      if (modal.fin <= modal.inicio) {
        toast.error("Fin debe ser mayor que inicio");
        return;
      }
      setSaving(true);
      try {
        await createBloqueo(barberoId, {
          inicio: new Date(modal.inicio).toISOString(),
          fin: new Date(modal.fin).toISOString(),
          motivo: modal.motivo.trim() || undefined,
        });
        toast.success("Bloqueo creado");
        closeModal();
        refresh();
        onChanged?.();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message ?? "No se pudo crear el bloqueo");
      } finally {
        setSaving(false);
      }
    };

    const remove = async (id: number) => {
      if (!barberoId) return;
      if (!confirm("¿Eliminar este bloqueo?")) return;
      try {
        await deleteBloqueo(barberoId, id);
        toast.success("Bloqueo eliminado");
        refresh();
        onChanged?.();
      } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message ?? "No se pudo eliminar");
      }
    };

    const fmt = (value: string) => dayjs(value).local().format("DD MMM YYYY • HH:mm");

    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-lg shadow-emerald-900/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200">
              Excepciones
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">Bloqueos y ausencias</h2>
            <p className="text-sm text-zinc-400">
              Define vacaciones, capacitaciones o mantenimientos especiales y mantenlos sincronizados con la agenda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rangeOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                className={`btn h-9 px-3 text-xs ${
                  range === opt.key
                    ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : "btn-ghost text-zinc-400"
                }`}
                disabled={loading}
              >
                {opt.label}
              </button>
            ))}
            <button
              className="btn btn-brand h-9 px-4 text-xs"
              onClick={openCreate}
              disabled={isDisabled}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo bloqueo
            </button>
          </div>
        </div>

        {!barberoId ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-neutral-900/40 p-6 text-center text-sm text-zinc-500">
            Selecciona un barbero para revisar bloqueos.
          </div>
        ) : rows.length === 0 && !loading ? (
          <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-zinc-400">
            No hay bloqueos en el rango seleccionado.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {loading ? (
              <li className="rounded-xl border border-zinc-800/80 bg-neutral-900/50 p-5 text-sm text-zinc-500">
                Cargando bloqueos…
              </li>
            ) : (
              rows.map((bloqueo) => (
                <li
                  key={bloqueo.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900/80 via-neutral-900/40 to-neutral-900/80 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 rounded-full bg-emerald-500/20 p-2 text-emerald-300">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{fmt(bloqueo.inicio)} → {fmt(bloqueo.fin)}</p>
                      <p className="text-xs text-zinc-400">
                        {bloqueo.motivo ? bloqueo.motivo : "Sin motivo registrado"}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost h-9 px-3 text-xs"
                    onClick={() => remove(bloqueo.id)}
                    disabled={isDisabled}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {modal.open && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur">
            <form onSubmit={submitModal} className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/90 p-6 space-y-4 shadow-xl shadow-emerald-900/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Nuevo bloqueo</h3>
                <button type="button" className="btn btn-ghost h-8 px-3" onClick={closeModal}>
                  Cerrar
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Inicio *</label>
                <input
                  type="datetime-local"
                  value={modal.inicio}
                  onChange={(e) => setModal((prev) => ({ ...prev, inicio: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fin *</label>
                <input
                  type="datetime-local"
                  value={modal.fin}
                  onChange={(e) => setModal((prev) => ({ ...prev, fin: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-500">Motivo</label>
                <input
                  value={modal.motivo}
                  onChange={(e) => setModal((prev) => ({ ...prev, motivo: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  placeholder="Vacaciones, comisión, mantenimiento…"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="btn btn-brand" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    );
  }
);

BarberoBloqueosManager.displayName = "BarberoBloqueosManager";
