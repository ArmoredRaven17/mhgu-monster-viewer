#!/bin/sh
# slot2_run.sh <check.mjs> <out>: one page check through the shared lock's slot 2
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
while ! mkdir "$SP/soak.slot2" 2>/dev/null; do find "$SP" -maxdepth 1 -name soak.slot2 -mmin +45 -exec rm -rf {} + 2>/dev/null; sleep 10; done
echo "effects $1 $$" > "$SP/soak.slot2/owner"
timeout ${T:-3600} node rcd3.mjs "$1" > "$2" 2>&1
rm -rf "$SP/soak.slot2"
