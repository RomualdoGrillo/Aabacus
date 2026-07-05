# Aabacus — progetto

Materiale di supporto allo sviluppo (non fa parte del deploy dell'app).

| Cartella | Contenuto |
|----------|-----------|
| `specs/` | Documentazione tecnica e concetti |
| `specs/diagrams/` | Diagrammi architetturali (SVG editabili) |
| `dev/` | Script di sviluppo (es. ChromeLauncher) |
| `Organization/` | Agenti, organigramma, handoff, ricette test browser |
| `tests/` | Test automatizzati (e2e, helper) |
| `tests/recipes/` | Ricette browser per agente GABBA |
| `release/` | Packaging e release (futuro) |

## Test E2E

```bash
cd project/tests
npm install
npm run test:e2e
```

Richiede server su porta 5500 (avviato automaticamente da Playwright, oppure `npx --yes serve -l 5500 app` dalla root).
