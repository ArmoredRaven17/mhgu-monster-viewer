#!/bin/sh
# laneB/probe.sh name...: pq/<name>.json -> pq/<name>.out on lane B's server
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for n in "$@"; do PROBE="$(cat pq/$n.json)" sh laneB/run.sh laneB/probe2.mjs pq/$n.out; done
