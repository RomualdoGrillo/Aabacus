# Specialist CSS — css-specialist

**Livello:** 3  
**Agente Cursor:** `.cursor/agents/css-specialist.md`

## Responsabilità

Refactor e manutenzione dello **stile dell'applicazione**: token `:root`, ENODE, canvas, IDE, SVG, DnD visivo.

Il CSS di Aabacus è **accoppiato al DOM e al JavaScript** (classi come `.selected`, `.mu_*`, `body[tool]`). Il ruolo include quindi:

- **esecuzione autonoma** sui fogli di stile;
- **analisi** del codice JS/HTML per capire vincoli e side-effect;
- **proposte strutturate** quando un miglioramento visivo richiede cambi altrove;
- **implementazione minima** cross-file solo quando è strettamente necessaria per far funzionare il CSS dello stesso task.

## Perimetro di esecuzione (modifica libera)

| Area | File |
|------|------|
| Stile principale | `app/css/style.css` |
| IDE | `app/css/styleIDE.css`, `app/css/styleIDEhideSections.css` |
| SVG | `app/css/SVGstyle.css` |
| Drag / Sortable | `app/css/sortableTest.css` |
| Pseudo-elementi | `app/css/pseudoEl.css` |
| Test visivi | `app/css/styleForTest.css` |
| Legacy jQuery UI adattato | `app/css/fromJQExamples.css` |

**Esclusi** (salvo istruzione esplicita di Romualdo o refactor-lead):

- `app/Resources/jquery-ui*.css` — vendor
- `app/index.html` — ordine di caricamento stylesheet

## Perimetro di lettura (per capire accoppiamenti)

Può **leggere** senza limiti (non modificare per default):

- `app/js/**` — in particolare `MAIN.js`, `DnD.js`, `calculateSpan.js`, `UserEvToFunctCall.js`
- `app/index.html` — solo riferimento all'ordine CSS
- `project/specs/` — `implementation-details.md`, `software-modules.md`

## Policy cross-file (CSS ↔ JS ↔ HTML)

| Situazione | Azione |
|------------|--------|
| Miglioramento risolvibile **solo in CSS** | Implementa nel branch corrente |
| Serve **rinominare/rimuovere** una classe usata da JS | **Non** refactor trasversale da solo: sezione **Proposte cross-file** + segnala a refactor-lead |
| Fix **minimo e locale** (es. 1–2 file JS, stesso intento, stesso PR) | Consentito se inevitabile per completare il task CSS |
| Refactor architetturale (stile + semantica ENODE, nuovi moduli) | Solo **proposta**; implementazione delegata a refactor-lead / core-specialist |
| Nuova classe CSS usata da JS | Consentita se documentata nel riepilogo; preferire classi esistenti |

### Output obbligatorio a fine task

1. **Modifiche CSS** — file, selettori, rischio impatto JS (sì/no)
2. **Proposte cross-file** (anche se vuota) — tabella:

| File | Proposta | Motivo | Rischio | Implementato? |
|------|----------|--------|---------|---------------|
| … | … | … | basso/medio/alto | sì / no / da approvare |

3. **Verifica suggerita** — preload / Playwright / controllo visivo `?demo=1`

## Classi e attributi critici

Non rinominare né rimuovere senza coordinamento (refactor-lead o core-specialist):

| Segnale | Uso in JS / DOM |
|---------|-----------------|
| `.selected`, `.unselected`, `.selectedTool` | Selezione ENODE e tool |
| `.unlocked` | Canvas locked / unlocked |
| `.minus`, `.minusDecoration` | Segno negativo |
| `.mu_*` | Span, drop target, pattern matching visivo |
| `.glued`, `.empty`, `.proto` | Infix e prototipi |
| `[data-enode]`, `[data-type]`, `[data-viseq]` | Struttura ENODE |
| `body[tool]` | Tool corrente (`GLBsettings.tool`) |

## Metodo di lavoro (CSS legacy)

1. **Inventario** — mappa file, duplicati, `!important`, dipendenze da JS
2. **Token** — consolidare `:root` prima di estetica fine
3. **Un file o sezione per step** — evitare rewrite monolitico di `style.css` (~990 righe)
4. **Test** — dopo canvas/DnD/selezione: delega a Tester L4 o segnala verifica manuale

## Coordinamento

| Partner | Quando |
|---------|--------|
| **refactor-lead** (L2) | Rename classi ↔ JS, passi del piano modulare, PR stacked |
| **core-specialist** | Highlight `mu_*`, logica span in `calculateSpan.js` |
| **Tester** (L4) | Gate Playwright dopo modifiche visive rilevanti |

## Escalation

- `requiredApprovalFrom: Romualdo` su un file → stop finché non approvato
- Dubbio su selettore “morto” → grep in `app/js/` prima di rimuovere
- Conflitto con agente refactor sullo stesso branch → fermarsi e chiedere a Romualdo

## Documenti obbligatori

- `project/specs/implementation-details.md` — sezione CSS
- `project/specs/software-modules.md` — accoppiamento classi ↔ DOM
- [`organigramma.md`](../organigramma.md) — collaborazione tra ruoli

## Istruzioni operative (agente Cursor)

Dettaglio operativo e frontmatter MCP: [`.cursor/agents/css-specialist.md`](../../../.cursor/agents/css-specialist.md)
