# HANDOFF

Documento de traspaso de contexto para quien retome este repo. Objetivo: seguir trabajando sin releer todo el historial. Se actualiza al terminar cada feature — no es una bitácora histórica, es una foto del momento.

Para las reglas de arquitectura/negocio, ver [`CLAUDE.md`](./CLAUDE.md). Este archivo es sobre *estado*.

## Última actualización

**2026-09-16** — Las 11 ramas de Track C (agentes de IA) **ya están mergeadas en `develop`** (PR #8 a #18, en el orden de la tabla de abajo). `ORB-C10` completo, `ORB-C11` a falta de créditos del proveedor (ver `HANDOFF.md` del backend). Encima hay un **segundo stack sin mergear** con los límites del asistente (`ORB-C06` en la 2.6), el horario, el selector de organizaciones y la prueba e2e del recorrido completo — ver [PR stack](#pr-stack).

Además, en `orbita-api` (backend) hay una rama de Track D (`feature/d01-dashboard-shell` ya mergeada; `d02-contactos`, `d03-busqueda`, `d04-pipelines`, `d05-oportunidades`, `d12-sitio-publico`, `d13-exportacion`, `figma-alignment` **todavía no**) — contactos, búsqueda, pipelines, oportunidades, exportación y sitio público. Nadie de este repo la está tomando todavía; queda para quien retome Track D.

Este repo ahora también avanza **Track A** (equipo, facturación, perfil — pantallas 3.8/3.10/3.11 de la guía de diseño) y **Track B** (canales y bandeja — pantallas 1.7–1.10, 3.7 de la guía), porque el desarrollador de Track B en el backend dejó el proyecto. El backend de Track B (`ORB-B01`–`ORB-B08`) se está integrando a `develop` de `orbita-api` en paralelo; hasta que eso aterrice, las pantallas de bandeja/conectar-WhatsApp quedan de esqueleto listas para conectar.

## Qué está implementado

Sobre lo que dejó `ORB-D01` (paleta, shell, cliente HTTP, login/registro/2FA/recuperar, Vitest + Playwright):

**Bloques compartidos** (`components/ui/`, para cualquier track): `status-badge`, `textarea`, `switch`, `radio-card-group`, `checkbox-card`, `tabs`, `file-drop`, `confirm-dialog`, `permission-state`, `error-state`, `level-slider`, `password-input`, `scroll-area`, `screen-transition`, y `toast` rediseñado (ícono, cierre manual, entrada/salida animada; los errores no se auto-descartan). Más `lib/hooks/use-polling` y los íconos de Figma en `components/icons/nav-icons.tsx`.

**Marca y shell**: logo oficial en `public/brand/` (SVG vectorial + PNG del manual), sidebar fijo de 240 px con las medidas de Figma, contenido con scroll propio, transición suave entre pantallas y `SignOutButton` compartido con aviso.

**Agente IA** (`/t/[tenantId]/agente`): lista de asistentes con activar/pausar y eliminar; editor con pestañas Instrucciones (nombre, personalidad, instrucciones con ejemplos copiables y los tres deslizadores de estilo), Herramientas (catálogo del backend, las no disponibles explican por qué), Conocimiento (subir archivos o pegar texto, estado por documento con refresco cada 3 s solo mientras algo se indexa, reindexar y eliminar) y Pruebas (chat con la traza: herramientas usadas, documentos citados, tokens y costo). Guardar deja borrador, Publicar lo pone en vivo, Descartar lo borra.

**Sesión**: `GET /api/auth/me` devuelve identidad y membresías, así que al iniciar sesión se entra directo a la organización (la última usada si se pertenece a varias) y `/sin-organizacion` queda solo para quien no pertenece a ninguna. Quien pertenece a varias cambia entre ellas desde el pie del panel lateral; con una sola, el nombre se muestra como texto y no como un control que no hace nada.

**Límites del asistente** (pestaña «Límites» de la 2.6): temas de los que no habla, con campo de etiquetas, la frase que responde en su lugar y la **frase de traspaso** (`ORB-C07`), que lee el cliente cuando la conversación pasa a una persona. Se guardan en `PUT .../guardrails`. Un tema bloqueado ahora también deja la conversación esperando al equipo, y la pantalla lo dice.

**Horario** (pestaña «Horario»): «Siempre» o «Solo fuera del horario laboral». La segunda pide el horario del equipo, semana completa, con varias franjas por día — un turno partido se conserva en vez de perderse al guardar. El asistente cubre lo que quede fuera (`outsideHours: "AssistantAnswers"`); «Siempre» manda `businessHours: null`. Se guarda en `PUT .../business-hours`.

**Reglas de asignación** (entrada propia bajo la lista de asistentes, `ORB-C08`): quién atiende cada conversación nueva. Cada regla es «llega por [canal] · y menciona [palabra] · la atiende [asistente o Mi equipo]», numerada y con flechas para reordenar, porque **gana la primera que coincida**. Si una regla sin canal ni palabra no está de última, la pantalla avisa que se come todas las de abajo — la API la acepta y no se bloquea, solo deja de pasar inadvertida. **No hay pantalla en la Guía de Diseño para esto**: se diseñó siguiendo la estética del resto, con visto bueno explícito del responsable del track.

**Casos de prueba guardados** (pestaña «Pruebas», `ORB-C11`): una conversación de prueba se guarda con un nombre y se vuelve a probar después de cambiar el asistente. Al re-ejecutar se repiten las preguntas contra el asistente de hoy, encadenando las respuestas nuevas como historial, y cada respuesta muestra al lado **lo que respondió al guardar el caso**, que es lo que le da sentido a repetirla. No dice «cambió»: el modelo redacta distinto la misma respuesta de una corrida a otra, así que afirmar un cambio sería falso muchas veces. Si en pruebas reales la diferencia aparece demasiado, se evalúa comparar de otra forma — con datos, no antes. Viven en el servidor (`GET|POST|DELETE .../test-cases`), no en el navegador, porque su valor es justamente sobrevivir a un cambio de máquina. Tope de 20 por asistente.

**Conversaciones en espera** (`ORB-C07`, entrada propia bajo la lista): la cola de las que el asistente dejó para una persona, con el motivo en castellano, el resumen y hace cuánto esperan. El resumen llega unos segundos después, así que se refresca solo mientras falte alguno. «Que la retome el asistente» se esconde para un Viewer, y el 403 del backend sigue siendo el control real.

**Respuestas repetidas** (`ORB-C12`, pestaña de la 2.6): cuándo puede reutilizar una respuesta ya dada, en cuatro niveles con nombre en vez de un umbral numérico, y cuántas preguntas se respondieron así. «Todavía nadie preguntó» se distingue de «0 %».

**Modelos de IA** (`ORB-C13`, entrada propia, **solo para el dueño**): qué modelo usa cada tarea (entender, escribir, leer documentos), distinguiendo lo que eligió la organización de lo que viene por defecto, con vuelta al default. Avisa que un identificador equivocado no falla ahí sino en la siguiente respuesta.

Horario y límites **rigen al guardar, sin publicar** — por eso el pie de Guardar/Publicar se oculta en esas dos pestañas (`hidden`, fuera del árbol de accesibilidad), para no ofrecer dos guardados distintos a la vez.

## Decisiones que ya se tomaron (no reabrir sin motivo)

- Un solo app Next.js 16 con route groups `(marketing)` / `(auth)` / `(app)`. El sitio público completo es `ORB-D12`.
- Tenant en la URL, no en el JWT. El token solo lleva `sub`.
- Nadie escribe `fetch` en componentes: pasar por [`lib/api/client.ts`](./lib/api/client.ts).
- Tras registro, el front hace login porque `POST /api/organizations` no setea cookies.
- La identidad **no** se copia a `localStorage`: viene de `/api/auth/me`. Ahí solo queda `orbita.lastTenantId`, y como preferencia de "la última organización que usaste", no como fuente de verdad.
- El rol que devuelve `/me` sirve para **esconder**, no para autorizar: el control real es el 403 del backend (`ORB-A08`).
- Nada de jerga de modelos en la interfaz: el backend expone `style` (formal↔cercano, breve↔detallado, neutro↔entusiasta) y nunca `prompt`, `modelo`, `temperatura` ni `tokens`. Hay pruebas que fallan si esas palabras aparecen.
- Los tipos de las rutas de Track C se escriben a mano en `lib/api/`: el snapshot `openapi/orbita.json` es de `develop` y no las incluye todavía. Hoy ese snapshot tiene 8 rutas (auth, organizations, `tenants/{id}`); el backend quedó de refrescarlo cuando su stack entre a `develop`.
- La 2.6 tiene **dos velocidades y se ven separadas**: nombre, personalidad, instrucciones, estilo y herramientas se redactan, se guardan y se publican; encendido, horario y límites rigen al momento. No es una inconsistencia: un ajuste operativo no puede quedar rehén de un borrador a medio escribir, que es el mismo motivo por el que `PATCH .../enabled` es subrecurso. Cada pestaña tiene **un solo guardar**: por eso el horario tiene pestaña propia en vez de compartirla con los límites.
- **El horario es del asistente, no de la organización**, y eso ya estaba decidido: `orbita-schema.dbml` pone `business_hours jsonb` en `ai_agents` y deja `tenants` con `timezone` y nada más. Se llegó a plantear moverlo al tenant para no duplicarlo por asistente; el modelo de datos, que `CLAUDE.md` declara autoritativo, ya había respondido que no.
- **La caché semántica (`ORB-C12`) no se construyó a propósito.** El backend expone `PUT .../semantic-cache` con `level` (`Off`/`Conservative`/`Balanced`/`Aggressive`), pero no aparece en la Guía de Pantallas, es P2 y su default `Off` no cambia el comportamiento. Añadirla haría más difícil la pantalla que la propia Guía llama «la segunda más difícil del producto». Se retoma si el producto la pide.
- El catálogo de herramientas trae `resultsIn` (dónde aterriza el resultado) y el dashboard decide qué decir de ese módulo: el mapa está en `describeToolResult`, en [`components/agents/agent-format.ts`](./components/agents/agent-format.ts). Cuando `/pipeline` deje de ser un cartel, se cambia ahí y en ningún otro sitio.

## Estado del backend

Se coordina por escrito en [`local/Acuerdos-Frontend-Backend.md`](./local/Acuerdos-Frontend-Backend.md) (una entrada por pregunta, en cuatro tandas; la última, del 2026-09-16). Lo relevante hoy:

- Track C (agentes, conocimiento, búsqueda, banco de pruebas) está en un stack de ramas **sin mergear** en `orbita-api`.
- El endpoint de membresías (`/api/auth/me`) es de Track A, pero lo construyó la sesión de Track C con autorización expresa del equipo, ante un bloqueo de producto: sin él no se podía usar la app en un navegador nuevo. Vive en `feature/a16-current-user-memberships` y añade una política RLS sobre `memberships` más un `app.user_id` en el `UnitOfWork`; **quien lleve Track A debería revisarlo antes de que entre a `develop`**.
- Para probar el front con todo junto, el backend dejó `integration/track-c-with-a16` (solo para preview, no para mergear).

### Segunda ronda de acuerdos (2026-09-15)

Lo que sigue se acordó por mensajería entre sesiones y **todavía no está volcado** en `local/Acuerdos-Frontend-Backend.md`, que se quedó en la segunda tanda. Sustituye a lo anterior donde lo contradiga:

- `MessageDto` trae `authorKind` (`Human`/`AiAgent`/`System`) y `aiRunId`. No hay `agentName` por mensaje porque una conversación conserva su asistente y nunca se re-enruta; el nombre se resuelve una vez por hilo.
- Borrar un asistente con historial ya no devuelve 500 sino **409 `Assistant has history`**; borrar sigue funcionando para uno que nunca atendió a nadie.
- Los guardrails van en su propio subrecurso y el match de temas es por **palabra completa** (así que «precio» no atrapa «precios»: el dueño agrega el plural). La frase de fuera de alcance la escribe el dueño; el default no promete un traspaso que todavía no existe.
- La caché semántica se expone como `level` enumerado, nunca como un umbral numérico.
- El enrutador decide **quién** y el horario decide **si ese contesta ahora**; fuera de horario la conversación no queda marcada con un asistente que no va a responder.

Sigue abierto, y no es del front: el `code` estable en `ProblemDetails` (`ORB-A08`/Track A). Sin él, cada título nuevo del backend degrada en silencio al mensaje genérico de `lib/api/errors.ts` — el 409 de arriba fue el primer caso real.

### Lo único que falta para que el agente responda de verdad

Con créditos en el proveedor de modelos, los documentos se indexan y el chat de pruebas responde. Sin ellos, los embeddings devuelven 402: los documentos se quedan en «En cola» y el chat responde 502 («El asistente no pudo responder ahora mismo»). El front ya muestra ambos casos como corresponde.

## PR stack (histórico — ya mergeado completo en `develop`)

Cada rama salía de la anterior y su PR iba contra la anterior. `feature/c-shared-ui` fue la única que fue contra `develop`. Se deja la tabla como referencia de qué trajo cada una.

| # | Rama | Qué trajo |
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

### Stack abierto, sobre `develop`

| # | Rama | Qué trae |
|---|---|---|
| 1 | `feature/c-delete-conflict-copy` | El 409 de borrar un asistente con historial deja de decir «inténtalo de nuevo» |
| 2 | `feature/c-tag-field` | `TagField`: bloque compartido de etiquetas con chips |
| 3 | `feature/c06-guardrails-api` | Tipos, `PUT .../guardrails` y validación espejo de la del backend |
| 4 | `feature/c06-guardrails-screen` | Pestaña «Límites» de la 2.6, con su propio guardar |
| 5 | `feature/c05-tool-results` | `resultsIn`: cada herramienta dice dónde deja su trabajo |
| 6 | `feature/c-org-switcher` | Cambiar de organización desde el panel lateral |
| 7 | `feature/c-agent-e2e` | Arreglo del mock de e2e y recorrido completo del asistente |
| 8 | `feature/c10-business-hours` | «¿Cuándo trabaja?» y `PUT .../business-hours` |
| 9 | `feature/c10-schedule-editor` | Pestaña «Horario»: semana completa con turnos partidos |
| 10 | `feature/c08-routing-rules` | Reglas de asignación: orden visible y reordenable |
| 11 | `feature/c11-saved-test-cases` | Guardar casos de prueba y re-ejecutarlos comparando respuestas |
| 12 | `feature/c07-handoff-reply` | Frase de traspaso y aviso de que las conversaciones escaladas no se ven aún |
| 13 | `feature/c07-handoff-queue` | Pantalla de la cola de traspasos |
| 14 | `feature/c12-repeated-answers` | Reutilizar respuestas parecidas |
| 15 | `feature/c13-model-per-task` | Modelos por tarea, solo para el dueño |

Las rutas de las ramas 3, 5 y 8 están en el stack sin mergear de `orbita-api`, así que contra `develop` de la API todavía responden 404. Los tipos y las pruebas ya están escritos contra el contrato acordado.

## Cómo retomar

1. `cp .env.example .env.local` y apuntar `NEXT_PUBLIC_API_BASE_URL` a la API (por defecto `http://localhost:5091`).
2. `bun install && bun dev`.
3. Para la API: levantarla desde `orbita-api` con el perfil `http` (`dotnet run --project Orbita.Api --launch-profile http`). El perfil `https` redirige el 5091 y rompe el CORS del front.
4. Regenerar tipos cuando el contrato entre a `develop`: levantar la API, `bun run refresh:openapi`, `bun run generate:api`. No editar `lib/api/generated/schema.d.ts` a mano.
5. **Probar contra la API real**, no solo contra los mocks: con la API corriendo,
   `ORBITA_REAL_API=1 ORBITA_E2E_EMAIL=... ORBITA_E2E_PASSWORD=... bun run test:e2e real-api`.
   Hace falta una cuenta dueña de una organización y Viewer en otra (la de demo sirve). Sin
   `ORBITA_REAL_API=1` esas pruebas se saltan, así que la suite normal no depende de la API.

## Probado contra la API real (2026-09-16)

Los mocks de `e2e/api-mock.ts` son una hipótesis sobre el backend; esto la contrastó con la base
compartida y modelos reales, sobre el stack de `orbita-api` que termina en `feature/c11-test-cases`.

- **Contrato**: cada campo de los tipos de `lib/api/` comparado contra las respuestas reales,
  **pobladas** (con borrador, horario, reglas y casos) — una lista vacía habría pasado sin probar
  nada. Sin desvíos.
- **Comportamiento**: 29 casos por HTTP — turno partido que vuelve en orden, `null` que limpia el
  horario sin tocar los límites, ids de reglas que rotan en cada `PUT`, los dos 409 con su título
  exacto, borrado idempotente de casos, 400 de validación, 404 de una regla a un asistente ajeno.
- **Navegador**: `e2e/real-api.spec.ts`, 4 recorridos, en verde y repetible sin dejar datos nuevos.

Lo que encontró y ya está corregido: la pantalla de reglas afirmaba «todas llegan a tu equipo» al
borrarlas, **antes de guardar**, y no avisaba de cambios sin guardar al salir. Y la propia prueba
tenía dos carreras que la hacían pasar sin verificar nada (contar reglas mientras cargaban,
esperar una URL que ya se cumplía antes de cambiar de organización).

**Datos de prueba que quedan** en «Panadería La Espiga», los dos en pausa y sin poder borrarse
porque tienen historial: «[prueba front] no usar» (la prueba lo reutiliza a propósito) y
«[prueba front] e2e 1789574606657» (sobrante de una corrida anterior al arreglo).

**Inestable, del lado del backend**: la base cerró conexiones varias veces en una hora. Dos
logins fallaron con 500 («An error occurred using a transaction»), ambos el primero tras un rato
sin actividad; 25 logins seguidos funcionaron. El front muestra «Algo salió mal. Inténtalo de
nuevo», que en este caso es el consejo correcto.

## Lo que sigue en Track C

- Barra superior de Figma (selector de asistente con Guardar y Publicar arriba); hoy esos botones están al pie del editor.
- Pulgar arriba/abajo de `ai_feedback`: el modelo de datos lo pide y ninguna historia lo recoge.

## Revisado en celular (390 px)

Las doce pantallas de Track C se recorrieron a ancho de teléfono. La Guía acepta que sean
incómodas ahí —solo bandeja, conversación, tablero y notificaciones tienen que estar bien— pero
ninguna puede quedar rota, así que `e2e/celular.spec.ts` recorre todas y **falla si la página se
sale a lo ancho**, que es en lo que termina un diseño apretado.

Se corrigieron dos: en Reglas de asignación y en Modelos de IA el campo de texto compartía fila
con los botones y quedaba cortado (un identificador de modelo truncado es ilegible). Ahora el
campo ocupa toda la fila por debajo de 640 px y los botones bajan.

Queda incómodo y se acepta: con siete pestañas, la tira del editor se desplaza en horizontal y en
un teléfono solo se ven tres a la vez. El componente `Tabs` es compartido con otros tracks, así
que cambiarlo se acuerda antes.

## Huecos de backlog sin dueño

- ~~La cola de traspasos no tiene pantalla~~ — **construida** como entrada propia dentro de Agente IA, sin tocar `/bandeja`, que es de Track B. Si esa bandeja la incorpora después, esta vista se retira.
- **`ORB-C13` depende de la PR #52 del backend.** Ahí llegan `ManageAiModels` (solo Owner: un Admin recibe 403 aunque entre por la ruta directa) y `GET /api/ai-providers`, que la pantalla usa para editar los modelos del proveedor que responde hoy (`isPrimary`, el primero *configurado*). Sin esa PR, la pantalla no tiene proveedores que leer.
- **Referencia anterior (ya resuelta).** La cola de traspasos: El backend ya expone `GET .../handoffs` (con `{ items, nextCursor, total }`, la espera más antigua primero) y `POST .../conversations/{id}/return-to-assistant`. La superficie natural es la bandeja, que es de Track B y otra persona está construyendo; también cabría una lista suelta en Agente IA. **Mientras no exista, `escalar_a_humano` deja clientes esperando que nadie ve desde el panel**, y la tarjeta de la herramienta lo advierte. Tampoco hay aviso en vivo: no hay cliente de SignalR.
  Para quien construya esa pantalla: mostrar `summary`, no `lastMessagePreview`. Ese campo es el último mensaje en cualquier dirección (así lo define `ORB-B03`), así que casi siempre es nuestra propia frase de traspaso. Y `summary` llega `null` unos segundos: significa «todavía no», no «no hay». Tiempos medidos contra la base compartida: la frase le llega al cliente ~3,8 s después de su mensaje y el resumen ~4 s más tarde. En «Panadería La Espiga» quedó a propósito una conversación de prueba esperando en la cola, para verificar la forma real.

No son de Track C y no se toman por cuenta propia; están anotados para que alguien decida:

- `ORB-C12` pide medir el porcentaje de aciertos. El backend expone `hitRate` y no hay dónde mostrarlo; lo más cercano es el panel de consumo, `ORB-D11`.

## Fuera de alcance de este repo por ahora

Contactos, pipeline, campañas, reportes reales y sitio marketing completo — son Track D, sin dueño activo (ver la nota de arriba sobre las ramas de Track D sin mergear en el backend). Bandeja y canales pasaron a estar EN alcance (Track B, ver sección siguiente).
