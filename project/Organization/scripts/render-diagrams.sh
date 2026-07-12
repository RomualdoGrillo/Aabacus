#!/usr/bin/env bash
# Rigenera i PDF degli organigrammi da sorgenti Mermaid (.mmd).
# Uso: bash project/Organization/scripts/render-diagrams.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DIAG="$ROOT/project/Organization/diagrams"
CLI="@mermaid-js/mermaid-cli"

cd "$ROOT"

render() {
  local name="$1"
  echo "→ $name"
  npx -y "$CLI" -i "$DIAG/${name}.mmd" -o "$DIAG/${name}.pdf" -b white
}

render organigramma-operativo
render organigramma-livelli

echo "Fatto. PDF in project/Organization/diagrams/"
