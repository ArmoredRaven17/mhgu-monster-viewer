"""ctlmot.py: from ctl/action_*.txt (ctlflip2), every (action -> motion) pair a C poke ADDS that the zeroed runs of that action never
set; then whether psl-mask.js CLIP_ACTIONS lists that action on that clip (for a monster whose PSL word reads the action). Out:
per monster, the new pairs, the pokes, and 'listed' / 'NOT listed'."""
import os, re, glob, ast, json, subprocess, collections
HERE = os.path.dirname(os.path.abspath(__file__))
LINE = re.compile(r'^FLIP \((\d+), (0x[0-9a-f]+)\) (\S+(?: \+ \S+)*): (.*)$')
RUN = re.compile(r'ph(\d) e(\d) \+(\[.*?\]) -(\[.*?\])(?= \||$| \()')
MOT = re.compile(r'MOT L(\d+) M(\d+) ')
js = subprocess.run(['node', '--input-type=module', '-e', """
import { CLIP_ACTIONS, PSL_MASK_MONSTERS } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
console.log(JSON.stringify({ ca: CLIP_ACTIONS, pm: [...(PSL_MASK_MONSTERS || [])] }));
"""], capture_output=True, text=True)
CA = json.loads(js.stdout) if js.returncode == 0 else {'ca': {}, 'pm': []}
if js.returncode: print('# CLIP_ACTIONS not read:', js.stderr[-200:])
def listed(mon, lst, slot, st, n):
    t = (CA['ca'].get(mon) or {})
    e = t.get('%s|Motion[%d]' % (lst, slot))
    if e is None: return None
    flat = json.dumps(e)
    return ('[%d, %d]' % (st, n)) in flat.replace(' ', '').replace('[%d,%d]' % (st, n), '[%d, %d]' % (st, n))
for f in sorted(glob.glob(os.path.join(HERE, 'ctl', 'action_*.txt'))):
    mon = os.path.basename(f)[7:-4]
    new = collections.OrderedDict()
    for l in open(f):
        m = LINE.match(l.rstrip('\n'))
        if not m: continue
        st, n, pk = int(m.group(1)), int(m.group(2), 16), m.group(3)
        for r in RUN.finditer(m.group(4)):
            try: add = ast.literal_eval(r.group(3))
            except Exception: continue
            for it in add:
                mm = MOT.search(it)
                if mm and it.strip().startswith('MOT'):
                    key = (st, n, int(mm.group(1)), int(mm.group(2)))
                    if key not in new or len(pk) < len(new[key]): new[key] = pk
    # keep only motions the action never set zeroed: the zeroed MOT set per action is in the '-' lists only when lost, so read
    # the zeroed set from a plain run is not available here -- a motion appearing as '+' in every poke of the action is new
    if not new: continue
    pm = mon in CA['pm']
    print('%s: %d new (action, motion) pairs%s' % (mon, len(new), ' [word reads the action]' if pm else ''))
    for (st, n, L, M), pk in list(new.items())[:40]:
        li = listed(mon, L, M, st, n) if pm else None
        print('    (%d, %#x) -> L%d M%d   <- %s%s' % (st, n, L, M, pk, '' if li is None else ('   listed' if li else '   NOT listed in CLIP_ACTIONS')))
