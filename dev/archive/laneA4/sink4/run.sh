#!/bin/sh
# laneA4/sink4/run.sh id...: specs/<id>.json -> out/<id>.out through the slot-2 lock (sinkmeter.mjs OFF then ON)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
D=C:/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/sink4
mkdir -p $D/out
echo "pid $$" > $D/run_pid.txt
for id in "$@"; do PROBES="$(cat $D/specs/$id.json)" sh $SP/slot2_rcd3.sh $D/sinkmeter.mjs $D/out/$id.out; echo "$id $(date +%H:%M:%S)" >> $D/run_progress.txt; done
echo ALLDONE >> $D/run_progress.txt
