#!/bin/sh
# a soak of chosen motion keys under the shared two-slot lock. Usage: sh soak_keys.sh <out.log> <mon> <key>...
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
OUT="$1"; shift
while :; do
  for s in 1 2; do
    L="$SP/soak.slot$s"
    if mkdir "$L" 2>/dev/null; then
      echo "keys $$" > "$L/owner"
      cd /c/MHGU-Extract/MHGU-Monster-Viewer
      timeout 2400 node dev/effect-live-soak.mjs "$@" --viewer-inputs > "$OUT" 2>&1
      rc=$?
      rm -rf "$L"
      exit $rc
    fi
  done
  sleep 15
done
