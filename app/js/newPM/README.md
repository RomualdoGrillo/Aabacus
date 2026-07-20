# newPM (sperimentale)

Motore di pattern matching con traccia visualizzabile (“maglione che calza”).
Caricato da `index.html` (non sostituisce ancora `PMTutilities.js`).

## Avvio rapido

1. Server: `npx --yes serve -l 5500 app`
2. Apri la fixture:

```
http://127.0.0.1:5500/?preloadPath=./Data/TestBedExamples/newPM_assoc.mmls
```

3. In DevTools → Console:

```js
// MATCH + animazione (play:true di default)
await newPM('[data-tag=newPM-pattern]', '[data-tag=newPM-ok]')

// FAIL (times)
await newPM('[data-tag=newPM-pattern]', '[data-tag=newPM-fail-times]')

// FAIL (espressione troppo corta)
await newPM('[data-tag=newPM-pattern]', '[data-tag=newPM-fail-short]')

// solo match, senza animazione
await newPM('[data-tag=newPM-pattern]', '[data-tag=newPM-ok]', { play: false })
```

Semantica: `newPM(selectorOfDragged, selectorOfTarget)` —
arg1 = pattern, arg2 = input su cui “rilasciare”.

## API

```js
await newPM(pattern, target)                 // play:true
await newPM(pattern, target, { play: false })
await newPM.last().play()
newPM.clear()
newPM.version
```

`pattern` / `target`: selettore CSS, jQuery, o nodo DOM ENODE.

## Fasi visuali (schema PDF)

1. **dragStart / dragGhost** — contorni plus interno/esterno
2. **structureFit** — stringimento interno → esterno
3. **leaves** — bind di `a__`, `b_`, `c__`
4. **transform** — placeholder

## Fixture

[`Data/TestBedExamples/newPM_assoc.mmls`](../../Data/TestBedExamples/newPM_assoc.mmls)

| data-tag | Ruolo |
|----------|--------|
| `newPM-assoc` | proprietà forAll |
| `newPM-pattern` | membro sinistro (pattern) |
| `newPM-transform` | membro destro (transform) |
| `newPM-ok` | input che matcha |
| `newPM-fail-times` | input times → no match |
| `newPM-fail-short` | `1+x` → no match |

## Demo staged (opzionale)

```js
$.getScript('js/newPM/demo-fixtures.js')
await runNewPmDemo('match')
```
