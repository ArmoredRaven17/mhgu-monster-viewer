# emcacts.py (2026-10-19): every action op `00 st n` in a monster's command table (any group, any stream; op 0x92's variant arms NOT
# evaluated, so a superset of what the variant issues) -> emcacts.json {mon: ['st:0xnn', ..]}, for fbbcmp.mjs's filter
import sys, json, os
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
D = os.path.dirname(os.path.abspath(__file__))
mons = [l.split()[0] for l in open(os.path.join(D, '..', 'neset', 'fbb_list.txt')) if l.startswith('em')]
out = {}
for mon in mons:
    import glob
    g = glob.glob(r'C:\MHGU-Extract\scratch-em\%s\enemy\cmd_tbl\*_cmdtbl.emc' % mon)   # (a variant's arc carries its line's table: em001_02 -> em001_00_cmdtbl)
    if not g: out[mon] = None; continue
    p = g[0]
    ver, groups = emc.load(p); acts = set()
    for st in groups:
        for s in st:
            for o in emc.parse(s):
                b = o.split()
                if b[0] == '00' and len(b) >= 3: acts.add('%d:0x%02x' % (int(b[1], 16), int(b[2], 16)))
    out[mon] = sorted(acts)
json.dump(out, open(os.path.join(D, 'emcacts.json'), 'w'), indent=0)
print({k: (len(v) if v is not None else None) for k, v in out.items()})
