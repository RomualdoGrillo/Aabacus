# Aabacus Testing

Workflow: per rendere veloce lo sviluppo è necessario che l'AI possa eseguire test e valutare il risultato senza intervento umano.

I test devono comprendere:

- keyboard
- Mouse: Drag and Drop, click, ecc.
- touch: pinch/unpinch e direzione del movimento verticale/orizzontale; tracciare una curva attorno a uno o più elementi HTML (futuribile)

## Architettura

| Componente | Percorso | Ruolo |
|------------|----------|--------|
| App | `app/` | Prodotto — **nessun** codice di test (usa API esistenti: `ENODEparent`, `GLBsettings`, …) |
| Core test (iniettato) | `project/tests/helpers/browser/core.js` | Ponte runtime: probe, coordinate, simulazione eventi |
| Helper esercizio | `project/tests/helpers/exercises/` | Logica DOM/assert specifica (es. Hanoi) |
| Iniettore Playwright | `project/tests/helpers/injectTest.js` | Carica core + esercizio in `page.evaluate` |
| Test manuali console | `project/tests/testViaConsole/` | Istruzioni + script per DnD via DevTools |
| Test E2E | `project/tests/e2e/` | Playwright: orchestra test, legge pass/fail |
| Ricette | `project/tests/recipes/` | Step leggibili per il ruolo **Tester** (L4, `AGENTS.md`) |
| Spec | `project/specs/tests.md` | Regole e obiettivi |

Gli helper di test **non** sono file serviti da `app/` — Playwright li inietta dopo il caricamento dell'app. Riutilizzano jQuery e globali dell'app (`GLBsettings`, `Sortable`, …) senza duplicarne la logica ENODE.

Avvio server (dalla root del repo; accessibile anche da iPad sulla stessa WiFi):

```bash
npx --yes serve -l tcp://0.0.0.0:5500 app
```

URL di test (solo preload; `demo=1` mostra il cursore rosso durante simulateMove):

```
http://127.0.0.1:5500/?preloadPath=./Data/exercises/hanoi4.mmls
http://127.0.0.1:5500/?demo=1&preloadPath=./Data/exercises/hanoi4.mmls
```

Test manuali in console: `project/tests/testViaConsole/` — `npm run test:console:hanoi`.

Esempio DnD (Torre di Hanoi): `hanoi4.mmls` — helper `window.__aabacusTestExercises.hanoi` (dopo `injectTestHelpers(page, { exercise: 'hanoi' })`).

Nei test Hanoi, i **paletti** (`hanoirod`) non devono spostarsi; solo i **dischi** (`cn`) sono trascinabili. Usare `getRodDragCoordinates()` per simulare un drag sul paletto e verificare che `getRodDiscCounts()` e `getRodOrder()` restino invariati.

## Stati del canvas: `tiedCanvas`

`GLBsettings.tiedCanvas` **non** disabilita il drag. Distingue due modalità:

| Stato | Classe DOM | Comportamento |
|-------|------------|---------------|
| **tied** (`tiedCanvas: true`) | `#canvas` senza `untied` | Definizioni vincolanti; si applicano **proprietà matematiche** (commutativa, associativa, …) |
| **untied** (`tiedCanvas: false`) | `#canvas.untied` | Spostamento **libero** degli ENODE per costruire espressioni |

Nei test **non** forzare `tiedCanvas = false` se l'esercizio è pensato per modalità tied (es. `hanoi4.mmls` con proprietà DnD).


1. **Regression test:** solo eventi DOM reali via coordinate viewport (`clientX` / `clientY`).
2. **Selector:** ammessi solo per calcolare coordinate (`offset` nel bounding box) e per preflight con `elementFromPoint`.
3. **Vietato in regression:** chiamate dirette a `MakeSortableAndInjectMouseDown`, `_onTapStart`, API SortableJS o altre scorciatoie interne.
4. **Drag:** sequenza `pointerdown`/`mousedown` → N × `pointermove`/`mousemove` (default 20 step) → `pointerup`/`mouseup`; un salto unico A→B non basta per SortableJS.
5. **Assert:** verificare lo stato DOM/canvas **dopo** la catena completa, non solo l’avvio del drag.
6. **Diagnostica:** usare `probePoint(x, y)` prima di un drag ambiguo (aree piccole, overlay, target annidati).
7. **SortableJS e PointerEvent:** il core iniettato emette `PointerEvent` + `MouseEvent` e, perché Chromium non inoltra i `pointermove` sintetici ai listener Sortable, invoca anche `_onTouchMove` / `_emulateDragOver` / `_onDrop`. Per CI preferire Playwright (`page.mouse`).

## API core iniettato (`window.__aabacusTest`)

Sorgente: `project/tests/helpers/browser/core.js` — `injectTestHelpers(page)`.

- `waitForReady(timeoutMs?)` — attende canvas con almeno un `[data-enode]`
- `getState()` — legge `GLBsettings`, conteggi ENODE
- `resolveTarget({ selector, offset } | { x, y })` — coordinate viewport
- `probeElement` / `probePoint` — hit test; ENODE via `$(el).closest('[data-enode]')` (stesso pattern dell'app)
- `interpolatePoints`, `simulatePointerPath`, `simulateDnD`, `simulateClick`

## Helper esercizio Hanoi (`window.__aabacusTestExercises.hanoi`)

Sorgente: `project/tests/helpers/exercises/hanoi.js` — `injectTestHelpers(page, { exercise: 'hanoi' })`.

- `getExerciseState()` — `{ hanoiRodCount, hanoiDiscCount }`
- `isExerciseReady()` — esercizio Hanoi preload completo
- `getMoveCoordinates({ fromRodIndex, toRodIndex })` — coordinate drag
- `getRodDiscCounts()` — dischi per paletto `[rod0, rod1, rod2]`
- `simulateMove(opts)` — drag completo via API generica + assert `moved`

Touch (pinch, curve): stesso principio con `TouchEvent` — da implementare in seguito.
