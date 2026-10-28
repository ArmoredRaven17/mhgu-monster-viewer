#!/bin/sh
# laneA4/sink4/runshot.sh: sinkshot.mjs over shot_items.json through the slot-2 lock -> shots.out, then sheet.py -> sheets
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
D=C:/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneA4/sink4
echo "pid $$" > $D/shot_pid.txt
DBG="$(cat $D/shot_items.json)" sh $SP/slot2_rcd3.sh $D/sinkshot.mjs $D/shots.out
python $D/sheet.py $D/shots.out $D/shots $D/sink4_sheet.png > $D/sheet.log 2>&1
echo SHOTDONE2 >> $D/shot_pid.txt
