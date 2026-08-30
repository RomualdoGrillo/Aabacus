# Handoff tecnico — branch `cursor/fix-lasso-select-cf8b`

**Data handoff:** 2026-08-30  
**Branch HEAD al handoff:** `2b79418` (ahead of `origin/cursor/fix-lasso-select-cf8b` di almeno 1 commit al momento della scrittura; verificare `git status`).  
**Pista:** FrontEnd2 / **v1f** (`index2.html` + input2), parallela alla produzione **v1** (`index.html`).  
**Ruolo di riferimento:** Specialist FrontEnd2 — [`project/Organization/roles/frontend2-specialist.md`](../Organization/roles/frontend2-specialist.md).  
**PR storica:** https://github.com/RomualdoGrillo/Aabacus/pull/49 (draft verso `master`; stato da riallineare al push).

Questo documento **non** modifica il codice: è un trasferimento di contesto per chi riprende la pista.

Etichette di fase: [`release-phases.md`](release-phases.md). Contratti L2: [`gesture-action-table.md`](gesture-action-table.md), [`session-lifecycle.md`](session-lifecycle.md).

---

## 1. Obiettivi iniziali e requisiti

### Obiettivo di prodotto

Rifare lo strato **input** touch-first (tablet ~10") senza spezzare la UI di produzione: pista parallela `index2` sullo **stesso backend** (preload, SaveLoad, ExpressionManager, property registry, PActx/conclude snello).

### Requisiti emersi / confermati (Romualdo + spec)

| ID | Requisito | Stato pista |
|----|-----------|-------------|
| R1 | Recognizer gesti (tap, lazo, slice, pinch, dnd) → intent puri | Implementato in `gestures.js` |
| R2 | Tabella **G/A** (gesture/actions) con colonne **tied/untied** come unico posto per associazioni | Custode `UserEvToFunctCall2.js` + L2 GOV2 |
| R3 | Discriminante colonna: `GLBsettings.tiedCanvas` (lucchetto `#canvas > .firstMember`) | Implementato; hit-area touch ampliata |
| R4 | Lazo: seleziona sibling colpiti / gruppo valido; in untied tipicamente `selectSiblings` | OK su prop_comm_gen e2e |
| R5 | Convivere con legacy: `selectionManager` condiviso; non riscrivere DnD.js/Sortable per index2 | `applyDnD` senza Sortable (parziale) |
| R6 | Load/Save/Undo di sessione anche senza preload (boot hardwired) | System G/A + MAIN2; Load tied → avviso svincola |
| R7 | Events file: mmls v1 → import solo colonna **tied**; mmls v2 = JSON G/A | Import v1 + reader v2 prototipale |
| R8 | Pinch H/V: discriminazione difficile → unificare trigger `pinch` (interim) | Fatto |
| R9 | Canale aperto DnD: G/A gate `applyDnD`, non elenco HW in tabella | Documentato L2 §3; riga già presente |
| R10 | Tool+Enter / selectedTool in G/A | **Non** fatto (piano canali aperti, passo successivo) |

Motivazioni e inventario gesti: [`new-interface-spec.md`](new-interface-spec.md) (decisioni 23/07/2026 + §7).

---

## 2. Architettura scelta e invarianti

### Stack runtime index2

```text
index2.html
  → strati 1–4 condivisi (state, ExpressionManager, properties, SaveLoad, preload, …)
  → selectionManager.js (condiviso)
  → UserEvToFunctCall2.js   // custode G/A
  → input2/gestures.js      // recognizer puro
  → input2/importMmlsV1.js  // adapter events legacy → tied
  → MAIN2.js                // boot, dispatch, tied lock, builtin, debug
```

### Invarianti (non violare senza Romualdo / L2)

1. **Un solo custode G/A:** `UserEvToFunctCall2.js`. Niente mappe parallele (`intentMap` deprecato/rinominato).
2. **Ascolto gated dalla colonna attiva:** lista vuota ⇒ recognizer non ascolta quel trigger (`enabledRecognizerIntents`).
3. **Discriminante:** `GLBsettings.tiedCanvas` (non una seconda tabella).
4. **Produzione intatta nel principio:** `index.html` + `MAIN.js` / `DnD.js` / `UserEvToFunctCall.js` restano la UI v1; eccezione sul branch: `selectionManager` estratto da MAIN.js in file condiviso (MAIN.js solo include/delega).
5. **mmls v1 import → solo `actionsTied`**; righe `system: true` non sovrascrivibili arbitrariamente.
6. **Canale aperto ≠ azione chiusa:** `applyDnD` abilita il gesto; quale proprietà HW si applica è runtime (registry + `ci[data-tag]` in canvas).
7. **Boot ≠ file:** comandi sessione e fundamental da hardcoded; `.mmls`/`.mml` solo preload/load ([`session-lifecycle.md`](session-lifecycle.md)).

### Flusso intent

```text
pointer/key → gestures / onKeyDown
  → resolveIntent(intent, table, { tied })
  → listTryActions + availability (didattiche)
  → MAIN2: builtin (undo/load/save/toggleSelect/selectSiblings/applyDnD)
       oppure TryOnePropertyByName → conclude2
```

---

## 3. Mappa file (vs `master` sul branch)

### Creati

| Path | Ruolo |
|------|--------|
| `app/js/selectionManager.js` | Selezione grigia / tool giallo; condiviso legacy+index2 |
| `app/js/input2/importMmlsV1.js` | Adapter events MathML → override colonna tied |
| `app/css/input2.css` | Touch/lasso/blade/debug + hit-area lucchetto |
| `app/Data/exercises/prop_comm_gen_mmlsv2.mmls` | Prototipo events = JSON G/A |
| `project/specs/gesture-action-table.md` | L2 GOV2 tabella G/A |
| `project/specs/release-phases.md` | v1 / v1f / v1b / v1fb / v2 / futuribile |
| `project/specs/session-lifecycle.md` | BOOT / PRELOAD / LOAD / SAVE |
| `project/specs/frontend2-handoff.md` | Questo handoff |
| `project/Organization/roles/frontend2-specialist.md` (+ agent) | Ruolo L3 |
| `project/tests/unit-UserEvToFunctCall2.js` | Unit G/A |
| `project/tests/unit-importMmlsV1.js` | Unit import v1 |
| `project/tests/unit-input2-selection.js` | Unit selezione / dispatch |
| `project/tests/e2e/input2-lasso-select.spec.js` | E2E lucchetto + lazo/tap |

### Rinominati

| Prima | Dopo |
|-------|------|
| `app/js/input2/boot2.js` | `app/js/MAIN2.js` |
| `app/js/input2/intentMap.js` | `app/js/UserEvToFunctCall2.js` |
| `project/tests/unit-intentMap.js` | sostituito da `unit-UserEvToFunctCall2.js` (vecchio rimosso) |

### Modificati (rilevanti)

| Path | Nota |
|------|------|
| `app/index2.html` | Script MAIN2, importMmlsV1, input2.css, `#fileToLoad` |
| `app/js/input2/gestures.js` | FSM + enabledIntents + lasso/slice/dnd/pinch |
| `app/js/MAIN.js` | `selectionManager` spostato fuori (delega al file condiviso) |
| `app/index.html` | Inclusione `selectionManager.js` (minimo necessario al share) |
| Specs UI/org/README | Tag fasi, §7, organigramma FE2 |

---

## 4. Commit raggruppati per funzionalità

Ordine tipico da merge-base con `master` (sintesi tematica; hash tipici sul branch):

| Tema | Commit rappresentativi (messaggi) |
|------|-----------------------------------|
| Spec touch + pista index2 | `new-interface-spec`, sez. 7, prototipi pinch/lasso |
| Guscio index2 + recognizer taglio | `guscio index2.html`, intent map iniziale |
| Tabella G/A + ricette gestToAction + alias | `tabella gesture-action`, `ricette reali`, `override events` |
| Lazo/DnD system + slice/lasso/drag | `lazo e DnD nel recognizer`, fix sibling/tap |
| `selectionManager` condiviso + merge master | `selectionManager condiviso`, `merge conflitti` |
| UserEvToFunctCall2 + organigramma FE2 | `feat(frontend2): UserEvToFunctCall2…` |
| Debug Maiusc+D, tied lock, rename MAIN2 | `Maiusc+D`, `toggle tied`, `boot2→MAIN2` |
| Gating ascolto per colonna + PATH feedback | `ascolto gated`, `feedback PATH` |
| Docs G/A + mmls v2 prototipo | `gesture-action-table`, `prop_comm_gen_mmlsv2` |
| Shift+L / Load tied avviso / lucchetto touch | `SHIFT+l`, `avvisa svincolare`, `Improved tie/untie` |
| Pinch unificato | `unifica pinchHor/pinchVert` |
| Session lifecycle + canale aperto DnD | `ciclo sessione…`, `canale aperto DnD` |

Rumore: `test results`, `minor` — da non trattare come contratto.

---

## 5. Tentativi falliti o abbandonati (e perché)

| Tentativo | Esito | Motivo |
|-----------|--------|--------|
| Nome `intentMap.js` | Abbandonato → `UserEvToFunctCall2.js` | Principio sdoppiamento omologo legacy |
| `boot2.js` | Abbandonato → `MAIN2.js` | Stesso principio |
| Load sempre attivo anche in tied | Revertito | Policy: load solo untied; in tied **avviso** (non silenzio) |
| PinchHor / PinchVert separati in G/A | Fusi in `pinch` | Discriminazione H/V inaffidabile su device; operandi pinch = debito futuro |
| Portare SortableJS / tool Tab declare in index2 | Non fatto | Spec: tool da rendere superflui; DnD HW via `applyDnD` senza Sortable |
| `confirmApply` / Enter → selectedTool in G/A | Rimandato | Piano “canali aperti”: fatto solo DnD minimo |
| Dialog Load replace vs append | Solo documentato | Debito SaveLoad; produzione ha solo confirm replace canvas |
| Push remoto intermittente | Fallito in sessione (auth HTTPS / no `gh`) | Operativo, non di prodotto |

---

## 6. Funzionalità: confermate / incomplete / rotte

### Confermate (con evidenza)

- Tap → `toggleSelect` (select/deselect) su index2.
- Lazo in **untied** → `selectSiblings` (e2e + unit).
- Toggle tied/untied dal lucchetto (pointerup + hit 44px); e2e dedicato.
- Gating ascolto: tied vs untied cambia slice/pinch/lasso.
- Shift+L: untied apre picker; tied alert svincola.
- Shift+S / Mod+z builtin; setTable sync recognizer + debug panel.
- Import mmls v1 → solo tied; system lasso non sovrascrivibile.
- Pinch H e V → stessa try-list unificata.

### Incomplete (debito consapevole)

- **applyDnD:** skip prop che richiedono pre-insert Sortable (`associativeDnD`, `associativeGenDnD`, `partDistributDnD`, `addRedundantDnD`, … — v. `DND_SKIP_NEEDS_PREINSERT` in MAIN2).
- **autoAdapt / copy / declare** come tool globali: non portati; G/A non ha ancora `confirmApply`.
- **mmls events v2 reader:** prototipo `tryLoadMmlsV2GA`; non irrigidito.
- **SAVE:** settings assenti; events serializzati ancora legacy se si usa AlltoMMLSstring.
- **Commutativa:** Sortable/sort, non riga G/A (fuori canale `applyDnD`).
- Doppio click / rename / forThis: ancora legacy o assenti in MAIN2.

### Rotte o fragili

- E2E Playwright: in alcuni ambienti browser non installato / webServer sandbox — non assumere CI verde senza `project/tests` + browsers.
- Feedback PATH (lasso trail vs blade): corretto per famiglie in ascolto; da ri-testare dopo ogni cambio `enabledRecognizerIntents`.
- `#events` DOM in index2: G/A vive nel custode JS; non aspettarsi MathML events come unica verità dopo preload v1 (merge tied).

---

## 7. Assunzioni operative (tied, selezione, gesti)

| Tema | Assunzione usata nel codice |
|------|-----------------------------|
| **tied** | `GLBsettings.tiedCanvas === true` ⇒ colonna `actionsTied`; classi `.untied` assenti su `#canvas,#result,#events` |
| **untied** | Lucchetto aperto; lazo tipicamente selezione; slash/pinch spesso liste vuote in default |
| **Selezione** | `.selected` grigio = operando; `.selectedTool` giallo = solo se `tool==declare` (selectionManager); index2 non cicla Tab tool |
| **Lazo** | Intent `lasso` + targets sibling; non assume linearità futura dei role (spec); feedback trail se famiglia in ascolto |
| **Slice** | Intent `slice`/`slash` + `axis` h/v → `slashHor`/`slashVert`; discriminazione da efficienza chord/path |
| **Drag / DnD** | Parte da foglia `[data-enode]`; drop → `applyDnD`; non Sortable reorder (commutativa) |
| **Gesture→intent** | `gestures.js` emette intent; **nessuna** conoscenza proprietà; mapping solo in G/A |
| **Pinch** | Intent ancora con `axis`, ma `intentToTrigger` → sempre `pinch` |
| **Load** | Builtin solo se try-list non vuota; tied ⇒ avviso |

---

## 8. Test eseguiti

### Automatici (rieseguiti in handoff, 2026-08-30)

```bash
node project/tests/unit-UserEvToFunctCall2.js
# → 36 PASS, 0 FAIL

node project/tests/unit-importMmlsV1.js
# → 13 PASS, 0 FAIL

node project/tests/unit-input2-selection.js
# → 15 PASS, 0 FAIL
# (log attesi: azioni non nel registry es. Reciprocal/defZero in availability)
```

E2E (storici sul branch; non rieseguiti in questo handoff se Playwright/browser assente):

```bash
cd project/tests && npx playwright test e2e/input2-lasso-select.spec.js
# Casi: lucchetto tied↔untied; lazo/tap su prop_comm_gen
```

### Manuali (sessione sviluppo)

| Scenario | URL tipica | Esito tipico |
|----------|------------|--------------|
| Preload + tied | `http://127.0.0.1:5500/index2.html?preloadPath=./Data/exercises/prop_comm_gen.mmls` | Canvas tied; Shift+L → alert |
| Load dopo untie | Svincola lucchetto, Shift+L | File picker + inject |
| Lazo untied | Dopo unlock | Selezione sibling |
| iPad lucchetto | Stesso URL in LAN | Hit-area 44px + pointerup (post fix) |
| Debug G/A | Maiusc+D | Pannello tabella |

Produzione v1 da non regressare a mano: `index.html` stesso preload; Shift+L senza alert tied.

---

## 9. Conflitti e dipendenze vs `master` / legacy

| Area | Dipendenza / rischio |
|------|----------------------|
| **`selectionManager.js`** | Estratto da MAIN.js: **master merge** deve includere lo script in `index.html` e non riduplicare la funzione in MAIN.js |
| **`DnD.js` / Sortable** | index2 **non** usa MakeSortable per HW; parità prop incompleta (SKIP list). Non spezzare DnD.js “per far passare” index2 |
| **`UserEvToFunctCall.js`** | Resta v1 (`keyboardEvToFC`, `getDnDpropEnabled`). MAIN2 riusa `getDnDpropEnabled` / `TryOnePropertyByName` dove esistono |
| **`MAIN.js`** | Click lucchetto, Tab tool, Enter declare: solo v1. MAIN2 ha omologhi parziali |
| **Preload/SaveLoad** | Condivisi; `injectAllMMLS` svuota `#events` — su index2 la G/A system sopravvive nel JS, non nel DOM events |
| **GOV2** | `gesture-action-table.md`, `session-lifecycle.md`, parte di `implementation-details`: modifiche solo con approvazione Romualdo |
| **Merge v1f∪v1b** | Policy sezioni in `session-lifecycle.md`; non inventare secondo custode G/A in backend |

---

## 10. Cosa riusare / riscrivere / scartare

### Riusare così com’è

- `UserEvToFunctCall2.js` (API pure + DEFAULT_TABLE + gating).
- `gestures.js` FSM + `setEnabledIntents` (contratto enabled).
- `importMmlsV1.js`.
- `selectionManager.js` condiviso.
- Specs L2: G/A, session-lifecycle, release-phases.
- Unit test G/A / import / selection come rete di sicurezza.

### Riscrivere o irrigidire (prossimo lavoro)

- Reader mmls v2 + Save events G/A (+ settings).
- `applyDnD` / percorso prop che richiedono pre-insert (o accettare subset documentato).
- Canale aperto **confirmApply** (Enter + `.selectedTool`) se ancora necessario in v1f.
- Dialog Load replace/append (SaveLoad).
- Discriminazione pinch / operandi (quando si spezza di nuovo H/V).

### Scartare / non riportare

- Vecchi nomi `intentMap` / `boot2` in docs o nuovi moduli.
- Duplicare tabella gesture in MAIN2 o in gestures.js.
- Abilitare Load in tied “per comodità” senza dialog/policy.
- Elencare proprietà HW (`replaceDnD`, …) come actions chiuse nella riga `dnd`.
- Portare Sortable “per commutativa” dentro il recognizer senza design esplicito (resta path strutturale Sortable / `data-commutative`).

---

## 11. Checklist ripresa lavoro (15 min)

1. `git checkout cursor/fix-lasso-select-cf8b && git log master..HEAD --oneline`
2. Aprire `index2.html?preloadPath=./Data/exercises/prop_comm_gen.mmls`
3. Unit: tre comandi §8
4. Leggere L2 § canale aperto DnD + session-lifecycle (boot vs file)
5. Decidere prossimo incremento: **confirmApply**, **Save G/A**, o **parità applyDnD**

---

## 12. Riferimenti rapidi

| Cosa | Dove |
|------|------|
| Custode G/A | `app/js/UserEvToFunctCall2.js` |
| Orchestrazione | `app/js/MAIN2.js` |
| Recognizer | `app/js/input2/gestures.js` |
| Import v1 | `app/js/input2/importMmlsV1.js` |
| Stili FE2 | `app/css/input2.css` |
| Entry | `app/index2.html` |
| L2 G/A | `project/specs/gesture-action-table.md` |
| L2 sessione | `project/specs/session-lifecycle.md` |
| UI touch | `project/specs/new-interface-spec.md` §7 |
