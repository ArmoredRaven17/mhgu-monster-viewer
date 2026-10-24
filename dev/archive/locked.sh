#!/bin/sh
# locked.sh <owner> <out.log> <env-assignments...> -- run one headless check (run-check.mjs + a module) through the shared two-slot
# soak lock. Usage: sh locked.sh <owner> <out> <module.mjs> [VAR=value ...]
SP="$(cd "$(dirname "$0")" && pwd)"
OWN="$1"; OUT="$2"; MOD="$3"; shift 3
while :; do
  for s in 1 2; do
    L="$SP/soak.slot$s"
    if mkdir "$L" 2>/dev/null; then
      echo "$OWN $$" > "$L/owner"
      cd /c/MHGU-Extract/MHGU-Monster-Viewer
      env "$@" timeout 2400 node "$(cygpath -w "$SP/run-check.mjs")" "$(cygpath -w "$MOD")" > "$OUT" 2>&1
      rc=$?
      rm -rf "$L"
      exit $rc
    fi
    find "$SP" -maxdepth 1 -name "soak.slot$s" -mmin +45 -exec rm -rf {} + 2>/dev/null
  done
  sleep 15
done
