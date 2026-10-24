#!/bin/sh
S=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
for m in "$@"; do
  sh $S/soak_locked.sh $m $S/survey_ap/soak/$m.log
  echo "$m rc=$?" >> $S/survey_ap/soak/done.txt
done
