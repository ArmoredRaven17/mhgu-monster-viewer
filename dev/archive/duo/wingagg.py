# wingagg.py: per action of Seltas (s_census.json), the motions it sets and the ctl+0x49 (flight / wing state) it writes,
# phase by phase, with the pc -- linked (1) and unlinked (0) together
import json, re, collections
d = json.load(open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\s_census.json'))
out = []
for act, runs in sorted(d.items(), key=lambda kv: (int(kv[0].split(',')[0]), int(kv[0].split(',')[1], 16))):
    ph = collections.OrderedDict()
    for k, ev in runs.items():
        p, link, scen = k.split('/')
        for e in ev:
            for m in re.finditer(r'ctl\+0x49@(0x[0-9a-f]+)=(0x[0-9a-f]+)', e):
                ph.setdefault(int(p), set()).add('W49=%d@%s' % (int(m.group(2), 16), m.group(1)))
            if e.startswith('MOT '):
                mm = re.match(r'MOT (L\d+ M\d+) \S+ b(\S+) s(\S+) (\S+) @(0x[0-9a-f]+)', e)
                if mm: ph.setdefault(int(p), set()).add('MOT %s b%s s%s @%s' % mm.groups()[0:3] + (mm.group(5),) if False else 'MOT %s b%s s%s @%s' % (mm.group(1), mm.group(2), mm.group(3), mm.group(5)))
    if any(any(x.startswith('W49') for x in v) for v in ph.values()) or any(ph.values()):
        out.append(act + ': ' + ' | '.join('ph%d: %s' % (p, ', '.join(sorted(v))) for p, v in ph.items() if v))
open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\s_wings.txt', 'w').write('\n'.join(out))
print(len(out))
