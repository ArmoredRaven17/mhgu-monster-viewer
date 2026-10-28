#!/bin/sh
# laneA3/probe.sh name...: pq/<name>.json -> pq/<name>.out, laneB2/probe2.mjs (rage / sweep / dumpParts / partSweep steps) through the slot-2 lock
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for n in "$@"; do PROBE="$(cat pq/$n.json)" sh slot2_rcd3.sh laneB2/probe2.mjs pq/$n.out; done
