!!!GOV level:2architecture requiredApprovalFrom:Romualdo

# Fasi di evoluzione (etichette documentazione)

Documento di **livello 2**: definisce le **etichette di fase** da usare nelle specifica Aabacus, così che ogni requisito o contratto indichi a quale traguardo appartiene. Non va modificato senza approvazione esplicita di Romualdo.

**Non confondere** queste fasi di *prodotto/documentazione* con i formati file **mmls v1 / mmls v2** (sezione `events` legacy MathML vs JSON tabella G/A — v. [`gesture-action-table.md`](gesture-action-table.md)).

---

## 1. Tassonomia

| Etichetta | Significato |
|-----------|-------------|
| **v1** | Situazione precedente a **giugno 2026**, rimasta stabile per un anno o più. Baseline: `index.html`, `MAIN.js`, `UserEvToFunctCall.js`, `DnD.js` / Sortable, sezione `events` MathML (`eventtoaction`). |
| **v1f** | **v1 + nuova frontend** (pista parallela): `index2.html`, `MAIN2.js`, `UserEvToFunctCall2.js`, `input2/*`, tabella **G/A**. Condivide il **backend esistente** (preload, SaveLoad, ExpressionManager, proprietà, …). |
| **v1b** | **v1 + nuova backend** (pista parallela o successiva): evoluzione del motore / persistenza / moduli sotto lo strato input, senza presupporre il merge con v1f. |
| **v1fb** | Risultato del **merge** di **v1f** e **v1b**: un solo prodotto con nuova frontend e nuova backend. |
| **v2** | Promozione di **v1fb** quando raggiunge pulizia, funzionalità e assenza di bug **almeno equivalenti a v1**. Da quel momento “la versione corrente” del prodotto è v2. |
| **futuribile** | Idee o requisiti oltre il traguardo della fase in cui compaiono: utili a orientare, **non** vincolanti per chiudere v1f / v1b / v1fb. |

Ordine temporale atteso (non obbligatorio che v1b finisca prima di v1f):

```text
v1 ──► v1f ──┐
             ├──► v1fb ──► v2
v1 ──► v1b ──┘
         └── (futuribile: rami e idee oltre il merge)
```

---

## 2. Come etichettare i documenti

1. In testa al documento (o alla sezione), indicare la fase **principale** del contenuto, es. `Fase: v1f (bozza)`.
2. Sezioni che descrivono altro da quella fase vanno marcate esplicitamente, es. `*(futuribile)*`, `*(v1 — legacy)*`, `*(target v1fb)*`.
3. Il codice e i test possono restare su piste parallele (`index` = v1, `index2` = v1f) finché non esiste v1fb.
4. Quando si introduce un contratto nuovo, dichiarare: **in quale fase nasce**, e se è obbligatorio per chiudere quella fase o solo futuribile.

---

## 3. Mappa documenti → fase (orientativa)

| Documento | Fase principale | Note |
|-----------|-----------------|------|
| [`core-concepts.md`](core-concepts.md) | **v1** (concetti stabili) | Aggiornare solo se il concetto cambia di significato in v1fb/v2 |
| [`software-modules.md`](software-modules.md) | **v1** (+ note v1f dove già diverge) | Descrive soprattutto `index.html` / moduli legacy |
| [`implementation-details.md`](implementation-details.md) | **v1** | Dettaglio implementativo baseline |
| [`tests.md`](tests.md) | **v1** + obiettivo touch | Obiettivi touch spesso *futuribili* o v1f |
| [`new-interface-spec.md`](new-interface-spec.md) | **v1f** | Rifacimento input / touch; §7 pista `index2` |
| [`gesture-action-table.md`](gesture-action-table.md) | **v1f** | Contratto G/A |
| [`session-lifecycle.md`](session-lifecycle.md) | **v1f** (+ futuribile SAVE/LOAD) | BOOT / PRELOAD / LOAD / SAVE |

Aggiornare questa tabella quando nasce un documento L2 rilevante.

---

## 4. Criterio di promozione a v2

**v1fb → v2** solo quando Romualdo ritiene soddisfatti, rispetto a **v1**:

- parità (o superiore) di funzionalità usate in produzione/didattica;
- assenza di regressioni bloccanti note;
- documentazione e moduli allineati (una sola pista UI+backend, o deprecazione esplicita della pista vecchia).

Fino ad allora si parla di **v1fb**, non di v2.
