# laneA4/sink4/mkspecs.py (lane A4, 2026-10-26): sinkmeter specs per monster -- every SINK4 clip a play reaches (any-play rows, and
# CLIP_ACTIONS-reached shared rows through every copy '*'), looped, OFF then ON. usage: mkspecs.py [ids,] -> specs/<id>.json
import json, os, re, subprocess, sys
H = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(H, 'specs'), exist_ok=True)
txt = subprocess.run(['node', os.path.join(H, 'shared_ca.mjs')], capture_output=True, text=True).stdout
want = sys.argv[1].split(',') if len(sys.argv) > 1 else None
for line in txt.splitlines():
    if ' | ' not in line: continue
    em, rest = line.split(' | ', 1)
    if want and em not in want: continue
    clips = [m.group(1) for m in re.finditer(r'(\d+\|Motion\[\d+\]) \((?:any play|CLIP_ACTIONS[^)]*)\)', rest)]
    steps = [{'clip': c + '*', 'frames': 240, 'loop': True} for c in clips]
    specs = [{'id': em, 'off': True, 'steps': steps}, {'id': em, 'off': False, 'steps': steps}]
    json.dump(specs, open(os.path.join(H, 'specs', em + '.json'), 'w'))
    print(em, len(clips))
