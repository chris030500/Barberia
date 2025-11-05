import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { listBloqueos, createBloqueo, deleteBloqueo, type Bloqueo } from "@/api/horario/bloqueos";
import { useAuth } from "@/stores/auth"; // asumiendo tu hook que expone user/roles/barberoId

dayjs.extend(utc);

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  barberoId: number;
};

function ModalNuevoBloqueo({ open, onClose, onSaved, barberoId }: ModalProps) {
  const [inicioLocal, setInicioLocal] = useState("");
  const [finLocal, setFinLocal] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    now.setSeconds(0, 0);
    const in10 = new Date(now.getTime() + 60 * 60 * 1000);
    setInicioLocal(toLocalInput(now));
    setFinLocal(toLocalInput(in10));
    setMotivo("");
  }, [open]);

  const toLocalInput = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };
  const localToIso = (v: string) => new Date(v).toISOString();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inicioLocal || !finLocal) return toast.error("Selecciona inicio y fin");
    if (new Date(finLocal) <= new Date(inicioLocal)) return toast.error("Fin debe ser después de inicio");
    setSaving(true);
    try {
      await createBloqueo(barberoId, {
        inicio: localToIso(inicioLocal),
        fin: localToIso(finLocal),
        motivo: motivo.trim() || null,
      });
      toast.success("Bloqueo creado");
      onSaved();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message ?? "No se pudo crear el bloqueo");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-neutral-900/90 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Nuevo bloqueo</h3>
          <button onClick={onClose} className="btn btn-ghost h-9 px-3">✕</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Inicio *</label>
            <input
              type="datetime-local"
              value={inicioLocal}
              onChange={(e) => setInicioLocal(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Fin *</label>
            <input
              type="datetime-local"
              value={finLocal}
              onChange={(e) => setFinLocal(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              placeholder="Capacitación, mantenimiento, etc."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button className="btn btn-brand" disabled={saving}>
              {saving ? "Guardando…" : "Crear bloqueo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BarberoBloqueosPage() {
  const { user } = useAuth();
  const myBarberoId = user?.barberoId ?? null;
  const [barberoId, setBarberoId] = useState<number | "">(myBarberoId ?? "");
  const [rows, setRows] = useState<Bloqueo[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const isDisabled = useMemo(() => !barberoId, [barberoId]);

  const refresh = async () => {
    if (!barberoId) return;
    setLoading(true);
    try {
      const data = await listBloqueos(Number(barberoId));
      setRows(data);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar la lista de bloqueos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [barberoId]);

  const onDelete = async (id: number) => {
    if (!barberoId) return;
    if (!confirm("¿Eliminar este bloqueo?")) return;
    try {
      await deleteBloqueo(Number(barberoId), id);
      toast.success("Bloqueo eliminado");
      refresh();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  };

  const fmt = (iso: string) => dayjs(iso).local().format("DD/MM/YYYY HH:mm");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bloqueos del barbero</h1>
          <p className="text-sm text-zinc-500">
            Crea periodos no disponibles (vacaciones, comisión, mantenimiento…)
          </p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="btn btn-brand"
          disabled={isDisabled}
        >
          Nuevo bloqueo
        </button>
      </header>

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

      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900/60 border-b border-zinc-800">
            <tr className="text-left">
              <th className="py-2 px-3">Inicio</th>
              <th className="py-2 px-3">Fin</th>
              <th className="py-2 px-3">Motivo</th>
              <th className="py-2 px-3 w-24 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-zinc-500">
                  {loading ? "Cargando…" : "Sin bloqueos"}
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-zinc-800/60 hover:bg-neutral-900/30">
                <td className="py-2 px-3">{fmt(b.inicio)}</td>
                <td className="py-2 px-3">{fmt(b.fin)}</td>
                <td className="py-2 px-3">{b.motivo || "—"}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => onDelete(b.id)} className="btn btn-ghost btn-sm">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalNuevoBloqueo
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={refresh}
        barberoId={Number(barberoId || 0)}
      />
    </div>
  );
}