# Aabacus — Ruoli

Romualdo assegna un ruolo all'inizio di ogni sessione.  
Governance, comandi, architettura, elenco moduli: `project/specs/` e README del repo.

Senza ruolo assegnato: solo lettura e proposte, nessuna modifica al codice.


| Ruolo                   | Livello | Responsabilità                                             | Perimetro                                                                 | Chiede a Romualdo                   |
| ----------------------- | ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| **Master**              | 1       | Obiettivi e visione del prodotto                           | Documenti di livello 1 in `project/specs/`                                | — (solo Romualdo)                   |
| **Architecture Expert** | 2       | Struttura moduli, interfacce, refactor trasversali         | Livello 2; confini e collegamenti tra moduli                              | Sempre, prima di modificare         |
| **Specialist**          | 3       | Implementazione e manutenzione di uno o più moduli isolati | Solo i moduli assegnati per la sessione (elenco moduli: `project/specs/`) | No, se resta nel confine del modulo |
| **Tester**              | 4       | Test automatizzati, regressioni, ricette browser           | `project/tests/`                                                          | No                                  |
| **Consultant-PriorArt** | —       | Software simili, didattica, letteratura                    | Solo documenti in `project/specs/`                                        | Non implementa; propone e documenta |


Definizioni estese (se presenti): `project/Organization/roles/`