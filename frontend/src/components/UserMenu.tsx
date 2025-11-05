// src/components/UserMenu.tsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/stores/auth";
import { LogOut } from "lucide-react"; // 👈 para ícono de cerrar sesión
import { motion, AnimatePresence } from "framer-motion";

export default function UserMenu() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const name = user?.nombre ?? "Usuario";
  const avatarLetter = name.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      {/* Botón principal (avatar redondo) */}
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-full border border-border bg-neutral-800 text-sm font-medium flex items-center justify-center hover:bg-neutral-700 transition-colors"
        title={name}
      >
        {avatarLetter}
      </button>

      {/* Menú desplegable */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-neutral-900 shadow-lg ring-1 ring-black/20 overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              {user?.email && (
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              )}
            </div>

            <div className="p-1">
              <button
                onClick={logout}
                disabled={loading}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-60"
              >
                <LogOut size={16} />
                {loading ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}