"""Every (status, number) the action main handles, both variants, phases 0..5, frame tests / ends answered 0 and 1, charged 0 / 1:
every change-family call target. Looking for who reaches (1, 5) and (9, n)."""
import sys, trace as TR
res = {}
for v in (0, 4):
    for st in range(0, 0x12):
        for n in range(0, 0x100):
            for ph in range(0, 6):
                for e in (0, 1):
                    for ch in (0, 1):
                        ev = TR.run(v, st, n, ph, e, e, ch, follows=0)
                        for x in ev:
                            if x.startswith('CHG'):
                                t = x.split('(')[1].split(')')[0]
                                res.setdefault(t, set()).add((v, st, n, ph))
for t in sorted(res):
    if t.startswith('1, 0x5') or t.startswith('9,') or t.startswith('8,') or t.startswith('1, 0x15') or t.startswith('1, 0x4'):
        print(t, sorted(res[t])[:20])
import json; json.dump({k: sorted(v) for k, v in res.items()}, open('follows.json', 'w'))
