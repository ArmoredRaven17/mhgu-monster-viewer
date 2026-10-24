#!/bin/sh
# msall.sh <ids file> <tag>: the draw meter survey, ONE run-check page per monster (a crash costs one monster; each written as it ends)
S="C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad"
cd /c/MHGU-Extract/MHGU-Monster-Viewer
mkdir -p "$S/ms"
for id in $(tr ',' ' ' < "$1"); do
  [ -s "$S/ms/$id.out" ] && grep -q "^FAIL REPORT" "$S/ms/$id.out" && continue
  METER_IDS=$id timeout 1500 node "$S/run-check.mjs" "$S/metersurvey.mjs" > "$S/ms/$id.out" 2>&1
  echo "$id rc=$?" >> "$S/ms/_progress_$2.txt"
done
echo "chunk $2 done" >> "$S/ms/_progress_$2.txt"
