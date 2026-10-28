#!/bin/sh
# hyperaudit/auracensus.sh (hyper audit, 2026-10-28): every aura u 1300+ID of every hyper monster (both .mdd files' IDs,
# datacheck.json) started headless through the viewer's runtime (hypereye/eyedraws.mjs, 40 frames, rest joints): the draw counts
# and every model draw that is not the shared smoke / spark (cm100_000 / cm150_000) -- the eye pairs show as cm200_108 (or Kut-Ku's
# cm100_000 mesh 43, so cm100_000 rows are counted separately). -> auracensus.out
H=/c/MHGU-Extract/MHGU-Monster-Viewer/dev/archive
cd /c/MHGU-Extract/MHGU-Monster-Viewer
python -c "
import json
d=json.load(open('dev/archive/hyperaudit/datacheck.json'))
for m,r in d.items():
  ks=sorted(set(a['key'] for fk in ('normal','g') if r[fk] for a in r[fk]['auras'].values()))
  for k in ks: print(m,k)
" | while read mon key; do
  echo "== $mon u $key"
  node $H/hypereye/eyedraws.mjs $mon ${mon}u $key 40 > /tmp/ac_$$.txt 2>&1; rc=$?
  echo "exit $rc"
  grep "^frame\|Error\|refus" /tmp/ac_$$.txt | head -3
  echo "cm100_000 rows: $(grep -c 'model effect.base.cm100_000' /tmp/ac_$$.txt) cm150_000 rows: $(grep -c 'cm150_000' /tmp/ac_$$.txt)"
  grep "^  model" /tmp/ac_$$.txt | grep -v "cm100_000\|cm150_000" | awk '{print $2, $3, $4, $7, $8}' | sort | uniq -c
  grep "^  model effect.base.cm100_000 mesh 43" /tmp/ac_$$.txt | awk '{print $2, $3, $4, $7, $8}' | sort | uniq -c
done
rm -f /tmp/ac_$$.txt
