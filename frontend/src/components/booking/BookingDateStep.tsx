import { useEffect, useState } from "react";
import { getSlots, type SlotsResponse } from "@/api/agenda/agenda";
import toast from "react-hot-toast";

type Props = {
  barberoId: number;
  servicioId: number;
  fecha: string; // YYYY-MM-DD
  onFechaChange: (yyyyMMdd: string) => void;
  onPickSlot: (hhmm: string) => void;
};

type SlotDTO = { inicio: string; fin: string }; // ISO strings desde el backend

function toLocalHHmm(iso: string) {
  const d = new Date(iso); // interpreta el ISO en UTC y lo muestra en local
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function BookingDateStep({
  barberoId,
  servicioId,
  fecha,
  onFechaChange,
  onPickSlot,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!barberoId || !servicioId || !fecha) return;
    (async () => {
      setLoading(true);
      try {
        const res = await getSlots({ barberoId, servicioId, fecha });
        const data: SlotsResponse = (res as any).data ?? res;

        // data.slots viene como Array<{inicio, fin}>
        const hhmm = (data.slots ?? [])
          .map((s: SlotDTO) => toLocalHHmm(s.inicio))
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

        setSlots(hhmm);
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar horarios disponibles");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [barberoId, servicioId, fecha]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-zinc-400 mb-1">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Horarios disponibles</h4>
          {loading && <span className="text-xs text-zinc-500">Cargando…</span>}
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay horarios disponibles para esta fecha.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((hhmm) => (
              <button
                key={hhmm}
                type="button"
                onClick={() => onPickSlot(hhmm)}
                className="rounded-full border border-emerald-700/60 bg-emerald-900/20 hover:bg-emerald-900/40 px-3 py-1.5 text-sm"
              >
                {hhmm}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
