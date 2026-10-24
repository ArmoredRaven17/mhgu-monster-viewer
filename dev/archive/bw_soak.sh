#!/bin/sh
# live soak of every Brute Wyvern with the viewer's own inputs, two at a time
cd /c/MHGU-Extract/MHGU-Monster-Viewer
OUT="$1"
mkdir -p "$OUT"
run(){ timeout 2400 node dev/effect-live-soak.mjs "$1" --viewer-inputs > "$OUT/$1.log" 2>&1; echo "$1 $(tail -1 "$OUT/$1.log")" >> "$OUT/summary.txt"; }
set -- em043_00 em043_05 em044_00 em045_00 em045_04 em055_00 em063_00 em063_05 em080_00 em080_04
while [ $# -gt 0 ]; do
  run "$1" & shift
  [ $# -gt 0 ] && { run "$1" & shift; }
  wait
done
echo ALLDONE >> "$OUT/summary.txt"
