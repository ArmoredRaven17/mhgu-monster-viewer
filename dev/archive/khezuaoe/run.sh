#!/bin/sh
# khezuaoe/run.sh <check.mjs> <out>: one page check (a fresh headless Edge page) on this lane's own server (port 5797: python
# dev/serve.py 5797, its PID in khezuaoe/server.pid), retried up to 3 times when the page never mounts.
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/khezuaoe
cd $H
for t in 1 2 3; do
  timeout 9000 node rcd.mjs "$1" --url http://localhost:5797 > "$2" 2>&1
  grep -q "^FAILED: the viewer never came up" "$2" || break
  echo "mount retry $t" >> "$2.retries"
done
