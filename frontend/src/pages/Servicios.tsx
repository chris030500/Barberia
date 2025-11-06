import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
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
    <div className="app-container space-y-8 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-violet-500/10 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.18),transparent_65%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" /> Catálogo atractivo
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white">{title}</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Diseña experiencias memorables ajustando duración, precios y estado de cada servicio en segundos.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={soloActivos}
                  onChange={(e) => setSoloActivos(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-neutral-900"
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
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-white/70 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Estado actual</p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Servicios activos</span>
                <span className="text-lg font-semibold text-white">{items.filter((s) => s.activo).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duración media</span>
                <span className="text-lg font-semibold text-white">
                  {items.length ? Math.round(items.reduce((acc, curr) => acc + (curr.duracionMin ?? 0), 0) / items.length) : 0} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
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
                <td className="px-4 py-6 text-center text-white/60" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-white/60" colSpan={6}>
                  Sin servicios
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium text-white">{s.nombre}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-white/60">
                    {s.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3 text-white/80">{s.duracionMin} min</td>
                  <td className="px-4 py-3 text-white/80">{money(s.precioCentavos)}</td>
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

      <div className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/60">
          Página <span className="tabular-nums">{page + 1}</span> de{" "}
          <span className="tabular-nums">{Math.max(totalPages, 1)}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={size}
            onChange={(e) => {
              setPage(0);
              setSize(Number(e.target.value));
            }}
            className="rounded-xl border border-white/10 bg-neutral-950 px-2 py-1 text-sm text-white"
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
