# Quaderni di laboratorio

Memoria durevole del modello **un agentone**: ciò che un lavoratore interinale lascia al successivo quando la chat non esiste più.

## Uso

1. Apri o copia [`_template.md`](_template.md) per ogni filone di lavoro (refactor, feature, investigazione).
2. Il **agente genitore** aggiorna il quaderno a fine step significativo o prima di chiudere la sessione.
3. I **subagent** (es. Gabba) leggono il quaderno se serve contesto oltre specs e test; scrivono nel log sessioni se hanno esito da preservare.
4. Committa il quaderno insieme al codice — è parte del handoff git.

## Regola

Nessuna informazione critica solo “nella testa” dell’agente o in una chat separata. Se il prossimo lavoratore non la trova nel repo, non esiste.

Vedi: [`../modello-agentone.md`](../modello-agentone.md).
