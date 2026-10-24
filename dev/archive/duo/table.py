# table.py: the per-clip table of dev/em069-duo-spec.md -- every clip on her three lists, the actions that play it
# (q_motion_ctx.json from ctx.py: class code; the status-10/11 scripts walked here), its class (render/monster.js
# ROM_PARTNER_BODY.em069_00.classes, else `both` when an action plays it, else `unresolved`), and his pair.
import json, re, struct, sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
import tracer as t
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
mons = json.load(open(V + r'\docs\monsters.json'))['monsters']
Q = [m for m in mons if m['id'] == 'em069_00'][0]
ctx = json.load(open('q_motion_ctx.json'))
js = open(V + r'\docs\render\monster.js', encoding='utf-8').read()
blk = js[js.index('classes: {'):js.index('pairs: {')]
classes = dict(re.findall(r"'(\d\|Motion\[\d+\])': '(\w+)'", blk))
pblk = js[js.index('pairs: {', js.index('ROM_PARTNER_BODY = {')):js.index('// the two-layer attacks')]
pairs = {}
for k, body in re.findall(r"'(\d\|Motion\[\d+\](?:_start|_loop)?)':\s*\{(.*?)\}\s*\]\s*\}", pblk, re.S):
    segs = re.findall(r"clip: '([^']+)', mode: '(\w+)'(?:, start: (\d+))?(?:, blend: (\d+))?", body)
    hold = 'holdAfter' in body
    pairs[k] = ' then '.join('%s %s%s%s' % (c, 'hold (187 mod 61 = 4)' if hold else m, (' from %s' % s) if s and s != '0' else '', (' b%s' % b) if b else '') for c, m, s, b in segs)
for a, b in [[82, 83], [84, 83], [85, 86], [87, 86], [92, 93], [94, 95]]:
    pairs['4|Motion[%d]' % a] = pairs['4|Motion[%d]' % b] + ' (layer-2 motion of M%d)' % b
# status 10 / 11: the scripts their handlers pick (tracer, part 0 / direction 0) and the motions in them
def smot(a):
    out = []
    for k in range(40):
        e = armdis.rd(a + 8 * k, 8); op = e[0]; arg = struct.unpack_from('<I', e, 4)[0]
        if op in (0xfd, 0xfe, 0xff): break
        if op in (0, 2, 0x35):
            m = struct.unpack_from('<H', armdis.rd(arg, 2))[0]; out.append('L%d M%d' % ((m >> 8) & 0xf, m & 0xff))
    return out
react = {}
for st in (10, 11):
    for n in range(256):
        for part in (0, 2, 4, 6):
            r = t.run('uEm069_00', st, n, phase=0, link=1, part=part, extra=[(t.E + 0x7420, b'\1')])
            for a, mode, lr in r.get('scripts', []):
                for m in smot(a): react.setdefault(m, set()).add('(%d,%#x)' % (st, n))
RECS = {}
for m in (10, 11, 36): RECS['L0 M%d' % m] = '(2,0x18) turn record 0x16a0cd4 (0x7a258 / 0x7a27c)'
for m in (12, 13): RECS['L0 M%d' % m] = '(2,0x0) / (2,0x15) turn record 0x16a0ee4 via table 0x17e1330 (0x7a284 / 0x7a2a8)'
for m in (18, 19, 23): RECS['L4 M%d' % m] = '(4,0x1) / (4,0x2) turn record 0x16a0d94'
for m in (74, 75): RECS['L4 M%d' % m] = '(7,0x3e) turn record 0x16a0dd4 -- (7,0x3e) has NO ENTRY at variant 0 (no EMC op, no code follow)'
for a, b in [[82, 83], [84, 83], [85, 86], [87, 86], [92, 93], [94, 95]]:
    RECS['L4 M%d' % a] = 'second motion layer of L4 M%d (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850)' % b
rows = []
for l in Q['lists']:
    lid = l['id']
    for c in l['clips']:
        bare = re.sub(r'_(start|loop)$', '', c['clip'])
        key = 'L%s M%s' % (lid, re.search(r'\[(\d+)\]', bare).group(1))
        acts = []
        if key in ctx:
            for a, v in sorted(ctx[key]['actions'].items()):
                how = v['how'][0] if v['how'] else ''
                acts.append('(%s) %s' % (a, re.sub(r'^p\d+ ', '', how).replace('  ', ' ').strip()))
        if key in RECS: acts.append(RECS[key])
        if key in react: acts.append('scripts ' + ' '.join(sorted(react[key])[:8]) + (' +%d' % (len(react[key]) - 8) if len(react[key]) > 8 else ''))
        cls = classes.get('%s|%s' % (lid, bare)) or ('both' if acts and 'NO ENTRY' not in ' '.join(acts) else 'unresolved')
        pair = pairs.get('%s|%s' % (lid, c['clip'])) or ('-' if cls in ('solo', 'release', 'unresolved') else 'ride: Motion[35]_loop wrap (his 1:0)')
        rows.append((lid, c['clip'], round(c['dur'] * 60), cls, pair, '; '.join(acts)[:230] or 'no action found'))
print('| list | clip | frames | class | his clip + time rule | her actions (setter site / scripts) |')
print('|---|---|---|---|---|---|')
for r in rows: print('| %s | %s | %d | **%s** | %s | %s |' % r)
import collections
print(collections.Counter(r[3] for r in rows), file=sys.stderr)
