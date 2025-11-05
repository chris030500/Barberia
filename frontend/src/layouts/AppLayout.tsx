// src/layouts/AppShell.tsx
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50 flex flex-col overflow-x-hidden">
      <Navbar />

      {/* separador fijo del navbar */}
      <div aria-hidden style={{ height: "var(--nav-h)" }} />

      <main className="relative flex-1 overflow-hidden">
        {/* 🎨 Fondo decorativo centrado respecto al viewport (sin safe paddings) */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-neutral-950 overflow-hidden">
          <div
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              h-[580px] w-[105vw]   /* usa vw para evitar offsets por padding */
              bg-gradient-to-br from-emerald-600/25 via-transparent to-cyan-400/20
              blur-3xl rounded-[5rem] pointer-events-none
            "
          />
        </div>

        {/* Contenido: centrado vertical/horizontal y con safe-area simétrica */}
        <div className="app-container safe-inline flex items-center justify-center min-h-[calc(100svh-var(--nav-h))] py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-neutral-800">
        <div className="app-container safe-inline py-4 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} BarberApp · Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}