import { useEffect, useMemo, useState } from "react";
import {
  listServicios,
  deleteServicio,
  type ServicioDTO,
} from "@/api/servicios/services";
import ServicioFormModal from "@/components/servicios/ServicioFormModal";
import toast from "react-hot-toast";

function money(cents: number) {
  return (cents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function ServiciosPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [items, setItems] = useState<ServicioDTO[]>([]);
  const [soloActivos, setSoloActivos] = useState<boolean>(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<ServicioDTO | null>(null);

  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  async function load() {
    setLoading(true);
    try {
      const pageRes = await listServicios({
        page,
        size,
        sort: "nombre,asc",
        soloActivos,
      });
      setItems(pageRes.content ?? []);
      setTotalPages(pageRes.totalPages ?? 0);
    } catch (err: any) {
      console.error(err);
      toast.error("No se pudo cargar servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page, size, soloActivos]);

  const title = useMemo(() => "Servicios", []);

  const onSaved = () => {
    // tras crear/editar, recarga página actual
    load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await deleteServicio(id);
      toast.success("Servicio eliminado");
      // si borras el último de la página, regrésate una
      if (items.length === 1 && page > 0) setPage((p) => p - 1);
      else load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-zinc-400">
            Gestiona tu catálogo de servicios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={(e) => setSoloActivos(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
            />
            Mostrar solo activos
          </label>
          <button
            onClick={() => {
              setEdit(null);
              setModalOpen(true);
            }}
            className="btn btn-brand"
          >
            Nuevo servicio
          </button>
        </div>
      </div>

      {/* Tabla / lista */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-neutral-900/40">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/60">
            <tr className="text-left text-zinc-400">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 hidden md:table-cell">Descripción</th>
              <th className="px-4 py-3">Duración</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-400" colSpan={6}>
                  Sin servicios
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-t border-zinc-800/60">
                  <td className="px-4 py-3 font-medium">{s.nombre}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-400">
                    {s.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3">{s.duracionMin} min</td>
                  <td className="px-4 py-3">{money(s.precioCentavos)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2 text-xs
                      ${
                        s.activo
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-600/30"
                          : "bg-zinc-700/20 text-zinc-300 border border-zinc-600/30"
                      }
                    `}
                    >
                      {s.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn btn-ghost h-9"
                        onClick={() => {
                          setEdit(s);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="btn h-9 border-red-900/60 bg-red-900/20 hover:bg-red-900/40"
                        onClick={() => onDelete(s.id)}
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

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Página <span className="tabular-nums">{page + 1}</span> de{" "}
          <span className="tabular-nums">{Math.max(totalPages, 1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={size}
            onChange={(e) => {
              setPage(0);
              setSize(Number(e.target.value));
            }}
            className="rounded-xl border border-zinc-800 bg-neutral-900 px-2 py-1 text-sm"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              className="btn btn-ghost h-9"
            >
              Anterior
            </button>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-ghost h-9"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <ServicioFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
        servicio={edit}
      />
    </div>
  );
}
