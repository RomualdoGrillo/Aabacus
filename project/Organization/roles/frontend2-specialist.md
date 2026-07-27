# Specialist FrontEnd2 — frontend2-specialist

**Livello:** 3  
**Agente Cursor:** `.cursor/agents/frontend2-specialist.md`

## Responsabilità

Pista parallela UI touch-first (`index2` / input2): recognizer di gesti, traduzione gesto→azione (omologo di `UserEvToFunctCall.js`), orchestrazione boot, selezione condivisa. Lascia intatta la UI di produzione (`index.html` + moduli interaction legacy).

## Perimetro

- `app/index2.html`
- `app/js/input2/**` (`gestures.js`, …)
- `app/js/MAIN2.js` — omologo di `MAIN.js` (orchestrazione index2)
- `app/js/UserEvToFunctCall2.js` — tabella gesture/tasto → azioni (tied/untied); unico custode della tabella
- `app/js/selectionManager.js` — condiviso con legacy; modifiche solo se servono a entrambe le UI o a index2
- `app/css/input2.css`
- Test dedicati: `project/tests/unit-UserEvToFunctCall2.js`, `project/tests/unit-input2-*.js`, `project/tests/e2e/input2-*.js`
- Spec della pista: `project/specs/new-interface-spec.md` §7 (aggiornamenti di allineamento al codice)

## Non tocca (salvo istruzione refactor-lead / Romualdo)

- `app/index.html` e lo strato interaction legacy: `MAIN.js`, `DnD.js`, `UserEvToFunctCall.js`
- `app/css/style.css` e resto CSS produzione → css-specialist
- Nucleo ENODE / properties / persistence → altri Specialist o L2
- Refactor trasversali multi-strato → Architecture Expert

## Principio di sdoppiamento

Quando possibile, **sostituire** un modulo legacy con un omologo `*2` (stesso ruolo, nomenclatura parallela). Non inventare suddivisioni/nomi nuovi senza motivo preciso. Esempio: `UserEvToFunctCall.js` → `UserEvToFunctCall2.js` (non `intentMap.js`).

## Escalation

- Contratto tied/untied o cambio API verso properties/core → refactor-lead + Romualdo
- Parità visiva ExpressionTree → css-specialist + gate Gabba

## Documenti

- `project/specs/gesture-action-table.md` — **L2 GOV2**: contratto tabella gesture/azioni (non modificare senza Romualdo)
- `project/specs/new-interface-spec.md` §7
- `project/specs/software-modules.md` (strato input)
- `AGENTS.md`, `project/Organization/organigramma.md`
