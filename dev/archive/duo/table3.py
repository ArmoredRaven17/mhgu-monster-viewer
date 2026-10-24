# table3.py: the complete per-clip table of her 158 clips + his combined clips, from the walkers' outputs
import json, re, sys, io
exec(open('table.py', encoding='utf-8').read().split("print('| list | clip")[0])
emc = json.load(open('q_emc2.json'))
def ctxof(a):
    t = emc.get(a.strip('()'))
    return t['tag'] if t else ('shared reaction / death' if a.strip('()').split(',')[0] in ('10', '11', '16', '12', '13') else 'code chain only')
WING = {'Motion[6]': 'out 0', 'Motion[7]': 'out (2)', 'Motion[16]': 'out (2)', 'Motion[9]': 'folded (0)', 'Motion[5]_loop': 'out (2)',
        'Motion[14]': '1', 'Motion[3]_loop': 'out (2)', 'Motion[4]': 'out (2) -> 0', 'Motion[71]_start': 'folded (0)', 'Motion[71]_loop': 'folded (0)',
        'Motion[73]': 'folded (0)', 'Motion[45]_loop': 'folded (0)', 'Motion[48]': 'folded (0)', 'Motion[8]': 'folded (0)', 'Motion[27]_loop': 'out (2)',
        'Motion[28]': 'folded (0)', 'Motion[79]_loop': 'folded (0)', 'Motion[35]_loop': 'folded (0)', 'Motion[33]': 'folded (0)'}
out = ['| list | clip | frames | her actions (stream context) | he is | why | his clip, frames | his form (claws / glow / wings in the ROM) |',
       '|---|---|---|---|---|---|---|---|']
WHY = {'combined': 'required: her action asks him (request) or is a linked-only coupling (§11 / §14)',
       'solo': 'not on her (L0 M16: the dead male eaten; L4 M29: he never came)',
       'release': 'request 7 at frame 0: he unlinks and flies off',
       'both': 'issued with and without him, asks nothing: the row decides; his own logic',
       'unresolved': 'no action of hers plays it at variant 0 (§6.1): treated as both'}
for (lid, clip, F, cls, pair, acts) in rows:
    alist = re.findall(r'\((\d+,0x[0-9a-f]+)\)', acts)
    ctx = '; '.join('(%s) %s' % (a, ctxof('(' + a + ')')) for a in dict.fromkeys(alist)) or acts[:80]
    if 'scripts' in acts: ctx += '; status 10/11 scripts: ' + acts.split('scripts ')[-1][:80]
    if 'record' in acts or 'layer' in acts: ctx += '; ' + [x for x in acts.split('; ') if 'record' in x or 'layer' in x][0][:90]
    present = {'combined': 'mounted', 'both': 'mounted if the row is On', 'unresolved': 'mounted if the row is On', 'solo': 'not shown', 'release': 'not shown'}[cls]
    his = pair if pair != 'ride: Motion[35]_loop wrap (his 1:0)' else 'his own logic: ride M35 to 180, then his draw (M31 / M32 / ride)'
    hc = re.match(r"(Motion\[\d+\](?:_start|_loop)?)", his)
    form = '-' if cls in ('solo', 'release') else ('claws 10 (stage 0), glow on, wings ' + (WING.get(hc.group(1), 'folded (0)') if hc else 'folded (0); claws grow in his M31 / M32'))
    out.append('| %s | %s | %d | %s | **%s** | %s | %s | %s |' % (lid, clip, F, ctx[:260], cls + ' -- ' + present, WHY[cls], his, form))
open('table3.md', 'w', encoding='utf-8').write('\n'.join(out))
import collections
print(collections.Counter(r[3] for r in rows))
