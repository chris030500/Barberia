import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { updateUsuarioMe } from "@/api/usuarios/services";
import type { UpdateMePayload } from "@/api/usuarios/types";
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
      if (user) {
        setUser({
          ...user,
          ...updated,
          roles: updated.roles ?? user.roles ?? [],
        });
      }
      toast.success("Perfil actualizado correctamente");
      const from = (location.state as any)?.from?.pathname ?? "/booking";
      navigate(from, { replace: true, state: {} });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "No se pudo guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="app-container py-6">
      <div className="max-w-xl mx-auto card-surface">
        <h1 className="card-title mb-2">Completa tu perfil</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Necesitamos tu nombre y un teléfono de contacto para poder agendar tus citas y enviarte recordatorios.
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
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
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
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
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
