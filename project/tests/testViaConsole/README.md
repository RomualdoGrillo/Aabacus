# Test manuali via console / JavaScript

Helper per simulare DnD e fare probe **senza** aggiungere codice in `app/`.  
Gli script vivono qui; la logica è in `../helpers/browser/core.js` e `../helpers/exercises/`.

## Prerequisito: server locale

Dalla **root del repo**:

```bash
npx --yes serve -l 5500 app
```

URL esercizio Hanoi (drag dischi):

```
http://127.0.0.1:5500/?preloadPath=./Data/exercises/hanoi4.mmls
```

Con cursore rosso durante la simulazione aggiungi `demo=1`:

```
http://127.0.0.1:5500/?demo=1&preloadPath=./Data/exercises/hanoi4.mmls
```

---

## Metodo 1 — Playwright + console (consigliato)

Apre Chromium, inietta gli helper, lascia il browser aperto.

```bash
cd project/tests
npm run test:console:hanoi
```

Si apre il Playwright Inspector: usa **Resume** solo quando vuoi chiudere la sessione.

In **DevTools → Console**:

```javascript
await __aabacusTest.waitForReady();

await __aabacusTestExercises.hanoi.simulateMove({
  fromRodIndex: 0,
  toRodIndex: 1,
  steps: 25
});
```

Verifica:

```javascript
__aabacusTestExercises.hanoi.getRodDiscCounts();
// dopo mossa riuscita: [3, 1, 0]
```

### Probe prima di un drag

```javascript
__aabacusTest.probeElement({
  selector: '#canvasRole [data-enode=hanoi] [data-enode=cn]',
  offset: { x: 0.5, y: 0.5 }
});
```

### Drag generico (coordinate o selector)

```javascript
await __aabacusTest.simulateDnD({
  from: { selector: '#canvasRole [data-enode=cn]', offset: { x: 0.5, y: 0.5 } },
  to: { selector: '#canvasRole [data-enode=hanoirod]:nth-child(2) .ol_role', offset: { x: 0.5, y: 0.85 } },
  steps: 25
});
```

### URL personalizzato

```bash
URL='http://127.0.0.1:5500/?demo=1&preloadPath=./Data/exercises/altro.mmls' npm run test:console:hanoi
```

---

## Metodo 2 — Solo browser + incolla in console

Utile se non vuoi Playwright headed. **Dopo ogni reload** della pagina devi reincollare.

1. Apri l’URL dell’esercizio nel browser.
2. Genera lo snippet:

```bash
cd project/tests
node testViaConsole/print-paste-snippet.js | pbcopy    # macOS → appunti
# oppure
node testViaConsole/print-paste-snippet.js > /tmp/aabacus-console.js
```

3. DevTools → Console → incolla ed esegui.
4. Usa le stesse API del metodo 1.

---

## Metodo 3 — Solo mouse umano

Nessun helper: apri l’URL e trascina col mouse. L’app non richiede `__aabacusTest`.

---

## API rapida

| Oggetto | Funzioni principali |
|---------|---------------------|
| `__aabacusTest` | `waitForReady`, `getState`, `probePoint`, `probeElement`, `resolveTarget`, `simulatePointerPath`, `simulateDnD`, `simulateClick` |
| `__aabacusTestExercises.hanoi` | `getExerciseState`, `isExerciseReady`, `getMoveCoordinates`, `getRodDiscCounts`, `simulateMove` |

Per CI/regression preferire `npm run test:e2e` (Playwright + `page.mouse`).

---

## File in questa cartella

| File | Ruolo |
|------|--------|
| `open-console-hanoi.js` | Browser headed + iniezione helper |
| `print-paste-snippet.js` | Stampa core+hanoi da incollare in console |
| `README.md` | Queste istruzioni |
