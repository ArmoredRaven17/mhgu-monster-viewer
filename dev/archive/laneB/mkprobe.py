# laneB/mkprobe.py <mon>...: pq/ba<mon>.json -- a census-lite probe over the monster's open (non-held) records: every clip that binds
# one (CLIP_EFFECTS) or whose MOTION_STATES row names it, each piece and copy ('*') at its FULL length (census3 capped plays at 900
# frames), x3 (cycles), under: plain, Rage on, Exhausted on, every Parts row at its last option
import json, re, sys, os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
SP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cen = json.load(open(os.path.join(SP, 'cen', 'census.json')))
mj = open(os.path.join(V, 'docs/render/monster.js'), encoding='utf8').read(); ce = mj[mj.find('export const CLIP_EFFECTS'):]
ms = open(os.path.join(V, 'docs/render/motion-states.js'), encoding='utf8').read().split('\n')
mons = json.load(open(os.path.join(V, 'docs/monsters.json'))); mons = mons['monsters'] if isinstance(mons, dict) else mons
for mon in sys.argv[1:]:
    ent = [x for x in mons if x['id'] == mon][0]
    dur = {}
    for l in ent['lists']:
        for c in l['clips']:
            b = re.sub(r'_(start|loop)$', '', c['clip']); dur[(l['id'], b)] = dur.get((l['id'], b), 0) + round(c['dur'] * 60)
    d = json.load(open(os.path.join(V, 'docs/effects', mon + '.json')))
    efl = {(e['record']['pel'], e['record']['key'], e['when']): e['efl'] for e in d['effects'] if e.get('record')}
    i = ce.find('\n  %s: {' % mon); blk = ce[i:ce.find('\n  },', i)] if i >= 0 else ''
    want, clips = [], []
    for k, why in cen[mon]['open']:
        if 'hyper burst' in why or 'ROM REASON' in why or k.endswith('|1500|event'): continue
        _, pel, key, when = k.split('|'); key = int(key); want.append(k)
        for l in blk.split('\n'):
            mm = re.match(r"\s*'L(\d+) (Motion\[\d+\])': \{", l)
            for m in re.finditer(r"\{ bit: (\d+), efl: '([^']+)', key: (\d+),", l):
                if mm and int(m.group(3)) == key and efl.get((pel, key, when), '').endswith(m.group(2)): clips.append((mm.group(1), mm.group(2)))
        for l in ms:
            if ("'%s', %d]" % (pel, key)) in l or ("'%s', %d," % (pel, key)) in l:
                mm = re.search(r"'(\d+)\|(Motion\[\d+\])(#\w+)?'", l)
                if mm: clips.append((mm.group(1), mm.group(2)))
    clips = list(dict.fromkeys(clips))
    play = []
    for l, c in clips:
        f = dur.get((l, c), 300) + 10
        for r in range(3): play.append({'clip': '%s|%s*' % (l, c), 'frames': f})
    steps = list(play)
    steps += [{'set': {'monRage': True}}] + play + [{'set': {'monRage': False}}]
    steps += [{'set': {'monTired': True}}] + play + [{'set': {'monTired': False}}]
    steps += [{'partsAll': 'last'}] + play + [{'partsAll': 'first'}]
    json.dump({'id': mon, 'steps': steps, 'want': want}, open(os.path.join(SP, 'pq', 'ba%s.json' % mon), 'w'))
    print(mon, len(want), 'records', len(clips), 'clips', sum(s.get('frames', 0) for s in steps), 'frames')
