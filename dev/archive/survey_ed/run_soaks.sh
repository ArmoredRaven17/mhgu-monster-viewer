#!/bin/sh
SP="C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad"
OUT="$SP/survey_ed/soak"
for m in "$@"; do
  sh "$SP/soak_locked.sh" "$m" "$OUT/$m.log"
  echo "$m rc=$? $(tail -1 "$OUT/$m.log")" >> "$OUT/summary.txt"
done
echo ALLDONE >> "$OUT/summary.txt"
