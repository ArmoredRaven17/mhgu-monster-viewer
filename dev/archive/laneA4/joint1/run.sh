#!/bin/sh
# laneA4/joint1/run.sh <check.mjs> <out> '<DBG json>': one page check through the slot-2 lock (as laneA3/dbg.sh)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
DBG="$3" sh slot2_rcd3.sh "$1" "$2"
