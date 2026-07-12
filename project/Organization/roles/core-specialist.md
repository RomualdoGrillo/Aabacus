# Specialist core — core-specialist

**Livello:** 3  
**Agente Cursor:** `.cursor/agents/core-specialist.md`

## Responsabilità

Nucleo espressioni ENODE: manipolazione albero, MathML, helper numerici, utilità DOM pure del core (allineato a `software-modules.md` §2.1 e strato `core/` §5).

## Perimetro

- `app/js/ExpressionManager.js`
- `app/js/inflatedeflate.js`
- `app/js/math.js`
- `app/js/formatXML.js`
- `app/js/calculateSpan.js` (parte logica; coordinamento con css-specialist per classi `mu_*` di highlight)
- `app/js/dom-utils.js` (utilità DOM generiche senza orchestrazione eventi)

## Non tocca (salvo istruzione refactor-lead)

- `app/css/` → css-specialist
- `MAIN.js`, `DnD.js`, `UserEvToFunctCall.js`, `Undo.js` → interaction (Specialist futuro)
- `PMTutilities.js`, `HardWiredProperties.js`, … → properties (Specialist futuro)
- `preload.js`, `SaveLoad.js` → persistence (Specialist futuro)
- `state.js`, `settings.js` → stato/orchestrazione (L2)

## Escalation

- Estrazione UI da `ExpressionManager.js` (passo 4 del piano refactor): coordina con refactor-lead.
- Nuove classi CSS per highlight span: segnala a css-specialist.

## Documenti

- `project/specs/software-modules.md` §2.1, §5, §6
- `project/specs/core-concepts.md`

## Istruzioni operative

Vedi file agente completo in [`.cursor/agents/core-specialist.md`](../../../.cursor/agents/core-specialist.md).
