# laneB/where.py <mon>...: each open (non-held) record of the census -> its CLIP_EFFECTS bindings (clip, frames, bit, on) and the
# motion-states.js / shells.js / index.html lines naming (pel, key)
import json, re, sys, os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cen = json.load(open(os.path.join(SP, 'cen', 'census.json')))
mj = open(os.path.join(V, 'docs/render/monster.js'), encoding='utf8').read()
ce = mj[mj.find('export const CLIP_EFFECTS'):]
srcs = {f: open(os.path.join(V, f), encoding='utf8').read().split('\n') for f in ('docs/render/motion-states.js', 'docs/render/psl-mask.js', 'docs/index.html')}
eff = {}
for mon in sys.argv[1:]:
    d = json.load(open(os.path.join(V, 'docs/effects', mon + '.json')))
    efl = {(e['record']['pel'], e['record']['key'], e['when']): e['efl'] for e in d['effects'] if e.get('record')}
    i = ce.find('\n  %s: {' % mon); blk = ce[i:ce.find('\n  },', i)] if i >= 0 else ''
    r = cen[mon]
    for k, why in r['open'] + [(k, v) for k, v, c in r['starts_nodraw']]:
        if 'hyper burst' in why: continue
        _, pel, key, when = k.split('|'); key = int(key)
        print('==', mon, pel, key, when, efl.get((pel, key, when)), '|', why[:90])
        for l in blk.split('\n'):
            mm = re.match(r"\s*'(L\d+ Motion\[\d+\])': \{ frames: (\d+)", l)
            for m in re.finditer(r"\{ bit: (\d+), efl: '([^']+)', key: (\d+), on: (\[\[[^}]*?\]\])", l):
                if int(m.group(3)) == key and efl.get((pel, key, when), '').endswith(m.group(2)):
                    print('    clip', mm.groups() if mm else '?', 'bit', m.group(1), m.group(4)[:70])
        for f, L in srcs.items():
            for n, l in enumerate(L):
                if ("'%s', %d]" % (pel, key)) in l or ("'%s', %d," % (pel, key)) in l:
                    print('    %s:%d %s' % (f.split('/')[-1], n + 1, l.strip()[:150]))
