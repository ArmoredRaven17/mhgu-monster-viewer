#!/bin/sh
# laneB2/checks.sh: the class checks touched by lane B2's builds, one page at a time on lane B2's server
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
C=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/checks
cd $SP
for f in elders em084_00 class-requests class-toggles em069_00; do sh laneB2/run.sh $C/$f.mjs laneB2/chk_$f.out; done
