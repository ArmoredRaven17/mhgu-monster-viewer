#!/bin/sh
# cen/run.sh: the coverage census, one monster per page through the slot-2 lock, in the in-app list order
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for id in $(cat cen/order.txt); do
  if [ -s cen/$id.out ] && grep -q '^FAIL REPORT' cen/$id.out; then continue; fi
  METER_IDS=$id sh slot2_rcd2.sh census.mjs cen/$id.out
  echo "$id $(date +%H:%M:%S)" >> cen/_progress.txt
done
echo ALLDONE >> cen/_progress.txt
