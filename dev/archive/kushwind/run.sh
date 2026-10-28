#!/bin/sh
# kushwind/run.sh <check.mjs> <out> '<DBG json>': one page check through the shared slot-2 lock, against the server on $PORT
# (python dev/serve.py <port>, started by the caller); rcd3.mjs is the headless-Edge page-check runner (a copy of the scratchpad's)
SP=/c/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad
D=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/kushwind
while ! mkdir "$SP/soak.slot2" 2>/dev/null; do find "$SP" -maxdepth 1 -name soak.slot2 -mmin +45 -exec rm -rf {} + 2>/dev/null; sleep 10; done
echo "kushwind $1 $$" > "$SP/soak.slot2/owner"
for try in 1 2 3; do   # the page can miss a fetch while it mounts its default scene (a transient "Failed to fetch"): retry
  DBG="$3" timeout 3000 node $D/rcd3.mjs "$1" --url "http://localhost:${PORT:-63103}" > "$2" 2>&1
  grep -q "never came up" "$2" || break
done
rm -rf "$SP/soak.slot2"
