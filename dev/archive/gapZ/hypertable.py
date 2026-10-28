# hypertable.py: hyperall.json + hyper-motion.json -> HYPER_SHELLS (per monster / shell: cls = +0x15a8, aura per mode (-1 = any held:
# 0xcad9c), off = modes whose hit side is cleared) and, per .mdd file and ID, which shells / modes its entries reach.
import json, sys
d = json.load(open('hyperall.json')); hm = json.load(open(sys.argv[1]))
T = {}; why = {}
for key, r in d.items():
    mon, sh = key.split('/')
    if 'modes' not in r: why[key] = r.get('why'); continue
    aura = {mi: m['aura'] for mi, m in r['modes'].items()}
    off = sorted((mi for mi, m in r['modes'].items() if not m['hitSide']), key=int)
    vals = set(aura.values())
    ent = {'cls': r['cls15a8']}
    if vals == {-1}: ent['aura'] = -1
    else: ent['aura'] = {mi: a for mi, a in aura.items()}
    if off: ent['off'] = off
    T.setdefault(mon, {})[sh] = ent
# em043_00: no reader in SHELL_DATA, but base04 / base55 have no aura copy in their init band (+0x15bc stays -1) and +0x15ac stays 1
for sh, cls in (('shell04', 4), ('shell55', 55)):
    T.setdefault('em043_00', {})[sh] = {'cls': cls, 'aura': -1, 'note': 'no copy in the base band'}
json.dump(T, open('hypershells2.json', 'w'), separators=(',', ':'))
print(json.dumps(why))
for mon, v in hm.items():
    if mon == '_about': continue
    for side in ('normal', 'g'):
        s = (v.get(side) or {}).get('shells')
        if not s: continue
        for idk, ents in s.items():
            for (cls, atk, sc) in ents:
                hits = []
                for sh, e in T.get(mon, {}).items():
                    if e['cls'] != cls: continue
                    if e['aura'] == -1: ms = 'all modes' + (' but ' + ','.join(e.get('off', [])) if e.get('off') else '')
                    else:
                        ok = [mi for mi, a in e['aura'].items() if (a == -1 or a == int(idk)) and mi not in e.get('off', [])]
                        ms = ('modes ' + ','.join(sorted(ok, key=int))) if ok else 'none'
                    hits.append('%s (%s)' % (sh, ms))
                print('%s %-6s ID %s class %-2d x%.2f atk x%.2f -> %s' % (mon, side, idk, cls, sc, atk, '; '.join(hits) or 'NO SHELL OF THAT CLASS'))
