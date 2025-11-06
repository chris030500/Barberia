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
    <section className="rounded-2xl border border-zinc-800/80 bg-neutral-900/60 p-6 shadow-lg shadow-emerald-900/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Horario semanal</h2>
          <p className="text-sm text-zinc-400">
            Define las franjas recurrentes en las que el barbero ofrece citas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800/80">
          <div className="hidden md:grid md:grid-cols-[160px_120px_160px_160px_1fr] md:gap-0 md:bg-neutral-900/70 md:text-xs md:uppercase md:text-zinc-500">
            <div className="px-5 py-3">Día</div>
            <div className="px-5 py-3">Activo</div>
            <div className="px-5 py-3">Desde</div>
            <div className="px-5 py-3">Hasta</div>
            <div className="px-5 py-3">Resumen</div>
          </div>

          {dias.map((dia) => (
            <div
              key={dia.dow}
              className="grid grid-cols-1 gap-4 border-t border-zinc-800/60 bg-neutral-900/40 p-4 text-sm md:grid-cols-[160px_120px_160px_160px_1fr] md:items-center md:gap-0 md:p-0"
            >
              <div className="px-5 py-4 font-medium text-white">{DOW_LABEL[dia.dow]}</div>
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
              <div className="px-5 py-4 text-sm text-zinc-400">
                {formatResumen(dia)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
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
