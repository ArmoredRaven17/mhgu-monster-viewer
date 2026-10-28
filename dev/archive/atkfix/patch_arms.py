"""patch_arms.py <regen.json> <id,id,...> [--dry]: replace ONLY the named monsters' "arms" values in docs/attack-hitshapes.json, in place.
The file is compact JSON (attexport.py: separators (',', ':')); each monster's old arms text is located by its exact serialisation,
must occur exactly once inside that monster's block, and is swapped for the regenerated arms. Everything else in the file is left
byte for byte; the result is re-parsed and every untouched monster compared."""
import json, sys, os, hashlib
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\attack-hitshapes.json'
regen = json.load(open(sys.argv[1]))
ids = sys.argv[2].split(',')
dry = '--dry' in sys.argv
raw = open(P, 'rb').read()
h0 = hashlib.sha1(raw).hexdigest()
txt = raw.decode('utf8')
cur = json.loads(txt)
dump = lambda v: json.dumps(v, separators=(',', ':'))
assert dump(cur) == txt, 'the file is not the compact serialisation attexport writes: refusing a text patch'
new = txt
for i in ids:
    key = '"%s":' % i
    blk_old = key + dump(cur[i])
    assert new.count(blk_old) == 1, (i, 'block not found exactly once')
    arms_old = '"arms":' + dump(cur[i]['arms'])
    assert blk_old.count(arms_old) == 1, (i, 'arms not found exactly once in its block')
    for f in cur[i]:
        if f != 'arms': assert cur[i][f] == regen[i][f], (i, f, 'regenerated block differs outside arms')
    blk_new = blk_old.replace(arms_old, '"arms":' + dump(regen[i]['arms']))
    new = new.replace(blk_old, blk_new)
    print(i, 'arms clips', len(cur[i]['arms']), '->', len(regen[i]['arms']), 'bytes', len(arms_old), '->', len(blk_new) - len(blk_old) + len(arms_old))
chk = json.loads(new)
assert list(chk) == list(cur)
for k in cur:
    if k in ids: assert chk[k]['arms'] == regen[k]['arms'] and all(chk[k][f] == cur[k][f] for f in cur[k] if f != 'arms')
    else: assert chk[k] == cur[k], k
print('untouched monsters identical:', len(cur) - len(ids))
if dry: print('dry run, not written'); sys.exit(0)
assert hashlib.sha1(open(P, 'rb').read()).hexdigest() == h0, 'file changed while patching: refusing'
open(P, 'wb').write(new.encode('utf8'))
print('written', P, len(raw), '->', len(new.encode('utf8')), 'bytes')
