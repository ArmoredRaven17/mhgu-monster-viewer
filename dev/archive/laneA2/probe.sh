#!/bin/sh
# laneA2/probe.sh name...: pq/<name>.json -> pq/<name>.out, laneB/probe2.mjs (loop before the clip pick) through the slot-2 lock
# (slot2_rcd3.sh: rcd3.mjs serves docs/ itself in a fresh headless Edge profile)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for n in "$@"; do PROBE="$(cat pq/$n.json)" sh slot2_rcd3.sh laneB/probe2.mjs pq/$n.out; done
