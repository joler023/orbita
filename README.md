# Órbita — Dashboard

Frontend de Órbita: un CRM conversacional multi-tenant con agentes de IA sobre WhatsApp e Instagram (TikTok en la fase 1). Este repo es el dashboard, hecho con Next.js (App Router).

## Estado actual

Este repo es todavía el scaffold base de `create-next-app`: no hay pantallas, cliente de API, autenticación ni capa de estado propios del producto. Todo eso se construye desde cero, consumiendo la API en [`orbita-api`](https://github.com/joler023/orbita-api) (repo `Orbita`), cuyo modelo de dominio (tenants, conversaciones, mensajes, agentes de IA, CRM, eventos) vive en `../docs/orbita-schema.dbml`.

Convenciones obligatorias de desarrollo (SOLID, tipado ultra estricto — nada de `any`, testing, commits, branching) están en [`CLAUDE.md`](./CLAUDE.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 (`strict: true`) · Tailwind CSS 4 · ESLint 9 (flat config) · gestor de paquetes **bun**.

## Cómo correrlo

```bash
bun install
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos comunes

```bash
bun run build      # build de producción
bun run start      # servir el build de producción
bun run lint       # ESLint
bunx tsc --noEmit  # type-check (no hay script dedicado todavía)
```

No hay test runner configurado todavía — según la convención de este repo, instalarlo (Vitest + Testing Library para unitarios, Playwright para e2e) es parte de la primera feature, no un paso posterior.

## Repos relacionados

- [`orbita-api`](https://github.com/joler023/orbita-api) — backend (ASP.NET Core, Clean Architecture) que consume este dashboard.
- `../docs` — modelo de datos, historias de usuario y guía de pantallas del producto.
