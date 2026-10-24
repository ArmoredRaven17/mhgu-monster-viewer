#!/bin/sh
# Any headless-viewer command through the same two-slot lock soak_locked.sh uses. Usage: sh run_locked.sh <out.log> <cmd...>
SP="$(cd "$(dirname "$0")" && pwd)"
OUT="$1"; shift
while :; do
  for s in 1 2; do
    L="$SP/soak.slot$s"
    if mkdir "$L" 2>/dev/null; then
      echo "run_locked $$ $*" > "$L/owner"
      cd /c/MHGU-Extract/MHGU-Monster-Viewer
      "$@" > "$OUT" 2>&1
      rc=$?
      rm -rf "$L"
      exit $rc
    fi
    find "$SP" -maxdepth 1 -name "soak.slot$s" -mmin +45 -exec rm -rf {} + 2>/dev/null
  done
  sleep 15
done
