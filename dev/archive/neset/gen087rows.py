# gen087rows.py: Ahtal-Neset's shell event rows (types 9 / 10 / 11, kind 1) by action: selector n (EMC a3 (0, n), emcpair087.txt) ->
# the actions it precedes; the selector's list rows (seq087.txt) on their motion. Prints JSON {"st:n": {"L<l> M<m>": [[f0, type, a0, a1, a2], ..]}}
import re, json, collections
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
sel = {}
for l in open(D + r'\neset\emcpair087.txt', encoding='utf8'):
    m = re.match(r'selector +(\d+) \(0x[0-9a-f]+\): actions (.*?)   \[', l)
    if m: sel[int(m.group(1))] = [(int(a, 16), int(b, 16)) for a, b in re.findall(r'\((0x[0-9a-f]+), (0x[0-9a-f]+)\)', m.group(2))]
reach = set(map(tuple, json.load(open(D + r'\fb\reach_em087_00.json'))['rt00']))
rows = collections.defaultdict(lambda: collections.defaultdict(list)); kinds = collections.Counter(); unreached = collections.Counter()
for l in open(D + r'\neset\seq087.txt', encoding='utf8'):
    m = re.match(r'idx +(\d+) list (\d) @0x[0-9a-f]+ type +(\d+) motion 0x([0-9a-f]+) \((L\d+ M\d+)\) kind +(\d+)  f (.*)$', l)
    if not m: continue
    idx, typ, mot, kind = int(m.group(1)), int(m.group(3)), m.group(5), int(m.group(6))
    fl = [float(x) for x in m.group(7).split()]
    if typ not in (9, 10, 11, 14): continue
    kinds[(typ, kind)] += 1
    for act in sel.get(idx, []):
        if act not in reach: unreached[(idx, act)] += 1; continue
        rows['%d:0x%02x' % act][mot].append([fl[0], typ, kind, fl[4], fl[5], fl[6], idx])
print(json.dumps({'rows': rows, 'kinds': {str(k): v for k, v in kinds.items()}, 'unreached': {str(k): v for k, v in unreached.items()},
                  'noselector': sorted(set(int(re.match(r'idx +(\d+)', l).group(1)) for l in open(D + r'\neset\seq087.txt') if re.match(r'idx +\d+ list', l)) - set(sel))}))
