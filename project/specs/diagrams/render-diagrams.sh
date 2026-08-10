#!/usr/bin/env bash
# Rigenera PDF stampabili (sfondo bianco) dei diagrammi in project/specs/diagrams/
# Uso: bash project/specs/diagrams/render-diagrams.sh [nome-base]
# Senza argomenti: genera architettura-strati-target (software-modules.md §5)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DIAG="$ROOT/project/specs/diagrams"
CLI="@mermaid-js/mermaid-cli"

cd "$ROOT"

render_mermaid() {
  local name="$1"
  echo "→ Mermaid: $name"
  npx -y "$CLI" -i "$DIAG/${name}.mmd" -o "$DIAG/${name}.pdf" -b white -w 1200 -H 1600
}

render_svg() {
  local name="$1"
  local html="$DIAG/.${name}-print.html"
  local pdf="$DIAG/${name}.pdf"
  echo "→ SVG: $name"
  cat > "$html" <<EOF
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>${name}</title>
  <style>
    @page { margin: 12mm; background: #fff; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .wrap { background: #fff; padding: 8px; }
    svg { max-width: 100%; height: auto; display: block; background: #fff; }
    h1 { font: 16px/1.3 Arial, sans-serif; color: #111; margin: 0 0 12px; }
    p { font: 11px/1.4 Arial, sans-serif; color: #444; margin: 0 0 12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Aabacus — schema moduli software (architettura attuale)</h1>
    <p>Da project/specs/diagrams/software-modules.svg</p>
$(cat "$DIAG/${name}.svg")
  </div>
</body>
</html>
EOF
  google-chrome --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="$pdf" "file://$html"
  rm -f "$html"
}

if [[ $# -eq 0 ]]; then
  render_mermaid architettura-strati-target
elif [[ "$1" == "software-modules" ]]; then
  render_svg software-modules
else
  render_mermaid "$1"
fi

echo "Fatto. PDF in project/specs/diagrams/"
