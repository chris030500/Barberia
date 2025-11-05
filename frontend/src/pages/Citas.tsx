import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { listCitas, completarCita, cancelarCita } from "@/api/citas";
import type { CitaDTO, Page } from "@/api/citas/types";
import CitaFormModal from "@/components/citas/CitaFormModal";
import { moneyMX } from "@/lib/money";

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function toIso(z: Date) {
  return z.toISOString();
}
function fmtDateTimeLocal(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function StatusBadge({ s }: { s: CitaDTO["estado"] }) {
  const map: Record<string, string> = {
    AGENDADA: "bg-emerald-900/30 text-emerald-300 ring-1 ring-emerald-700/40",
    COMPLETADA: "bg-sky-900/30 text-sky-300 ring-1 ring-sky-700/40",
    CANCELADA: "bg-rose-900/30 text-rose-300 ring-1 ring-rose-700/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>
      {s}
    </span>
  );
}

export default function CitasPage() {
  // rango por defecto: hoy
  const [desde, setDesde] = useState<string>(() => toIso(startOfLocalDay(new Date())));
  const [hasta, setHasta] = useState<string>(() => toIso(endOfLocalDay(new Date())));
  const [barberoId, setBarberoId] = useState<number | "">("");
  const [estado, setEstado] = useState<"AGENDADA" | "CANCELADA" | "COMPLETADA" | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("inicio,asc");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Page<CitaDTO> | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<CitaDTO | null>(null);

  const desdeInput = useMemo(() => new Date(desde).toISOString().slice(0, 16), [desde]);
  const hastaInput = useMemo(() => new Date(hasta).toISOString().slice(0, 16), [hasta]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listCitas({
        barberoId: barberoId ? Number(barberoId) : undefined,
        estado: estado || undefined,
        desde,
        hasta,
        page,
        size,
        sort,
      });
      setData(res);
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudieron cargar las citas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberoId, estado, desde, hasta, page, size, sort]);

  const onNueva = () => {
    setEditing(null);
    setOpenModal(true);
  };
  const onEditar = (c: CitaDTO) => {
    setEditing(c);
    setOpenModal(true);
  };
  const onSaved = () => fetchData();

  // KPIs rápidos (de la página actual para no hacer más requests)
  const kpis = useMemo(() => {
    const arr = data?.content ?? [];
    const total = arr.length;
    const ag = arr.filter(x => x.estado === "AGENDADA").length;
    const co = arr.filter(x => x.estado === "COMPLETADA").length;
    const ca = arr.filter(x => x.estado === "CANCELADA").length;
    const sum = arr.reduce((a, b) => a + (b.precioCentavos || 0), 0);
    return { total, ag, co, ca, sum };
  }, [data]);

  const completar = async (c: CitaDTO) => {
    try {
      await completarCita(c.id);
      toast.success("Cita completada");
      fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo completar la cita");
    }
  };

  const cancelar = async (c: CitaDTO) => {
    try {
      await cancelarCita(c.id);
      toast.success("Cita cancelada");
      fetchData();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo cancelar la cita");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Citas</h1>
          <p className="text-sm text-zinc-400">Administra y controla tus reservaciones.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={fetchData}>Actualizar</button>
          <button className="btn btn-brand" onClick={onNueva}>Nueva cita</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-surface p-4">
          <p className="text-xs text-zinc-500">Total (página)</p>
          <p className="text-xl font-semibold">{kpis.total}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-zinc-500">Agendadas</p>
          <p className="text-xl font-semibold">{kpis.ag}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-zinc-500">Completadas</p>
          <p className="text-xl font-semibold">{kpis.co}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-xs text-zinc-500">Ingresos (página)</p>
          <p className="text-xl font-semibold">{moneyMX(kpis.sum)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-surface p-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Desde</label>
            <input
              type="datetime-local"
              value={desdeInput}
              onChange={(e) => setDesde(new Date(e.target.value).toISOString())}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Hasta</label>
            <input
              type="datetime-local"
              value={hastaInput}
              onChange={(e) => setHasta(new Date(e.target.value).toISOString())}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Barbero (ID)</label>
            <input
              type="number"
              placeholder="Ej. 1"
              value={barberoId}
              onChange={(e) => setBarberoId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Estado</label>
            <div className="flex gap-2">
              <select
                value={estado}
                onChange={(e) => setEstado((e.target.value || "") as any)}
                className="flex-1 rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="AGENDADA">Agendada</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-40 rounded-xl border border-zinc-800 bg-neutral-900/70 px-3 py-2"
                title="Ordenar por"
              >
                <option value="inicio,asc">Inicio ↑</option>
                <option value="inicio,desc">Inicio ↓</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/40 sticky top-0 z-10">
              <tr className="text-left text-zinc-400">
                <th className="py-2 px-4">Inicio</th>
                <th className="py-2 px-4">Fin</th>
                <th className="py-2 px-4">Barbero</th>
                <th className="py-2 px-4">Servicio</th>
                <th className="py-2 px-4">Cliente</th>
                <th className="py-2 px-4">Precio</th>
                <th className="py-2 px-4">Estado</th>
                <th className="py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">Cargando…</td>
                </tr>
              )}
              {!loading && data?.content?.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <div className="text-3xl">🗓️</div>
                      <p>No hay citas con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && data?.content?.map((c) => (
                <tr key={c.id} className="border-t border-zinc-800 hover:bg-neutral-900/30">
                  <td className="py-3 px-4">{fmtDateTimeLocal(c.inicio)}</td>
                  <td className="py-3 px-4">{fmtDateTimeLocal(c.fin)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="grid place-items-center w-7 h-7 rounded-full bg-zinc-800 text-xs">
                        {(c.barberoNombre ?? `#${c.barberoId}`).slice(0,2).toUpperCase()}
                      </div>
                      <div>{c.barberoNombre ?? `#${c.barberoId}`}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{c.servicioNombre ?? `#${c.servicioId}`}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{c.clienteNombre}</span>
                      {c.clienteTelE164 && (
                        <a className="text-xs text-emerald-400 hover:underline" href={`tel:${c.clienteTelE164}`}>
                          {c.clienteTelE164}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{moneyMX(c.precioCentavos)}</td>
                  <td className="py-3 px-4">
                    <StatusBadge s={c.estado} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-ghost h-8 px-3" onClick={() => onEditar(c)}>Editar</button>
                      {c.estado === "AGENDADA" && (
                        <>
                          <button className="btn btn-brand h-8 px-3" onClick={() => completar(c)}>Completar</button>
                          <button className="btn btn-danger h-8 px-3" onClick={() => cancelar(c)}>Cancelar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="border-t border-zinc-800 px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-500">
            Página {data ? data.number + 1 : 1} de {data?.totalPages ?? 1} · {data?.totalElements ?? 0} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost"
              disabled={loading || (data?.number ?? 0) <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ◀
            </button>
            <button
              className="btn btn-ghost"
              disabled={loading || (data ? data.number + 1 >= data.totalPages : true)}
              onClick={() => setPage((p) => p + 1)}
            >
              ▶
            </button>
            <select
              className="btn btn-ghost"
              value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}/pág</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CitaFormModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSaved={onSaved}
        editing={editing}
      />
    </div>
  );
}