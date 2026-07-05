# PR #30 — Fix DnD con target `.tgt` dinamici (SortableJS)

> **Stato:** proposta da valutare **dopo** il refactoring modulare dell'app.  
> **Non merge immediato:** portare la logica nel nuovo modulo DnD quando la struttura sarà stabile.

Fixes #27

---

## Problema

Durante un drag con proprietà DnD abilitate (es. `hanoiMoveDnD`, sostituzione, ecc.), succede spesso che:

1. **L'evidenziazione** (`mu_DropTarget`) appare in **uscita** dalla zona, non all'ingresso del puntatore.
2. **Il drop non avviene** anche con il cursore sulla zona corretta.
3. **Il drop finisce sulla zona sbagliata** (Sortable segnala un `.tgt` diverso da quello sotto il cursore).

Hanoi (`hanoi4.mmls`) rende il bug molto visibile (colonne vuote, bordi invisibili), ma il meccanismo riguarda **tutte** le proprietà che usano target ad hoc `.tgt` su ENODE (`makeTargetsSortableRolesOrENODEs`).

---

## Causa (architettura attuale)

Al **mousedown**, prima che Sortable gestisca il drag:

1. `cleanupDnD()` rimuove i target del drag precedente.
2. `makeTargetsSortableRolesOrENODEs` crea `<div class="tgt">` dentro gli ENODE validi e abilita Sortable su quelle zone **vuote**.
3. La sorgente riceve `[from=froENODE]` e `_onTapStart` avvia Sortable.

I target non sono persistenti: nascono e muoiono a ogni drag. Sortable lavora su superfici `.tgt` appena create, spesso vuote e con `pointer-events: none`.

Sortable poi:

- usa `onMove` / `event.to` legati a `swapThreshold` (non al puntatore);
- a volte **non emette `onAdd`** su `.tgt` vuoti;
- a volte **`onAdd` riporta il `.tgt` sbagliato** rispetto alla posizione del cursore.

---

## Soluzione (3 interventi + ritocchi)

| # | Intervento | Dove | Scopo |
|---|------------|------|--------|
| 1 | **Highlight sul puntatore** | `highlightDropTargetAtPoint`, listener in `startDropTargetHighlightTracking` | Feedback visivo all'ingresso, indipendente da `onMove` |
| 2 | **Target corretto in `onAdd`** | `resolveAdHocPropertyTarget` | Per drop su `.tgt`, ENODE sotto il cursore batte `event.to` |
| 3 | **Fallback in `onEnd`** | `onEndHandler` → `tryManualPropertyDrop` | Se `onAdd` non ha applicato la proprietà, la applichiamo noi |

**Ritocchi collaterali (generali):**

- `sort: false` per drag di proprietà (si sposta tra liste, non si riordina la sorgente).
- `emptyInsertThreshold: 30`, `swapThreshold: 0.4` (aiuto Sortable su liste vuote).
- Flag `GLBDnDdropHandled` per evitare doppi drop (`onAdd` + fallback).
- CSS: `.tgt` a piena area (`top/left/right/bottom: 0`); `outline` su `.mu_DropTarget`.

**Non incluso:** codice specifico Hanoi (`hanoirod`, `[data-enode=cn]`, ecc.).

---

## File modificati (rispetto a `master`)

| File | Δ circa | Contenuto |
|------|---------|-----------|
| `app/js/DnD.js` | +~170 righe | Tutta la logica sopra |
| `app/css/style.css` | +7 righe | Hit area `.tgt` + outline `.mu_DropTarget` |

Nessun altro file dell'applicazione.

---

## Funzioni nuove (riferimento per porting post-refactor)

```
getDropPointerFromEvent(event)
getDropTargetAtPoint(clientX, clientY)
highlightDropTargetAtPoint(clientX, clientY)
getDraggedElementForManualDrop(event)
tryManualPropertyDrop(event, targetEl)
resolveAdHocPropertyTarget(event)
onPointerMoveDuringDrag(event)
startDropTargetHighlightTracking(originalEvent)
stopDropTargetHighlightTracking()
onEndHandler(event)
```

**Variabili di stato:** `GLBDnDdropHandled`, `GLBDnDlastPointer`, `dropTargetHighlightHandler`.

**Hook modificati:** `startHandlerMouseDown`, `onMove` (svuotato), `onAdd`, `makeSortableMouseDown`, `MouseUpCleanup`, `cleanupDnD`.

---

## Come verificare

Server: `npx serve -l 5500 app` (dalla root del repo).

- **Hanoi:** `http://localhost:5500/index.html?preloadPath=./Data/exercises/hanoi4.mmls`  
  Evidenza all'ingresso; 15 mosse ottimali; contatore `Moves:15`.
- **Test Playwright (su master):** `project/tests/e2e/hanoi-drag.spec.js`, `hanoi-solve.spec.js`.

Checklist manuale rapida:

- [ ] Evidenziazione compare **entrando** in una zona valida.
- [ ] Drop sulla colonna/zona sotto il cursore.
- [ ] Nessun doppio spostamento / contatore che salta di 2.
- [ ] Altre proprietà DnD con `.tgt` su ENODE (non solo Hanoi) se disponibili.

---

## Porting dopo refactoring

Se `DnD.js` diventa un modulo:

1. **Spostare insieme** le funzioni elencate e lo stato `GLBDnDdropHandled` / `GLBDnDlastPointer`.
2. **Mantenere il contratto** con Sortable: `onStart` → tracking; `onAdd` → `resolveAdHocPropertyTarget` per `.tgt`; `onEnd` → fallback.
3. **Non dipendere** da selettori Hanoi: usare `[target]:not([from])` e `[data-enode]` generico.
4. **CSS:** regole su `.tgt` / `.mu_DropTarget` restano in foglio globale o nel modulo UI drag.
5. Se sostituisci Sortable o elimini i `.tgt` dummy, **rivaluta** se servono ancora tutti e tre gli interventi; il fallback (3) resta utile finché il drop non è affidabile al 100%.

---

## Limiti noti / direzioni future

- Sortable resta responsabile del **drag visivo**; noi correggiamo **target effettivo** e **feedback**.
- Refactor strutturali possibili (fuori scope di questa PR):
  - target sortable sulla role visibile (`.ol_role`) invece del `.tgt` vuoto;
  - istanze Sortable persistenti invece di create/distrutte ogni mousedown;
  - drop gestito interamente fuori da Sortable per le sole proprietà DnD.

---

## Branch

`cursor/fix-dnd-drop-zone-highlight-4a2d` — commit rilevante: `27280da` (versione distillata generica).
