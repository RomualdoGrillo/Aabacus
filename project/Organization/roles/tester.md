# Tester — ruolo L4

**Livello:** 4  
**Agente Cursor:** *non ancora creato* (`e2e-tester.md` previsto)

## Responsabilità

- Test automatizzati Playwright in `project/tests/e2e/`.
- Helper browser e ricette in `project/tests/recipes/`.
- Smoke `project/tests/smoke-expression-manager.js`.
- Verificare esito test senza intervento umano quando possibile.

## Perimetro

- Solo `project/tests/` (e aggiornamenti a `project/specs/tests.md` se necessario documentare regole test).

## Non tocca

- `app/` (prodotto) — usa API esistenti via helper iniettati.

## Invocazione

- Dopo modifiche a canvas, DnD, nucleo ENODE: refactor-lead o Specialist delegano al Tester.
- Ricette YAML in `project/tests/recipes/` (es. `hanoi-drag.yaml`).

## Riferimenti

- [`project/specs/tests.md`](../../specs/tests.md)
- [`organigramma.md`](../organigramma.md)
