# newPM (sperimentale)

Motore di pattern matching con traccia visualizzabile (“maglione che calza”).
**Non** è collegato a `index.html` né a `PMTutilities.js`: non cambia il comportamento dell’app finché non lo carichi a mano.

## Caricare da console

Con Aabacus già aperta (`app/index.html`):

```js
$.getScript('js/newPM/load.js')
// oppure, se preferisci il controllo esplicito:
await newPM.load()  // dopo aver iniettato solo load.js senza auto-start
```

`load.js` iniettato con `$.getScript` carica da solo CSS + `match.js` + `visualize.js` + `api.js`.

## Invocare

`pattern` e `input` possono essere: nodo DOM, jQuery, oppure selettore CSS che punta a un ENODE.

```js
// solo match + log + oggetto risultato
const r = newPM(pattern, input)
r.matched
r.bindings
r.trace

// match + animazione step-by-step
await newPM(pattern, input, { play: true, stepMs: 600 })

// ripeti l’ultima animazione
await newPM.last().play()

// pulisci overlay
newPM.clear()
```

### Esempio tipico in canvas

1. Seleziona / individua due ENODE (pattern e input).
2. In console:

```js
const $input = $('.selected').closest('[data-enode]') // adatta al tuo stato UI
const $pattern = $('[data-tag=...] ...')              // membro pattern della proprietà
await newPM($pattern, $input, { play: true })
```

## Cosa fa / non fa (v0.1)

| Fa | Non fa ancora |
|----|----------------|
| Match strutturale + parametri `_` / `__` / `___` | Replace / transform / refine |
| Trace narrata + ellisse “che si stringe” | Integrazione tasti / drag dell’app |
| API `window.newPM` | Sostituzione di `adaptMatch` |

Quando sarà maturo, questo modulo potrà sostituire il PM di produzione; fino ad allora resta opt-in da console.
