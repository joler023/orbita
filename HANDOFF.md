# HANDOFF

Documento de traspaso de contexto para quien retome este repo. Objetivo: seguir trabajando sin releer todo el historial. Se actualiza al terminar cada feature — no es una bitácora histórica, es una foto del momento.

Para las reglas de arquitectura/negocio, ver [`CLAUDE.md`](./CLAUDE.md). Este archivo es sobre *estado*.

## Última actualización

**2026-09-07** — `ORB-D01` (sistema de diseño y shell del dashboard) en `feature/d01-dashboard-shell`.

## Qué está implementado

- Paleta Órbita (50–900) en Tailwind 4 y componentes base: botón, campo, modal, tabla, toast, empty state, skeleton.
- Shell autenticado según Figma: sidebar, top bar, card de usuario, drawer móvil.
- Rutas `/t/[tenantId]/…` (Inicio con KPIs placeholder; el resto empty states). Stub de marketing en `/`.
- Cliente HTTP con `credentials: "include"`, tipos generados desde [`openapi/orbita.json`](./openapi/orbita.json), refresh en 401 hacia `POST /api/auth/refresh`.
- Login, registro (register → login), 2FA en dos pasos, recuperar contraseña. Copy de error en español.
- Vitest + Playwright.

## Decisiones que ya se tomaron (no reabrir sin motivo)

- Un solo app Next.js 16 con route groups `(marketing)` / `(auth)` / `(app)`. El sitio público completo es `ORB-D12`.
- Tenant en la URL, no en el JWT. El token solo lleva `sub`.
- Nadie escribe `fetch` en componentes: pasar por [`lib/api/client.ts`](./lib/api/client.ts).
- Tras registro, el front hace login porque `POST /api/organizations` no setea cookies.
- Organización activa: `localStorage` (`orbita.lastTenantId`) hasta que Track A exponga membresías.

## Hueco con Track A (identidad)

`GET /api/auth/me` solo devuelve `{ userId }`. Login no trae tenant. RLS impide listar membresías sin tenant ambiente. Pedir:

- `memberships: [{ tenantId, name, role }]` en login y `/api/auth/me`.
- `Domain=.orbita.com` en las cookies de producción ([`AuthCookies`](../orbita-api/Orbita.Api/Identity/AuthCookies.cs) hoy no setea `Domain`).

Mientras tanto, un usuario que entra en un dispositivo nuevo sin `lastTenantId` cae en `/sin-organizacion`.

## Cómo retomar

1. `cp .env.example .env.local` y apuntar `NEXT_PUBLIC_API_BASE_URL` a la API (por defecto `http://localhost:5091`).
2. `bun install && bun dev`.
3. Regenerar tipos si cambia el contrato: levantar la API, `bun run refresh:openapi`, `bun run generate:api`. No editar `lib/api/generated/schema.d.ts` a mano.

## Fuera de D01

Bandeja, contactos, pipeline, campañas, reportes reales, SignalR, sitio marketing completo.
