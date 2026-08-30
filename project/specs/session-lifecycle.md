!!!GOV level:2architecture requiredApprovalFrom:Romualdo

# Ciclo di sessione — BOOT / PRELOAD / LOAD / SAVE

**Fase principale: v1** (produzione = `index.html` + backend SaveLoad/preload).  
Sezioni marcate **v1f** / *futuribile* descrivono la pista `index2` o obiettivi non ancora in produzione.  
Etichette: [`release-phases.md`](release-phases.md).  
Disegno di riferimento (Romualdo): [Google Drawing — boot/preload/Load/Save](https://docs.google.com/drawings/d/1JCNdfnflDztLSefOmkGGkRilHv8-15BhFF9KIXd8A08/edit?usp=sharing).  
Correlati: [`software-modules.md`](software-modules.md), [`gesture-action-table.md`](gesture-action-table.md) (**v1f**).

Documento di **livello 2**. Non va modificato senza approvazione esplicita di Romualdo.

---

## 1. Modello (come deve intendersi)

Due sole fonti di contenuto per le sezioni UI:

| Fonte | Quando | Cosa fa |
|-------|--------|---------|
| **Hardcoded (BOOT)** | All’apertura della pagina, **prima** di qualsiasi file | Riempie *alcune* sezioni da codice / markup fisso |
| **File** (`.mmls` / `.mml` / `.prt` / …) | Solo in **Preload** e **Load** | Aggiunge o sostituisce contenuto di esercizio *sopra* il boot |

Il **boot non legge mai** `.mmls` / `.mml`. Quei formati compaiono solo in preload (URL) e load (file locale).

Sezioni tipiche dopo il boot (come nel [disegno](https://docs.google.com/drawings/d/1JCNdfnflDztLSefOmkGGkRilHv8-15BhFF9KIXd8A08/edit?usp=sharing)):

| Sezione | Contenuto da BOOT (hardcoded) |
|---------|--------------------------------|
| **Palette** | Prototipi ENODE **fondamentali** (Def, And, …) — oggi scritti in `index.html` / `index2.html` con classe `.fundamental` |
| **Events** | Comandi di sessione non-didattici: almeno **Shift+L → load**, più Save, Undo, copy/paste (nel disegno: blocco “Non proprietà”) |
| **Canvas / Result / Settings** | Solo scheletro vuoto (o default UI); il contenuto esercizio arriva da file |

```mermaid
flowchart LR
  boot[Boot_hardcoded] --> preload[Preload_file]
  preload --> load[Load_file]
  load --> edit[UserEditing]
  edit --> save[Save]
```

---

## 2. Cosa fa oggi la produzione (v1) — scostamenti dal modello

Il modello sopra è quello di riferimento. In **v1** (`index.html`) l’implementazione è **parzialmente allineata**:

| Sezione al boot | Modello | Produzione v1 oggi |
|-----------------|---------|---------------------|
| **Palette** | fundamental hardcoded | **Sì** — markup in `index.html` |
| **Events** | Shift+L, Save, Undo, copyPaste *nella sezione events* (o equivalente) | **No in `#events`** — `#events` resta vuoto; le stesse azioni sono **hardcoded in `MAIN.js`** (keydown), quindi funzionano comunque senza preload |
| Canvas / result / settings | scheletro | scheletro / UI vuota |

Quindi: il boot *comportamentale* (Load/Save/Undo senza file) c’è; il boot *nella sezione Events* come nel disegno **non** è ancora materializzato in DOM in v1. In **v1f** la G/A `system` (`UserEvToFunctCall2.js` → `DEFAULT_TABLE`) è l’equivalente corretto della sezione Events al boot (Shift+L, Shift+S, Mod+z, …).

---

## 3. Preload e Load — unici punti che leggono file

```text
Boot (solo hardcoded)     Preload (.mmls URL)        Load (locale)           Editing    Save
 |                              |                          |                      |         |
 v                              v                          v                      v         v
 palette ← fundamental     + sezioni da .mmls         stesso inject di        sessione   §6
 events  ← sessioni        (palette non-fund.,         preload per .mmls
            (modello /       events didattici,          (.mml / .prt: rami
             G/A v1f;        canvas, settings,           dedicati)
             MAIN.js in v1)  result)
 canvas/result vuoti
```

| Fase | Input file | Effetto sulle sezioni |
|------|------------|------------------------|
| **Preload** | `.mmls` da URL (`?preloadPath=`, default `PRELOAD.mmls`) via `preloadAll` → `injectAllMMLS` | Sopra il boot: palette (non-fundamental), events (ricette file), canvas, settings, result. I **fundamental** restano. |
| **Load** | file locale Maiusc+L → `loadFileConvert` | `.mmls`: confirm “scarta canvas” poi **stesso** `injectAllMMLS` (replace, non ancora dialog sovrascrivi/aggiungi). `.mml` → `#canvasRole`. `.prt` → palette. |

Nessun altro percorso di avvio deve aprire `.mmls`/`.mml` al posto del boot.

---

## 4. BOOT (dettaglio)

### 4.1 Palette (v1 e v1f)

Prototipi `.fundamental` nel HTML iniziale. Senza di essi il canvas non si crea correttamente. Il preload/load **non** li cancella (`:not(.fundamental)`).

### 4.2 Events — modello vs implementazione

| Contenuto atteso al boot | v1 | v1f |
|--------------------------|----|-----|
| Shift+L → load | in `MAIN.js` (non in `#events`) | riga G/A `system` + `MAIN2` |
| Shift+S → save | idem | idem |
| Ctrl+Z → undo; Ctrl+C/V/X | idem | Mod+z in G/A; copy/paste ancora tipicamente in codice |
| tap / lasso / … | n/a (legacy) | G/A `system` |

**Regola:** preload/load possono arricchire Events con ricette **didattiche**; non devono cancellare i comandi di sessione del boot (in v1f: righe `system: true` della G/A).

### 4.3 Canvas / Result / Settings al boot

Solo struttura DOM (e pannello settings vuoto). Contenuto esercizio **solo** da preload/load.

---

## 5. LOAD (file locale) — dettagli estensione

| Estensione | Produzione oggi |
|------------|-----------------|
| `.mmls` | `confirm` “discart the existing canvas…” → `injectAllMMLS` (**replace**, come preload) |
| `.mml` | inject nel target (di solito `#canvasRole`) **senza** svuotare tutto il bundle |
| `.prt` | opzionale confirm “replace prototypes?” poi inject in `#palette` |
| `.json` | `injectAll` (manifest legacy) |

Non c’è dialog generica “sovrascrivere **o** aggiungere” su canvas/palette: quello resta **target / debito** (disegno Romualdo; checklist v1f).

---

## 6. SAVE

### 6.1 Produzione (v1) — comportamento reale

| Contesto | Output | Contenuto |
|----------|--------|-----------|
| Nessuna `.selected` + Shift+S | file `.mmls` via `AlltoMMLSstring()` | sezioni **palette** (senza fundamental), **canvas**, **events**, **result** |
| Con `.selected` | file `.mml` | solo il frammento selezionato |

**Non** serializza **settings** (TODO storico in `SaveLoad.js` / `software-modules.md`).  
Il disegno che indica “Save al momento solo Canvas → .mml” descrive solo il ramo **con selezione**; il ramo senza selezione è già multi-sezione `.mmls`.

### 6.2 Obiettivo (*futuribile* / chiusura autori v1f–v1fb)

`.mmls` completo con **settings** + `events` in formato G/A; UI esplicita “esercizio completo” vs “selezione”.

---

## 7. Delta v1f (index2) rispetto allo schema produzione

| Tema | v1 produzione | v1f (index2) |
|------|---------------|--------------|
| Events al **boot** | scorciatoie solo in `MAIN.js`; `#events` vuoto | G/A `system` = contenuto Events del boot (Shift+L, …) |
| Events da **file** | MathML `eventtoaction` in `#events` | merge didattica in G/A (no overwrite `system`) |
| Save/Load/Undo | `MAIN.js` | G/A `system` + builtin `MAIN2` (parallelo al modello del disegno) |
| Post-load | `injectAllMMLS` fine | + `reloadMmlsOverrides` / import v1→tied |
| Load se tied | sempre apre picker | avviso svincola |
| Dialog replace/append | assente | debito (come nel disegno) |

---

## 8. Criteri / debito

### Produzione (v1) — già così

- Boot senza file: app usabile (scorciatoie + fundamental).
- Preload e Load `.mmls` condividono `injectAllMMLS`.
- Save senza selezione → `.mmls` senza settings.

### v1f — in corso / debito

- G/A system + import events → tied — *in codice*
- events file = G/A JSON (formato-events v2) come default esercizi index2 — *debito*
- LOAD: dialog canvas/palette replace vs append — *debito* (disegno)
- SAVE: + settings (+ events G/A) — *debito*

### futuribile

- Include events didattici condivisi
- Deprecazione `eventtoaction` MathML

---

## 9. Allineamento codice

| Pezzo | Dove | Fase |
|-------|------|------|
| Scorciatoie Save/Load/Undo/copy | `MAIN.js` | v1 |
| `preloadAll` / `injectAllMMLS` | `preload.js` | v1 |
| `loadFileConvert` / `AlltoMMLSstring` | `SaveLoad.js` | v1 |
| Prototipi fundamental | `index.html` | v1 |
| G/A system + Load tied avviso | `UserEvToFunctCall2.js`, `MAIN2.js` | v1f |
| Import events → tied | `input2/importMmlsV1.js` | v1f |
