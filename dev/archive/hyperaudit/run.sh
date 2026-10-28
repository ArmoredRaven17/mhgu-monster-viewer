#!/bin/sh
# hyperaudit/run.sh <check.mjs> <out>: one page check on the audit's own server (port 5811: python dev/serve.py 5811, its PID in
# hyperaudit/server.pid), its own headless Edge profile (rcd.mjs), retried up to 3 times when the page never mounts.
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/hyperaudit
cd $H
for t in 1 2 3; do
  timeout 9000 node rcd.mjs "$1" --url http://localhost:5811 > "$2" 2>&1
  grep -q "^FAILED: the viewer never came up" "$2" || break
  echo "mount retry $t" >> "$2.retries"
done
