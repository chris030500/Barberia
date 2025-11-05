import { useAuth } from '@/stores/auth'
import Button from '@/components/Button'

export default function Home() {
  const { user, logout } = useAuth()
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Hola {user?.nombre ?? 'usuario'} 👋</h1>
        <p className="text-[var(--text-muted)]">Bienvenido a tu panel de administración.</p>
      </div>

      <section className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Citas del día", value: "12", color: "from-emerald-500/40" },
          { title: "Clientes activos", value: "48", color: "from-cyan-500/40" },
          { title: "Ganancias", value: "$3,240", color: "from-violet-500/40" },
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-[var(--border)] bg-gradient-to-br {card.color} via-transparent to-black/20 p-6">
            <p className="text-sm text-[var(--text-muted)]">{card.title}</p>
            <h2 className="text-3xl font-bold mt-2">{card.value}</h2>
          </div>
        ))}
      </section>

      <Button variant="danger" onClick={logout}>
        Cerrar sesión
      </Button>
    </div>
  )
}
