"""laneA4/sink4/sheet.py (lane A4, 2026-10-26): sinkshot.mjs output (SHOT lines) -> PNG pairs and one sheet.
Usage: python sheet.py <shots.out> <outdir> <sheet.png>
Each row: sink rule OFF (the viewer before the rule) | ON | the frame difference (red where any channel differs by > 8/255),
with the clip, frame, the unit y both ways, the changed-pixel count, and the effect pixels each way (frame less the same frame
with the effect runtime suppressed) so a sink that loses its effects shows."""
import sys, os, json, base64, io
from PIL import Image, ImageDraw
import numpy as np

src, outdir, sheet = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(outdir, exist_ok=True)
rows = []
dec = lambda u: Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGB')
A = lambda im: np.asarray(im).astype(int)
for line in open(src, encoding='utf-8', errors='replace'):
    if not line.startswith(('PASS SHOT', 'FAIL SHOT')) or '  -- ' not in line:
        continue
    label, js = line.split('  -- ', 1)
    d = json.loads(js)
    if 'shots' not in d:
        print('no shots:', label.strip(), d.get('error')); continue
    it, s = d['it'], d['shots']
    safe = ''.join(c if c.isalnum() else '_' for c in it['label'])
    im, bo = {}, {}
    for rule, sh in s.items():
        im[rule] = dec(sh['url']); im[rule].save(os.path.join(outdir, '%s_%s.png' % (safe, rule)))
        bo[rule] = dec(sh['body'])
    diff = np.abs(A(im['off']) - A(im['on'])).max(axis=2) > 8
    fx = {r: int((np.abs(A(im[r]) - A(bo[r])).max(axis=2) > 8).sum()) for r in im}
    vis = np.asarray(im['on']).copy() // 3
    vis[diff] = (255, 40, 40)
    n = int(diff.sum())
    rows.append((it, s, im['off'], im['on'], Image.fromarray(vis.astype(np.uint8)), n, fx))
    print('%-34s f%s/%s  unit y OFF %s ON %s  changed px %7d  effect px OFF %6d ON %6d' % (
        it['label'], s['off']['f'], s['on']['f'], s['off']['unit'][1], s['on']['unit'][1], n, fx['off'], fx['on']))
if rows:
    W, H = rows[0][2].size
    sc = 0.45
    w, h = int(W * sc), int(H * sc)
    pad = 34
    out = Image.new('RGB', (3 * w, len(rows) * (h + pad)), (24, 24, 24))
    dr = ImageDraw.Draw(out)
    for i, (it, s, a, b, dv, n, fx) in enumerate(rows):
        y = i * (h + pad)
        dr.text((6, y + 4), '%s  (%s L%s %s f%s)   unit y OFF %s -> ON %s   changed px %d   effect px OFF %d / ON %d' % (
            it['label'], it['id'], it['list'], it['clip'], it['frame'], s['off']['unit'][1], s['on']['unit'][1], n, fx['off'], fx['on']), fill=(255, 255, 255))
        for k, x in enumerate((a, b, dv)):
            out.paste(x.resize((w, h)), (k * w, y + pad))
        dr.text((6, y + pad + 4), 'BEFORE (no posture-4 sink)', fill=(255, 255, 0))
        dr.text((w + 6, y + pad + 4), 'AFTER (SINK4: ground at the unit, body P+0x5c x m below)', fill=(0, 255, 255))
        dr.text((2 * w + 6, y + pad + 4), 'changed pixels (red)', fill=(255, 120, 120))
    out.save(sheet)
    print('sheet', sheet, out.size)
