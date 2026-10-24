#!/bin/sh
# recheck.sh CLS EM VARS STATUSES "targets" -> census with RAGE / TIRED 0/1
cls=$1; em=$2; vars=$3; sts=$4; tg=$5
for R in 0 1; do for Ti in 0 1; do RAGE=$R TIRED=$Ti CLS=$cls EM=$em python census_c.py $vars $sts rc_${cls}_$R$Ti.json > /dev/null; done; done
python - "$cls" "$tg" <<'PY'
import json, sys, collections
cls, tg = sys.argv[1], [tuple(int(x, 0) for x in t.split(':')) for t in sys.argv[2].split()]
for R in (0, 1):
  for Ti in (0, 1):
    d = json.load(open('rc_%s_%d%d.json' % (cls, R, Ti)))
    c = collections.defaultdict(set)
    for k, ev in d.items():
        for x in ev:
            if not x.startswith('CHG'): continue
            for s, n in tg:
                if '(%d, %#x)' % (s, n) in x: c[(s, n)].add('(%s,%#x)p%s' % (k.split(',')[1], int(k.split(',')[2]), k.split(',')[3]))
    print(cls, 'RAGE', R, 'TIRED', Ti, {'(%d,%#x)' % k: sorted(v)[:6] for k, v in c.items()})
PY
