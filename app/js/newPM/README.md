# newPM (sperimentale)

```js
newPM(selectorOfDragged, selectorOfTarget)
```

Entrambi gli argomenti sono stringhe selettore (jQuery/`$()`).  
`data-tag` solo sulla proprietà `forAll` (`newPM-assoc`).

---

## Test in console

### 1. Apri la fixture

```
http://127.0.0.1:5500/?preloadPath=./Data/TestBedExamples/newPM_assoc.mmls
```

Ricarica la pagina dopo aggiornamenti a `js/newPM/` (cache).

### 2. Incolla

```js
await newPM(newPM.SEL.attack, newPM.SEL.dropOk)
```

Altri casi:

```js
await newPM(newPM.SEL.attack, newPM.SEL.dropFailTimes)  // NO MATCH (times)
await newPM(newPM.SEL.attack, newPM.SEL.dropFailShort)  // NO MATCH (corto)
await newPM(newPM.SEL.pattern, newPM.SEL.okRoot)        // MATCH depth 0
```

Oppure le stringhe esplicite (relative al `forAll`, indipendenti dai `ci` sopra):

```js
await newPM(
  '[data-tag=newPM-assoc] .firstMember [data-enode=plus] [data-enode=plus]',
  '[data-tag=newPM-assoc] ~ [data-enode=eq]:eq(0) [data-enode=plus] [data-enode=plus] [data-enode=cn]'
)
```

Senza animazione: terzo argomento `{ play: false }`.

---

## Selettori (`newPM.SEL`)

| Chiave | Ruolo |
|--------|--------|
| `attack` | plus interno del pattern (dragged) |
| `dropOk` | foglia `3` nella 1ª eq dopo la proprietà |
| `dropFailTimes` | cn nella 2ª eq (times) |
| `dropFailShort` | cn nella 3ª eq (corta) |
| `pattern` / `okRoot` | root pattern ↔ root input |

`:eq(n)` è sintassi jQuery (non CSS puro).

---

## API

```js
await newPM(selectorOfDragged, selectorOfTarget)
await newPM(selectorOfDragged, selectorOfTarget, { play: false })
newPM.SEL
newPM.clear()
newPM.version
```
