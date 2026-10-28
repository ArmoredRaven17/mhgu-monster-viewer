# hypereye/mat108.py: print an effect model's materials as the viewer's effects json carries them (default cm200_108 on em002_00).
#   python dev/archive/hypereye/mat108.py [monster] [model]
import json, sys, os
V = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'docs')
mon = sys.argv[1] if len(sys.argv) > 1 else 'em002_00'
model = sys.argv[2] if len(sys.argv) > 2 else 'cm200_108'
d = json.load(open(os.path.join(V, 'effects', mon + '.json'), encoding='utf8'))
for k, v in d['resources'].items():
    if k.endswith(model):
        print(k, {a: b for a, b in v.items() if a != 'materials'})
        for i, m in enumerate(v.get('materials') or []):
            print(' material', i, json.dumps(m)[:2500])
