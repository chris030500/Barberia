import { useEffect, useMemo, useState } from "react";
import { listBarberos, deleteBarbero } from "@/api/barberos";
import type { BarberoDTO, Page } from "@/api/barberos/types";
import BarberoFormModal from "@/components/barberos/BarberoFormModal";
import toast from "react-hot-toast";

export default function BarberosPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [soloActivos, setSoloActivos] = useState(true);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<BarberoDTO> | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BarberoDTO | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listBarberos({ page, size, soloActivos });
      setData(res);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar barberos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, soloActivos]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q.trim()) return data.content;
    const s = q.trim().toLowerCase();
    return data.content.filter((b) => b.nombre.toLowerCase().includes(s));
  }, [data, q]);

  const onSaved = () => {
    // tras guardar, refrescar lista y reset
    fetchList();
    setEditing(null);
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar barbero? Esta acción no se puede deshacer.")) return;
    try {
      await deleteBarbero(id);
      toast.success("Barbero eliminado");
      fetchList();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="app-container py-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Barberos</h1>

        <div className="flex items-center gap-2">
          <div className="input-pill">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500"><path fill="currentColor" d="M10 18a7.95 7.95 0 0 0 4.9-1.7l4.4 4.4l1.4-1.4l-4.4-4.4A8 8 0 1 0 10 18m0-14a6 6 0 1 1 0 12a6 6 0 0 1 0-12" /></svg>
            <input
              placeholder="Buscar por nombre…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
            />
            Solo activos
          </label>

          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn btn-brand"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Tabla / Cards */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        {/* Desktop: tabla */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/60">
              <tr className="text-left">
                <th className="px-4 py-3">Barbero</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Servicios</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>Sin resultados</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-t border-zinc-800/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(b.nombre)}`}
                          alt=""
                          className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                        />
                        <div className="font-medium">{b.nombre}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.telefonoE164 || "-"}</td>
                    <td className="px-4 py-3">
                      {b.servicios?.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/60 bg-emerald-900/20 px-2 py-0.5 text-emerald-300">
                          {b.servicios.length} servicio{b.servicios.length > 1 ? "s" : ""}
                        </span>
                      ) : <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 ${b.activo ? "border-emerald-700/60 bg-emerald-900/20 text-emerald-300" : "border-zinc-700 bg-zinc-800 text-zinc-300"}`}>
                        <span className={`h-2 w-2 rounded-full ${b.activo ? "bg-emerald-500" : "bg-zinc-400"}`} />
                        {b.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn btn-ghost h-9"
                          onClick={() => { setEditing(b); setModalOpen(true); }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-ghost h-9"
                          onClick={() => onDelete(b.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="md:hidden divide-y divide-zinc-800">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">Sin resultados</div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(b.nombre)}`}
                    alt=""
                    className="h-10 w-10 rounded-full border border-zinc-800 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.nombre}</div>
                    <div className="text-xs text-zinc-500 truncate">{b.telefonoE164 || "—"}</div>
                  </div>
                  <span className={`ml-auto shrink-0 inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs ${b.activo ? "border-emerald-700/60 bg-emerald-900/20 text-emerald-300" : "border-zinc-700 bg-zinc-800 text-zinc-300"}`}>
                    <span className={`h-2 w-2 rounded-full ${b.activo ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {b.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {b.descripcion && (
                  <p className="mt-3 text-sm text-zinc-400 line-clamp-3">{b.descripcion}</p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {b.servicios?.length ? `${b.servicios.length} servicio(s)` : "Sin servicios"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost h-9" onClick={() => { setEditing(b); setModalOpen(true); }}>
                      Editar
                    </button>
                    <button className="btn btn-ghost h-9" onClick={() => onDelete(b.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-zinc-400">
            Página {data.number + 1} de {data.totalPages} · {data.totalElements} registros
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Anterior
            </button>
            <button
              className="btn btn-ghost"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>

            <select
              value={size}
              onChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
              className="h-10 rounded-xl border border-zinc-800 bg-neutral-900/70 px-2 text-sm outline-none"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/página</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Modal */}
      <BarberoFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={onSaved}
        editing={editing ?? undefined}
      />
    </div>
  );
}