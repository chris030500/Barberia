import { useEffect, useState } from "react";
import { listServicios, type ServicioDTO } from "@/api/servicios/services";
import { listBarberosLite, type BarberoLite } from "@/api/barberos";
import BookingDateStep from "@/components/booking/BookingDateStep";
import { createCita } from "@/api/citas";
import toast from "react-hot-toast";
import { localInputToIso } from "@/lib/datetime";

export default function BookingPage() {
  const [servicios, setServicios] = useState<ServicioDTO[]>([]);
  const [barberos, setBarberos] = useState<BarberoLite[]>([]);
  const [servicioId, setServicioId] = useState<number | "">("");
  const [barberoId, setBarberoId] = useState<number | "">("");
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [hhmm, setHhmm] = useState<string>("");

  // cliente
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [sv, bs] = await Promise.all([
          listServicios({ page: 0, size: 500, sort: "nombre,asc", soloActivos: true }),
          listBarberosLite()
        ]);
        const arr = ((sv as any).data?.content ?? (sv as any)?.content ?? []) as ServicioDTO[];
        setServicios(arr);
        setBarberos(bs);
      } catch (e) {
        console.error(e);
        toast.error("No se pudieron cargar catálogos");
      }
    })();
  }, []);

  const onPickSlot = (hhmmSel: string) => setHhmm(hhmmSel);

  const reservar = async () => {
    try {
      if (!servicioId) return toast.error("Selecciona un servicio");
      if (!barberoId) return toast.error("Selecciona un barbero");
      if (!fecha || !hhmm) return toast.error("Selecciona un horario");
      if (!nombre.trim()) return toast.error("Ingresa tu nombre");

      const iso = localInputToIso(`${fecha}T${hhmm}:00`);
      const res = await createCita({
        barberoId: Number(barberoId),
        servicioId: Number(servicioId),
        clienteNombre: nombre.trim(),
        clienteTelE164: tel.trim() || null,
        inicio: iso,
        overrideDuracionMin: null,
        overridePrecioCentavos: null,
        notas: null
      });
      const saved = (res as any).data ?? res;
      toast.success("Cita reservada");
      // redirige o muestra confirmación
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "No se pudo reservar";
      if (String(msg).toLowerCase().includes("empalm")) {
        toast.error("Ese horario se empalmó, intenta otro");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="app-container py-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface">
          <h2 className="card-title mb-4">Reservar cita</h2>

          {/* Servicio */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Servicio</label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* Barbero */}
          <div className="mb-4">
            <label className="block text-sm text-zinc-400 mb-1">Barbero</label>
            <select
              value={barberoId}
              onChange={(e) => setBarberoId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
            >
              <option value="">— Selecciona —</option>
              {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>

          {/* Fecha y slots */}
          {!!servicioId && !!barberoId && (
            <div className="mb-4">
              <BookingDateStep
                barberoId={Number(barberoId)}
                servicioId={Number(servicioId)}
                fecha={fecha}
                onFechaChange={setFecha}
                onPickSlot={onPickSlot}
              />
              {hhmm && <p className="mt-2 text-sm text-emerald-400">Seleccionado: {fecha} {hhmm}</p>}
            </div>
          )}
        </div>

        <div className="card-surface">
          <h2 className="card-title mb-4">Tus datos</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nombre *</label>
              <input className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
                     value={nombre} onChange={(e)=>setNombre(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Teléfono (E.164)</label>
              <input className="w-full rounded-xl border border-zinc-800 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-700"
                     value={tel} onChange={(e)=>setTel(e.target.value)} placeholder="+5255..." />
            </div>
            <div className="flex justify-end">
              <button onClick={reservar} className="btn btn-brand">Reservar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
