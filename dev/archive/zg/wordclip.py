"""BACKWARD diff, tracer -> CLIP_ACTIONS: for every clip the tracer (sweep/r3_<mon>.jsonl) finds played by two or more actions,
the ROM enable word (vt+0x13c, jscheckpd.py's emulation) for each of those actions, calm and enraged, posture 0 and 4 (depth 0 and
-1000 with MoguriBaseOfs -1000), rank 5. A clip whose actions give words that NONE of its CLIP_ACTIONS entries (or, with no entry,
the no-action play) gives is printed: a play the viewer cannot show.
   EM=NN VAR=v python wordclip.py <vtable hex> <mon>"""
import os, sys, json, re
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jscheckpd.py'), encoding='utf8').read()
vt, mon = sys.argv[1], sys.argv[2]
sys.argv = ['jscheckpd.py', vt, mon, '0', '0']
os.environ.setdefault('MOGURI', '-1000')
exec(src[:src.index('ACT = [')])
HERE = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg'
rows = [json.loads(l) for l in open(os.path.join(HERE, 'sweep', 'r3_%s.jsonl' % mon)) if l.strip()]
by = {}
for j in rows:
    for m in set(j['mot']) | set(j['scr']):
        by.setdefault(m, []).append(tuple(j['a']))
ca = json.loads(os.popen('node --input-type=module -e "import { CLIP_ACTIONS } from \'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js\'; '
                         'console.log(JSON.stringify(CLIP_ACTIONS[\'%s\'] || {}))"' % mon).read() or '{}')
if os.environ.get('NOCA'): ca = {}          # the positive control: as if no CLIP_ACTIONS existed
# the bits each clip binds (monster.js CLIP_EFFECTS, the monster's largest block, as wordsweep.py): an unbound bit shows nothing
MONJS = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js', encoding='utf8').read()
BOUND, _best = {}, 0
for mm in re.finditer(r'\n  ' + mon + r': \{', MONJS):
    blk = MONJS[mm.start():MONJS.find('\n  },', mm.start())]
    got = {}
    for cl in re.finditer(r"'L(\d+) Motion\[(\d+)\]': \{ frames: \d+, bits: \[(.*?)\] \}", blk):
        got['L%s M%s' % (cl.group(1), cl.group(2))] = sum(1 << int(b) for b in re.findall(r'bit: (\d+)', cl.group(3)))
    if len(got) > _best: BOUND, _best = got, len(got)
STATES = [(po, d, r) for po in (0, 4) for d in ((0.0,) if po == 0 else (0.0, -1000.0)) for r in (0, 1)]
out = 0
for clip, acts in sorted(by.items()):
    if len(acts) < 2: continue
    L, M = [int(x) for x in re.findall(r'\d+', clip)]
    m = (L << 8) | M
    key = '%d|Motion[%d]' % (L, M)
    ent = ca.get(key)
    ents = ent if isinstance(ent, list) else [ent] if ent else []
    listed = [tuple(e['action']) if e.get('action') else None for e in ents] or [None]
    # the plays the viewer can show: every entry's action and its `rage` / `tired` form (which form the AI issues in which state
    # is the command table's -- op 0x1c pairs -- not the clip's), each in the same state
    va = set()
    for e in ents:
        for f in ('action', 'rage', 'tired'):
            if e.get(f): va.add(tuple(e[f]))
    if not ents or any(not e.get('action') for e in ents): va.add(None)
    mask = BOUND.get(clip, 0)
    if not mask: continue
    can = {s: {rom(m, x, s[0], s[1], s[2], 0, 5) & mask for x in va} for s in STATES}
    miss = {}
    for a in acts:
        for st in STATES:
            w = rom(m, a, st[0], st[1], st[2], 0, 5) & mask
            if w not in can[st]: miss.setdefault((st, w), []).append(a)
    if miss:
        out += 1
        print('%s %s listed %s; bound bits %#x; words not covered:' % (mon, key, listed, mask))
        for (st, w), aa in sorted(miss.items()):
            print('    posture %d depth %g rage %d: %#x  <- %s' % (st[0], st[1], st[2], w, ' '.join('(%d, %#x)' % x for x in aa)))
print('== %s: %d clips with an uncovered word (states: %s)' % (mon, out, STATES))
