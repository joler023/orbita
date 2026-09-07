# Órbita — Dashboard

Frontend de **Órbita**: un CRM conversacional multi-tenant con agentes de IA sobre WhatsApp e Instagram (TikTok en la fase 1). Este repo es el dashboard, hecho con Next.js (App Router).

## Estado actual

`ORB-D01` (shell), `ORB-D04` (pipelines) y `ORB-D05` (kanban) van apilados. Inicio sigue con KPIs vacíos. Contactos y el sitio público todavía no.

El backend vive en [`orbita-api`](https://github.com/joler023/orbita-api). Este dashboard llama a `api` directo (sin BFF), con `credentials: "include"`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 (`strict: true`) · Tailwind CSS 4 · ESLint 9 · Vitest · Playwright · gestor de paquetes **bun**.

## Cómo correrlo

```bash
bun install
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5091
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000). La API debe estar corriendo para registro/login reales.

### Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Origen de la API (CORS ya permite `http://localhost:3000`) |

## Comandos comunes

```bash
bun run lint         # ESLint
bunx tsc --noEmit    # type-check
bun run test         # Vitest
bun run test:e2e     # Playwright (instalar Chromium: bunx playwright install chromium)
bun run generate:api # tipos desde openapi/orbita.json
bun run refresh:openapi  # baja el OpenAPI de una API en marcha
```

## Convenciones

Ver [`CLAUDE.md`](./CLAUDE.md). Commits sin coautoría de IA. Una feature por rama `feature/<nombre>` desde `develop`.

Ver [`HANDOFF.md`](./HANDOFF.md) para el estado de trabajo y el contrato pendiente con identidad (listar membresías).

## Repos relacionados

- [`orbita-api`](https://github.com/joler023/orbita-api) — backend (ASP.NET Core).
- `../docs` — modelo de datos, historias de usuario y guía de pantallas.
