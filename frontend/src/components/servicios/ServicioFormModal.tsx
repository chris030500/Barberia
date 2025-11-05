import { useEffect, useState } from "react";
import { createServicio, updateServicio, type ServicioDTO } from "@/api/servicios/services";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (s: ServicioDTO) => void;
  servicio?: ServicioDTO | null; // si viene es edición
};

function centsFromMXN(mx: string) {
  const n = Number(mx.replace(/[^\d.]/g, "").trim());
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}
function mxnFromCents(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function ServicioFormModal({ open, onClose, onSaved, servicio }: Props) {
  const isEdit = !!servicio;
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMin, setDuracionMin] = useState(30);
  const [precio, setPrecio] = useState("0"); // como texto MXN
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit && servicio) {
      setNombre(servicio.nombre || "");
      setDescripcion(servicio.descripcion || "");
      setDuracionMin(servicio.duracionMin || 30);
      setPrecio(mxnFromCents(servicio.precioCentavos));
      setActivo(servicio.activo);
    } else {
      setNombre("");
      setDescripcion("");
      setDuracionMin(30);
      setPrecio("0");
      setActivo(true);
    }
  }, [open, isEdit, servicio]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.error("Nombre es obligatorio");
    if (duracionMin < 5) return toast.error("Duración mínima 5 minutos");
    const precioCentavos = centsFromMXN(precio);

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        duracionMin,
        precioCentavos,
        activo,
      };
      const res = isEdit && servicio
        ? await updateServicio(servicio.id, payload)
        : await createServicio(payload);
      toast.success(isEdit ? "Servicio actualizado" : "Servicio creado");
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800/80 bg-neutral-900/80 backdrop-blur p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{isEdit ? "Editar servicio" : "Nuevo servicio"}</h3>
          <button onClick={onClose} className="btn btn-ghost h-9 px-3">Cerrar</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
            <textarea
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Duración (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none"
                value={duracionMin}
                onChange={(e) => setDuracionMin(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">Precio</label>
              <input
                inputMode="decimal"
                className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="$ 0.00"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
            />
            Activo
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
            <button disabled={saving} className="btn btn-brand min-w-28">
              {saving ? "Guardando…" : (isEdit ? "Actualizar" : "Crear")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}