import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getHorario, saveHorario, type HorarioDia } from "@/api/horario/horario-semanal";
import { useAuth } from "@/stores/auth"; // asumiendo tu hook que expone user/roles/barberoId

const DOWS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function emptySemana(): HorarioDia[] {
  return Array.from({ length: 7 }).map((_, dow) => ({
    dow,
    activo: dow >= 1 && dow <= 6, // por defecto Lun–Sáb activos
    desde: "10:00",
    hasta: "19:00",
  }));
}

export default function BarberoHorarioPage() {
  const { user } = useAuth();
  const myBarberoId = user?.barberoId ?? null; // si es ADMIN puedes pasar ?barberoId param en la ruta
  const [barberoId, setBarberoId] = useState<number | "">(myBarberoId ?? "");
  const [dias, setDias] = useState<HorarioDia[]>(emptySemana());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDisabled = useMemo(() => !barberoId, [barberoId]);

  useEffect(() => {
    if (!barberoId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getHorario(Number(barberoId));
        setDias(data.length ? normalize(data) : emptySemana());
      } catch (e) {
        console.error(e);
        toast.error("No se pudo cargar el horario");
      } finally {
        setLoading(false);
      }
    })();
  }, [barberoId]);

  function normalize(arr: HorarioDia[]): HorarioDia[] {
    // Garantiza 7 filas (0..6) ordenadas
    const map = new Map(arr.map(d => [d.dow, d]));
    return Array.from({ length: 7 }).map((_, dow) => {
      const curr = map.get(dow);
      return curr ?? { dow, activo: false, desde: "10:00", hasta: "19:00" };
    });
  }

  const onChange = (dow: number, patch: Partial<HorarioDia>) => {
    setDias(prev => prev.map(d => (d.dow === dow ? { ...d, ...patch } : d)));
  };

  const onSave = async () => {
    if (!barberoId) return toast.error("Selecciona barbero");
    setSaving(true);
    try {
      const payload = dias.map(d => ({
        id: d.id,
        dow: d.dow,
        activo: !!d.activo,
        desde: d.desde,
        hasta: d.hasta,
      }));
      await saveHorario(Number(barberoId), payload);
      toast.success("Horario guardado");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Horario semanal</h1>
          <p className="text-sm text-zinc-500">
            Define los horarios base por día. Los bloqueos cubren excepciones.
          </p>
        </div>
      </header>

      {/* Selector de barbero (si ADMIN) */}
      {!myBarberoId && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Barbero</label>
          <input
            type="number"
            placeholder="ID de barbero"
            value={barberoId}
            onChange={(e) => setBarberoId(e.target.value ? Number(e.target.value) : "")}
            className="w-64 rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
          />
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-neutral-900/40 divide-y divide-zinc-800">
        <div className="px-4 py-3 text-xs text-zinc-500 flex">
          <div className="w-28">Día</div>
          <div className="w-24">Activo</div>
          <div className="w-28">Desde</div>
          <div className="w-28">Hasta</div>
          <div className="flex-1" />
        </div>

        {dias.map((d) => (
          <div key={d.dow} className="px-4 py-3 flex items-center gap-3">
            <div className="w-28 text-sm">{DOWS[d.dow]}</div>
            <div className="w-24">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-emerald-600 h-4 w-4"
                  checked={!!d.activo}
                  onChange={(e) => onChange(d.dow, { activo: e.target.checked })}
                  disabled={isDisabled || loading}
                />
                Activo
              </label>
            </div>
            <div className="w-28">
              <input
                type="time"
                value={d.desde}
                onChange={(e) => onChange(d.dow, { desde: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-neutral-900/70 px-2 py-1.5 outline-none focus:border-emerald-700"
                disabled={!d.activo || isDisabled || loading}
              />
            </div>
            <div className="w-28">
              <input
                type="time"
                value={d.hasta}
                onChange={(e) => onChange(d.dow, { hasta: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-neutral-900/70 px-2 py-1.5 outline-none focus:border-emerald-700"
                disabled={!d.activo || isDisabled || loading}
              />
            </div>
            <div className="flex-1 text-xs text-zinc-500">
              {d.activo ? `${d.desde}–${d.hasta}` : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setDias(emptySemana())}
          className="btn btn-ghost"
          disabled={loading || isDisabled}
        >
          Reset
        </button>
        <button
          onClick={onSave}
          disabled={saving || loading || isDisabled}
          className="btn btn-brand"
        >
          {saving ? "Guardando…" : "Guardar horario"}
        </button>
      </div>
    </div>
  );
}