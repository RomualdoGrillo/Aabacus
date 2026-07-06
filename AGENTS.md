# Aabacus

Aabacus is a purely **client-side static web application** (an educational visual editor for mathematical/logical expressions). It is plain HTML/CSS/JavaScript with jQuery, `mathjs`, `popper.js` and `Sortable.js`. There is **no backend server, no database, and no automated test suite**. See `docs/core-concepts.md` and `docs/implementation-details.md` for how the app works.

## Cursor Cloud specific instructions

### Running the app (development)
- The app is a set of static files. Serve the repository root over HTTP and open `index.html`. The project's VS Code config expects **port 5500** (`.vscode/launch.json` / Live Server), so use that port for consistency:
  - `python3 -m http.server 5500` (run from the repo root), then open `http://localhost:5500/index.html`.
- The page loads jQuery / mathjs / popper from CDNs (`code.jquery.com`, `cdnjs.cloudflare.com`), so the **browser needs internet access** to render correctly.
- On startup the app auto-loads `./Data/Preload/PRELOAD.mmls` via AJAX (see top of `js/MAIN.js`). You can load any other example by appending a query param, e.g. `index.html?preloadPath=./Data/SectionExample.mml`.
- `Shift+D` toggles debug mode (pink background) which makes the otherwise hover-revealed canvas/expression clearly visible — useful when testing/screenshotting.
- Core interaction: **double-click** a value/variable in an expression to rename it via a prompt; drag palette blocks to build expressions. Other shortcuts are documented in `docs/implementation-details.md`.

### Build / lint / test
- **Build** (optional, production minify only): `npm run minify` (uses `terser`). Note two pre-existing caveats: (1) the committed `terser` binaries under `node_modules/.bin` lack the executable bit until `npm install` runs, and (2) the `minify` script references `js/newPatternMatching.js`, which does not exist in the repo, so the script fails partway. To minify an existing file directly use e.g. `npx terser -c -m -o /tmp/out.js -- js/MAIN.js`. Building is **not** required to run/develop the app.
- **Lint**: none configured.
- **Tests**: none — the `npm test` script intentionally errors (`"Error: no test specified"`). Verify changes manually in the browser.

### Repo quirks
- `node_modules/` is **committed** to the repo, but running `npm install` slightly rewrites some files (executable bits, `package-lock.json` lockfile version). Avoid committing that incidental churn.
