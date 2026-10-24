#!/bin/sh
# one at a time through the shared lock
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
for m in "$@"; do
  sh $SP/soak_locked.sh $m $SP/survey_rc/soak/$m.log
  echo "$m $(tail -1 $SP/survey_rc/soak/$m.log)" >> $SP/survey_rc/soak/summary.txt
done
echo ALLDONE >> $SP/survey_rc/soak/summary.txt
