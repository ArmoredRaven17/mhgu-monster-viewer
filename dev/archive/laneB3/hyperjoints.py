# laneB3/hyperjoints.py (lane B3, 2026-10-27): for every hyper monster (docs/hyper-auras.json), each aura record u 1300 + ID (and the
# bursts u 1311.. when exported): its .efl, the payload root joint (+0x32) and the joints the effect's node blocks bind to (export
# `joints`, node +0x2c read by 0xae83c8) -- an aura whose nodes name joints besides its root (eyes) shows here.
import json, os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
H = json.load(open(os.path.join(V, 'hyper-auras.json'), encoding='utf8'))
for mon in [k for k in H if k != '_about']:
    p = os.path.join(V, 'effects', mon + '.json')
    if not os.path.exists(p): print(mon, 'no effects json'); continue
    d = json.load(open(p, encoding='utf8'))
    by = {}
    for e in d['effects']:
        r = e.get('record')
        if r and r['pel'].endswith('u') and 1300 <= r['key'] <= 1320:
            b = bytes.fromhex(r['payload']); j = int.from_bytes(b[0x32:0x34], 'little')
            by[r['key']] = (e['efl'].split('/')[-1], j, e.get('joints'), e.get('when'))
    parts = {a['key']: (a['part'], a['joint'], a['group']) for f in ('normal', 'g') if H[mon].get(f) for a in H[mon][f]['auras']}
    for k in sorted(set(by) | set(parts)):
        print(mon, 'u', k, 'part/joint/group', parts.get(k), 'record', by.get(k))
