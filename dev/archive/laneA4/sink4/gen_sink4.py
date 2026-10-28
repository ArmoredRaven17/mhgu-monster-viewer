# laneA4/sink4/gen_sink4.py (effects lane A4, 2026-10-26): the posture-4 sink table for the viewer (motion-states.js SINK4) from the
# posture-4 audit (laneA4/p4audit/p4group.txt: every action of every class, every phase, under unicorn) and the .dtb MoguriBaseOfs
# (p4audit/moguri_dtb.txt). A clip is a row when an action plays it with the segment's final posture 4 and a P+0x5c the class SETs
# from MoguriBaseOfs (`MOG`) or a literal; held values (no write), tune / computed values (the tracer's stubs: 20 / 40 / inf / 33.3 /
# s16) and ramps (ADD) are left out and listed (`skipped`). A later phase that rewrites P+0x5c with no new motion marks the clip as
# changing mid-play (left out). Output: sink4.json {em: {clip: {acts: [...], v: value}}} + skipped, and sink4.js (the JS literal).
import re, json, os, collections
H = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(H, '..', 'p4audit')
MOG = {}
for l in open(os.path.join(A, 'moguri_dtb.txt')):
    m = re.match(r'^(em\d{3}_\d{2})\s.*Moguri\(\+0x32\)=(-?[\d.]+)', l)
    if m: MOG[m.group(1)] = float(m.group(2))
LITERAL_OK = {-100.0, -1000.0, -500.0, -600.0, -30.0, -303.0}     # literals at the SET sites (p4group.txt / the audit's rows)
# -353.0 (Lavasioth 0xe3fc68, only while e+0x1068 bit 6 is clear; else e+0xcae0 = tune[4]) is NOT taken: the bit is not read
def clipkey(t):
    m = re.match(r'L(\d+)M(\d+)', t); return '%d|Motion[%d]' % (int(m.group(1)), int(m.group(2)))
rows = collections.defaultdict(dict); skipped = []
ems = []
for line in open(os.path.join(A, 'p4group.txt')):
    if line.startswith('=='):
        ems = ['em%s_%02d' % (x.split('_')[0][2:], int(x.split('_')[1])) for x in re.findall(r'em\d{3}_\d', line)]
        continue
    if '::' not in line: continue
    acts_s, rest = line.split('::', 1)
    acts = re.findall(r'\((\d+),(0x[0-9a-f]+)\)', acts_s); acts = ['%d,%d' % (int(a), int(b, 16)) for a, b in acts]
    segs = re.findall(r'ph(\d+)(\(in 4\))?\[([^\]]*)\]', rest)
    for em in ems:
        mog = MOG.get(em, 0.0)
        posture, p5c = None, 'held'; last = None; changed = set()
        for ph, in4, body in segs:
            for alt in body.split('||'):
                posture = 4 if in4 else posture
                played = []; vals = []
                for ev in [x.strip() for x in alt.split('|')]:
                    if ev.startswith('POST '): posture = int(ev.split()[1].split('@')[0])
                    elif ev.startswith('SET '):
                        s = ev.split()[1].split('@')[0]
                        p5c = mog if s == 'MOG' else (float(s) if re.match(r'^-?[\d.]+$', s) and float(s) in LITERAL_OK | {0.0} else 'other:' + s)
                        vals.append(p5c)
                    elif ev.startswith('ADD '): p5c = 'ramp:' + ev.split()[1].split('@')[0]; vals.append(p5c)
                    elif ev.startswith('M '): played.append(clipkey(ev.split()[1]))
                    elif ev.startswith('TURN '): played += [clipkey(t) for t in re.findall(r'L\d+M\d+', ev)]
                    elif ev.startswith('BCA'): p5c = 0.0; posture = 1
                    elif ev.startswith('P1'): posture = 1
                ends = any(x in alt for x in ('IDLE', 'VT3E8', 'CHG'))
                if played: last = (played, posture, p5c)
                elif vals and last and not ends and any(v != last[2] for v in vals): changed.update(last[0])
                # (a rewrite in a phase that also ends the action -- IDLE / VT3E8 / CHG -- is the clip's end, not mid-play; the same
                # value rewritten is no change)
                for c in played:
                    if posture != 4: continue
                    if isinstance(p5c, float):
                        if p5c == 0.0: continue
                        r = rows[em].setdefault(c, {'acts': [], 'v': p5c})
                        if r['v'] != p5c: r['conflict'] = sorted(set(r.get('conflict', [r['v']]) + [p5c]))
                        r['acts'] += [a for a in acts if a not in r['acts']]
                    else: skipped.append((em, c, acts, str(p5c)))
        for c in changed:
            if c in rows[em]: rows[em][c]['changes'] = True
out = {em: {c: r for c, r in sorted(v.items())} for em, v in sorted(rows.items()) if v}
json.dump({'rows': out, 'skipped': skipped, 'mog': MOG}, open(os.path.join(H, 'sink4.json'), 'w'), indent=1)
for em, v in out.items():
    print(em, 'MOG', MOG.get(em), len(v), 'clips:', ', '.join('%s %g%s%s' % (c, r['v'], ' CONFLICT' if 'conflict' in r else '', ' CHANGES' if r.get('changes') else '') for c, r in v.items()))
print('skipped:', len(skipped))
for s in sorted(set((a, b, d) for a, b, c, d in skipped)): print('  ', s)
