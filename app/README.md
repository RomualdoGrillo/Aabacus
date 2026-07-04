# Aabacus — applicazione

Codice prodotto: IDE matematico interattivo (HTML, CSS, JS, contenuti `.mml` / `.mmls`).

## Avvio locale

Dalla root del repository:

```bash
npx --yes serve -l 5500 app
```

Apri [http://127.0.0.1:5500/](http://127.0.0.1:5500/)

Il server serve **solo** la cartella `app/` come root web (non la root del repository).

Esempio con esercizio precaricato:

```
http://127.0.0.1:5500/?preloadPath=./Data/exercises/hanoi4.mmls
```

Avvio alternativo: **Terminal → Run Task → Serve Aabacus**.
