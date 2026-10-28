# glblens.py <mon>: every pose glb animation's length in frames (60 / s), as a motion id map 'id:frames' (id = list << 8 | slot; a split
# clip's _start + _loop summed), for emu_rate's len= argument
import json, struct, sys, glob, os, re
mon = sys.argv[1]
out = {}
for fn in sorted(glob.glob(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\poses\monsters\%s_*.glb' % mon)):
    m = re.search(r'_(\d+)\.glb$', fn)
    if not m: continue
    L = int(m.group(1))
    b = open(fn, 'rb').read(); l = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + l])
    acc = j['accessors']
    for a in j.get('animations', []):
        name = a.get('name', '')
        mm = re.match(r'^Motion\[(\d+)\](?:_(start|loop))?$', name)
        if not mm: continue
        dur = max(acc[s['input']].get('max', [0])[0] for s in a['samplers'])
        k = (L << 8) | int(mm.group(1))
        out[k] = out.get(k, 0) + round(dur * 60)
print(','.join('%x:%d' % (k, v) for k, v in sorted(out.items())))
