#!/bin/sh
# rk_run.sh <idsfile> <rank>: the draw survey one monster per page at a quest rank, into rk/<rank>_<id>.out (skip done ones)
cd /c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
for id in $(tr ',' ' ' < $1); do
  f=rk/$2_$id.out
  if [ -s $f ] && grep -q "REPORT" $f; then continue; fi
  METER_IDS=$id MS_RANK=$2 timeout 1500 node run-check-long.mjs metersurvey_rank.mjs > $f 2>&1
done
