# Aabacus — Moduli software

Questo documento descrive l'organizzazione attuale del codice JavaScript di Aabacus (directory `app/js/`), le responsabilità e le dipendenze di ogni file, lo stato globale condiviso, i problemi strutturali rilevati e il piano di rifattorizzazione per rendere il software più semplice e modulare, in preparazione a parziali riscritture.

Documenti correlati: [core-concepts.md](core-concepts.md) (concetti fondamentali), [implementation-details.md](implementation-details.md) (dettagli implementativi), [tests.md](tests.md) (test).

---

## 1. Architettura attuale in sintesi

- **Nessun sistema di moduli**: tutti i file sono caricati con `<script>` in `app/index.html`; ogni funzione e variabile top-level è globale. L'ordine di caricamento in `index.html` è di fatto il grafo delle dipendenze (i riferimenti incrociati si risolvono a tempo di chiamata, quindi le dipendenze circolari "funzionano" purché nessuno chiami nulla prima che tutti gli script siano caricati).
- **Il DOM è il modello dati**: l'espressione è un albero di `div[data-enode]` (ENODE) dentro `#canvasRole`. Non esiste un modello separato dalla vista: attributi (`data-enode`, `data-type`, `title`/`mark`, `data-import`) e classi CSS (`minus`, `untied`, `selected`, `mu_*`) codificano sia semantica sia stato UI.
- **Estensione dei nodi DOM**: `ENODEextend` fa `$.extend(node, ENODE)` su ogni elemento `[data-enode]`, aggiungendo metodi (`ENODE_getChildren`, `ENODE_getName`, ...) direttamente ai nodi DOM.
- **Due motori di trasformazione**: proprietà *hard-wired* (funzioni JS imperative, dispatch per nome via `window[data-tag]`) e proprietà *pattern-based* (dichiarate come `forAll`+`eq` nell'espressione stessa, applicate dal pattern matcher). Entrambe convergono nell'oggetto `PActx` e in `PActxConclude`.
- **Interazione**: selezione e drag & drop su mousedown (SortableJS creato pigramente a ogni drag), tastiera mappata su proprietà tramite la sezione `#events`.

### Ordine di caricamento degli script (index.html)

```
jQuery → Sortable → Popper → mathjs (CDN)
sound.js → inflatedeflate.js → UserEvToFunctCall.js → Undo.js → SaveLoad.js
→ infix.js → math.js → PMTutilities.js → TranslateFormat.js → formatXML.js
→ preload.js → SVGlines.js → DnD.js → InteractJStests.js → AldoUtilities.js
→ Ajax.js → PatternMatchingTrasform.js → ExpressionManager.js
→ HardWiredProperties.js → addedHardWiredProperties.js → calculateSpan.js
→ MAIN.js  (ultimo: orchestratore, avvia il preload)
```

File presenti ma **non caricati**: `utilities.js` (vuoto/commentato). File caricato ma **morto**: `InteractJStests.js` (richiede Interact.js, che non è caricato).

---

## 2. Inventario dei moduli

I file sono raggruppati per sottosistema. Per ogni file: responsabilità, simboli principali, dipendenze notevoli, problemi.

### 2.1 Nucleo espressioni

| File | righe | Responsabilità |
|---|---|---|
| `ExpressionManager.js` | ~1160 | Facciata dell'albero ENODE: primitive strutturali di manipolazione, navigazione (ruoli/figli/nome), clonazione da prototipi, sostituzioni (`forAll`, replace-all), validazione tipi/arità per il drop, valutazione numerica parziale, uguaglianza strutturale, orchestrazione del refresh visivo |
| `inflatedeflate.js` | ~240 | Conversione bidirezionale ENODE ⇄ MathML (`createConvertedTree`, `ENODEcreateMathmlString`, `ReplaceOneENODE`) + parser per MML misto a HTML (`$parserForMixedMMLHTML`) |
| `infix.js` | ~90 | Separatori infissi (`.infix`) tra operandi e segnaposto per ruoli vuoti (`refreshOneInfix`, `refreshOneEmpty`) |
| `TranslateFormat.js` | ~125 | Trasformazioni di formato: minus come fattore, conversioni di rappresentazione del segno (`signsAsClasses*`), figli "glued" degli operatori unari (`refreshGlued`) |
| `calculateSpan.js` | ~345 | Analisi di scope e giurisdizione logica: span delle variabili legate (`forAll`), ricerca occorrenze (`$findOccurrences`), propagazione attraverso `and`/`implies`, cluster associativi, evidenziazione |
| `math.js` | ~70 | Helper numerici: fattorizzazione in primi, lettura testo numerico di un ENODE, scomposizione in decine/centinaia |
| `formatXML.js` | ~30 | Pretty-printer XML puro, senza dipendenze applicative |
| `SVGlines.js` | ~55 | Linee SVG di collegamento su `#svgContainer` (`lineAB`, `clearLines`); `drawCallOut` e `updateMarkerColor` sono stub incompleti |

Punti d'attenzione nel nucleo:

- In `ExpressionManager.js` convivono **logica pura dell'albero** (CRUD, navigazione, clone, sostituzioni, uguaglianza, valutazione) e **funzioni miste con la UI**: `prompt()` in `ENODECreateDefinition` e `ENODErenamePrompt`, icone jQuery UI in `ENODERefreshAsymmEq`, overlay, etichette di debug (`ENODEshowMarks`), lettura di `$('body').attr('timesDisposition')` in `RefreshEmptyInfixBraketsGlued`, scrittura di `exclusiveFocus` in `createForThis`, snapshot undo in `ENODErenamePrompt`.
- Liste dei tag foglia duplicate: `symbols` (`ExpressionManager.js`) e `leafTags` (`inflatedeflate.js`).
- Il segno ha **tre rappresentazioni** (prefisso nel nome, classe CSS `minus`, operatore `minus` wrappante) con logica di conversione duplicata tra `TranslateFormat.js`, `ENODErenamePrompt` e blocchi commentati di `inflatedeflate.js`.
- Funzioni rotte o morte: `ENODE_replaceWith` (usa `ENODE_getEnclIfPresent` mai definita), `ENODEBesideGiven` (usa la globale `$toBeComp` mai definita nel suo scope), `checkCn`, `overflowExsists`, `addTypeDecorations` (senza chiamanti).

### 2.2 Proprietà e pattern matching

| File | righe | Responsabilità |
|---|---|---|
| `PMTutilities.js` | ~725 | Motore del pattern matching: dispatch (`TryOnePropertyByName`), pipeline (`InstructAndTryOnePMT`, `PActxFromAttackPoints`), matcher ricorsivo (`adaptMatch`, `orderMatch`), sistema di marcature (`ENODESmarkUnmark`, formato `mark-link-post`), ordinamento post-match (`orderUL`), pulizia (`PMcleanAndPost`) |
| `PatternMatchingTrasform.js` | ~250 | Lato "transform" del PM: lookup proprietà (`findPMPropByName`), clone e swap dei membri (`swapMembersClone`), tipizzazione parametri (`parameterType`, suffissi `_`/`__`/`___`), sostituzione nei `forAll` (`replaceInForall`), riformattazione se restano variabili libere (`reformatForallProp`) |
| `HardWiredProperties.js` | ~1075 | Framework delle proprietà cablate: `newPActx`, registro DnD (`PropertyDnD`/`propertiesDnD`), validatori (`validFor*`), implementazioni (associate, distribute, collect, compose, decompose, replace/link, modus ponens, redundant, Hanoi, forThis, evaluateComparison), euristica parentesi (`ENODEneedsBracket`) |
| `addedHardWiredProperties.js` | ~95 | Specializzazioni didattiche: `tabelline`, `composePlusOnly`, `decomposeTens`, helper `$toBeComposedWithSiblings` (chiamato da `compose` nel file principale: dipendenza inversa rispetto all'ordine di caricamento, funziona solo perché risolta a runtime) |
| `refine.js` | ~190 | Post-applicazione: `REFINE_KINDS`, `markNeedsRefine(kind)`, `postApplyAfterProperty`, `refineAfterProperty`. Controllato dalle marcature, non da intensità |

Concetti trasversali:

- **`PActx`** (creato da `newPActx` in `PMTutilities.js`): contesto di applicazione di una proprietà. Campi principali: `matchedTF`, `msg`, `$pattern`, `$operand`, `$transform`, `$equation`, `$cloneProp`, `replacedAlready`, `visualization`. Le HW di solito impostano `replacedAlready=true`; le PM lasciano la sostituzione a `refreshAndReplace` in `refine.js`. `PActxConclude` delega il post a `postApplyAfterProperty` (replace + refine sui nodi marcati via `REFINE_KINDS`).
- **Dispatch per nome**: `TryOnePropertyByName(nome, ...)` cerca `$('[data-tag=nome]')`; se l'elemento è `ci` chiama `window[nome](...)` (il nome della funzione JS deve coincidere con `data-tag`), altrimenti avvia il PM. È l'accoppiamento più fragile del sistema.
- **Marcature**: stringa `mark-link-post` in `title` (persistente, salvata in MML) o `mark` (volatile). `m` = vincoli di match (es. `s` selected, `d` dragged), `l` = etichette per i path di riordino, `p` = post-azioni (`c` = auto-refine via `REFINE_KINDS`, `n` = non riordinare — **non** riusare `n` per un percorso di forma normale).

Problemi noti: `evaluateComparison` usa `=` invece di `==` nei confronti su `ENODEClass` (righe ~1020–1033: valuta sempre il ramo `eq`); `ENODEModusPonens` è incompleto; `revert`, `isEquationMember`, `clearTragets` (typo nel nome) sono definiti e mai chiamati; `tabelline`/`composePlusOnly` ritornano `undefined` invece di un `PActx` fallito nei rami di guardia.

### 2.3 Interazione utente

| File | righe | Responsabilità |
|---|---|---|
| `MAIN.js` | ~505 | Bootstrap e hub eventi: stato globale (`GLBsettings`, `debugMode`, `preloadPath`), listener document-level (click, dblclick, mousedown/up, touch, keydown), selezione (`selectionManager`), scorciatoie (undo/copy/paste/save/load/tab-tool), orchestrazione post-proprietà (`PActxConclude` → `refine.js`), celebrazione |
| `DnD.js` | ~355 | Motore drag & drop su SortableJS: al mousedown individua il nodo trascinabile e i target validi (riordino su untied, proprietà DnD, autoAdapt, copy), crea/riattiva pigramente i Sortable, gestisce il drop (`onAdd`: move/clone/proprietà), pulizia (`cleanupDnD`) |
| `UserEvToFunctCall.js` | ~160 | Traduzione input → proprietà: mappa tasti sulle azioni in `#events` (`tryEventActionsOnNode`, `keyboardEvToFC`), filtro proprietà DnD abilitate (`getDnDpropEnabled`) |
| `Undo.js` | ~80 | Undo a snapshot: stack `FILO` di cloni dell'albero radice, `ssnapshot.take/undo/copy/paste`. Nota: lo snapshot è preso *dopo* ogni azione |
| `sound.js` | ~10 | 5 oggetti Audio precaricati (2 usati: `clickSound`, `victorySound`) |
| `AldoUtilities.js` | ~290 | Cassetto di utilità eterogenee: pulizia classi, path/URL, confronto col risultato e celebrazione (`lookForResultAndCelebrate`, `compareWithResult`), parser semplice (`dummyParser`, `identifierToENODE`), antenato comune, grado dei monomi, comparatori per Sortable |
| `InteractJStests.js` | ~40 | **Morto**: esperimento Interact.js mai integrato, libreria non caricata |
| `utilities.js` | ~10 | **Morto**: non caricato da index.html, solo codice commentato |
| `Ajax.js` | ~75 | **Morto in pratica**: demo AJAX iniziale senza chiamanti (il vero layer AJAX è in `preload.js`) |

Stato dell'interazione: il valore corrente del tool (`""`, `copy`, `autoAdapt`, `declare`) vive in `GLBsettings.tool` ed è specchiato in `body[tool]` per il CSS; `GLBDnD.toolWhenMousedown` lo congela all'inizio del drag. La selezione avviene su **mousedown** (dentro `MakeSortableAndInjectMouseDown`), non su click.

### 2.4 Persistenza e caricamento

| File | righe | Responsabilità |
|---|---|---|
| `preload.js` | ~295 | Bootstrap dei contenuti: `preloadAll` (GET asincrona del `.mmls`), `injectAllMMLS` (parsing delle sezioni palette/events/canvas/result/settings), loader legacy JSON (`injectAll`), `loadAjaxAndInject` (GET **sincrona** + inject), ponte impostazioni ⇄ UI (`GLBsettingsToInterface`, listener su `#settings`) |
| `SaveLoad.js` | ~165 | Download (`saveTextAsFile`), upload (`loadFileConvert`, branch per suffisso), primitiva di inserimento (`inject`), risoluzione import (`importAll` su `[data-import]`), serializzazione completa (`AlltoMMLSstring`) |

Formati dati (in `app/Data/`): `.mmls` = bundle multi-sezione (sessione completa), `.mml` = frammento MathML (fondamenti, eventi, esercizi), `.prt` = prototipi palette in HTML, `.set` = impostazioni JSON, `.json` = manifest legacy per `injectAll`. Le sezioni `settings` popolano `GLBsettings`. L'attributo `data-import` su un ENODE segnaposto fa caricare e iniettare un file esterno (marcato con `importStatus`); al salvataggio i figli importati vengono scartati e resta il riferimento.

Pipeline di boot: `MAIN.js` legge `preloadPath` dall'URL → `preloadAll` → `injectAllMMLS` → `inject` per ogni sezione (palette prima del canvas, perché l'inflate usa i prototipi della palette) → `importAll` → parsing settings → `GLBsettingsToInterface` → `RefreshEmptyInfixBraketsGlued`.

Bug noti: in `inject` la condizione `if(containerRequirements='bool')` è un **assegnamento**, sempre vero; `importAll` ignora il parametro `$startNode` (cerca sempre in `body`) ed è a passata singola (import annidati in file appena caricati possono restare irrisolti); `loadFileConvert` ignora il parametro `fileToLoadPar`.

---

## 3. Stato globale condiviso

| Stato | Definito in | Usato da | Note |
|---|---|---|---|
| `GLBsettings` | `MAIN.js` (dichiarato), `preload.js` (popolato) | MAIN, DnD, UserEvToFunctCall, preload | Config esercizio: tool, tiedCanvas, gameMode, movesCounter, visSettings... |
| `GLBDnD` | `DnD.js` | solo DnD | Bus ad-hoc per il ciclo di vita del drag (workaround SortableJS) |
| `debugMode` | `MAIN.js` | quasi tutti | Attiva marcature visibili, salta importAll, ecc. |
| `canvas` | `MAIN.js` | UserEvToFunctCall | **Nome fuorviante**: punta a `#canvasRole`, non a `#canvas` |
| `ssnapshot` / `FILO` | `Undo.js` | MAIN, EM, TranslateFormat, SaveLoad | `FILO` è una globale implicita creata dentro `ssnapshot()` |
| `ENODE` | `ExpressionManager.js` | inflatedeflate (metodi sui nodi) | Oggetto di metodi copiato sui nodi DOM da `ENODEextend` |
| `propertiesDnD` | `HardWiredProperties.js` | DnD, UserEvToFunctCall | Registro proprietà trascinabili |
| `preloadPath`, `tools`, `sortablesSelectorString` | `MAIN.js` | preload, AldoUtilities, DnD | |
| `body[tool]`, classi `.selected`/`.untied`/`.selectedTool`/`mu_*`, attributi `target`/`from`/`mark`/`data-path` | vari | vari | Il DOM usato come contenitore di stato applicativo |

Globali **implicite** (assegnate senza `let`/`var`, inquinano `window`): `$clone` (AldoUtilities/EM), `$commParent` (DnD), `toBeCancelled` (MAIN), `$toBeRestored` (Undo), `$sections` (preload), `noBVarChildren`, `i` (inflatedeflate), `$pattern`, `$subtree`, `res` (PMTutilities), `$extOp` (TranslateFormat), `$secondMember`, `$targets` (calculateSpan), `$composed` (HardWiredProperties).

---

## 4. Problemi strutturali (riepilogo)

1. **Responsabilità mal collocate**
   - UI dentro il nucleo espressioni: `prompt()`, icone, overlay, `ssnapshot.take()` in `ExpressionManager.js`; classi CSS e SVG dentro `calculateSpan.js`.
   - Logica espressioni fuori dal nucleo: `ENODEneedsBracket` e `newPActx` in `HardWiredProperties.js`; `dummyParser`/`identifierToENODE` e `compareWithResult` in `AldoUtilities.js`; `GLBsettingsToInterface` (UI settings) in `preload.js`; `RepeatedRefine_c` in `UserEvToFunctCall.js`.
   - `AldoUtilities.js` è un cassetto senza coesione (utilità DOM + logica di gioco + parser + geometria d3 morta).
2. **File e codice morto**: `utilities.js`, `InteractJStests.js`, `Ajax.js`, codice d3 hull, `swapElements`, `sorting`, `sortablesExcluded`, 3 suoni su 5, `revert`, `isEquationMember`, `clearTragets`, `PActxViewer`, `searchForMarked`, stub SVG, grandi blocchi commentati ovunque.
3. **Bug latenti**: assegnamenti al posto di confronti (`inject`, `evaluateComparison`), funzioni che riferiscono simboli inesistenti (`ENODE_replaceWith`, `ENODEBesideGiven`), `$RolesAffectedByStartPropositionROLES` con variabili non definite in un ramo, `searchEventHandler` che logga una variabile inesistente.
4. **Globali implicite** (elenco in §3): rischio di collisioni silenziose in un ambiente tutto-globale.
5. **Accoppiamenti fragili**: dispatch `window[data-tag]`; `addedHardWiredProperties` chiamato da `HardWiredProperties`; `canvas` fuorviante; duplicazioni (`symbols`/`leafTags`, tre rappresentazioni del segno).
6. **Nessun confine modulo**: impossibile testare unità in isolamento; l'ordine degli script è l'unica documentazione delle dipendenze.

---

## 5. Architettura modulare di destinazione

Obiettivo: confini espliciti a **strati**, senza cambiare (per ora) il modello DOM-centrico né introdurre bundler. Ogni strato può dipendere solo dagli strati sopra di lui nell'elenco (dall'alto = più fondamentale):

```
1. core/          nucleo espressioni (nessuna dipendenza da UI)
   ExpressionManager.js, inflatedeflate.js, math.js, formatXML.js,
   calculateSpan.js (parte logica)
2. rendering/     refresh visivo dell'espressione
   infix.js, TranslateFormat.js, SVGlines.js, calculateSpan.js (parte highlight)
3. properties/    motori di trasformazione
   PMTutilities.js, PatternMatchingTrasform.js,
   HardWiredProperties.js, addedHardWiredProperties.js, PActx
4. persistence/   caricamento e salvataggio
   preload.js (solo loading), SaveLoad.js
5. interaction/   input utente e orchestrazione
   MAIN.js, DnD.js, UserEvToFunctCall.js, Undo.js, sound.js,
   settings-UI (estratta da preload.js), game/goal (estratta da AldoUtilities.js)
```

Regole di dipendenza volute:

- `core` non conosce `prompt`, suoni, snapshot, classi `mu_*`, `body[tool]`.
- `rendering` legge il core e scrive solo presentazione (classi, `.infix`, SVG).
- `properties` usa `core` + `rendering`; non registra listener.
- `interaction` è l'unico strato che registra eventi e tocca `GLBsettings`.
- Lo stato condiviso residuo (`GLBsettings`, `ssnapshot`, `propertiesDnD`) è dichiarato esplicitamente in un unico punto, non sparso.

---

## 6. Piano di rifattorizzazione

Passi ordinati, ciascuno piccolo, testabile con la suite e2e + `smoke-expression-manager.js`, e con comportamento invariato. I passi 1–3 sono pura rimozione/correzione a rischio minimo; i passi 4–7 spostano confini; il passo 8 è opzionale e abilita il futuro.

### Passo 1 — Bonifica del codice morto
- Eliminare i file: `utilities.js`, `InteractJStests.js` (+ script tag), `Ajax.js` (+ script tag).
- Rimuovere: `swapElements`, `sorting`, `sortablesExcluded` (MAIN), `revert`, `isEquationMember`, `clearTragets` (HardWired), `PActxViewer`, `markOriginalPositionInSubtree` commentata (PMT), `searchForMarked` (PMTrasform), codice d3 hull e `updateContainerView`/`sortByGrade` (AldoUtilities), `drawCallOut`/`updateMarkerColor` (SVGlines), `ENODE_replaceWith`, `ENODEBesideGiven`, `checkCn`, `overflowExsists`, `addTypeDecorations` (EM), suoni inutilizzati, `refreshInfix` obsoleta (dopo aver sostituito l'unica chiamata in `TranslateFormat.js`), grandi blocchi commentati.
- Verificare prima di ogni rimozione l'assenza di riferimenti anche nei file `Data/*.mml/.mmls` (gli `eventtoaction` chiamano funzioni per nome).

### Passo 2 — Correzione dei bug latenti
- `inject`: `containerRequirements='bool'` → `containerRequirements==='bool'` (verificare i chiamanti: oggi il ramo gira sempre, la correzione può cambiare comportamento → testare `.prt` e caricamento result).
- `evaluateComparison`: `if (ENODEClass = "eq")` → `===` (e rami successivi).
- `searchEventHandler`: correggere il `console.warn` su variabile inesistente.
- Rimuovere il ramo morto con variabili non definite in `$RolesAffectedByStartPropositionROLES`.

### Passo 3 — Eliminazione delle globali implicite
- Aggiungere `let`/`const` a tutte le assegnazioni implicite (§3). Nessun cambio di comportamento atteso salvo dove la globale era condivisa per errore (verificare `$clone`, usato in più file).
- Rinominare la globale `canvas` in `canvasRole` (o sostituirla con `$('#canvasRole')` nei 2 usi).

### Passo 4 — Estrazione della UI dal nucleo espressioni
- Spostare da `ExpressionManager.js` verso lo strato interaction/rendering: i `prompt()` (`ENODErenamePrompt`, la parte interattiva di `ENODECreateDefinition`), `ENODE_overlay`, `ENODEshowMarks`/`showAllMarks`/`hideAllMarks`, la chiamata a `ssnapshot.take()`, la scrittura di `exclusiveFocus`.
- Il nucleo espone la parte pura (es. `ENODErename(nome)`); l'interaction chiede il nome all'utente e chiama il nucleo.
- Unificare `symbols`/`leafTags` in un'unica costante del core.

### Passo 5 — Ricollocamento delle funzioni fuori posto
- `ENODEneedsBracket` → rendering (vicino a `refreshOneBracket`).
- `newPActx` → un nuovo `properties/PActx.js` (o in cima a `PMTutilities.js`), così `HardWiredProperties` e `PMTutilities` dipendono da un punto comune.
- ~~`RepeatedRefine_c` → strato properties~~ fatto: `app/js/refine.js` (`refineAfterProperty`, `markNeedsRefine`).
- Smontare `AldoUtilities.js`: `dummyParser`/`identifierToENODE` → core; `lookForResultAndCelebrate`/`compareWithResult` → nuovo modulo game/goal (interaction); utilità DOM generiche (`commonParent`, `removeClassByPrefix`, comparatori) → un `dom-utils.js`; il resto si elimina col passo 1.
- Estrarre da `preload.js` la parte settings-UI (`GLBsettingsToInterface`, `populateDropdown`, listener `#settings`) in un `settings.js` (interaction); `preload.js` resta solo loader.

### Passo 6 — Stato condiviso esplicito
- Creare `state.js` (caricato per primo tra gli script dell'app) che dichiara `GLBsettings`, `debugMode`, `preloadPath`, `tools` e l'oggetto `ssnapshot`; gli altri file smettono di dichiararli.
- Documentare in testa a `state.js` chi legge e chi scrive ogni campo.

### Passo 7 — Ordine di caricamento a strati
- Riordinare gli `<script>` in `index.html` secondo gli strati del §5 (core → rendering → properties → persistence → interaction, `MAIN.js` ultimo) e aggiungere un commento che vieta dipendenze "verso il basso".
- Questo passo è solo riordino + verifica: nessun codice cambia.

### Passo 8 (opzionale, abilitante) — Verso i moduli veri
- Quando gli strati sono stabili: avvolgere ogni file in IIFE esponendo un namespace (`Aabacus.core`, `Aabacus.props`, ...), oppure migrare a ES modules con un piccolo passo di build. Da valutare solo dopo che i passi 1–7 sono consolidati, perché il dispatch `window[data-tag]` delle proprietà hard-wired richiede un registro esplicito (es. `propertyRegistry[nome]`) prima di poter chiudere lo scope globale.

### Criteri di verifica per ogni passo
- Suite Playwright (`npx playwright test` in `project/tests`) verde.
- `node smoke-expression-manager.js` verde (11 controlli).
- Caricamento manuale di almeno: `PRELOAD.mmls` (default), `hanoi4.mmls`, un esercizio con `decomposeTens`/`tabelline` (es. Crotti), salvataggio e ricaricamento con Shift+S / Shift+L.
- Nessun errore in console al boot e durante le operazioni di base.
