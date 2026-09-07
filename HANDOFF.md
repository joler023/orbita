# HANDOFF

Documento de traspaso de contexto para quien retome este repo (otro desarrollador, u otra sesión de Claude Code). Objetivo: que puedas seguir trabajando sin releer todo el historial de commits. Se actualiza al terminar cada feature — no es una bitácora histórica, es una foto del momento.

Para las reglas de arquitectura/negocio vinculantes (que no cambian de una feature a otra), ver [`CLAUDE.md`](./CLAUDE.md). Este archivo es sobre *estado*, `CLAUDE.md` es sobre *reglas*.

## Última actualización

**2026-09-06** — repo todavía en scaffold; solo se ha tocado documentación (`README.md`, `CLAUDE.md`) hasta ahora.

## Qué está implementado

Nada de producto todavía. Este repo es el scaffold base de `create-next-app` (`bun create next-app`): no hay pantallas propias, cliente de API, autenticación ni capa de estado. Ver "Estado actual" en [`README.md`](./README.md).

El backend (`../Orbita`) ya expone registro de organización, login/sesión e invitaciones de equipo — ver su propio `HANDOFF.md` para el detalle exacto de lo implementado ahí. Este repo aún no consume ninguno de esos endpoints.

## Qué construir primero

Ver "Qué construir primero" en `README.md` (viene de `../docs/Orbita-Guia-de-Pantallas.pdf`): bandeja de conversaciones primero, luego conectar WhatsApp, luego el asistente de IA. Tanda 1 de pantallas (registro, login, primeros pasos, bandeja, conversación, datos de contacto) es donde va el 60% del esfuerzo inicial.

Como el backend de identidad ya existe (`POST /api/organizations`, `POST /api/auth/login|refresh|logout`, invitaciones de equipo), la primera pantalla real con sentido para empezar es **registro + login**, no la bandeja — ya hay API contra la cual construirla, y valida el cliente HTTP/manejo de cookies antes de meterse con WebSockets o UI más compleja.

## Decisiones que ya se tomaron (no reabrir sin motivo)

- El backend transporta el JWT de acceso en una cookie `httpOnly`/`SameSite=Lax` (`access_token`), no en un header — el cliente HTTP de este repo debe enviar credenciales (`credentials: "include"` o equivalente) en vez de manejar el token manualmente.
- No hay claim de tenant en el JWT — cualquier pantalla que necesite saber "en qué organización estoy" debe resolverlo explícitamente (endpoint o parámetro de ruta), no asumirlo del token de sesión.
- Todavía no existe test runner — instalarlo (Vitest + Testing Library, Playwright para e2e) es parte de la primera feature branch, no un paso posterior (ver `CLAUDE.md`).

## Cómo retomar el trabajo

1. Leer "Qué está implementado" arriba y en `README.md` de ambos repos para saber qué hay disponible en el backend.
2. `git fetch && git log --oneline develop..origin/develop` para confirmar que no hay nada mergeado que no se haya bajado.
3. Cada feature nueva es su propia rama `feature/<nombre>` desde `develop` (ver `CLAUDE.md`).
4. Antes de dar una feature por terminada: `bun run lint`, `bunx tsc --noEmit` sin errores, tests en verde, y actualizar `README.md` y este archivo.

## Riesgos y deuda conocida

- **Sin cliente HTTP ni manejo de autenticación todavía** — la primera feature que toque el backend define ese patrón para todo lo que siga; vale la pena pensarlo bien en vez de improvisarlo endpoint por endpoint.
- **Sin test runner configurado** — bloquea que cualquier feature cumpla la convención de "nada se entrega sin pruebas" hasta que se instale.
