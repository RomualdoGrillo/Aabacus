# Aabacus — applicazione

Codice prodotto: IDE matematico interattivo (HTML, CSS, JS, contenuti `.mml` / `.mmls`).

## Avvio locale

Dalla root del repository:

```bash
npx --yes serve -l tcp://0.0.0.0:5500 app
```

Apri [http://127.0.0.1:5500/](http://127.0.0.1:5500/) (o `http://localhost:5500/`).

Il server serve **solo** la cartella `app/` come root web (non la root del repository).

L'ascolto su `0.0.0.0` permette di raggiungere l'app anche da altri dispositivi sulla stessa rete WiFi (es. iPad), oltre che dalla Mac stessa.

Esempio con esercizio precaricato:

```
http://127.0.0.1:5500/?preloadPath=./Data/exercises/hanoi4.mmls
```

Avvio alternativo: **Terminal → Run Task → Serve Aabacus**.

## Test su iPad (rete WiFi domestica)

1. Avvia il server come sopra e lascialo in esecuzione.
2. Trova l'IP della Mac sulla WiFi:

   ```bash
   ipconfig getifaddr en0
   ```

   (se non restituisce nulla, prova `en1` oppure **Impostazioni di Sistema → Rete → WiFi → Dettagli**)

3. Su iPad (stessa WiFi), apri Safari con:

   ```
   http://<IP-DELLA-MAC>:5500/
   ```

   Esempio:

   ```
   http://192.168.1.42:5500/?preloadPath=./Data/exercises/hanoi4.mmls
   ```

L'IP assegnato dal router può cambiare nel tempo: ricontrollalo prima di ogni sessione di test.

Ferma il server con `Ctrl+C` quando hai finito.
