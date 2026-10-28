#!/bin/sh
# laneB/run.sh <check.mjs> <out>: one page check on lane B's own server (port 5711), its own headless Edge (rcd3.mjs)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
timeout 9000 node laneB/rcd3b.mjs "$1" --url http://localhost:5711 > "$2" 2>&1
