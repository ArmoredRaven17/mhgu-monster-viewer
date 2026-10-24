#!/bin/sh
# Fanged Beasts live soak, one at a time through the shared lock
S="/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad"
OUT="$S/survey_fb/soak"
for m in "$@"; do
  sh "$S/soak_locked.sh" "$m" "$OUT/$m.log"
  echo "$m $(tail -1 "$OUT/$m.log")" >> "$OUT/summary.txt"
done
echo ALLDONE >> "$OUT/summary.txt"
