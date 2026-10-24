#!/bin/sh
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
for m in em044_00 em004_00 em007_00 em007_04 em033_00 em043_00 em043_05 em045_00 em045_04 em055_00 em063_00 em063_05 em018_04 em002_02; do
  sh $SP/soak_locked.sh $m $SP/soak9_$m.log
  echo "$m rc=$? $(tail -1 $SP/soak9_$m.log)"
done
echo ALLDONE
