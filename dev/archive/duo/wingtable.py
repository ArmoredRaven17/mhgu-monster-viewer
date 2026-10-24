# wingtable.py: Seltas' wing state per motion, from s_census.json -- for each action, phases in order, the last ctl+0x49
# written up to the phase (and in it) is the value under that phase's motion. Motion -> {value: [actions]}.
import json, re, collections
d = json.load(open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\s_census.json'))
tab = collections.defaultdict(lambda: collections.defaultdict(set))
noval = collections.defaultdict(set)
for act, runs in d.items():
    byph = collections.defaultdict(lambda: {'w': [], 'm': []})
    for k, ev in runs.items():
        p = int(k.split('/')[0])
        for e in ev:
            for m in re.finditer(r'ctl\+0x49@(0x[0-9a-f]+)=(0x[0-9a-f]+)', e):
                v = int(m.group(2), 16)
                if v not in byph[p]['w']: byph[p]['w'].append(v)
            mm = re.match(r'MOT L(\d+) M(\d+)', e)
            if mm:
                mk = mm.group(1) + '|Motion[' + mm.group(2) + ']'
                if mk not in byph[p]['m']: byph[p]['m'].append(mk)
    last = None
    for p in sorted(byph):
        ws = byph[p]['w']
        cur = ws if ws else ([last] if last is not None else [])
        for mk in byph[p]['m']:
            if cur:
                for v in cur: tab[mk][v].add(act)
            else: noval[mk].add(act)
        if ws: last = ws[-1]
out = {}
for mk in sorted(tab, key=lambda k: (int(k.split('|')[0]), int(re.search(r'\d+\]', k).group(0)[:-1]))):
    out[mk] = {str(v): sorted(a) for v, a in tab[mk].items()}
json.dump({'tab': out, 'noval': {k: sorted(v) for k, v in noval.items()}}, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\s_wingtable.json', 'w'), indent=0)
for k, v in out.items():
    print(k, {a: (b if len(b) < 6 else b[:6] + ['...']) for a, b in v.items()})
print('NO VALUE (inherit):', {k: sorted(v) for k, v in noval.items()})
