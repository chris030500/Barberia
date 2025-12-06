# Plan de mejoras integrales

Este documento resume oportunidades de mejora transversales para backend, frontend y operación. Sirve como hoja de ruta priorizada.

## Backend
- **Seguridad y autenticación**
  - Activar rotación y revocación de refresh tokens (persistir `jti` y fecha de expiración).
  - Configurar cookies según entorno: `secure`/`SameSite=None` solo en producción y `HttpOnly` siempre.
  - Aplicar rate limiting a `/auth` y `/citas` (por IP/uid) con bucket4j o Spring Cloud Gateway.
- **Fiabilidad y datos**
  - Añadir migraciones de base de datos versionadas (Flyway/Liquibase) y validar el schema en arranque.
  - Crear índices para consultas frecuentes: `citas(barbero_id, inicio)`, `citas(cliente_id, inicio)`, `usuarios(firebase_uid)`.
  - Normalizar el módulo de cliente (tabla `cliente` y relación en citas) para habilitar historial y marketing.
- **Observabilidad**
  - Exponer métricas con Micrometer/Prometheus y health checks liveness/readiness.
  - Añadir trazas distribuídas (OpenTelemetry) en reservas y autenticación.
- **Performance**
  - Eliminar `fetch join` paginados; usar proyecciones DTO o consultas en dos pasos para barberos/servicios.
  - Cachear catálogos de servicios y barberos activos con expiración corta (Caffeine/Redis).
- **Calidad**
  - Añadir tests de integración para `CitaService` (reglas de solape, perfil incompleto, bloqueos) y para `UsuarioController` (actualización de teléfono y nombre).

## Frontend
- **UX y accesibilidad**
  - Incorporar `aria-*`, focus management y estados de carga/éxito en formularios críticos (login, booking, completar perfil).
  - Agregar modo oscuro y preferencias persistentes (localStorage) con un toggle global.
- **Rendimiento**
  - Dividir el bundle por rutas con `React.lazy`/`Suspense`; precargar solo las vistas usadas tras login.
  - Memorizar listas extensas (barberos, servicios) y usar virtualización si superan ~100 ítems.
- **Robustez**
  - Centralizar manejo de errores HTTP en un `ErrorBoundary` y toasts homogéneos.
  - Añadir pruebas E2E (Playwright/Cypress) para el flujo de completar perfil + reservar.
- **Colaboración/DX**
  - Definir convenciones de estilo (ESLint/Prettier) y scripts de `lint` en CI.
  - Documentar mocks de API y datos de ejemplo para desarrollo sin backend.

## Operación y despliegue
- **CI/CD**
  - Pipeline que ejecute lint, pruebas, builds de frontend y backend, y genere artefactos versionados.
  - Escanear dependencias (OWASP Dependency-Check/Snyk) y contenedores (Trivy).
- **Entornos**
  - Variables centralizadas por ambiente (`.env` + Kubernetes secrets), con toggles para notificaciones y pagos.
  - Backups automáticos de base de datos y restauración probada en staging.

## Prioridad sugerida
1. Seguridad y consistencia de datos (tokens, migraciones, índices, cliente real).
2. Observabilidad y performance (métricas, logs estructurados, cacheo, eliminación de fetch joins).
3. Experiencia de usuario (accesibilidad, error handling, modo oscuro, formularios robustos).
4. Calidad continua (tests, lint, CI/CD, escaneos).
