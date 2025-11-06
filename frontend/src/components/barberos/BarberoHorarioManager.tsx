import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, RotateCcw } from "lucide-react";
import { getHorario, saveHorario, type HorarioDia } from "@/api/horario/horario-semanal";

const DOW_LABEL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function createDefaultSemana(): HorarioDia[] {
  return Array.from({ length: 7 }).map((_, dow) => ({
    dow,
    activo: dow >= 1 && dow <= 5,
    desde: "10:00",
    hasta: "19:00",
  }));
}

function normalizeSemana(items: HorarioDia[] | undefined | null): HorarioDia[] {
  const map = new Map<number, HorarioDia>();
  if (items) {
    for (const item of items) {
      map.set(item.dow, {
        id: item.id,
        dow: item.dow,
        activo: !!item.activo,
        desde: item.desde ?? "10:00",
        hasta: item.hasta ?? "19:00",
      });
    }
  }
  return Array.from({ length: 7 }).map((_, dow) => (
    map.get(dow) ?? { dow, activo: false, desde: "10:00", hasta: "19:00" }
  ));
}

function formatResumen(dia: HorarioDia) {
  if (!dia.activo) return "Sin disponibilidad";
  return `${dia.desde} – ${dia.hasta}`;
}

type Props = {
  barberoId: number | null;
  initialHorario?: HorarioDia[];
  onSaved?: (horario: HorarioDia[]) => void;
  disabled?: boolean;
};

export function BarberoHorarioManager({ barberoId, initialHorario, onSaved, disabled }: Props) {
  const [dias, setDias] = useState<HorarioDia[]>(createDefaultSemana());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!barberoId) {
      setDias(createDefaultSemana());
      setTouched(false);
      return;
    }
    if (initialHorario) {
      setDias(normalizeSemana(initialHorario));
      setTouched(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const data = await getHorario(barberoId);
        setDias(normalizeSemana(data));
        setTouched(false);
      } catch (err) {
        console.error(err);
        toast.error("No se pudo obtener el horario");
      } finally {
        setLoading(false);
      }
    })();
  }, [barberoId, initialHorario]);

  const isDisabled = !barberoId || disabled;

  const resumenSemana = useMemo(() =>
    dias.filter((d) => d.activo).length
  , [dias]);

  const actualizarDia = (dow: number, patch: Partial<HorarioDia>) => {
    setDias((prev) => {
      setTouched(true);
      return prev.map((d) => (d.dow === dow ? { ...d, ...patch } : d));
    });
  };

  const aplicarATodos = (dow: number) => {
    const origen = dias.find((d) => d.dow === dow);
    if (!origen) return;
    setDias((prev) => prev.map((d) => (
      d.dow === dow
        ? d
        : { ...d, activo: origen.activo, desde: origen.desde, hasta: origen.hasta }
    )));
    setTouched(true);
    toast.success("Horario replicado al resto de la semana");
  };

  const reset = () => {
    if (initialHorario) {
      setDias(normalizeSemana(initialHorario));
    } else {
      setDias(createDefaultSemana());
    }
    setTouched(false);
  };

  const onSave = async () => {
    if (!barberoId) return;
    setSaving(true);
    try {
      const payload = dias.map((d) => ({
        dow: d.dow,
        activo: !!d.activo,
        desde: d.desde,
        hasta: d.hasta,
      }));
      const updated = await saveHorario(barberoId, payload);
      setDias(normalizeSemana(updated));
      setTouched(false);
      toast.success("Horario guardado");
      onSaved?.(updated);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur shadow-lg shadow-emerald-900/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200">
            Agenda base
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">Horario semanal</h2>
          <p className="text-sm text-zinc-400">
            Ajusta los bloques recurrentes del barbero y mantén la operación sincronizada con la demanda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {barberoId ? `${resumenSemana} día(s) activos` : "Sin selección"}
          </span>
          <button
            className="btn btn-ghost h-10 px-3 text-xs"
            onClick={() => aplicarATodos(1)}
            disabled={isDisabled || loading}
            title="Copiar el lunes al resto de días"
          >
            <Copy className="mr-2 h-4 w-4" /> Copiar lunes
          </button>
          <button
            className="btn btn-ghost h-10 px-3 text-xs"
            onClick={reset}
            disabled={loading}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Restablecer
          </button>
        </div>
      </div>

      {!barberoId ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-neutral-900/40 p-6 text-center text-sm text-zinc-500">
          Selecciona un barbero para gestionar su disponibilidad.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="hidden md:grid md:grid-cols-[160px_120px_160px_160px_1fr] md:bg-white/5 md:text-xs md:uppercase md:text-zinc-500">
            <div className="px-5 py-3 tracking-[0.2em]">Día</div>
            <div className="px-5 py-3 tracking-[0.2em]">Activo</div>
            <div className="px-5 py-3 tracking-[0.2em]">Desde</div>
            <div className="px-5 py-3 tracking-[0.2em]">Hasta</div>
            <div className="px-5 py-3 tracking-[0.2em]">Resumen</div>
          </div>

          {dias.map((dia) => (
            <div
              key={dia.dow}
              className="grid grid-cols-1 gap-4 border-t border-white/10 bg-neutral-900/30 p-4 text-sm transition hover:bg-neutral-900/60 md:grid-cols-[160px_120px_160px_160px_1fr] md:items-center md:gap-0 md:p-0"
            >
              <div className="px-5 py-4 font-medium text-white">
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${dia.activo ? "bg-emerald-400" : "bg-zinc-600"}`}
                  />
                  {DOW_LABEL[dia.dow]}
                </span>
              </div>
              <div className="px-5 py-4">
                <label className="inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-zinc-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500"
                    checked={!!dia.activo}
                    onChange={(e) => actualizarDia(dia.dow, { activo: e.target.checked })}
                    disabled={isDisabled || loading}
                  />
                  Disponible
                </label>
              </div>
              <div className="px-5 py-4">
                <input
                  type="time"
                  value={dia.desde}
                  onChange={(e) => actualizarDia(dia.dow, { desde: e.target.value })}
                  disabled={!dia.activo || isDisabled || loading}
                  className="w-full rounded-lg border border-zinc-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500 focus:ring-0"
                />
              </div>
              <div className="px-5 py-4">
                <input
                  type="time"
                  value={dia.hasta}
                  onChange={(e) => actualizarDia(dia.dow, { hasta: e.target.value })}
                  disabled={!dia.activo || isDisabled || loading}
                  className="w-full rounded-lg border border-zinc-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-emerald-500 focus:ring-0"
                />
              </div>
              <div className="px-5 py-4 text-sm text-zinc-400">{formatResumen(dia)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          {barberoId ? `${resumenSemana} día(s) activos` : "Sin barbero seleccionado"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={reset}
            disabled={loading || (!touched && !!initialHorario)}
          >
            Restablecer
          </button>
          <button
            className="btn btn-brand"
            onClick={onSave}
            disabled={isDisabled || saving || loading || !touched}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  );
}
