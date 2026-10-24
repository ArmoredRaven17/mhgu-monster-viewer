#!/bin/sh
# live soak of every large Flying Wyvern with the viewer's own inputs, three at a time
cd /c/MHGU-Extract/MHGU-Monster-Viewer
OUT="$1"
mkdir -p "$OUT"
run(){ timeout 2400 node dev/effect-live-soak.mjs "$1" --viewer-inputs > "$OUT/$1.log" 2>&1; echo "$1 $(tail -1 "$OUT/$1.log")" >> "$OUT/summary.txt"; }
set -- em001_00 em001_02 em001_04 em002_00 em002_02 em002_04 em003_00 em004_00 em005_00 em007_00 em007_04 em032_00 em032_04 em033_00 em037_00 em037_04 em038_00 em042_00 em077_00 em081_00 em081_04
while [ $# -gt 0 ]; do
  run "$1" & shift
  [ $# -gt 0 ] && { run "$1" & shift; }
  [ $# -gt 0 ] && { run "$1" & shift; }
  wait
done
echo ALLDONE >> "$OUT/summary.txt"
