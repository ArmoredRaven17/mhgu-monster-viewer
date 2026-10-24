#!/bin/sh
S="C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad"
cd /c/MHGU-Extract/MHGU-Monster-Viewer
for id in $(tr ',' ' ' < "$1"); do
  [ -s "$S/sw/$id.out" ] && grep -q "^FAIL REPORT" "$S/sw/$id.out" && continue
  METER_IDS=$id timeout 3700 node "$S/run-check-long.mjs" "$S/metersweep.mjs" > "$S/sw/$id.out" 2>&1
  echo "$id rc=$?" >> "$S/sw/_progress_$2.txt"
done
echo "chunk $2 done" >> "$S/sw/_progress_$2.txt"
