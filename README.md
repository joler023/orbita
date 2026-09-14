# Órbita — Dashboard

Frontend de **Órbita**: un CRM conversacional multi-tenant con agentes de IA sobre WhatsApp e Instagram (TikTok en la fase 1). Este repo es el dashboard, hecho con Next.js (App Router).

## Estado actual

`ORB-D01` dejó el sistema de diseño, el shell autenticado, el cliente HTTP con cookies y login/registro.

Sobre eso está **Track C (agentes de IA)**: `ORB-C10` completo y `ORB-C11` a falta de créditos del proveedor de modelos. La pantalla `/t/[tenantId]/agente` crea y configura asistentes, gestiona sus documentos y los prueba, contra la API real. Al iniciar sesión se entra directo a tu organización, porque `GET /api/auth/me` ya devuelve las membresías.

Todavía no existen la bandeja, el CRM ni el sitio público completo: Inicio muestra KPIs vacíos y el resto del menú son estados vacíos.

Nada de Track C está mergeado: son 11 ramas apiladas sobre `develop`. La tabla del PR stack, lo que falta y el estado del backend están en [`HANDOFF.md`](./HANDOFF.md).

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

Ver [`CLAUDE.md`](./CLAUDE.md). Commits sin coautoría de IA. Cada historia en su rama `feature/<nombre>`; cuando son varias seguidas se apilan (cada una sale de la anterior y su PR va contra la anterior), como está hoy en el PR stack de Track C.

Ver [`HANDOFF.md`](./HANDOFF.md) para el estado de trabajo, el PR stack y los acuerdos con el backend.

## Repos relacionados

- [`orbita-api`](https://github.com/joler023/orbita-api) — backend (ASP.NET Core).
- `../docs` — modelo de datos, historias de usuario y guía de pantallas.
