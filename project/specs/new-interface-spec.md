# Specifica — Rifacimento interfaccia utente (touch-first)

**STATO: BOZZA — prima revisione di Romualdo ricevuta (23/07/2026); taglio promosso alla prova su tablet come gesto di scomposizione (§3.3.1); avviata pista parallela `index2` (§7)**

## Decisioni di revisione (Romualdo, 23/07/2026)

Risposte alle domande aperte della sezione 5; prevalgono su ogni requisito in contrasto nel resto del documento.

1. **Target**: tablet con schermo da 10 pollici. In futuro, eventuale sottoinsieme di esercizi semplici su cellulare (non dimensiona questa specifica).
2. **Pinch verticale**: idea mai sperimentata, nata per illustrare le due operazioni fondamentali — somma in orizzontale, prodotto in verticale. Prima di specificarne la semantica (fattorizzazione automatica vs scelta) va validata l'ergonomia su un prototipo rapido (`app/prototypes/pinch-lasso.html`, in lavorazione).
3. **Lazo**: seleziona solo sottoespressioni valide. Casi d'uso dichiarati: (a) aggiungere una parentesi attorno a una serie di fratelli dentro un'operazione associativa; (b) eliminare una serie di fratelli contenuti nello stesso role; (c) circondare un singolo elemento con un "confine" per usarlo come definens di una nuova definizione (basterebbe un touch, ma il confine disegnato può essere graficamente più calzante). Nota architetturale: in futuro un role potrebbe non essere solo una lista orizzontale/verticale ma una tabella o un'area a disposizione libera (insieme) — il lazo non deve assumere la linearità.
4. **Tool**: i gesti della nuova interfaccia dovrebbero rendere superflui i tool attuali (`copy`/`autoAdapt`/`declare`). Fallback se qualche azione non risulterà fluida: menù contestuale su long-touch sull'ENODE, oppure palette di scelta tool.
5. **SortableJS**: sostituirlo non è un obiettivo; ma poiché l'UI si ripensa da zero, le alternative si possono valutare liberamente.

Documento di specifica per il rifacimento dello strato **input** di Aabacus. Non modifica il motore delle espressioni né il registro delle proprietà: propone un nuovo contratto di gesti e di architettura del layer che parla con le interfacce già documentate in [`software-modules.md`](software-modules.md).

Documenti correlati: [`software-modules.md`](software-modules.md) (strati input / session services), [`tests.md`](tests.md) (obiettivi touch futuribili), [`implementation-details.md`](implementation-details.md) (UI attuale e goal touch — non modificare senza approvazione GOV).

---

## Motivazioni del committente (Romualdo)

1. **Origine touch, prototipo mouse/tastiera.** L’app è nata pensata per dispositivi touch (tablet in primis). Il prototipo attuale è incentrato su mouse + tastiera per ragioni di risorse; su touch **non funziona quasi per nulla**.
2. **Interazioni avanzate desiderate e oggi impossibili:**
   - (a) selezione di un insieme di ENODE disegnando un **lazo**;
   - (b) **pinch / unpinch orizzontale** su un numero/termine → scomposizione in **addendi**;
   - (c) **pinch / unpinch verticale** → scomposizione in **fattori**.
3. **Interfaccia da ripensare da zero.** L’UI attuale è frutto di rattoppi successivi ed è probabilmente inutilmente complicata: non bastano piccole modifiche.

Queste motivazioni sono sviluppate nelle sezioni 2–4; l’inventario della sezione 1 fonda ogni affermazione sul codice esistente.

---

## 1. Inventario delle interazioni attuali

Fonte primaria: strato **input** (`MAIN.js`, `DnD.js`, `UserEvToFunctCall.js`) e UI in `app/index.html`, come descritto in `software-modules.md` §2.5. Le session services (`Undo.js`, `game.js`, `settings.js`) non registrano eventi document-level (salvo il pannello settings) ma sono invocate dall’input.

### 1.1 Struttura UI (`app/index.html`)

| Area | ID / ruolo | Contenuto |
|------|------------|-----------|
| Colonna sinistra | `#leftColumn` → `#events` | Ricette `eventtoaction` (mappa gesto/tasto → azioni); caricate da preload come `gestToAction_mml` (`preload.js`) |
| Centro | `#paletteRow` → `#palette` | Prototipi trascinabili (fondamentali) |
| Centro | `#canvas` → `#canvasAnd` → `#canvasRole` | Albero ENODE dell’espressione (modello dati) |
| Centro | `#divOverlay` / `#svgContainer` | Linee SVG di hint (non input) |
| Centro | `#result` | Risultato atteso / celebrazioni |
| Destra | `#rightColumn` → `#settings`, `#fileToLoad` | Impostazioni e caricamento file |
| Status | `#statusDisplay` | Contatore mosse |

Dipendenze globali di runtime: jQuery 3.4.1, **SortableJS** (`Resources/sortablejs/Sortable.js`), math.js, Popper (caricati in `index.html`).

### 1.2 Boot e registrazione eventi (`MAIN.js`)

All’avvio:

- `ssnapshot()` + `ssnapshot.take()` — undo (`Undo.js`).
- `preloadAll(preloadPath)` — contenuti (`preload.js`).
- Listener nativi: `click` → `clickHandler`, `dblclick` → `dblclickHandler`.
- Listener jQuery document-level:
  - `mousedown` → `MakeSortableAndInjectMouseDown` (`DnD.js`);
  - `touchstart` → `preventDefault` + `stopPropagation` + stessa funzione;
  - `mouseup` / `touchend` → `MouseUpCleanup` (`DnD.js`);
  - `keydown` → scorciatoie + `keyboardEvToFC` (`UserEvToFunctCall.js`).

**Assente oggi:** zoom/pan del canvas, pinch, lazo, recognizer di gesti multi-touch, toolbar dedicata ai tool (il ciclo tool è solo **Tab**).

### 1.3 Tabella interazioni (gesto → effetto → implementazione)

#### A. Selezione e tool

| # | Gesto | Effetto | File / funzione | Dipendenze |
|---|-------|---------|-----------------|------------|
| A1 | `mousedown` / `touchstart` su ENODE in `#canvas` o `#palette` | Seleziona l’ENODE (classi `.selected` / `.unselected`); evidenzia occorrenze (`mu_connected`) e giurisdizione bool (`mu_span`) | `DnD.js` → `MakeSortableAndInjectMouseDown` → `MAIN.js` → `selectionManager` | jQuery; `ENODEselectable` (`ExpressionManager.js`); `highlightOccurrences`, `$calculateJurisdictionUpstream` |
| A2 | Stesso gesto + **Ctrl/Cmd** | Multiselezione (aggiunge `.selected` se non c’è antenato già selected) | `selectionManager(..., ctrl=true)` | Tasto modificatore |
| A3 | Stesso gesto + **Shift** | Deselezione mirata / `.unselected` dentro selezione | `selectionManager(..., shift=true)` | Tasto modificatore |
| A4 | Click “vuoto” di selezione (deselectAll) | Rimuove selected/unselected | `selectionManager("",..., deselectAll=true)` chiamato da DnD su `.unselectable` e da `startHandlerMouseDown` | — |
| A5 | **Tab** | Cicla `GLBsettings.tool` su `tools = ["", "copy", "autoAdapt", "declare"]` (`state.js`); aggiorna `body[tool]` | `MAIN.js` → `changeTool` | Tastiera |
| A6 | In tool `declare`: mousedown su proprietà con `data-tag` | Toggle `.selectedTool` (tool “giallo”) | `selectionManager` ramo declare | `GLBsettings.tool` |
| A7 | **Ctrl+A** | Seleziona tutti gli ENODE di primo livello in `#canvasRole` | `MAIN.js` keydown | Tastiera |

#### B. Drag & drop (motore SortableJS)

Flusso unico: `MakeSortableAndInjectMouseDown` → calcolo target → creazione pigra Sortable → `fromSortable._onTapStart(event)` → callback Sortable → eventuale `onAdd` → `PActxConclude`.

| # | Gesto | Effetto | File / funzione | Dipendenze |
|---|-------|---------|-----------------|------------|
| B1 | Drag in tool default (`""`) su canvas **tied** | Calcola target DnD HW via `getDnDpropEnabled()` + `findTgt` (priorità **first-wins**); drop → `property.apply` | `DnD.js` (`MakeSortable…`, `onAdd`); `UserEvToFunctCall.js` (`getDnDpropEnabled`); `propertyRegistry.js` (`listDnDProperties`) | SortableJS, jQuery; gate `ci[data-tag]` in canvas |
| B2 | Drag in tool **`copy`**, o da definizione **untied**, o da **palette** | Target “opened” (`validTargetsFromOpened`); drop clona/muove e `wrapWithDefIfNeededreturnTarget` | `DnD.js` ramo copy/opened; `ExpressionManager.js` | SortableJS; Ctrl/Cmd o tool copy → clone (`toBeCloned` in `startHandlerMouseDown`) |
| B3 | Drag in tool **`autoAdapt`** da membro di equazione in `forAll` tied | Pattern match: target via `validCandidatesForPatternDrop`; drop → `InstructAndTryOnePMT` | `DnD.js`; `PMTutilities.js` / pattern matching | SortableJS; direzione ltr/rtl da first/second member |
| B4 | Drag in tool **`declare`** | Solo proprietà del `.selectedTool`; sort abilitato se `data-commutative` coincide con op del parent | `DnD.js` + `getDnDpropEnabled` filtro declare | Tool + selectedTool |
| B5 | Riordino (sort) entro `.ul_role` / untied | Sortable `sort:true`; `onUpdate` → sound + check risultato | `makeSortableMouseDown`, `onUpdate` | SortableJS, `clickSound` |
| B6 | Mouseup / touchend / Sortable `onEnd` | Nasconde target ed evidenziazioni (`hideTargetsOnMouseUp`); cleanup completo su nuovo mousedown (`cleanupDnD`) | `MouseUpCleanup`, `cleanupDnD` | Commento esplicito: mouseup e sortEnd non sempre si allineano |
| B7 | Hover durante drag | Classe `mu_DropTarget` sul parent del ruolo sotto il cursore | `onMove` | Implicito hover/pointer move |

**Proprietà DnD registrate** (`HardWiredProperties.js`, ordine = priorità first-wins):  
`hanoiMoveDnD`, `addRedundantDnD`, `removeRedundantDnD`, `forThisDnD`, `modusPonensDnD`, `replaceDnD` (`requiresCanvasCi: false`), `partCollectDnD`, `collectDnD`, `partDistributDnD`, `distributiveDnD`, `associativeGenDnD`, `associativeDnD`.

**Modificatori che cambiano i target** (passati a `findTgt` da `MakeSortableAndInjectMouseDown`):

| Proprietà | Condizione | File |
|-----------|------------|------|
| `distributiveDnD` / `partDistributDnD` | Ctrl/Cmd (e Alt per dist) **disattiva** i target | `validForDist`, `validForPartDist` |
| `removeRedundantDnD` | richiede **Alt** | `validRedundant` |
| `addRedundantDnD` | richiede **Ctrl/Cmd** | `validAddRedundant` |

#### C. Proprietà unary (tastiera / `#events` = gestToAction)

| # | Gesto | Effetto | File / funzione | Dipendenze |
|---|-------|---------|-----------------|------------|
| C1 | Tasto (lettera, frecce, …) con selezione non vuota | Cerca in `#events` le ricette `eventtoaction` (`searchEventHandler`) e prova in ordine `TryOnePropertyByName` | `MAIN.js` keydown → `keyboardEvToFC` → `tryEventActionsOnNode` | Contenuto preload `#events`; `PMTutilities.js` → `TryOnePropertyByName` |
| C2 | In tool `declare` + **Invio** | Applica `.selectedTool` (`data-tag`); **Shift** = direzione `rtl` | `keyboardEvToFC` | Declare + selectedTool |
| C3 | Post-proprietà (refine) | `tryEventActionsOnNode($ENODE, "c")` ecc. senza passare dalla tastiera | `refine.js` → `UserEvToFunctCall.js` | Non è un gesto utente diretto |

**Unary HW tipiche** (`registerHardWiredMap` in `HardWiredProperties.js` / `addedHardWiredProperties.js`):  
`compose`, `decomposeInAProduct` (direzione `"up"` / fattori), `decomposeInASum` (direzione `"right"` / addendi), `evaluateComparison`, più didattiche `tabelline`, `composePlusOnly`, `decomposeTens`.

Mappatura frecce: tipicamente via dati in `#events` (es. esercizi Crotti / dbo: `←`/`→`/`↑`/`↓` → compose/decompose…). `keyToCharacter` in `MAIN.js` traduce i keycode frecce nei caratteri freccia.

#### D. Click, doppio click, edit inline

| # | Gesto | Effetto | File / funzione | Dipendenze |
|---|-------|---------|-----------------|------------|
| D1 | Click su `.firstMember` di una definizione | Toggle tied/untied; sul `#canvas` aggiorna anche result/events e `GLBsettings.tiedCanvas` | `clickHandler` | `ENODERefreshAsymmEq`, `ssnapshot.take` |
| D2 | Dblclick su `ci`/`cn` in def **untied** | Prompt rinomina | `dblclickHandler` → `ENODErenamePrompt` → `ENODErename` | `window.prompt` |
| D3 | Dblclick su `ci` in def **tied** con parametro in header | Prompt “Specify a value” → `forThisPar_focus_nofocus` | `dblclickHandler` | `prompt`, `dummyParser` |
| D4 | Dblclick su `forAll` / `and` | Toggle `data-vis=collapsed` | `dblclickHandler` | — |

#### E. Scorciatoie di sessione / file (`MAIN.js` keydown)

| # | Gesto | Effetto | Implementazione |
|---|-------|---------|-----------------|
| E1 | Ctrl+Z | Undo | `ssnapshot.undo` (`Undo.js`) |
| E2 | Ctrl+C / Ctrl+V / Ctrl+X | Copy / paste / cut | `ssnapshot.copy/paste` + `cancelSelected` |
| E3 | Canc / Backspace | Rimuove `.selected` non tied | `cancelSelected` → `ENODEremove` |
| E4 | Ctrl+B | “Baptize”: prompt nome → `ENODECreateDefinition` | prompt |
| E5 | Shift+S | Salva `.mmls` o `.mml` della selezione | `AlltoMMLSstring` / `ENODEcreateMathmlString` + `saveTextAsFile` |
| E6 | Shift+L | Apre `#fileToLoad` | trigger click → `loadFileConvert` |
| E7 | Shift+D | Toggle `debugMode` (body.debug, palette hidden) | `debugToggle` |

#### F. Session services e feedback

| # | Trigger | Effetto | File / funzione |
|---|---------|---------|-----------------|
| F1 | Dopo proprietà riuscita | `postApplyAfterProperty` → refine → snapshot → `movesCounter++` → `lookForResultAndCelebrate` → overlay feedback | `PActxConclude` (`MAIN.js`); `refine.js`; `game.js` |
| F2 | Change su `#settings` / controlli | Aggiorna `GLBsettings` e classi body | `settings.js` (`GLBsettingsToInterface`, listener `change`) |
| F3 | Vittoria gioco | `victorySound` + immagini in `#result` | `game.js` → `VisualizeCelebration` |

### 1.4 Diagnosi del “rattoppo” (complicazioni osservate)

1. **Bus globale `GLBDnD` e iniezione in Sortable.** Commento in testa a `DnD.js`: non c’è modo pulito di passare stato tra mousedown e callback Sortable (issue SortableJS #1196). Si usa `_onTapStart(event)` privato.
2. **Doppio canale mouseup / onEnd.** `cleanupDnD` documenta che né mouseup né sortEnd sono affidabili da soli; i target vengono prima *nascosti* (`hideTargetsOnMouseUp`) e rimossi solo al mousedown successivo — workaround temporale.
3. **Touch innestato male.** `MAIN.js` su `touchstart`/`touchend` fa `preventDefault` + `stopPropagation` e riusa il path mouse: blocca scroll nativo, non espone multi-touch, e non unifica con Pointer Events.
4. **Selezione accoppiata al drag.** Ogni `mousedown` su ENODE avvia la pipeline Sortable anche per un click di sola selezione: selezione e drag non sono fasi distinte.
5. **Priorità target first-wins + attributo `target` sul DOM.** I target validi vengono marcati sul DOM (`setAttribute('target', propertyName)`) e a volte wrap-pati con `.tgt` / `.notAtgt` — stato UI mescolato al modello ENODE.
6. **Modificatori Ctrl/Alt obbligatori** per alcune proprietà DnD: impossibili su tablet senza tastiera esterna.
7. **Tool invisibili.** Il ciclo Tab / `body[tool]` non ha chrome dedicato; modalità `declare`/`autoAdapt`/`copy` sono poco scoperte.
8. **Prompt sincroni** (`prompt`) per rename, forThis, save-as, baptize: UX desktop-era, incompatibile con touch e con Playwright fluido.
9. **Hover come feedback** (`onMove` → `mu_DropTarget`): su touch non esiste hover.
10. **jQuery + SortableJS + API ENODE + classi `mu_*`**: tre astrazioni sovrapposte nello stesso gesto, senza recognizer centrale.

---

## 2. Limitazioni dell’attuale interfaccia

### 2.1 Dichiarate dal committente

| Limitazione | Evidenza nel codice |
|-------------|---------------------|
| Pensata touch, usabile soprattutto mouse/tastiera | Listener e scorciatoie in `MAIN.js`; nessun pinch/lazo |
| Touch “quasi non funziona” | `touchstart` con `preventDefault`/`stopPropagation`; dipendenza da SortableJS e da eventi mouse |
| Nessun lazo di selezione | Solo click/mousedown + Ctrl/Shift in `selectionManager` |
| Nessun pinch orizzontale → addendi | `decomposeInASum` esiste come unary (tastiera / `#events`), non come gesto |
| Nessun pinch verticale → fattori | `decomposeInAProduct` idem (`decompose(..., "up")`) |
| UI da ripensare, non rattoppare | Accoppiamento selezione–DnD–Sortable–modificatori (sez. 1.4) |

### 2.2 Limitazioni emerse dall’analisi

1. **Tasti modificatori come parte del contratto DnD** (`findTgt(..., ctrlOrMeta, altKey)`): redundant add/remove e distribuzione cambiano significato senza UI alternativa.
2. **Target piccoli / ad hoc.** I drop su ENODE non-ruolo creano `.tgt` prepended; hit-testing con dito è fragile (anche i test Hanoi usano `probePoint` e offset — `tests.md`).
3. **Eventi mouse-only di fatto.** Nonostante `touchstart`, il modello mentale è mousedown → Sortable mouse path; assenti `pointerdown`/`gesture`-level API proprie.
4. **Dblclick e Tab** non hanno equivalenti touch naturali.
5. **Nessun zoom/pan** del canvas: su tablet espressioni grandi restano solo scroll di pagina (se non bloccato dal preventDefault).
6. **Palette / colonne IDE** pensate per desktop (tre colonne, toggle `fixed`); footprint touch non ottimizzato.
7. **Feedback sonoro/visivo** legato al path DnD (`clickSound` in `onAdd`/`onUpdate`) senza canale unificato per altri gesti.
8. **Testabilità touch ancora futuribile** (`tests.md`: pinch/curve “da implementare in seguito”).
9. **Salvataggio settings incompleto** (nota in `software-modules.md`: `AlltoMMLSstring` non serializza settings) — influenza ripristino tool/visibilità dopo load, non solo UX.

---

## 3. Requisiti della nuova interfaccia

**Principio guida:** *touch-first per tablet*; mouse e tastiera come raffinamento progressivo sullo stesso recognizer (Pointer Events), non come path parallelo.

Priorità: **MUST** / **SHOULD** / **COULD**.

### 3.1 Requisiti trasversali

| ID | Priorità | Requisito |
|----|----------|-----------|
| R0.1 | MUST | Input basato su **Pointer Events** nativi (unificano mouse / touch / pen). |
| R0.2 | MUST | **Recognizer di gesti centrale** (unico punto che interpreta pointer stream → intent: tap, long-press, drag, pinch, lasso, pan…). |
| R0.3 | MUST | Il layer input parla al motore **solo** tramite interfacce esistenti: `propertyRegistry` / `getDnDpropEnabled` / `findTgt`+`apply`, `TryOnePropertyByName`, `PActxConclude`, `markNeedsRefine` / `refine.js` — **mai** manipolare direttamente il DOM dell’espressione per applicare una proprietà. |
| R0.4 | MUST | Selezione e drag sono **fasi distinte** (soglia di movimento / long-press), non lo stesso handler. |
| R0.5 | MUST | Tutti i gesti MUST/SHOULD sono esercitabili in **Playwright** con emulazione touch (`TouchEvent` / pointer touch). |
| R0.6 | SHOULD | Nessuna dipendenza obbligatoria da tasti modificatori per le azioni didattiche primarie; i modificatori restano acceleratori desktop. |
| R0.7 | SHOULD | Target di drop con area minima touch-friendly (soglia da decidere — Domanda 1). |
| R0.8 | COULD | Feedback aptico (se supportato dal device). |

### 3.2 Lazo di selezione (nuovo)

| ID | Priorità | Gesto | Comportamento atteso | Casi limite |
|----|----------|-------|----------------------|-------------|
| R1.1 | MUST | Un dito disegna una curva chiusa (o quasi chiusa) sul canvas | Tutti gli ENODE il cui bounding box interseca / è contenuto nel poligono entrano in `.selected` (politica esatta: Domanda 5) | Lazo che interseca antenato e discendente: evitare selezione ridondante (preferire foglie o LCA — Domanda 5) |
| R1.2 | MUST | Lazo su area vuota | Deseleziona tutto | — |
| R1.3 | SHOULD | Secondo lazo con “add mode” (es. long-press → lasso, o toggle UI) | Unione alla selezione | Equivalente touch di Ctrl+click |
| R1.4 | SHOULD | Feedback live del tratto | Stroke semi-trasparente durante il gesto | Cancel se il dito esce dal canvas con gesto abort |
| R1.5 | COULD | Lazo che “snappa” solo a sottoespressioni matematicamente valide come operando unico | Filtra candidati con regola didattica | Può contraddire R1.1 se troppo restrittivo |

### 3.3 Pinch orizzontale → addendi; pinch verticale → fattori (nuovo)

Allineamento col motore esistente:

- Orizzontale ↔ `decomposeInASum` / `decompose(..., "right")` — scomposizione in **plus**.
- Verticale ↔ `decomposeInAProduct` / `decompose(..., "up")` — scomposizione in **times** / fattorizzazione.

| ID | Priorità | Gesto | Comportamento atteso | Casi limite |
|----|----------|-------|----------------------|-------------|
| R2.1 | MUST | Pinch **out** orizzontale su un termine/numero selezionato o sotto le dita | Invoca unary di scomposizione in addendi via `TryOnePropertyByName('decomposeInASum', …)` (o nome esercizi-equivalente se gated) poi `PActxConclude` | Su non-`cn` o val≤1: nessun effetto (come oggi `decompose`) |
| R2.2 | MUST | Pinch **out** verticale | Idem con `decomposeInAProduct` | Numero primo: oggi può inserire neutro `1` — confermare (Domanda 3) |
| R2.3 | MUST | Discriminazione asse | Se \|Δx\| > \|Δy\| × k → orizzontale; altrimenti verticale (k da tarare) | Pinch diagonale: scegliere asse dominante o abort con feedback |
| R2.4 | SHOULD | Pinch **in** (unpinch inverso) | Compose / riassorbimento verso il termine (es. `compose` sui fratelli selezionati o sul contesto) | Ambiguità se più interpretazioni — Domanda 4 |
| R2.5 | SHOULD | Preview durante il pinch | Hint visivo (addendi vs fattori) prima del commit al sollevamento | Commit solo se soglia di scala superata |
| R2.6 | COULD | Scelta fattorizzazione non canonica | UI per scegliere 2×3 vs 6×1 ecc. | Oggi `primeFactorization` è automatica |

#### 3.3.1 Ergonomia dell'unpinch — esiti prova su tablet e ricerca (23/07/2026)

Prova sul prototipo v1 (`app/prototypes/pinch-lasso.html`, tablet 10"): l'unpinch **orizzontale è scomodo e tende a scivolare in diagonale**. La letteratura conferma che non è un difetto di esecuzione ma di progetto:

- **Hoggan et al., ITS 2013** (*Multi-touch pinch gestures: performance and ergonomics*): l'espansione (unpinch) è più lenta e con più fallimenti ergonomici della contrazione; i fallimenti crescono con la distanza; estensione ottimale < 90 mm.
- **HFES 2014** (*Task-related Factors in Pinch Gestures*): i movimenti di pinch **diagonali sono i più accurati** — la diagonale è l'asse anatomico di apertura pollice-indice. Pretendere l'asse orizzontale puro rema contro la biomeccanica.
- **Prior art — Graspable Math** (Weitnauer & Ottmar, notazione algebrica dinamica touch): gesti = drag, tap; lo **shaking è usato come feedback di errore** (l'espressione si scuote su azione non valida), convenzione diffusa (iOS incluso). Usare lo scuotimento come gesto costruttivo è semanticamente a rischio.

Candidati alternativi in valutazione empirica sul prototipo v2 (`app/prototypes/gesti-v2.html`), tutti con variante H→addendi / V→fattori:

| Candidato | Idea | Pro | Contro |
|-----------|------|-----|--------|
| Unpinch migliorato | Classificazione su asse dominante (niente zona morta diagonale) + preview live orientabile | Conserva il gesto originale; due mani su tablet appoggiato | Resta a due dita |
| Taglio (slice) | Un dito attraversa il blocco; taglio verticale → addendi, orizzontale → fattori | Un dito, direzione netta, metafora "spezzare", niente conflitto col drag | Dualità taglio⊥scomposizione da verificare |
| Strappo (tear) | Un dito àncora, l'altro tira via; decide la direzione del dito mobile | Direzione precisa, comodo a due mani | Richiede coordinazione àncora+tiro |
| Scuotimento (shake) | ≥3 inversioni rapide sullo stesso asse (proposta di Romualdo) | Un dito, memorabile | Collisione semantica con shake=errore; ritarda il riconoscimento del drag; asse sporco |

**Verdetto prova su tablet (23/07/2026 pomeriggio): il TAGLIO è il candidato promosso** ("molto bello" — Romualdo). Diventa il gesto di riferimento per la scomposizione nel nuovo modulo di input (§7); gli altri candidati restano documentati come alternative. Restano dovuti test più approfonditi (v. §7.3).

### 3.4 Traduzione touch delle interazioni da conservare

#### Selezione e tool

| Inventario | Priorità | Gesto touch proposto | Note |
|------------|----------|----------------------|------|
| A1 select | MUST | Tap su ENODE | Sostituisce mousedown-select |
| A2 multi-select | MUST | Lazo (R1) e/o tap con toggle “multi” in UI | Non dipendere da Ctrl |
| A3 unselect mirato | SHOULD | Tap su nodo già selected dentro selezione ampia, o “gomma” | Equivalente Shift |
| A5 change tool | MUST | Segmented control / chip tool sempre visibile | Tab resta acceleratore tastiera |
| A6 selectedTool (declare) | SHOULD | Tap sulla proprietà in canvas in modalità declare | Come oggi, senza modificatori |
| A7 select all | SHOULD | Pulsante “seleziona tutto” o long-press su sfondo canvas | Ctrl+A resta su tastiera |

#### Drag & proprietà DnD

| Inventario | Priorità | Gesto touch proposto | Note |
|------------|----------|----------------------|------|
| B1 apply DnD HW | MUST | Drag dopo soglia (o long-press → drag) verso target evidenziati | Stesso `findTgt`/`apply` / `PActxConclude` |
| B2 copy / palette / opened | MUST | Drag da palette; modalità Copy come tool chip; pinch-clone COULD | Evitare obbligo Ctrl per clonare |
| B3 autoAdapt | MUST | Tool AutoAdapt + drag membro equazione → target | Conservare ltr/rtl (flip o handle sui due membri) |
| B4 declare | SHOULD | Conservare se Romualdo conferma (Domanda 8) | UI tool esplicita |
| B5 reorder | MUST | Drag orizzontale/verticale entro lista untied / `.ul_role` | Senza Sortable se sostituito (sez. 4) |
| Modificatori Alt/Ctrl su redundant/dist | MUST (equiv.) | Azioni esposte come varianti di tool o menu contestuale long-press | Rimuovere hard-require dei modificatori sul path touch |

#### Unary / gestToAction

| Inventario | Priorità | Gesto touch proposto | Note |
|------------|----------|----------------------|------|
| C1 ricette `#events` | MUST | Mantenere mappa dati; binding gesti: frecce → swipe; lettere → pulsanti proprietà / palette azioni | Il file dati resta il gate didattico |
| C2 declare+Invio | SHOULD | Pulsante “Applica” + toggle direzione | — |
| Compose | MUST | Swipe che avvicina due termini / unpinch (R2.4) / pulsante | Oltre alla tastiera |
| Decompose | MUST | Pinch (R2) | — |

#### Click / edit

| Inventario | Priorità | Gesto touch proposto | Note |
|------------|----------|----------------------|------|
| D1 tie/untie | MUST | Tap sull’icona lucchetto (target ampio) | Non sul solo angolo piccolo |
| D2 rename | MUST | Double-tap **oppure** long-press → foglio di input in-page | Vietare `prompt()` sul path touch |
| D3 forThis value | MUST | Long-press → editor in-page | Idem |
| D4 collapse | SHOULD | Double-tap su `forAll`/`and` o chevron | — |

#### Sessione / file / feedback

| Inventario | Priorità | Gesto touch proposto | Note |
|------------|----------|----------------------|------|
| E1 Undo | MUST | Pulsante Undo + gesture “shake” COULD; Ctrl+Z su tastiera | `ssnapshot.undo` |
| E2 Copy/Paste/Cut | SHOULD | Pulsanti / menu selezione; scorciatoie tastiera | |
| E3 Delete | MUST | Pulsante cestino con conferma se selezione grande | |
| E5/E6 Save/Load | SHOULD | Pulsanti file; file picker nativo | Shift+S/L restano |
| F1 conclude/celebrate | MUST | Invariato a valle di `PActxConclude` | |
| F2 settings | SHOULD | Pannello collassabile touch-friendly | |
| Zoom/pan canvas | SHOULD | Pan due dita / un dito su sfondo; pinch globale su sfondo = zoom UI (distinto dal pinch-decompose su ENODE) | Domanda 2 — *non esiste oggi* |
| Help / definizioni | COULD | Long-press su `ci` con `data-tag` → scheda proprietà | |

### 3.5 Mouse e tastiera come raffinamento

| ID | Priorità | Requisito |
|----|----------|-----------|
| R3.1 | MUST | Mouse genera gli stessi intent del recognizer (tap=click, drag=drag, wheel COULD=zoom). |
| R3.2 | SHOULD | Tastiera resta binding verso `keyboardEvToFC` e scorciatoie sessione. |
| R3.3 | COULD | Hover desktop per preview target DnD (oltre al feedback durante drag). |

---

## 4. Principi architetturali

### 4.1 Confine col motore (invariante)

```
Pointer stream → GestureRecognizer → Intent
    → Adapter (chiama solo API pubbliche properties/session)
        → TryOnePropertyByName | dndDescriptor.apply | InstructAndTryOnePMT
        → PActxConclude
            → postApplyAfterProperty / refine / undo snapshot / game
```

Vietato dall’adapter: `ENODEremove` / `ENODEinsert*` / edit HTML dell’espressione per “simulare” una proprietà. Consentito: leggere il DOM per hit-test e selezione (come oggi fa l’input), aggiornare **solo** classi/attributi di UI (`selected`, highlight), e delegare mutazioni semanticamente rilevanti alle proprietà.

Riferimento interfacce: `software-modules.md` §2.3–2.5 (`propertyRegistry`, `TryOnePropertyByName`, `PActxConclude`, `markNeedsRefine`).

### 4.2 Pointer Events e recognizer centrale

- Un modulo (proposta: nuovo file nello strato input, es. `GestureRecognizer.js` + `InputController.js`) possiede i listener `pointerdown/move/up/cancel`.
- Stato FSM tipico: `idle → possible_tap → dragging | lassoing | pinching | panning`.
- `MAIN.js` smette di essere un ammasso di handler sparsi: diventa bootstrap + wiring; `DnD.js` attuale viene sostituito o ridotto a “DragSession” guidato dal recognizer.
- Compatibilità test: allinearsi a `tests.md` (eventi reali via coordinate; vietate chiamate dirette a `_onTapStart`).

### 4.3 SortableJS — pro / contro

| Tenere SortableJS | Sostituire SortableJS |
|-------------------|------------------------|
| Già integrato; reorder e group `shared` funzionanti in scenari tied/untied | API privata `_onTapStart`; bus `GLBDnD`; conflitti noti con PointerEvent sintetici nei test (`tests.md` §6) |
| Meno codice da riscrivere nel breve | Controllo pieno su hit-test, soglie touch, multi-touch parallelo |
| Comunità/docs | Un drag “matematico” (apply property) non è un list-reorder: Sortable è forzato a fare da bus di drop |

**Raccomandazione di bozza:** *sostituire SortableJS per il path proprietà (drop su target semantici)*; *valutare* un reorder minimale custom (o Sortable solo in modalità untied/costruzione) nella Fase D. La decisione finale è di Romualdo (Domanda 9).

### 4.4 Testabilità Playwright

- Pagina di prova isolata del layer input (Fase C roadmap) con ENODE stub e mock di `TryOnePropertyByName` / `PActxConclude`.
- Scenario touch: due pointer per pinch; path pointer per lasso; assert su intent emessi e su chiamate mock (non sul DOM espressione mutato a mano).
- Allineamento a `tests.md`: regression con eventi DOM reali; estensione esplicita a `TouchEvent` / pointer touch.

### 4.5 Coesistenza con session services

Undo, game, settings restano invocati come oggi da `PActxConclude` / pannello: il rifacimento **non** li riscrive, salvo esporre pulsanti che chiamano le stesse API (`ssnapshot.*`, `GLBsettingsToInterface`).

---

## 5. Domande aperte per Romualdo

1. **Device / viewport target minimo?** (es. iPad 10ª gen landscape 1024×768, oppure solo ≥10″). Determina soglie hit-target e layout colonne.
2. **Serve zoom/pan del canvas** distinto dal pinch-decompose? Se sì, gesti riservati (sfondo vs ENODE)?
3. **Pinch verticale su `cn(6)`:** applica sempre la fattorizzazione prima `primeFactorization` (es. 2×3), propone scelte, o un passo alla volta (come `decomposeInASum` fa n→(n−1)+1)?
4. **Pinch-in (unpinch):** deve mappare sempre a `compose`? Anche tra termini non numerici?
5. **Lazo:** seleziona qualunque insieme di ENODE, oppure solo sottoinsiemi che formano un operando / fratelli dello stesso ruolo? Regola in caso di overlap antenato/discendente?
6. **Soglia e cancel del lazo:** curva deve chiudersi? Tolleranza gap? Undo della sola selezione?
7. **Tool `declare` / `autoAdapt` / `copy`:** si mantengono tutti e quattro i valori di `tools` in `state.js`, si semplificano, o si espongono diversamente (palette azioni invece di modalità globali)?
8. **Proprietà gated da Alt/Ctrl** (`addRedundantDnD`, `removeRedundantDnD`, …): quali varianti restano in curriculum touch e con quale UI?
9. **SortableJS:** mandato a sostituirlo nel path proprietà, o vincolo a tenerlo per reorder?
10. **Layout IDE (tre colonne, `#events` visibile):** su tablet events/settings restano pannelli, diventano drawer, o `#events` è solo motore nascosto?
11. **Double-tap vs long-press** come primitiva primaria per edit (rename / forThis)?
12. **Compatibilità esercizi esistenti** (`.mmls` con ricette freccia in `#events`): il pinch deve *affiancare* o *sostituire* le frecce per decompose?
13. **Modalità gioco** (`gameMode`, surprise result): vincoli UX aggiuntivi (nascondere undo, limitare lazo)?
14. **Accessibilità / penna:** Apple Pencil o solo dito? Preferenze?
15. **Nome e perimetro del prototipo Fase C:** conferma pagina isolata fuori da `index.html` production vs feature flag?

---

## 6. Bozza di roadmap

Fasi incrementali; ciascuna ha un **criterio di uscita** verificabile. Il motore properties/core non si riscrive.

### Fase A — Allineamento e decisioni

- Documentare decisioni sulle Domande 1–5, 7, 9 (minimo).
- Congelare elenco intent (`Select`, `LassoSelect`, `DragStart`, `DropOnTarget`, `PinchDecompose`, `Undo`, …).

**Uscita:** verbale/checklist Romualdo su MUST e su Sortable keep/replace.

### Fase B — Contratto Intent ↔ motore

- Adapter che, dato un intent + nodi, chiama solo API §4.1.
- Test unitari/smoke su adapter con DOM di esercizio minimo (senza UI nuova).

**Uscita:** per ogni intent MUST, almeno un test che verifica chiamata a `TryOnePropertyByName` / `apply` + `PActxConclude` senza mutazioni DOM “a mano”.

### Fase C — Prototipo isolato del layer input *(coordinatore)*

- Pagina di prova (fixture ENODE semplificati, mock o thin-wrap del motore).
- GestureRecognizer: tap, drag, **lasso**, **pinch H/V**.
- Suite Playwright con **emulazione touch** (pinch a due pointer, tratto lazo).

**Uscita:** CI verde sui gesti MUST del prototipo; nessun regressione richiesta ancora su `index.html` production.

### Fase D — Integrazione in app

- Sostituire progressivamente i listener di `MAIN.js` / path `DnD.js`.
- Chip tool + Undo + hit-target; rimozione `preventDefault` indiscriminato su touch.
- Traduzione touch delle unary via `#events` + pinch.

**Uscita:** un esercizio reale (es. fondazione + compose/decompose) completabile solo touch su tablet target; smoke Playwright touch su quell’esercizio.

### Fase E — Parità desktop e polish

- Scorciatoie tastiera e mouse come alias degli stessi intent.
- Menu contestuali per redundant/dist senza modificatori.
- Zoom/pan se approvato; rimozione dipendenze obsolete (Sortable se deciso).

**Uscita:** checklist parità inventario sez. 1 (tutte le interazioni conservate hanno path touch o decisione esplicita “desktop-only”); aggiornamento `tests.md` (touch non più futuribile).

### Fase F — Debito e semplificazione

- Eliminare GLBDnD / `_onTapStart` / prompt sincroni sul path principale.
- Revisione layout IDE tablet.
- Eventuale serializzazione settings (debito noto) se ancora rilevante.

**Uscita:** diagramma strato input aggiornato in `software-modules.md` (con approvazione architetturale se richiesta).

---

## 7. Pista parallela `index2` — modulo di input alternativo (avviata 23/07/2026)

Decisione di Romualdo: attaccare il problema anche dal lato UI in parallelo al refactoring — accorcia la strada verso un prodotto usabile e chiarisce le priorità del refactoring stesso.

### 7.1 Perimetro e invarianti

- **Guscio:** `app/index2.html`, accanto a `index.html` (non in `prototypes/`: così tutti i path relativi — `./Data/...`, `js/`, `css/`, immagini — e `?preloadPath=` di `state.js` funzionano invariati).
- **Invarianti dichiarate da Romualdo:** (1) stessa struttura HTML dell'**ExpressionTree a partire dal root `#canvas`** — precisazione 23/07: l'invariante riguarda solo l'albero; la struttura "IDE" (colonne sinistra/centrale/destra, palette, settings…) **può essere ridiscussa** se si trova un modo migliore di realizzarla; (2) stesso aspetto dell'albero — la riscrittura CSS da zero è un'occasione da cogliere, ma come **fase separata** con test di parità visiva; (3) **preload integrato dal primo giorno** (`preloadAll(preloadPath)`, esercizi `.mmls` reali via `?preloadPath=`).
- **Contratto reale dell'IDE verso il motore:** non il layout, ma gli ancoraggi DOM in cui preload/settings iniettano — `#canvasRole` (e wrapper `#canvas`/`#canvasAnd`), `#palette` (con i prototipi `fundamental`), `#events`, `#result`, `#settings`, `#svgContainer`/`#divOverlay`. Un'IDE ridisegnata deve solo conservare questi id (anche nascosti o ricollocati); in v0 `index2.html` mantiene lo skeleton attuale come impalcatura funzionale, il redesign del "chrome" è un passo successivo.
- **Riuso intatto degli strati 1–4** (core, rendering, properties, persistence). Si sostituisce solo lo strato interaction: niente `MAIN.js`, `UserEvToFunctCall.js`, `DnD.js` nel guscio nuovo.
- Il gating didattico resta: i gesti passano da `TryOnePropertyByName`, che richiede il `ci` della proprietà nel canvas dell'esercizio.

### 7.2 Architettura del modulo input (`app/js/input2/`)

Tre pezzi con confini netti, pensati per la sostituibilità dei gesti:

1. `gestures.js` — **recognizer puro** (Pointer Events → FSM → *intent*). Nessuna conoscenza del dominio matematico. Emette es. `{type:'slice', axis:'v', target}`.
2. `intentMap.js` — **mappa dichiarativa intent→azione** (es. `slice.v → decomposeInASum`, `slice.h → decomposeInAProduct`). È il punto di customizzazione: cambiare combinazione di gesti o dare all'utente finale la scelta = cambiare questa mappa, non il codice.
3. `boot2.js` — orchestrazione: preload, dispatch delle azioni (`TryOnePropertyByName` + conclude minimale con `postApplyAfterProperty`), stub documentati dei simboli dello strato escluso.

### 7.3 Requisiti di test sui gesti (Romualdo, 23/07)

1. **Non-sovrapposizione:** quasi mai un utente che vuole fattorizzare deve ritrovarsi con un lazo, ecc. Piano: matrice di confusione tra gesti — corpora di tratti sintetici (Playwright touch, con jitter e varianti diagonali) classificati dal recognizer + contatori riuscito/fallito in-app per le prove dal vivo.
2. **Coerenza del set:** il set finale dev'essere coerente, intuitivo e piacevole; si valuta sul prototipo con esercizi reali, non su blocchi finti.
3. **Modularità:** cambiare il set di gesti (o renderlo customizzabile dall'utente) non deve costare riscritture — garantito dall'intent map (§7.2.2).

### 7.4 Gesti configurabili dal file `.mmls` (proposta Romualdo 23/07, approvata)

La sezione `events` del `.mmls` — che oggi associa un tasto a una proprietà o lista di proprietà — estende il proprio vocabolario dai tasti ai **nomi di gesto**: la struttura `eventtoaction` resta identica, cambia solo cosa può comparire come evento (es. `slice.h → decomposeInAProduct`). L'esercizio resta così l'unica fonte di verità didattica: contenuto, palette, obiettivo, semantica dei gesti.

Due classi di gesti, in simmetria con `requiresCanvasCi` del property registry (infrastruttura non configurabile vs didattica configurabile):

| Classe | Gesti | Configurabile da `.mmls`? |
|--------|-------|---------------------------|
| **Strutturali** | `tap` → select, `lasso` → selectSiblings, `dnd` → replace / applyPMproperty, undo | **No** — cablati nel core dell'input; tentativi di rimappatura → warning |
| **Didattici** | `slice.h`, `slice.v`, futuri `pinch.*`, `doubletap`, … | **Sì** — via sezione `events` |

Regole:

1. **Default nel codice, override nell'esercizio**: la intent map di default vive in `intentMap.js`; il `.mmls` può restringere (quali gesti sono attivi) o eccezionalmente rimappare; in assenza di dichiarazioni valgono i default. Protegge la coerenza del set per l'allievo (§7.3.2) ed evita boilerplate per gli autori.
2. **Vocabolario canonico degli intent** fissato in specifica: `tap`, `lasso`, `dnd`, `slice.h`, `slice.v` (+ estensioni future). La sezione `events` usa questi nomi; nomi sconosciuti → warning in console, mai fallimento silenzioso.
3. Doppio gating invariato: il gesto mappato passa comunque da `TryOnePropertyByName`, quindi serve anche il `ci` della proprietà nel canvas.

### 7.5 Tabella gesture↔action (Romualdo, 23/07 sera)

Fonte: tabella di Romualdo (immagine agli atti della chat) + ricette reali in `gestToAction.mml`. Formalizza tre concetti: il **target** del gesto tra parentesi (`selected` = selezione corrente, `pinched`/`slashed` = bersaglio individuato dal gesto stesso), gli **alias tastiera** di ogni gesto (parità desktop), le **liste ordinate di azioni** `{name, val?}` (si prova nell'ordine finché una matcha; `val` è il secondo argomento ltr/rtl/int passato a `TryOnePropertyByName`).

| Trigger gesto | Alias tastiera | Target | Azioni (in ordine) | Classe |
|---------------|----------------|--------|--------------------|--------|
| — | command+z | — | undo | **sistema** |
| — | Maiusc+l | — | load | **sistema** |
| — | Maiusc+s | selected | save | **sistema** |
| tap | — | (target del tap) | toggleSelect | **sistema** |
| lasso | — | targets del lazo | selectSiblings | **sistema** |
| dnd | — | source→target del drag | applyDnD | **sistema** |
| — | p | selected | plusAssociate ltr, plusAssociate rtl, timesAssociate ltr, timesAssociate rtl, orAssociate ltr, orAssociate rtl, andAssociate ltr, andAssociate rtl | didattica |
| — | c | selected | OppositeOfOpposite ltr, InvOfOpposite ltr, evaluateComparison int, PlusSingleTerm ltr, TimesSingleFactor ltr, AndSingleChild ltr, OrSingleChild ltr, defOne ltr, OrNeutral ltr, AndNeutral ltr, andAbsorbingEl ltr, orAbsorbingEl ltr, notFalse ltr, zeroAsEmptyPlus ltr, oneAsEmptyTimes ltr, plusAssociate ltr, timesAssociate ltr, andAssociate ltr, orAssociate ltr | didattica |
| pinchHor | arrowDown | pinched / selected | compose, AndNeutral ltr, timesAbsorbingEl ltr | didattica |
| pinchVert | arrowLeft | pinched / selected | compose, composeXorNotX rtl | didattica |
| slashHor | arrowUp (*) | slashed / selected | timesAbsorbingEl rtl, decomposeInAProduct, AndNeutral rtl, Reciprocal rtl | didattica |
| slashVert | arrowRight (*) | slashed / selected | decomposeInASum, Opposite rtl, defZero rtl, composeXorNotX rtl | didattica |

(*) Alias slash allineati alla convenzione legacy delle frecce (ArrowRight=addendi, ArrowUp=fattori), in attesa di conferma esplicita di Romualdo; azioni con secondo argomento ltr/rtl ora supportate.

**Discriminazione slice / lazo / drag** (recognizer `gestures.js`, §7.3.1): slice e lazo partono entrambi *fuori da ogni foglia* `[data-enode]` (i contenitori `and`/`eq` riempiono il canvas: l'interpretazione operativa di «fuori dagli ENODE» è «fuori dalle foglie»). Un tratto quasi rettilineo che *attraversa* un ENODE → `slice`; un percorso con curvatura/ritorno che *racchiude* senza attraversare → `lasso`; se i due criteri competono o il gesto è insufficiente → nessun intent. Il drag (`dnd`) parte *su una foglia* e supera la soglia di movimento (il tap resta giù+su senza move). Tutti gli intent passano da `dispatchIntent` → `resolveIntent` (tabella sopra); nessun percorso di smistamento parallelo.

Regole di incorporamento nel codice (accortezze di Romualdo):

1. Lo smistamento gesture→action è **centralizzato in un unico modulo unit-testabile**: `intentMap.js` possiede tabella e risoluzione come funzioni pure (niente DOM); `boot2.js` fa solo il cablaggio eventi.
2. Le righe **sistema** non sono riconfigurabili da `.mmls` (warning al tentativo).
3. **Disabilitazione al "tied"**: quando il canvas diventa tied si calcola quali proprietà hanno il `ci` nel canvas e si disabilitano le azioni che non avrebbero comunque conseguenze (esposto anche per future affordance UI).

---

## Appendice A — Mappa rapida file analizzati

| File | Ruolo nell’inventario |
|------|------------------------|
| `app/index.html` | Struttura palette / canvas / events / settings; ordine script |
| `app/js/MAIN.js` | Listener, tool, selezione, dblclick, scorciatoie, `PActxConclude` |
| `app/js/DnD.js` | Intero flusso drag → target → Sortable → `onAdd` |
| `app/js/UserEvToFunctCall.js` | `keyboardEvToFC`, `tryEventActionsOnNode`, `getDnDpropEnabled`, `#events` |
| `app/js/propertyRegistry.js` | Contratto unary vs dnd |
| `app/js/HardWiredProperties.js` | `decompose`/`compose`, registrazione DnD, modificatori in `findTgt` |
| `app/js/settings.js` | Pannello ↔ `GLBsettings` |
| `app/js/game.js` | Vittoria post-mossa |
| `app/js/state.js` | `tools`, campi `GLBsettings` |
| `app/js/Undo.js` | `ssnapshot.take/undo/copy/paste` |
| `app/js/preload.js` | Caricamento `gestToAction_mml` in `#events` |
| `project/specs/software-modules.md` | Confini strati e API consentite |
| `project/specs/tests.md` | Vincoli regression e touch futuribile |

## Appendice B — Glossario operativo

| Termine | Significato |
|---------|-------------|
| ENODE | `div[data-enode]` nel canvas; modello dati = DOM |
| Intent | Esito discreto del recognizer (non un evento DOM grezzo) |
| gestToAction / `#events` | Sezione dati che lega tecla/gesto logico a liste di `callfunction` / proprietà |
| first-wins | Prima proprietà DnD in ordine di registrazione che reclama un target lo tiene |
| tied / untied | Canvas (o definizione) vincolato vs costruzione libera |

---

## Nota di coerenza (rilettura)

- Ogni interazione inventariata cita file/funzione verificabili; pinch e lazo sono esplicitamente **nuovi** (non presenti nel codice).
- I requisiti MUST del pinch riusano le unary già registrate (`decomposeInASum` / `decomposeInAProduct`), evitando un secondo motore di scomposizione.
- La roadmap Fase C coincide con la richiesta del coordinatore (prototipo isolato + Playwright touch).
- Nessuna modifica a file marcati `!!!GOV … requiredApprovalFrom:Romualdo` è necessaria per questa bozza: il presente documento è un file **nuovo** in attesa di revisione.
