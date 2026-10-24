# ROM-run table of Bloodbath's head piece (kind 2, em 7, motion 2 of em007_04_option) in a canonical frame:
# J = (0, 400, -300), owner at the origin (G = (0, -20, 0)), facing +Z so qa = identity. Per step k: horizontal
# fraction of J->G, dy = pos.y - yb (the root curve's height, unscaled), yb, quaternion.
import sys, json, subprocess
sys.argv = ['headdrop.py', '2', '3', '7', '{"owner_pos":[0.0,0.0,0.0],"joint142":[0.0,400.0,-300.0]}']
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\tail-scratch')
import tail_emu as TE
TE.LMT = r'C:\MHGU-Extract\scratch-em\em007_04\enemy\em_option\mot\em007_04_option.lmt'
exec(open('headdrop.py').read().split('t, out = TE.run')[0].split("TE.LMT = ")[1].split('\n',1)[1])
t, out = TE.run(cfg, frames=80)
rows = []
for k, s in out:
    if k < 0: continue
    x, y, z = s['pos']
    rows.append([k, round(s['frame'], 1), s['phase'], round((z + 300.0) / 300.0, 5), round(y - s['y1464'], 3), round(s['y1464'], 3)] + [round(v, 5) for v in s['quat']])
json.dump(rows, open('head_table.json', 'w'))
for r in rows: print(r)
print([l for l in t.log if l[0] != 'owner_vcall'])
