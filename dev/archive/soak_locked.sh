#!/bin/sh
# ONE live soak through a shared two-slot lock, so the survey agents never run more than two headless viewers at once
# (three at once gave "viewer never came up"). Usage: sh soak_locked.sh <mon> <out.log>
# A slot is a directory (mkdir is atomic); a slot older than 45 minutes is taken as abandoned and reclaimed.
SP="$(cd "$(dirname "$0")" && pwd)"
MON="$1"; OUT="$2"
while :; do
  for s in 1 2; do
    L="$SP/soak.slot$s"
    if mkdir "$L" 2>/dev/null; then
      echo "$MON $$" > "$L/owner"
      cd /c/MHGU-Extract/MHGU-Monster-Viewer
      timeout 2400 node dev/effect-live-soak.mjs "$MON" --viewer-inputs > "$OUT" 2>&1
      rc=$?
      rm -rf "$L"
      exit $rc
    fi
    find "$SP" -maxdepth 1 -name "soak.slot$s" -mmin +45 -exec rm -rf {} + 2>/dev/null
  done
  sleep 15
done
