# hypereye/glowpix.py (hyper-eye lane, 2026-10-27): the eye glow's DRAW-LEVEL measure from eyepage.mjs's output and shots: per eye, in a
# 48x48 box around its projected centroid (eyeScreen), the pixels that read as the core (r >= 200, g 60..235, b <= 110: yellow-orange)
# and as the halo (luma < 40 or magenta: r > g + 25 and b > g + 10), hyper off vs on.
#   python dev/archive/hypereye/glowpix.py out_build_<mon>.txt ...
import sys, os, json, re
from PIL import Image
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'shots', 'hypereye')
def count(img, c, R=24):
    core = halo = 0
    for y in range(max(0, c[1] - R), min(img.height, c[1] + R)):
        for x in range(max(0, c[0] - R), min(img.width, c[0] + R)):
            r, g, b = img.getpixel((x, y))[:3]
            if r >= 200 and 60 <= g <= 235 and b <= 110: core += 1
            elif (0.3 * r + 0.59 * g + 0.11 * b) < 40 or (r > g + 25 and b > g + 10): halo += 1
    return core, halo
for f in sys.argv[1:]:
    t = open(f, encoding='utf8').read()
    m = re.search(r'EYE (\S+)  -- (\{.*\})', t)
    if not m: print(f, 'no result'); continue
    mon, d = m.group(1), json.loads(m.group(2))
    sc = [c for c in (d.get('eyeScreen') or []) if c]
    off = Image.open(os.path.join(SHOTS, mon + '_off.png')).convert('RGB'); on = Image.open(os.path.join(SHOTS, mon + '_on_' + ('node' if d.get('framePass') == 17 else 'none') + '.png')).convert('RGB')
    row = d['rows'][0] if d.get('rows') else {}
    eyes = [d2 for d2 in d['draws'] if d2['model'] != 'cm150_000' and not (d2['model'] == 'cm100_000' and d2['mesh'] in (0, 5))]
    print(mon, 'pass 0x%x' % (d.get('framePass') or 0), 'meter starts', row.get('st'), 'lit', '%s/%s' % (row.get('lit'), row.get('s')), row.get('verdict'),
          '| eye draws', len(eyes), sorted({e['emit'] + '/' + e['depth'] for e in eyes}),
          '| core,halo px per eye off', [count(off, c) for c in sc], 'on', [count(on, c) for c in sc])
