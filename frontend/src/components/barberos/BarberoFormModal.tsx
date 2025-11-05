import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { BarberoDTO, BarberoSave } from "@/api/barberos/types";
import { createBarbero, updateBarbero } from "@/api/barberos";
import { listServicios } from "@/api/servicios/services"; // <-- ajusta si tu export cambia

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (b: BarberoDTO) => void;
  editing?: BarberoDTO | null;
};

type ServicioLite = { id: number; nombre: string };

export default function BarberoFormModal({ open, onClose, onSaved, editing }: Props) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activo, setActivo] = useState(true);
  const [servicios, setServicios] = useState<number[]>([]);
  const [allServicios, setAllServicios] = useState<ServicioLite[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar servicios
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // Request a page of servicios; the service expects a params object.
        // listServicios may return a Page<ServicioDTO>, so prefer `.content` if present.
        const res = await listServicios({ page: 0, size: 200, sort: "nombre,asc", soloActivos: true });
        const data = (res as any)?.content ?? res;
        setAllServicios(data);
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar servicios");
      }
    })();
  }, [open]);

  // Cargar datos si editando
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setNombre(editing.nombre ?? "");
      setTelefono(editing.telefonoE164 ?? "");
      setDescripcion(editing.descripcion ?? "");
      setAvatarUrl(editing.avatarUrl ?? "");
      setActivo(!!editing.activo);
      setServicios(editing.servicios ?? []);
    } else {
      setNombre("");
      setTelefono("");
      setDescripcion("");
      setAvatarUrl("");
      setActivo(true);
      setServicios([]);
    }
  }, [open, editing]);

  const title = editing ? "Editar barbero" : "Nuevo barbero";
  const isValidTel = useMemo(() => {
    if (!telefono) return true; // opcional
    return /^\+?[1-9]\d{7,14}$/.test(telefono);
  }, [telefono]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.error("El nombre es requerido");
    if (!isValidTel) return toast.error("Teléfono inválido (usa E.164, ej. +525512345678)");

    const payload: BarberoSave = {
      nombre: nombre.trim(),
      telefonoE164: telefono.trim() || null,
      descripcion: descripcion.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      activo,
      servicios,
    };

    setLoading(true);
    try {
      const saved = editing
        ? await updateBarbero(editing.id, payload)
        : await createBarbero(payload);
      toast.success(editing ? "Barbero actualizado" : "Barbero creado");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  const toggleServicio = (id: number) => {
    setServicios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="
        fixed inset-0 z-50 grid place-items-center p-4
        bg-black/50 backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg card-surface">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost h-9 px-3"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              placeholder="Ej. Carlos Ruiz"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Teléfono (E.164)</label>
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 outline-none ${
                isValidTel ? "border-zinc-800 bg-neutral-900/70" : "border-red-500/60 bg-red-500/10"
              }`}
              placeholder="+525512345678"
            />
            {!isValidTel && (
              <p className="mt-1 text-xs text-red-400">Formato inválido. Usa +código y número.</p>
            )}
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700"
              placeholder="https://…"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2 outline-none focus:border-emerald-700 min-h-[80px]"
              placeholder="Especialidades, notas…"
            />
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              id="activo"
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
            />
            <label htmlFor="activo" className="text-sm text-zinc-300">Activo</label>
          </div>

          {/* Servicios */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Servicios</label>
            {allServicios.length === 0 ? (
              <p className="text-xs text-zinc-500">No hay servicios cargados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allServicios.map((s) => {
                  const selected = servicios.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleServicio(s.id)}
                      className={`
                        rounded-full border px-3 py-1 text-sm
                        ${selected
                          ? "border-emerald-700 bg-emerald-900/30"
                          : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"}
                      `}
                    >
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button disabled={loading} className="btn btn-brand">
              {loading ? "Guardando…" : editing ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}