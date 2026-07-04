# Aabacus

Aabacus is a purely **client-side static web application** (an educational visual editor for mathematical/logical expressions). It is plain HTML/CSS/JavaScript with jQuery, `mathjs`, `popper.js` and `Sortable.js`. There is **no backend server, no database, and no automated test suite**. See `docs/core-concepts.md` and `docs/implementation-details.md` for how the app works.

## Cursor Cloud specific instructions

### Running the app (development)

The app is a set of static files served over HTTP on **port 5500**.

#### Dev server control panel (recommended)

Run the local control panel, then use the **Go Live** button in the bottom-right corner (similar to Live Server in VS Code):

```bash
npm run dev
```

Then open:

- Control panel: `http://127.0.0.1:5501/`
- App: `http://127.0.0.1:5500/index.html`

The control panel starts/stops the app server on port 5500.

#### Manual / VS Code Live Server

- `python3 -m http.server 5500` from the repo root, or
- VS Code / Cursor extension **Live Server** (recommended in `.vscode/extensions.json`), configured for port 5500 in `.vscode/settings.json`.

Load any example with a query param, e.g.:

`index.html?preloadPath=./Data/exercises/hanoi4.mmls`

The page loads jQuery / mathjs / popper from CDNs, so the **browser needs internet access**.

- `Shift+D` toggles debug mode (pink background), useful when testing/screenshotting.
- Core interaction: **double-click** a value/variable to rename it; drag blocks to build expressions.

### Build / lint / test

- **Build** (optional): `npm run minify` (uses `terser`). Not required to run/develop the app.
- **Lint**: none configured.
- **Tests**: none — verify changes manually in the browser.

### Repo quirks

- `node_modules/` is committed, but `npm install` may rewrite executable bits / lockfile metadata. Avoid committing that incidental churn.
