# newPM (sperimentale)

```js
newPM(selectorOfDragged, selectorOfTarget)
```

`data-tag` solo sulla proprietà `forAll` (`newPM-*`).

---

## Fixture

| Nome | File | Proprietà |
|------|------|-----------|
| `assoc` | `TestBedExamples/newPM_assoc.mmls` | `a__+(b_+c__) = (a__+b_)+c__` |
| `distrib` | `TestBedExamples/newPM_distrib.mmls` | `a_(b_+c_) = a_*b_ + a_*c_` |
| `power` | `TestBedExamples/newPM_power.mmls` | `a_^n_ * b_^n_ = (a_*b_)^n_` (come `power_x^2y^2`) |

`newPM.SEL` si auto-seleziona dal `data-tag` presente nel canvas.  
Forza un catalogo: `newPM.use('distrib')`. Elenco: `newPM.list()`.

---

## Console — associativa

```
http://127.0.0.1:5500/?preloadPath=./Data/TestBedExamples/newPM_assoc.mmls
```

```js
await newPM(newPM.SEL.attack, newPM.SEL.dropOk)          // MATCH
await newPM(newPM.SEL.attack, newPM.SEL.dropFailTimes)   // NO MATCH
await newPM(newPM.SEL.attack, newPM.SEL.dropFailShort)   // NO MATCH
```

---

## Console — distributiva

```
http://127.0.0.1:5500/?preloadPath=./Data/TestBedExamples/newPM_distrib.mmls
```

```js
await newPM(newPM.SEL.attack, newPM.SEL.dropOk)            // MATCH  2*(x+3)
await newPM(newPM.SEL.attack, newPM.SEL.dropFailPlus)      // NO MATCH  2+(x+3)
await newPM(newPM.SEL.attack, newPM.SEL.dropFailShort)     // NO MATCH  2*x
await newPM(newPM.SEL.attack, newPM.SEL.dropFailTernary)   // NO MATCH  2*(x+y+3)
await newPM(newPM.SEL.pattern, newPM.SEL.okRoot)           // MATCH depth 0
```

---

## Console — potenze (commonExponent)

```
http://127.0.0.1:5500/?preloadPath=./Data/TestBedExamples/newPM_power.mmls
```

```js
await newPM(newPM.SEL.attack, newPM.SEL.dropOk)         // MATCH  x^2*y^2
await newPM(newPM.SEL.attack, newPM.SEL.dropFailExp)    // NO MATCH  x^2*y^3
await newPM(newPM.SEL.attack, newPM.SEL.dropFailPlus)   // NO MATCH  x^2+y^2
await newPM(newPM.SEL.pattern, newPM.SEL.okRoot)        // MATCH depth 0
```

Senza animazione: terzo argomento `{ play: false }`.

---

## API

```js
await newPM(selectorOfDragged, selectorOfTarget)
await newPM(selectorOfDragged, selectorOfTarget, { play: false })
newPM.SEL       // selettori della fixture attiva
newPM.use('assoc'|'distrib'|'power'|null)
newPM.list()
newPM.FIXTURES
newPM.clear()
newPM.version
```
