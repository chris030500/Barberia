import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { updateUsuarioMe } from "@/api/usuarios/services";
import type { Role, UpdateMePayload } from "@/api/usuarios/types";
import { useAuth } from "@/stores/auth";

const TELEFONO_REGEXP = /^\+[1-9]\d{6,14}$/;

export default function CompletarPerfilPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth((state) => ({
    user: state.user,
    setUser: state.setUser,
  }));
  const faltantes = (location.state as any)?.faltantes as string[] | undefined;
  const [nombre, setNombre] = useState(() => user?.nombre ?? "");
  const [telefono, setTelefono] = useState(() => user?.telefonoE164 ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre ?? "");
    setTelefono(user.telefonoE164 ?? "");
  }, [user?.nombre, user?.telefonoE164]);

  const perfilCompleto = useMemo(() => {
    const nombreOk = Boolean(nombre.trim());
    const telOk = TELEFONO_REGEXP.test(telefono.trim());
    return nombreOk && telOk;
  }, [nombre, telefono]);

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    if (saving) return;

    const nombreTrim = nombre.trim();
    const telTrim = telefono.trim();

    if (!nombreTrim) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!TELEFONO_REGEXP.test(telTrim)) {
      toast.error("Ingresa un teléfono válido en formato E.164 (ej. +525512345678)");
      return;
    }

    try {
      setSaving(true);
      const payload: UpdateMePayload = {
        nombre: nombreTrim,
        telefonoE164: telTrim,
      };
      const updated = await updateUsuarioMe(payload);
      const normalizeRoles = (roles: unknown): Role[] => {
        if (!Array.isArray(roles)) return [];
        return roles.filter((rol): rol is Role =>
          rol === "ADMIN" || rol === "BARBERO" || rol === "CLIENTE"
        );
      };
      const roles = normalizeRoles(updated.roles ?? user?.roles);
      if (user) {
        setUser({
          ...user,
          ...updated,
          roles,
        });
      }
      toast.success("Perfil actualizado correctamente");
      const from = (location.state as any)?.from?.pathname ?? "/booking";
      navigate(from, { replace: true, state: {} });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Ese teléfono ya está asociado a otra cuenta. Usa uno diferente.");
      } else {
        const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo guardar";
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-container space-y-8 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_65%)]" aria-hidden />
        <div className="relative space-y-3">
          <p className="inline-flex items-center gap-2 text-sm text-emerald-200">
            <Sparkles className="h-4 w-4" /> Perfil verificado
          </p>
          <h1 className="text-3xl font-semibold text-white">Completa tus datos de contacto</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Tener tu nombre y teléfono en formato internacional nos permite confirmar citas, enviarte recordatorios y reaccionar rápidamente ante cambios en la agenda.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_45px_-35px_rgba(16,185,129,0.6)]">
        <h2 className="mb-2 text-xl font-semibold text-white">Datos obligatorios</h2>
        <p className="text-sm text-white/60 mb-6">
          Ingresa un nombre reconocible y un teléfono válido en formato E.164 para recibir notificaciones sin fricción.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          {faltantes?.length ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-200 text-sm">
              <p className="font-semibold">Datos faltantes:</p>
              <ul className="list-disc pl-5">
                {faltantes.map((campo) => (
                  <li key={campo}>{campo}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <label className="block text-sm text-zinc-400 mb-1" htmlFor="nombre">
              Nombre completo
            </label>
            <input
              id="nombre"
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1" htmlFor="telefono">
              Teléfono (formato E.164)
            </label>
            <input
              id="telefono"
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+525512345678"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Incluye el prefijo internacional y asegúrate de que podamos contactarte por este medio.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-brand w-full disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving || !perfilCompleto}
          >
            {saving ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
