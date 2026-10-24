#!/bin/sh
# rk_locked.sh <idsfile> <rank>: the rank survey, each monster's page through the shared two-slot lock (soak.slot1 / slot2, as soak_locked.sh)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for id in $(tr ',' ' ' < $1); do
  f=rk/$2_$id.out
  if [ -s $f ] && grep -q "REPORT" $f; then continue; fi
  done1=0
  while [ $done1 = 0 ]; do
    for s in 1 2; do
      L="$SP/soak.slot$s"
      if mkdir "$L" 2>/dev/null; then
        echo "rk $id $$" > "$L/owner"
        METER_IDS=$id MS_RANK=$2 timeout 1500 node run-check-long.mjs metersurvey_rank.mjs > $f 2>&1
        rm -rf "$L"; done1=1; break
      fi
      find "$SP" -maxdepth 1 -name "soak.slot$s" -mmin +45 -exec rm -rf {} + 2>/dev/null
    done
    [ $done1 = 0 ] && sleep 15
  done
done
