#!/bin/sh
# laneB3/probe.sh name...: laneB3/pq/<name>.json -> laneB3/pq/<name>.out through probe3.mjs (the draw meter on chosen
# plays; rows for `want`), on lane B3's server
B3=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/laneB3
cd $B3
for n in "$@"; do PROBE="$(cat pq/$n.json)" sh run.sh probe3.mjs pq/$n.out; done
