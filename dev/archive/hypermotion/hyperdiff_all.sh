#!/bin/sh
# hypermotion/hyperdiff_all.sh: hyperdiff.py over every hyper monster (G rank) -> hyperdiff/<id>.json
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/hypermotion
mkdir -p $H/hyperdiff
for m in $(python -c "import json; print(' '.join(k for k in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\hyper-motion.json')) if k.startswith('em')))"); do
  python $H/hyperdiff.py $m > $H/hyperdiff/$m.json 2>$H/hyperdiff/$m.err
  echo "$m done"
done
