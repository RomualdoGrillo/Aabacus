# Aabacus — Organizzazione agenti

Documentazione del team AI di sviluppo: ruoli, organigramma, interazioni e agenti Cursor attivi.

## Documenti

| File | Contenuto |
|------|-----------|
| [modello-agentone.md](modello-agentone.md) | **Un agentone** vs agenti paralleli; memoria solo via file e quaderni |
| [organigramma.md](organigramma.md) | Livelli GOV, organigramma operativo, flussi di collaborazione |
| [quaderni/](quaderni/) | Quaderni di laboratorio — handoff tra lavoratori interinali |
| [roles/](roles/) | Schede ruolo (descrizione umana per Romualdo) |
| [diagrams/](diagrams/) | Sorgenti Mermaid (`.mmd`) e PDF stampabili |

## Ruoli vs agenti Cursor

| Concetto | Dove | Scopo |
|----------|------|--------|
| **Ruolo** | `AGENTS.md`, `project/Organization/roles/` | Mansione, livello, perimetro, escalation |
| **Agente** | `.cursor/agents/*.md` | Profilo operativo che il **genitore** assume o delega come subagent interinale |
| **Quaderno** | `project/Organization/quaderni/` | Memoria durevole tra sessioni (il subagent non “ricorda” altrove) |
| **Romualdo** | umano | Master (L1), approvazioni GOV, review |

Prima si definisce il **ruolo**; poi si “assume” un agente scrivendo (o aggiornando) un file in `.cursor/agents/`.

## Agenti attivi (`.cursor/agents/`)

| Agente | Ruolo | Livello | Stato |
|--------|-------|---------|-------|
| `css-specialist` | Specialist CSS | L3 | attivo |
| `core-specialist` | Specialist nucleo espressioni | L3 | attivo |
| `gabba` | Tester L4 | L4 | attivo — **subagent**, non chat parallela |

Altri Specialist (rendering, properties, interaction, …) si aggiungono quando servirà.

## Diagrammi: come conservarli

**Sorgente canonica:** file testo `.mmd` in `project/Organization/diagrams/`.

1. Modifica il `.mmd` quando cambia l’organigramma.
2. Rigenera il PDF con lo script (vedi sotto) oppure incolla il contenuto su [mermaid.live](https://mermaid.live) per anteprima.
3. Il Markdown `organigramma.md` include gli stessi diagrammi in blocchi Mermaid (leggibili su GitHub/Cursor); in caso di dubbio, fa fede il `.mmd`.

```bash
# dalla root del repo
bash project/Organization/scripts/render-diagrams.sh
```

Richiede Node.js (`npx @mermaid-js/mermaid-cli`).

## Riferimenti

- Tabella ruoli: [`AGENTS.md`](../../AGENTS.md) (root repo)
- Moduli software e strati target: [`project/specs/software-modules.md`](../specs/software-modules.md)
- Test: [`project/specs/tests.md`](../specs/tests.md)
