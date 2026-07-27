# Backend refactoring — stato e roadmap

**Scopo:** condensare le conclusioni delle sessioni di refactoring del back-end (core / properties / persistence) perché ogni nuova chat possa ripartire da qui senza ricostruire lo storico. Il fronte parallelo **FrontEnd2** (`index2`, gesti touch) è fuori perimetro: vive su `project/specs/new-interface-spec.md` §7 e sul branch `cursor/fix-lasso-select-cf8b` (PR #49).

**Documento di riferimento architetturale:** [`software-modules.md`](software-modules.md) (mappa moduli, contratti, §4 TODO). Questo file ne è il compagno operativo: cosa è stato fatto, cosa resta, in che ordine.

---

## 1. Lavoro completato (già su `master`)

### 1.1 ExpressionManager unico gestore ENODE
Le manipolazioni dirette dell'albero sparse nel codice sono state sostituite dalle primitive di `ExpressionManager.js`. Eccezione documentata: il riordino via SortableJS sui ruoli untied/commutativi resta in `DnD.js`. (PR #32, commit `77f9f50`.)

### 1.2 Piano a passi di `software-modules.md` — passi 1–7 eseguiti
Piano originale in PR #33 (`9f0e893`); esecuzione:

| Passo | Contenuto | Commit / PR |
|-------|-----------|-------------|
| 1 | Bonifica codice morto (`utilities.js`, `Ajax.js`, `InteractJStests.js`, funzioni orfane) | `3633ad5`, PR #34 |
| 2 | Bug latenti (`inject`, `evaluateComparison`, …) | PR #35 |
| 3 | Globali implicite eliminate; `canvas` → `canvasRole` | PR #36 (chiuso, lavoro su master) |
| 4 | UI fuori dal nucleo espressioni (prompt/snapshot via chiamanti) | `839f803` |
| 5 | Ricollocamenti: smontato `AldoUtilities.js` → `dom-utils` / `game` / … | `5e5fe85` |
| 6 | Stato condiviso esplicito in `state.js` | `800ac48` |
| 7 | Ordine script a strati in `index.html` (core → rendering → properties → persistence → interaction) | `f702248` |

Il passo 8 (moduli veri) è **aperto**, vedi §2.1.

### 1.3 Refine — post-applicazione uniforme delle proprietà
Tutta la post-applicazione (raffinamento del risultato dopo HW o pattern-matching) è concentrata in `refine.js`:

- API: `markNeedsRefine`, `refineAfterProperty`, `trySimplifyNode`, `postApplyAfterProperty` (`21ab1ff`, `5be1a99`).
- Percorsi tipizzati `REFINE_KINDS` (`fde5102`); oggi è attivo il solo kind `"c"`.
- Decisione di Romualdo: **niente "intensità"**, solo marcature (lettere); `postIntensity` introdotto e poi rimosso (`96d765e`).
- Cascade refining iterativo con limite `REFINE_MAX_STEPS` e warn se tronca (`766042e`).
- `ENODEassociate` valorizza `$transform` + marcature (`d2a70bd`).

### 1.4 propertyRegistry — dispatch per nome senza `window[nome]`
`propertyRegistry.js` è l'unico canale di dispatch per nome (`af3f298`): descrittori `kind: 'unary' | 'dnd'`, `requiresCanvasCi` (gate didattico), ordine di registrazione = priorità **first-wins** per i target DnD (`8ed87c5`, PR #46 associativa generalizzata). Decisione: nessuna introspezione iniziale — il registro esplicito basta.

### 1.5 Abbandono di `ENODEextend`
I metodi aggiunti dinamicamente agli ENODE sono diventati **funzioni globali** (`7efe271`). Tipizzazione: typedef `ENode` con brand JSDoc, dogana `asENode`/`isENode` (`7b97e73`), JSDoc su interfacce di tutti i moduli + `ENODE.d.ts` (`deda509`), `@ts-check` sui moduli più stabili (`07b0935`), jsconfig (`259bfca`). Le funzioni `ENODE_*` accettano anche jQuery, eliminando il balletto `[0]` nei call-site (`0836d7c`). Fix collaterale: `ENODEpartCollect` restituisce PActx fallito a guardia mancata (`cddc4b7`).

---

## 2. Roadmap aperta (in ordine consigliato)

### 2.1 Moduli veri (ex passo 8)
Avvolgere i file in IIFE con namespace (`Aabacus.core`, `Aabacus.props`, …) oppure migrare a ES modules. Il prerequisito — registro esplicito al posto di `window[nome]` — è soddisfatto da `propertyRegistry.js`; resta da chiudere lo scope globale **strato per strato** (ordine naturale: core → rendering → properties → persistence → interaction). Decisione presa in chat: "non ora" al momento della discussione — è il primo candidato quando si riparte.

### 2.2 Refine, evoluzioni
- Secondo kind tipizzato (es. forma normale); lettera libera, **non** riusare `n` (riservata a "non riordinare").
- Ricetta di refine esplicita `{prop, arg}` indipendente dalla sezione `#events` dell'esercizio.
- Pulizia API: rimuovere l'alias `RepeatedRefine_c`; valutare rename della classe marker.

### 2.3 TODO puntuali di `software-modules.md` §4
1. `importAll` (`SaveLoad.js`): ignora `$startNode` ed è a passata singola → import annidati irrisolti.
2. `loadFileConvert` (`SaveLoad.js`): ignora `fileToLoadPar`, legge sempre `#fileToLoad`.
3. `AlltoMMLSstring` (`SaveLoad.js`): Shift+S non serializza la sezione settings → l'esercizio ricaricato perde tool/gameMode/….
4. `ENODE_dissolveContainer` (`ExpressionManager.js`): bug latente (`return $children` su `const` di ramo) — da correggere prima di riattivare i chiamanti.
5. `ENODEModusPonens`: incompleto ma registrato come `modusPonensDnD`.
6. Funzioni senza chiamanti attivi (rimozione o completamento): `ENODEfactorizeMinus`, `signsAsClasses*`, `ENODENumericCdsAsText`, `getHardWiredEntry`/`listHardWiredPropertyNames`, `searchForProperty`.

### 2.4 newPM/ — decidere il destino
Motore PM sperimentale (match tracciato, bind eager, storyboard): integrarlo o sostituire il PM di produzione (`PMTutilities.js` + `PatternMatchingTrasform.js`). Finché convivono, ogni modifica alle interfacce elencate in `software-modules.md` §2.7 va verificata su entrambi.

### 2.5 Grandi cantieri (solo con via libera esplicito di Romualdo)
- Separazione DOM **modello** vs **vista** (oggi il DOM è il modello): riscrittura di fondo, discussa ma non avviata.
- TypeScript pieno: scartato per ora a favore di JSDoc + `@ts-check` graduale.

---

## 3. Criteri di verifica per ogni passo (invariati)

- Suite Playwright verde (`npx playwright test` in `project/tests`).
- `node project/tests/smoke-expression-manager.js` verde.
- Caricamento manuale di: `PRELOAD.mmls`, `hanoi4.mmls`, un esercizio con `decomposeTens`/`tabelline`; salvataggio e ricaricamento Shift+S / Shift+L.
- Nessun errore in console al boot e nelle operazioni di base.

## 4. Operativo

- **Branch di lavoro backend:** `cursor/backend-refactoring-cf8b` (da `master`).
- **Ruoli:** core-specialist (L3) per lavori nel nucleo; refactor-lead (L2) + approvazione Romualdo per passi trasversali (es. §2.1, §2.5).
- **Non toccare** da questo fronte: `app/index2.html`, `app/js/input2/**`, `app/js/UserEvToFunctCall2.js` (fronte FrontEnd2).
