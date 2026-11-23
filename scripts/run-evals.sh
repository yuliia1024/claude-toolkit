#!/usr/bin/env bash
# Toolkit checks, cheapest first.
#
#   scripts/run-evals.sh static              # level 1: node tests + toolkit validator (free)
#   scripts/run-evals.sh triggers [plugin]   # level 2: does each skill activate on a typical request
#   scripts/run-evals.sh quality  [plugin]   # level 3: fixture cases, with vs without the plugin
#   scripts/run-evals.sh all                 # everything
#
# Levels 2 and 3 run real Claude sessions on your account. Budget per plugin run is capped
# with MAX_COST (USD, default 3). Reports stay local (evals/results/, gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGINS=(ai architect backend core node reviewer security)
MAX_COST="${MAX_COST:-3}"
JOBS="${JOBS:-4}"
mode="${1:-static}"
only="${2:-}"

targets() {
  if [[ -n "$only" ]]; then echo "$only"; else printf '%s\n' "${PLUGINS[@]}"; fi
}

has_cases() { # plugin, filter-kind
  local dir="$ROOT/plugins/$1/evals"
  [[ -d "$dir" ]] || return 1
  if [[ "$2" == trigger ]]; then compgen -G "$dir/trigger-*" >/dev/null
  else find "$dir" -mindepth 1 -maxdepth 1 -type d ! -name 'trigger-*' ! -name results | grep -q .
  fi
}

static() {
  (cd "$ROOT" && node --test tests/*.test.mjs && node plugins/core/scripts/validate-toolkit.mjs)
}

triggers() {
  local p status=0
  for p in $(targets); do
    has_cases "$p" trigger || continue
    echo "== triggers: $p"
    (cd "$ROOT/plugins" && claude plugin eval "./$p" --tag trigger --ablation none \
      --trust-plugin --no-publish -j "$JOBS" --max-cost-usd "$MAX_COST" --threshold 1) || status=1
  done
  return $status
}

quality() {
  local p status=0
  for p in $(targets); do
    has_cases "$p" quality || continue
    echo "== quality: $p"
    (cd "$ROOT/plugins" && claude plugin eval "./$p" --tag quality --scaffold --allow-tools Bash Edit Write \
      --trust-plugin --no-publish -j 2 --max-cost-usd "$MAX_COST" --threshold 0.6) || status=1
  done
  return $status
}

case "$mode" in
  static) static ;;
  triggers) triggers ;;
  quality) quality ;;
  all) static; triggers; quality ;;
  *) echo "usage: $0 static|triggers|quality|all [plugin]" >&2; exit 2 ;;
esac
