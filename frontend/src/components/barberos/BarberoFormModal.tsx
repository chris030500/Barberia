import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Hash,
  Mail,
  Phone,
  Scissors,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

import { createBarbero, updateBarbero } from "@/api/barberos";
import type { BarberoDTO, BarberoSave } from "@/api/barberos/types";
import { listServicios } from "@/api/servicios/services";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (b: BarberoDTO) => void;
  editing?: BarberoDTO | null;
};

type ServicioLite = {
  id: number;
  nombre: string;
  duracionMin?: number | null;
};

const MAX_ESPECIALIDADES = 8;

const steps = [
  {
    title: "Perfil profesional",
    description: "Define cómo se mostrará el barbero dentro del ecosistema.",
  },
  {
    title: "Contacto y servicios",
    description: "Completa la información operativa y asigna especialidades.",
  },
];

function computeAccent(nombre: string) {
  if (!nombre) return "hsl(156, 72%, 45%)";
  const hash = nombre
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 48%)`;
}

export default function BarberoFormModal({ open, onClose, onSaved, editing }: Props) {
  const [step, setStep] = useState(0);

  const [nombre, setNombre] = useState("");
  const [slogan, setSlogan] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portafolioUrl, setPortafolioUrl] = useState("");
  const [experiencia, setExperiencia] = useState("");
  const [activo, setActivo] = useState(true);

  const [servicios, setServicios] = useState<number[]>([]);
  const [allServicios, setAllServicios] = useState<ServicioLite[]>([]);

  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [especialidadDraft, setEspecialidadDraft] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await listServicios({ page: 0, size: 200, sort: "nombre,asc", soloActivos: true });
        const data = (res as any)?.content ?? res;
        setAllServicios(data ?? []);
      } catch (err) {
        console.error(err);
        toast.error("No se pudieron cargar los servicios disponibles");
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    if (editing) {
      setNombre(editing.nombre ?? "");
      setSlogan(editing.slogan ?? "");
      setDescripcion(editing.descripcion ?? "");
      setAvatarUrl(editing.avatarUrl ?? "");
      setTelefono(editing.telefonoE164 ?? "");
      setEmail(editing.emailProfesional ?? "");
      setInstagram(editing.instagramHandle ?? "");
      setPortafolioUrl(editing.portafolioUrl ?? "");
      setExperiencia(editing.experienciaAnos != null ? String(editing.experienciaAnos) : "");
      setActivo(Boolean(editing.activo));
      setServicios(editing.servicios ?? []);
      setEspecialidades(editing.especialidades ?? []);
    } else {
      setNombre("");
      setSlogan("");
      setDescripcion("");
      setAvatarUrl("");
      setTelefono("");
      setEmail("");
      setInstagram("");
      setPortafolioUrl("");
      setExperiencia("");
      setActivo(true);
      setServicios([]);
      setEspecialidades([]);
    }
    setEspecialidadDraft("");
  }, [open, editing]);

  const accent = useMemo(() => computeAccent(nombre), [nombre]);

  const isValidTel = useMemo(() => {
    if (!telefono.trim()) return true;
    return /^\+?[1-9]\d{7,14}$/.test(telefono.trim());
  }, [telefono]);

  const parsedExperiencia = useMemo(() => {
    if (!experiencia.trim()) return null;
    const parsed = Number.parseInt(experiencia.trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [experiencia]);

  const displayInstagram = instagram ? `@${instagram.replace(/^@+/, "")}` : "";

  const previewServicios = useMemo(() => {
    if (!servicios.length) return [];
    const map = new Map<number, ServicioLite>();
    allServicios?.forEach((s: ServicioLite) => map.set(s.id, s));
    return servicios
      .map((id) => map.get(id))
      .filter((s): s is ServicioLite => Boolean(s));
  }, [allServicios, servicios]);

  if (!open) return null;

  const closeAndReset = () => {
    if (loading) return;
    onClose();
  };

  const handleEspecialidadAdd = () => {
    const value = especialidadDraft.replace(/\s+/g, " ").trim();
    if (!value) return;
    if (value.length > 50) {
      toast.error("La especialidad debe tener máximo 50 caracteres");
      return;
    }
    if (especialidades.length >= MAX_ESPECIALIDADES) {
      toast.error(`Máximo ${MAX_ESPECIALIDADES} especialidades`);
      return;
    }
    const exists = especialidades.some((item) => item.toLowerCase() === value.toLowerCase());
    if (exists) {
      toast.error("La especialidad ya está agregada");
      return;
    }
    setEspecialidades((prev) => [...prev, value]);
    setEspecialidadDraft("");
  };

  const removeEspecialidad = (value: string) => {
    setEspecialidades((prev) => prev.filter((item) => item !== value));
  };

  const toggleServicio = (id: number) => {
    setServicios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canGoNext = step === 0 ? Boolean(nombre.trim()) : true;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!isValidTel) {
      toast.error("Teléfono inválido. Usa formato E.164");
      return;
    }
    if (experiencia.trim() && parsedExperiencia == null) {
      toast.error("Los años de experiencia deben ser un número entero");
      return;
    }

    const payload: BarberoSave = {
      nombre: nombre.trim(),
      telefonoE164: telefono.trim() ? telefono.trim() : null,
      descripcion: descripcion.trim() ? descripcion.trim() : null,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      emailProfesional: email.trim() ? email.trim() : null,
      instagramHandle: instagram.trim() ? instagram.replace(/^@+/, "").trim() : null,
      portafolioUrl: portafolioUrl.trim() ? portafolioUrl.trim() : null,
      slogan: slogan.trim() ? slogan.trim() : null,
      experienciaAnos: parsedExperiencia ?? null,
      especialidades: especialidades,
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
      toast.error(err?.response?.data?.message ?? "No se pudo guardar al barbero");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950/95 shadow-2xl">
        <div className="border-b border-white/10 bg-neutral-900/70 px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                <Sparkles className="h-3 w-3" /> {editing ? "Editar barbero" : "Nuevo barbero"}
              </span>
              <h2 className="mt-2 text-2xl font-semibold text-white">{steps[step].title}</h2>
              <p className="text-sm text-zinc-400">{steps[step].description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              {steps.map((s, idx) => (
                <div key={s.title} className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      idx === step
                        ? "border-emerald-400 bg-emerald-500/20 text-white"
                        : idx < step
                        ? "border-emerald-500/50 bg-emerald-500/30 text-emerald-100"
                        : "border-white/10 bg-white/5 text-zinc-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {idx < steps.length - 1 && <div className="h-px w-8 bg-white/10" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <form onSubmit={onSubmit} className="space-y-6">
            {step === 0 ? (
              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Nombre *</label>
                  <div className="relative">
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-400"
                      placeholder="Ej. Carlos Ruiz"
                      required
                    />
                    <UserBadge nombre={nombre} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Slogan</label>
                  <input
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-400"
                    placeholder="Tu look, mi inspiración"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 min-h-[120px]"
                    placeholder="Resumen de experiencia, estilo y personalidad"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Avatar (URL)</label>
                  <div className="flex gap-3">
                    <input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="https://…"
                    />
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300">
                      <Camera className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">Teléfono (E.164)</label>
                    <div className={`rounded-2xl border px-4 py-3 text-sm transition ${
                      isValidTel ? "border-white/10 bg-neutral-900/80" : "border-red-500/60 bg-red-500/10"
                    }`}>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone className="h-4 w-4" />
                        <input
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          className="w-full bg-transparent text-white outline-none"
                          placeholder="+525512345678"
                        />
                      </div>
                    </div>
                    {!isValidTel && (
                      <p className="mt-1 text-xs text-red-400">Formato inválido. Incluye prefijo internacional.</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">Correo profesional</label>
                    <div className="rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Mail className="h-4 w-4" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent text-white outline-none"
                          placeholder="contacto@barber.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">Instagram</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white">
                      <span className="text-zinc-500">@</span>
                      <input
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value.replace(/^@+/, ""))}
                        className="w-full bg-transparent text-white outline-none"
                        placeholder="usuario"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">Portafolio / Link</label>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white">
                      <UploadCloud className="h-4 w-4 text-zinc-400" />
                      <input
                        value={portafolioUrl}
                        onChange={(e) => setPortafolioUrl(e.target.value)}
                        className="w-full bg-transparent text-white outline-none"
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">Años de experiencia</label>
                    <input
                      value={experiencia}
                      onChange={(e) => setExperiencia(e.target.value.replace(/[^\d]/g, ""))}
                      className="w-full rounded-2xl border border-white/10 bg-neutral-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
                      placeholder="Ej. 5"
                      inputMode="numeric"
                    />
                  </div>
                  <label className="mt-6 flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-700 bg-neutral-900"
                    />
                    Mostrar en listados y reservas
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Especialidades</label>
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/60 px-3 py-3">
                    {especialidades.length === 0 ? (
                      <p className="text-xs text-zinc-500">Agrega estilos, técnicas o enfoques destacados.</p>
                    ) : (
                      especialidades.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-100"
                        >
                          <Hash className="h-3 w-3" /> {item}
                          <button
                            type="button"
                            onClick={() => removeEspecialidad(item)}
                            className="text-emerald-200/70 transition hover:text-white"
                            aria-label={`Quitar ${item}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={especialidadDraft}
                        onChange={(e) => setEspecialidadDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEspecialidadAdd();
                          }
                        }}
                        className="rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-xs text-white outline-none transition focus:border-emerald-400"
                        placeholder="Colorimetría, Fade, Barber Art…"
                      />
                      <button
                        type="button"
                        onClick={handleEspecialidadAdd}
                        className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/30"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400">Servicios asignados</label>
                  {allServicios.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/15 bg-neutral-900/40 px-4 py-6 text-center text-sm text-zinc-500">
                      No hay servicios activos disponibles.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {allServicios.map((s) => {
                        const selected = servicios.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleServicio(s.id)}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              selected
                                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                                : "border-white/10 bg-neutral-900/70 text-white hover:border-emerald-400/40"
                            }`}
                          >
                            <div>
                              <p className="font-medium">{s.nombre}</p>
                              {s.duracionMin ? (
                                <p className="text-xs text-zinc-400">{s.duracionMin} min</p>
                              ) : null}
                            </div>
                            <Scissors className="h-4 w-4 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <button type="button" onClick={closeAndReset} className="btn btn-ghost">
                  Cancelar
                </button>
                <span>Se guardará automáticamente al confirmar.</span>
              </div>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button type="button" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} className="btn btn-ghost">
                    Volver
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canGoNext) {
                        toast.error("Completa los campos obligatorios para continuar");
                        return;
                      }
                      setStep((prev) => Math.min(prev + 1, steps.length - 1));
                    }}
                    className="btn btn-brand"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button disabled={loading} className="btn btn-brand">
                    {loading ? "Guardando…" : editing ? "Actualizar" : "Crear barbero"}
                  </button>
                )}
              </div>
            </div>
          </form>

          <aside
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 p-6 text-white shadow-inner"
            style={{
              backgroundImage: `radial-gradient(circle at top, ${accent}33, transparent 70%)`,
            }}
          >
            <div className="absolute inset-0 rounded-3xl border border-white/5" />
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/20 bg-neutral-950">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-semibold">
                      {nombre ? nombre.slice(0, 1).toUpperCase() : "B"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{nombre || "Tu barbero"}</h3>
                  {slogan && <p className="text-sm text-emerald-100">{slogan}</p>}
                  {parsedExperiencia != null && (
                    <p className="text-xs text-zinc-300">{parsedExperiencia} año(s) de experiencia</p>
                  )}
                </div>
              </div>

              {descripcion && (
                <p className="text-sm text-zinc-300">{descripcion}</p>
              )}

              {especialidades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {especialidades.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white"
                    >
                      <Hash className="h-3 w-3" /> {item}
                    </span>
                  ))}
                </div>
              )}

              {previewServicios.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Servicios</p>
                  <ul className="space-y-2 text-sm text-white/90">
                    {previewServicios.map((s) => (
                      <li key={s.id} className="flex items-center justify-between">
                        <span>{s.nombre}</span>
                        {s.duracionMin ? <span className="text-xs text-zinc-400">{s.duracionMin} min</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 text-sm text-zinc-200">
                {telefono && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="h-4 w-4" /> {telefono}
                  </div>
                )}
                {email && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Mail className="h-4 w-4" /> {email}
                  </div>
                )}
                {instagram && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Hash className="h-4 w-4" /> {displayInstagram}
                  </div>
                )}
                {portafolioUrl && (
                  <a
                    href={portafolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-emerald-100 underline decoration-dotted"
                  >
                    Portafolio
                  </a>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function UserBadge({ nombre }: { nombre: string }) {
  if (!nombre.trim()) return null;
  return (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
      {nombre.length > 20 ? `${nombre.slice(0, 20)}…` : nombre}
    </div>
  );
}
