#!/bin/sh
# live soak of every Bird Wyvern with the viewer's own inputs, two at a time
cd /c/MHGU-Extract/MHGU-Monster-Viewer
OUT="$1"
mkdir -p "$OUT"
run(){ timeout 2400 node dev/effect-live-soak.mjs "$1" --viewer-inputs > "$OUT/$1.log" 2>&1; echo "$1 $(tail -1 "$OUT/$1.log")" >> "$OUT/summary.txt"; }
set -- em008_00 em009_00 em014_00 em015_00 em016_00 em018_00 em018_04 em034_00 em079_00 em079_04 em085_00
while [ $# -gt 0 ]; do
  run "$1" & shift
  [ $# -gt 0 ] && { run "$1" & shift; }
  wait
done
echo ALLDONE >> "$OUT/summary.txt"
