#!/bin/sh
# hypereye/run.sh <check.mjs> <out>: one page check on this lane's own server (port 5781: python dev/serve.py 5781, its PID in
# hypereye/server.pid), its own headless Edge profile (rcd.mjs, copied from laneB3/rcd3b.mjs), retried up to 3 times when the page
# never mounts.
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/hypereye
cd $H
for t in 1 2 3; do
  timeout 9000 node rcd.mjs "$1" --url http://localhost:5781 > "$2" 2>&1
  grep -q "^FAILED: the viewer never came up" "$2" || break
  echo "mount retry $t" >> "$2.retries"
done
