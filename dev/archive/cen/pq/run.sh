#!/bin/sh
# pq/run.sh: the queued probes, one at a time through the slot-2 lock: pq/<name>.json -> pq/<name>.out
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for n in "$@"; do PROBE="$(cat pq/$n.json)" sh slot2_rcd3.sh cen/probe.mjs pq/$n.out; done
