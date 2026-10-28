#!/bin/sh
# hypereye/eyecensus.sh [--pass11]: eyedraws.mjs over every hyper monster's head aura on its own _500 file (laneB3/hyperjoints.out),
# 30 frames, the model draws other than the shared smoke / spark models (cm100_000 / cm150_000) -- the per-monster rows.
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/hypereye
cd /c/MHGU-Extract/MHGU-Monster-Viewer
grep "_500.efl" dev/archive/laneB3/hyperjoints.out | grep "part/joint/group (" | while read mon u key rest; do
  echo "== $mon u $key"
  node $H/eyedraws.mjs $mon ${mon}u $key 30 "$@" 2>&1 | grep -v "cm100_000\|cm150_000\|^  prim\|^em0" 
done
