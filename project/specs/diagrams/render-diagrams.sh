#!/usr/bin/env bash
# PDF stampabili (sfondo bianco) degli schemi moduli da software-modules.md §1
# Uso: bash project/specs/diagrams/render-diagrams.sh [completa|sintetica|all]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DIAG="$ROOT/project/specs/diagrams"
CLI="@mermaid-js/mermaid-cli"

cd "$ROOT"

render() {
  local name="$1"
  local w="${2:-1400}"
  local h="${3:-2000}"
  echo "→ $name"
  npx -y "$CLI" -i "$DIAG/${name}.mmd" -o "$DIAG/${name}.pdf" -b white -w "$w" -H "$h"
}

target="${1:-completa}"

case "$target" in
  completa)
    render moduli-vista-completa 1600 2400
    ;;
  sintetica)
    render moduli-vista-sintetica 1200 800
    ;;
  all)
    render moduli-vista-sintetica 1200 800
    render moduli-vista-completa 1600 2400
    ;;
  *)
    echo "Uso: $0 [completa|sintetica|all]" >&2
    exit 1
    ;;
esac

echo "Fatto. PDF in project/specs/diagrams/"
