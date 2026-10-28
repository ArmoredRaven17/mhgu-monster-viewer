#!/bin/sh
# cen3/run.sh: the census retry (census3.mjs) over every monster with open records, list order, through the slot-2 lock
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
while IFS="$(printf '\t')" read -r id keys; do
  if [ -s cen3/$id.out ] && grep -q '^FAIL REPORT' cen3/$id.out; then continue; fi
  OPEN_KEYS="$keys" METER_IDS=$id sh slot2_rcd3.sh census3.mjs cen3/$id.out
  echo "$id $(date +%H:%M:%S)" >> cen3/_progress.txt
done < cen3/todo.txt
echo ALLDONE >> cen3/_progress.txt
