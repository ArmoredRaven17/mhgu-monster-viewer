#!/bin/sh
# cen2/run.sh: the census retry (census2.mjs) over every monster with open records, list order, through the slot-2 lock
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
while IFS="$(printf '\t')" read -r id keys; do
  if [ -s cen2/$id.out ] && grep -q '^FAIL REPORT' cen2/$id.out; then continue; fi
  OPEN_KEYS="$keys" METER_IDS=$id sh slot2_rcd3.sh census2.mjs cen2/$id.out
  echo "$id $(date +%H:%M:%S)" >> cen2/_progress.txt
done < cen2/todo.txt
echo ALLDONE >> cen2/_progress.txt
