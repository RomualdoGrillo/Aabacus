!!!GOV level:2architecture requiredApprovalFrom:Romualdo

# Ciclo di sessione — BOOT / PRELOAD / LOAD / SAVE

**Fase: v1f** (bozza L2)  
Etichette di fase: [`release-phases.md`](release-phases.md).  
Documenti correlati: [`gesture-action-table.md`](gesture-action-table.md) (G/A), [`new-interface-spec.md`](new-interface-spec.md) §7, [`software-modules.md`](software-modules.md) (preload / SaveLoad).

Documento di **livello 2**: fissa la policy di **hardwired vs file** e il significato di BOOT, PRELOAD, LOAD, SAVE sulla pista che evolve verso **v1fb**. Non va modificato senza approvazione esplicita di Romualdo.

---

## 1. Principio

| Origine | Contenuto | Motivo |
|---------|-----------|--------|
| **Hardwired (BOOT)** | Comandi di sessione nella G/A marcati `system`; prototipi ENODE `.fundamental` nell’HTML iniziale | Devono funzionare anche senza preload / in debug; non dipendono da I/O |
| **Da file** | Canvas e sezioni esercizio: `events` (G/A didattica), `palette`, `settings`, `result` | Contenuto scenario; caricabile e (obiettivo) salvabile come `.mmls` |

La **tabella G/A** è il formato corretto della sezione **`events`** (sostituisce progressivamente il MathML `eventtoaction` — oggi ancora **mmls formato-events v1** in molti esercizi; target **mmls formato-events v2** = JSON G/A).

Le righe G/A con `system: true` (undo / save / load / tap / lasso base, …) **non vengono sovrascritte** da PRELOAD né da LOAD.

---

## 2. BOOT (hardwired)

All’apertura di `index.html` (**v1**) o `index2.html` (**v1f**), prima di ogni file:

### 2.1 Events → G/A system (**v1f**)

Presenti nel custode (`UserEvToFunctCall2.js` → `DEFAULT_TABLE`), almeno:

| Alias / trigger | Ruolo | Note |
|-----------------|-------|------|
| `Mod+z` | undo | entrambe le colonne |
| `Shift+S` | save | entrambe le colonne |
| `Shift+L` | load | solo **untied**; in **tied** avviso di svincolare (policy v1f) |
| `tap` | toggleSelect | sistema |
| `lasso` | selectSiblings (untied) / azione base tied | sistema |

Altri trigger system (es. `dnd`) secondo [`gesture-action-table.md`](gesture-action-table.md).

### 2.2 Palette / scheletro DOM

Prototipi **irrinunciabili** (es. Def, And e quanto serve a creare il canvas) restano **hardwired** nel markup caricato inizialmente (`index.html` / `index2.html`), tipicamente con classe `.fundamental`. Senza di essi il canvas non si crea correttamente.

Il BOOT **non** dipende da un file di preload.

---

## 3. PRELOAD

Carica da URL (query `?preloadPath=…`, default di sessione) un `.mmls` e lo inietta nelle sezioni, **sopra** il BOOT.

| Sezione | Policy rispetto al BOOT |
|---------|-------------------------|
| **palette** | Aggiunge / sostituisce i prototipi **non** `.fundamental`; i fundamental restano |
| **events** | **v1f:** merge nella G/A → solo righe / colonne ammesse (didattica; in import mmls-events-v1 → colonna **tied**). Mai overwrite delle righe `system` |
| **canvas** | Di fatto **sostituisce** il contenuto esercizio (policy da dichiarare nei loader; non è un append didattico) |
| **settings** | Popola `GLBsettings` e l’UI settings |
| **result** | Sostituisce / riempie la sezione risultato |

PRELOAD è il percorso normale per esercizi e debug con file in repo. Usa il backend esistente (`preload.js` → `injectAllMMLS` → …); in **v1f** la catena termina con aggiornamento G/A (`MAIN2.reloadMmlsOverrides` / reader v2).

---

## 4. LOAD (file locale)

Apre il file picker sulla macchina locale (Maiusc+L / azione `load`).  
**Non** si basa su URL remoto per il file utente (limitazione browser + scelta di prodotto).

Usi:

- debug e test di nuovi esercizi;
- *(futuribile / utenti avanzati)* creazione e prova di esercizi propri.

### 4.1 Dialog di policy (**target v1f**, oggi parziale)

Essendo LOAD uno strumento di **sperimentazione**, deve chiedere come combinare i contenuti con la sessione corrente, almeno per:

| Area | Opzioni attese |
|------|----------------|
| **canvas** | sovrascrivere **oppure** aggiungere |
| **palette** | sovrascrivere i non-fundamental **oppure** aggiungere |

I `.fundamental` e le righe G/A `system` restano intoccabili.

**Stato codice oggi (v1 / v1f condiviso SaveLoad):** conferma tipica “scarta il canvas”, poi `injectAllMMLS` in modalità prevalentemente **replace**. La dialog bilanciata replace/append è **debito v1f** (o v1fb se si unifica il loader).

In **v1f**, con canvas **tied**, Load non parte in silenzio: avviso di svincolare prima (G/A: `actionsTied` vuota per `Shift+L`).

---

## 5. SAVE

### 5.1 Comportamento attuale (v1, ancora in v1f)

| Contesto | Output |
|----------|--------|
| Nessuna selezione + Shift+S | `AlltoMMLSstring()` → `.mmls` con sezioni **palette, canvas, events, result** |
| Selezione presente | `.mml` del solo pezzo selezionato |

Limitazioni note (v. anche `software-modules.md`):

- sezione **settings** **non** serializzata (TODO storico);
- sezione **events** ancora in formato MathML legacy, non G/A JSON;
- UX di salvataggio poco adatta a “edita esercizio → risalva bundle completo”.

### 5.2 Obiettivo (**v1f → v1fb**, parte *must* per parità autori)

Poter editare un esercizio e salvarlo in un `.mmls` che contenga **tutte** le sezioni rilevanti:

- palette (senza fundamental, come oggi)
- canvas
- **events** = snapshot G/A **didattica** (o tabella completa con `system` omessi / reiniettati al load dal BOOT)
- result
- **settings**

*(futuribile)* Scelta UI esplicita: “salva esercizio completo” vs “salva selezione”; eventuale Include di events comuni (solo didattica, non comandi system).

---

## 6. Riepilogo flussi

```text
BOOT (HTML + G/A system)
  │
  ├─► PRELOAD(.mmls da URL)     — replace controllato sezioni esercizio
  │         │
  │         └─► merge events → G/A (no overwrite system)
  │
  └─► LOAD(.mmls locale)        — dialog replace/append (target)
            │
            └─► stesso backend inject + merge G/A

SAVE ← serializza sezioni (obiettivo: + settings + events G/A)
```

---

## 7. Criteri di accettazione per fase

### v1f (chiudere la pista frontend)

- G/A system hardwired; Load/Save/Undo senza preload — *in codice*
- PRELOAD/LOAD condividono SaveLoad; post-load aggiorna G/A (import mmls-events-v1 → tied) — *in codice*
- events in file nuovi = G/A (mmls formato-events v2) come default per esercizi index2 — *debito*
- LOAD: dialog canvas/palette replace vs append — *debito*
- SAVE: settings + events G/A nel `.mmls` completo — *debito*

### v1b

Fuori da questo documento (nuova backend); il merge in **v1fb** dovrà rispettare le stesse policy di sezione e di `system`.

### futuribile

- Include di file events didattici condivisi
- Autori avanzati: workflow Load/Save come editor di esercizi
- Deprecazione completa di `eventtoaction` MathML

---

## 8. Allineamento codice (snapshot)

| Pezzo | Dove | Fase |
|-------|------|------|
| G/A default system | `UserEvToFunctCall2.js` | v1f |
| Avviso Load se tied | `MAIN2.js` | v1f |
| Import events legacy → tied | `input2/importMmlsV1.js` | v1f |
| PRELOAD / inject sezioni | `preload.js`, `SaveLoad.js` | v1 (condiviso) |
| `AlltoMMLSstring` senza settings | `SaveLoad.js` | v1 — debito SAVE |
| Prototipi fundamental | markup `index.html` / `index2.html` | v1 / v1f |
