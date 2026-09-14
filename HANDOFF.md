# HANDOFF

Documento de traspaso de contexto para quien retome este repo. Objetivo: seguir trabajando sin releer todo el historial. Se actualiza al terminar cada feature — no es una bitácora histórica, es una foto del momento.

Para las reglas de arquitectura/negocio, ver [`CLAUDE.md`](./CLAUDE.md). Este archivo es sobre *estado*.

## Última actualización

**2026-09-14** — Track C (agentes de IA) en el frontend: `ORB-C10` completo y `ORB-C11` a falta de créditos del proveedor. Sin mergear: son 11 ramas apiladas sobre `develop` (ver [PR stack](#pr-stack)).

## Qué está implementado

Sobre lo que dejó `ORB-D01` (paleta, shell, cliente HTTP, login/registro/2FA/recuperar, Vitest + Playwright):

**Bloques compartidos** (`components/ui/`, para cualquier track): `status-badge`, `textarea`, `switch`, `radio-card-group`, `checkbox-card`, `tabs`, `file-drop`, `confirm-dialog`, `permission-state`, `error-state`, `level-slider`, `password-input`, `scroll-area`, `screen-transition`, y `toast` rediseñado (ícono, cierre manual, entrada/salida animada; los errores no se auto-descartan). Más `lib/hooks/use-polling` y los íconos de Figma en `components/icons/nav-icons.tsx`.

**Marca y shell**: logo oficial en `public/brand/` (SVG vectorial + PNG del manual), sidebar fijo de 240 px con las medidas de Figma, contenido con scroll propio, transición suave entre pantallas y `SignOutButton` compartido con aviso.

**Agente IA** (`/t/[tenantId]/agente`): lista de asistentes con activar/pausar y eliminar; editor con pestañas Instrucciones (nombre, personalidad, instrucciones con ejemplos copiables y los tres deslizadores de estilo), Herramientas (catálogo del backend, las no disponibles explican por qué), Conocimiento (subir archivos o pegar texto, estado por documento con refresco cada 3 s solo mientras algo se indexa, reindexar y eliminar) y Pruebas (chat con la traza: herramientas usadas, documentos citados, tokens y costo). Guardar deja borrador, Publicar lo pone en vivo, Descartar lo borra.

**Sesión**: `GET /api/auth/me` devuelve identidad y membresías, así que al iniciar sesión se entra directo a la organización (la última usada si se pertenece a varias) y `/sin-organizacion` queda solo para quien no pertenece a ninguna.

## Decisiones que ya se tomaron (no reabrir sin motivo)

- Un solo app Next.js 16 con route groups `(marketing)` / `(auth)` / `(app)`. El sitio público completo es `ORB-D12`.
- Tenant en la URL, no en el JWT. El token solo lleva `sub`.
- Nadie escribe `fetch` en componentes: pasar por [`lib/api/client.ts`](./lib/api/client.ts).
- Tras registro, el front hace login porque `POST /api/organizations` no setea cookies.
- La identidad **no** se copia a `localStorage`: viene de `/api/auth/me`. Ahí solo queda `orbita.lastTenantId`, y como preferencia de "la última organización que usaste", no como fuente de verdad.
- El rol que devuelve `/me` sirve para **esconder**, no para autorizar: el control real es el 403 del backend (`ORB-A08`).
- Nada de jerga de modelos en la interfaz: el backend expone `style` (formal↔cercano, breve↔detallado, neutro↔entusiasta) y nunca `prompt`, `modelo`, `temperatura` ni `tokens`. Hay pruebas que fallan si esas palabras aparecen.
- Los tipos de las rutas de Track C se escriben a mano en `lib/api/`: el snapshot `openapi/orbita.json` es de `develop` y no las incluye todavía.

## Estado del backend

Se coordina por escrito en [`local/Acuerdos-Frontend-Backend.md`](./local/Acuerdos-Frontend-Backend.md) (31 preguntas con su respuesta). Lo relevante hoy:

- Track C (agentes, conocimiento, búsqueda, banco de pruebas) está en un stack de ramas **sin mergear** en `orbita-api`.
- El endpoint de membresías (`/api/auth/me`) es de Track A, pero lo construyó la sesión de Track C con autorización expresa del equipo, ante un bloqueo de producto: sin él no se podía usar la app en un navegador nuevo. Vive en `feature/a16-current-user-memberships` y añade una política RLS sobre `memberships` más un `app.user_id` en el `UnitOfWork`; **quien lleve Track A debería revisarlo antes de que entre a `develop`**.
- Para probar el front con todo junto, el backend dejó `integration/track-c-with-a16` (solo para preview, no para mergear).

### Lo único que falta para que el agente responda de verdad

La cuenta de OpenRouter está en USD 0. Los embeddings devuelven 402, así que los documentos se quedan en "En cola" y el chat de pruebas responde 502 ("El asistente no pudo responder ahora mismo"). El front ya muestra ambos casos como corresponde; con saldo, funcionan sin tocar código.

## PR stack

Cada rama sale de la anterior y su PR va contra la anterior. `feature/c-shared-ui` es la única que va contra `develop`.

| # | Rama | Qué trae |
|---|---|---|
| 1 | `feature/c-shared-ui` | Bloques compartidos, tokens de estado y arreglos del cliente HTTP |
| 2 | `feature/c10-agents-api` | `lib/api/ai-agents` y `lib/api/knowledge`, errores en español |
| 3 | `feature/c10-agent-list` | Pantalla 2.5: lista, activar/pausar, eliminar |
| 4 | `feature/c10-agent-editor` | Pantalla 2.6: instrucciones, tono y herramientas |
| 5 | `feature/c-shell-brand` | Logo oficial, sidebar fijo e íconos de Figma |
| 6 | `feature/c10-knowledge-base` | Pantalla 2.7: documentos con estado y refresco |
| 7 | `feature/c10-agent-style-drafts` | Tres ejes de estilo, borrador y publicación |
| 8 | `feature/c11-test-bench` | Pantalla 2.8: chat de prueba con traza |
| 9 | `feature/c-access-screens` | Cerrar sesión, campo de contraseña con ojito, pantalla sin organización |
| 10 | `feature/c-shared-ux` | Scroll compartido, avisos, transiciones y cursor de los botones |
| 11 | `feature/c-session-memberships` | `/me` con membresías: entrar directo a tu organización |

## Cómo retomar

1. `cp .env.example .env.local` y apuntar `NEXT_PUBLIC_API_BASE_URL` a la API (por defecto `http://localhost:5091`).
2. `bun install && bun dev`.
3. Para la API: levantarla desde `orbita-api` con el perfil `http` (`dotnet run --project Orbita.Api --launch-profile http`). El perfil `https` redirige el 5091 y rompe el CORS del front.
4. Regenerar tipos cuando el contrato entre a `develop`: levantar la API, `bun run refresh:openapi`, `bun run generate:api`. No editar `lib/api/generated/schema.d.ts` a mano.

## Lo que sigue en Track C

- Barra superior de Figma (selector de asistente con Guardar y Publicar arriba); hoy esos botones están al pie del editor.
- Prueba e2e del recorrido completo: crear → configurar → subir documento → probar → publicar.
- Pulgar arriba/abajo de `ai_feedback`: el modelo de datos lo pide y ninguna historia lo recoge.

## Fuera de Track C

Bandeja, contactos, pipeline, campañas, reportes reales, SignalR y sitio marketing completo.
