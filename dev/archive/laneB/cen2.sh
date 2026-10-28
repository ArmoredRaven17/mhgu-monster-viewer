#!/bin/sh
# laneB/cen2.sh: the second census3 worker, laneB/todo2.txt (the Elder / ??? end, reversed) -> cen3/<id>.out
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
while IFS="$(printf '\t')" read -r id keys; do
  OPEN_KEYS="$keys" METER_IDS=$id sh laneB/run.sh census3.mjs cen3/$id.out
  echo "w2 $id $(date +%H:%M:%S)" >> laneB/_progress.txt
done < laneB/todo2.txt
echo W2DONE >> laneB/_progress.txt
