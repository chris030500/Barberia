import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Hash,
  Instagram,
  Link2,
  Mail,
  Phone,
  Sparkles,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";

import { deleteBarbero, listBarberos } from "@/api/barberos";
import type { BarberoDTO, Page } from "@/api/barberos/types";
import BarberoFormModal from "@/components/barberos/BarberoFormModal";

export default function BarberosPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
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
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la lista de barberos");
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
    const search = q.trim().toLowerCase();
    return data.content.filter((b) => {
      const matchesNombre = (b.nombre ?? "").toLowerCase().includes(search);
      const matchesSlogan = (b.slogan ?? "").toLowerCase().includes(search);
      const matchesTelefono = (b.telefonoE164 ?? "").toLowerCase().includes(search);
      const matchesCorreo = (b.emailProfesional ?? "").toLowerCase().includes(search);
      const matchesEspecialidad = (b.especialidades ?? []).some((tag) =>
        tag.toLowerCase().includes(search)
      );
      return matchesNombre || matchesSlogan || matchesTelefono || matchesCorreo || matchesEspecialidad;
    });
  }, [data, q]);

  const totalActivos = useMemo(() => {
    if (!data?.content) return 0;
    return data.content.filter((b) => b.activo).length;
  }, [data]);

  const totalEspecialidades = useMemo(() => {
    const set = new Set<string>();
    (data?.content ?? []).forEach((b) => {
      (b.especialidades ?? []).forEach((tag) => set.add(tag.toLowerCase()));
    });
    return set.size;
  }, [data]);

  const experienciaPromedio = useMemo(() => {
    const valores = (data?.content ?? [])
      .map((b) => b.experienciaAnos ?? 0)
      .filter((v) => v > 0);
    if (valores.length === 0) return null;
    const promedio = valores.reduce((acc, val) => acc + val, 0) / valores.length;
    return promedio.toFixed(promedio >= 10 ? 0 : 1);
  }, [data]);

  const onSaved = () => {
    fetchList();
    setEditing(null);
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar barbero? Esta acción no se puede deshacer.")) return;
    try {
      await deleteBarbero(id);
      toast.success("Barbero eliminado");
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar el barbero");
    }
  };

  return (
    <div className="relative mx-auto max-w-7xl space-y-10 px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%)]" />

      <header className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-neutral-950 via-neutral-900/80 to-neutral-950 p-6 shadow-2xl shadow-emerald-900/30">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 rotate-6 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15),_transparent_65%)] opacity-60 lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <Sparkles className="h-3 w-3" /> Gestión de barberos
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-white">Directorio profesional</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                Administra el talento de la barbería con fichas enriquecidas, especialidades y canales de contacto listos para compartir.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="input-pill">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500">
                  <path
                    fill="currentColor"
                    d="M10 18a7.95 7.95 0 0 0 4.9-1.7l4.4 4.4l1.4-1.4l-4.4-4.4A8 8 0 1 0 10 18m0-14a6 6 0 1 1 0 12a6 6 0 0 1 0-12"
                  />
                </svg>
                <input
                  placeholder="Buscar por nombre, especialidad o contacto…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-200">
                <input
                  type="checkbox"
                  checked={soloActivos}
                  onChange={(e) => setSoloActivos(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
                />
                Mostrar solo activos
              </label>
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-3 lg:w-auto lg:items-end">
            <div className="grid w-full gap-3 text-sm text-white/90 lg:w-72">
              <MetricBadge label="En plataforma" value={`${data?.totalElements ?? filtered.length}`} icon={<UsersRound className="h-4 w-4" />} />
              <div className="grid grid-cols-2 gap-3">
                <MetricBadge label="Activos" value={String(totalActivos)} icon={<Sparkles className="h-4 w-4" />} subtle />
                <MetricBadge label="Especialidades" value={String(totalEspecialidades)} icon={<Hash className="h-4 w-4" />} subtle />
              </div>
              <MetricBadge
                label="Experiencia promedio"
                value={experienciaPromedio ? `${experienciaPromedio} años` : "—"}
                icon={<Sparkles className="h-4 w-4" />}
                subtle
              />
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn btn-brand mt-2"
            >
              + Nuevo barbero
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-neutral-950/80">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left uppercase tracking-[0.2em] text-xs text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Barbero</th>
                <th className="px-6 py-4 font-semibold">Especialidades</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Servicios</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                    Cargando barberos…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">
                    No se encontraron barberos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-t border-white/5 text-white/90">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={b.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(b.nombre)}`}
                          alt={b.nombre}
                          className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                        />
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{b.nombre}</p>
                          {b.slogan ? <p className="text-xs text-emerald-200">{b.slogan}</p> : null}
                          {b.descripcion ? (
                            <p className="text-xs text-zinc-400 line-clamp-2">{b.descripcion}</p>
                          ) : null}
                          {b.experienciaAnos ? (
                            <p className="text-[11px] text-zinc-500">{b.experienciaAnos} año(s) de experiencia</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(b.especialidades ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100"
                          >
                            <Hash className="h-3 w-3" /> {tag}
                          </span>
                        ))}
                        {b.especialidades.length > 3 ? (
                          <span className="text-xs text-zinc-400">+{b.especialidades.length - 3} más</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 text-xs text-zinc-300">
                        {b.telefonoE164 && (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" /> {b.telefonoE164}
                          </span>
                        )}
                        {b.emailProfesional && (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" /> {b.emailProfesional}
                          </span>
                        )}
                        {b.instagramHandle && (
                          <span className="inline-flex items-center gap-2">
                            <Instagram className="h-3.5 w-3.5" /> @{b.instagramHandle}
                          </span>
                        )}
                        {b.portafolioUrl && (
                          <a
                            href={b.portafolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-emerald-200 hover:underline"
                          >
                            <Link2 className="h-3.5 w-3.5" /> Portafolio
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {b.servicios?.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">
                          {b.servicios.length} servicio{b.servicios.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          b.activo
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                            : "border-white/10 bg-white/5 text-zinc-400"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${b.activo ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        {b.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn btn-ghost h-9"
                          onClick={() => {
                            setEditing(b);
                            setModalOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn btn-ghost h-9" onClick={() => onDelete(b.id)}>
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

        <div className="md:hidden divide-y divide-white/10">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">Cargando barberos…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">No se encontraron barberos.</div>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="flex flex-col gap-4 p-4 text-white/90">
                <div className="flex items-start gap-3">
                  <img
                    src={b.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(b.nombre)}`}
                    alt={b.nombre}
                    className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{b.nombre}</p>
                        {b.slogan ? <p className="text-xs text-emerald-200">{b.slogan}</p> : null}
                        {b.descripcion ? (
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-3">{b.descripcion}</p>
                        ) : null}
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${
                          b.activo
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                            : "border-white/10 bg-white/5 text-zinc-400"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${b.activo ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        {b.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {b.experienciaAnos ? (
                      <p className="mt-2 text-[11px] text-zinc-500">{b.experienciaAnos} año(s) de experiencia</p>
                    ) : null}
                  </div>
                </div>

                {(b.especialidades ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {b.especialidades.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100"
                      >
                        <Hash className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 text-xs text-zinc-300">
                  {b.telefonoE164 && (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {b.telefonoE164}
                    </span>
                  )}
                  {b.emailProfesional && (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {b.emailProfesional}
                    </span>
                  )}
                  {b.instagramHandle && (
                    <span className="inline-flex items-center gap-2">
                      <Instagram className="h-3.5 w-3.5" /> @{b.instagramHandle}
                    </span>
                  )}
                  {b.portafolioUrl && (
                    <a
                      href={b.portafolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-200 hover:underline"
                    >
                      <Link2 className="h-3.5 w-3.5" /> Portafolio
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {b.servicios?.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100">
                      {b.servicios.length} servicio{b.servicios.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">Sin servicios asignados</span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-ghost h-9"
                      onClick={() => {
                        setEditing(b);
                        setModalOpen(true);
                      }}
                    >
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
      </section>

      {data && data.totalPages > 1 && (
        <footer className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-neutral-950/60 px-4 py-4 text-sm text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Página {data.number + 1} de {data.totalPages} · {data.totalElements} registros
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-ghost h-9 px-4"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            >
              ← Anterior
            </button>
            <button
              className="btn btn-ghost h-9 px-4"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Siguiente →
            </button>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="h-10 rounded-xl border border-white/10 bg-neutral-900/70 px-3 text-xs text-white outline-none transition focus:border-emerald-400"
            >
              {[12, 24, 48].map((n) => (
                <option key={n} value={n}>{n}/página</option>
              ))}
            </select>
          </div>
        </footer>
      )}

      <BarberoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
        editing={editing}
      />
    </div>
  );
}

function MetricBadge({
  label,
  value,
  icon,
  subtle = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  subtle?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
        subtle ? "border-white/10 bg-white/5 text-zinc-200" : "border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
      }`}
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
        {icon}
      </span>
    </div>
  );
}
