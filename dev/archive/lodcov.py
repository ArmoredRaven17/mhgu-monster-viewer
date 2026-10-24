"""Per set: 0xa718b8's returned masks (with the LOD level from [gen+0xe8] bits 8..11) and whether 0xa9272c's vectors cover the
masked walk blocks 0xa92798 / 0xa928f4 / 0xa92900 / 0xa92918."""
import json, sys, os
EFX = r'C:\MHGU-Extract\efx'
WALK = [0xa92798, 0xa927a0, 0xa927b4, 0xa927c0, 0xa928f4, 0xa92900, 0xa9290c, 0xa92918, 0xa92924]
for name in sys.argv[1:]:
    d = json.load(open(os.path.join(EFX, 'vectors', name, 'draw.json')))
    f = d['functions']
    lod = f.get('0xa718b8', {'calls': 0, 'vectors': []})
    rets = sorted(set(v['ret']['r0'] for v in lod['vectors']))
    lv = set()
    for v in lod['vectors']:
        for a, h in v['reads']:
            if len(h) == 8 and a == v['args'][0] + 0xe8:
                lv.add((int.from_bytes(bytes.fromhex(h), 'little') >> 8) & 0xf)
    m = f.get('0xa9272c', {'calls': 0, 'vectors': []})
    blocks = set(b for v in m['vectors'] for b in v['blocks'])
    print(name, 'a718b8 calls', lod['calls'], 'masks', rets, 'levels', sorted(lv), '| a9272c calls', m['calls'], 'vectors', len(m['vectors']),
          '| walk blocks', ' '.join('%x' % b for b in WALK if b in blocks))
