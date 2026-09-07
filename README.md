# Órbita — Dashboard

Frontend de **Órbita**: un CRM conversacional multi-tenant con agentes de IA sobre WhatsApp e Instagram (TikTok en la fase 1). Este repo es el dashboard, hecho con Next.js (App Router).

## Qué es Órbita y quién lo usa

En LATAM la venta de una PYME ocurre por WhatsApp, no por correo ni CRM tradicional: el teléfono del negocio lo tiene una sola persona, varios vendedores se pisan, nada queda registrado y no hay forma de medir nada. Órbita reúne esas conversaciones en un solo lugar con un agente de IA que responde y **ejecuta acciones sobre el CRM** cuando nadie está disponible. Piénsalo como el WhatsApp del negocio, pero para un equipo, con un tablero de ventas al lado.

Tres perfiles usan este dashboard, con necesidades muy distintas (detalle completo en la guía de pantallas):

- **El vendedor** — vive ocho horas al día en la bandeja de conversaciones. Necesita rapidez y cero fricción; suele estar en el celular.
- **El dueño o gerente** — entra pocas veces al día a ver reportes y configurar. Poca paciencia, menos tiempo.
- **El administrador** — conecta WhatsApp, invita al equipo, configura el agente de IA. Entra poco pero necesita entender qué está haciendo.

Seis principios de diseño gobiernan todo el producto (ver [`../docs/Orbita-Guia-de-Pantallas.pdf`](../docs/Orbita-Guia-de-Pantallas.pdf) para el detalle): la bandeja es el producto; que se parezca a WhatsApp donde tenga sentido; nada de vocabulario técnico visible al usuario; el celular importa de verdad; nunca una pantalla en blanco; los errores hablan en español.

## Estado actual

Este repo es todavía el scaffold base de `create-next-app`: no hay pantallas, cliente de API, autenticación ni capa de estado propios del producto. Todo eso se construye desde cero, consumiendo la API en [`orbita-api`](../Orbita) (repo `Orbita`), cuyo modelo de dominio (tenants, usuarios, membresías, conversaciones, mensajes, agentes de IA, CRM, eventos) vive en `../docs/orbita-schema.dbml`. El backend ya tiene el registro de organización (`POST /api/organizations`) y el aislamiento multi-tenant funcionando — ver el README de ese repo para el estado exacto.

### Qué construir primero (orden de esfuerzo recomendado)

Según la guía de pantallas, si hay que elegir dónde poner el esfuerzo, en este orden:

1. **La bandeja de conversaciones y la vista de conversación** — es donde el usuario vive ocho horas al día; merece más iteraciones que todo lo demás junto.
2. **Conectar WhatsApp** — el paso técnicamente más difícil para una persona no técnica; si falla, el cliente nunca llega a usar el producto.
3. **Configurar el asistente de IA** — el diferenciador de producto, y el más fácil de hacer intimidante (nada de "prompt", "temperatura" ni "tokens" visibles).

Las pantallas están agrupadas en tres tandas en la guía: **Tanda 1 (lo esencial)** — registro, login, primeros pasos, estructura de la app, conectar WhatsApp, bandeja, conversación, datos de contacto — es donde debe ir el 60% del esfuerzo de diseño/implementación inicial. **Tanda 2** añade ventas (pipeline kanban) y el asistente de IA. **Tanda 3** añade plantillas, campañas, reportes y ajustes. El detalle pantalla por pantalla (para qué sirve, qué debe poder hacer, qué cuidar) está en [`../docs/Orbita-Guia-de-Pantallas.pdf`](../docs/Orbita-Guia-de-Pantallas.pdf).

Explícitamente fuera de alcance por ahora (no diseñar/construir todavía): app móvil nativa, TikTok como canal, constructor visual de automatizaciones, modo oscuro, otros idiomas, marketplace de plantillas.

## Convenciones

Convenciones obligatorias de desarrollo (SOLID, tipado ultra estricto — nada de `any`, testing, commits, branching) están en [`CLAUDE.md`](./CLAUDE.md). Importante: los commits **nunca** llevan coautoría de IA (`Co-Authored-By`, `Claude-Session`, etc.) — el autor es siempre la persona.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5 (`strict: true`) · Tailwind CSS 4 · ESLint 9 (flat config) · gestor de paquetes **bun**.

## Requisitos

- [bun](https://bun.sh) (gestor de paquetes y runtime; ver la versión pinneada en `package.json` → `packageManager`) — nunca usar `npm`/`yarn`/`pnpm` en este repo, rompe el lockfile.
- Node.js no hace falta instalarlo aparte; bun trae su propio runtime.
- Opcional pero recomendado para trabajar contra datos reales: el backend (`../Orbita`) corriendo en paralelo — ver su README para levantarlo.

## Cómo correrlo (de cero a dashboard corriendo)

```bash
# 0. Clonar y entrar al repo
git clone <url-del-repo>
cd orbita-front

# 1. Instalar dependencias
bun install

# 2. Levantar el servidor de desarrollo
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000).

No hay variables de entorno propias todavía (no existe `.env.example`) — cuando la primera feature agregue un cliente HTTP hacia el backend, documentar aquí la variable con la URL base de la API.

### Problemas comunes al levantar el entorno

- **`bun install` falla o el lockfile queda inconsistente**: confirmar que se está usando `bun`, no `npm`/`yarn` — mezclar gestores de paquetes corrompe `bun.lock`.
- **Cambios en `AGENTS.md` que "reaparecen" solos**: es esperado, `next dev` lo regenera en cada corrida (ver `CLAUDE.md`) — no es un archivo para editar a mano.

## Comandos comunes

```bash
bun run build      # build de producción
bun run start      # servir el build de producción
bun run lint       # ESLint
bunx tsc --noEmit  # type-check (no hay script dedicado todavía)
```

No hay test runner configurado todavía — según la convención de este repo, instalarlo (Vitest + Testing Library para unitarios, Playwright para e2e) es parte de la primera feature, no un paso posterior.

Ver [`HANDOFF.md`](./HANDOFF.md) para una foto del estado actual del trabajo (qué feature está en curso, qué decisiones recientes no hay que reabrir, qué falta) — es lo primero que hay que leer al retomar el repo después de un tiempo sin tocarlo.

## Plantilla de Pull Request

Usar esta plantilla para todo PR de este repo (una feature por PR, una rama `feature/<nombre>` por feature — ver la convención de branching en `CLAUDE.md`):

```markdown
# [Nombre de la PR]

## Historia de Usuario
[HU-XX - Nombre de la tarea]

## ¿Qué hace este PR?

Descripción clara y concisa de los cambios realizados.

## Cambios Realizados

- [ ] Cambio 1
- [ ] Cambio 2
- [ ] Cambio 3

## Cómo Probar

1. Paso 1 para reproducir / verificar el comportamiento
2. Paso 2
3. Resultado esperado

## Checklist

- [ ] El código compila sin errores
- [ ] Las pruebas pasan localmente
- [ ] No se dejó código comentado ni console.log de depuración
- [ ] La rama está actualizada con la rama base
```

## Repos y documentos relacionados

- [`orbita-api`](../Orbita) — backend (ASP.NET Core, Clean Architecture) que consume este dashboard.
- `../docs` — carpeta compartida con:
  - [`OrbitaContextoyCompetencia.pdf`](../docs/OrbitaContextoyCompetencia.pdf) — estudio de mercado, competidores y posicionamiento (útil para entender *por qué* cada pantalla existe).
  - [`Orbita-Guia-de-Pantallas.pdf`](../docs/Orbita-Guia-de-Pantallas.pdf) — guía de pantallas para diseño: propósito, acciones, qué debe saltar a la vista y errores comunes de cada pantalla.
  - [`Orbita-Historias-de-Usuario.pdf`](../docs/Orbita-Historias-de-Usuario.pdf) — backlog del MVP con criterios de aceptación.
  - [`orbita-schema.dbml`](../docs/orbita-schema.dbml) — modelo de datos completo.
  - [`OrbitaDASArquitectura.pdf`](../docs/OrbitaDASArquitectura.pdf) — arquitectura del backend, útil para entender los contratos que expondrá la API.
