#!/bin/sh
# run_click.sh <out.log>: slimeclick.mjs through slot 1 of the soak lock; the node PID recorded in gapZ/bm.pid (the only one ever stopped)
SP="C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad"
OUT="$1"
while :; do
  L="$SP/soak.slot1"
  if mkdir "$L" 2>/dev/null; then
    echo "hypermeter $$" > "$L/owner"
    cd /c/MHGU-Extract/MHGU-Monster-Viewer
    node "$(cygpath -w "$SP/run-check.mjs")" "$(cygpath -w "$SP/gapZ/bmshot3.mjs")" > "$OUT" 2>&1 &
    NP=$!; echo "$NP" > "$SP/gapZ/bm.pid"
    wait $NP; rc=$?
    rm -rf "$L"
    exit $rc
  fi
  find "$SP" -maxdepth 1 -name "soak.slot1" -mmin +45 -exec rm -rf {} + 2>/dev/null
  sleep 15
done
