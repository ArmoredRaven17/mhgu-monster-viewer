#!/bin/sh
# laneB3/run.sh <check.mjs> <out>: one page check on lane B3's own server (port 5733: python dev/serve.py 5733, started by
# the lane, its PID in laneB3/server.pid), its own headless Edge profile (rcd3b.mjs, copied from lane B2), retried up to 3
# times when the page never mounts.
B3=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneB3
cd $B3
for t in 1 2 3; do
  timeout 9000 node rcd3b.mjs "$1" --url http://localhost:5733 > "$2" 2>&1
  grep -q "^FAILED: the viewer never came up" "$2" || break
  echo "mount retry $t" >> "$2.retries"
done
