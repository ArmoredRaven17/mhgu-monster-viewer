#!/bin/sh
# laneB2/run.sh <check.mjs> <out>: one page check on lane B2's own server (port 5721), its own headless Edge (rcd3b.mjs);
# retried up to 3 times when the page never mounts (mounts took 2-6 minutes under load, lane B)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
cd $SP
for t in 1 2 3; do
  timeout 9000 node laneB2/rcd3b.mjs "$1" --url http://localhost:5721 > "$2" 2>&1
  grep -q "^FAILED: the viewer never came up" "$2" || break
  echo "mount retry $t" >> "$2.retries"
done
