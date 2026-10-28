"""Lane A4 joint -1: decode j1shot.mjs output (SHOT lines) into PNG pairs and a pixel-diff sheet per run.
Usage: python sheet.py <shots.out> <outdir> <sheet.png>
Each row: shipped rule (gid-0 bone) | ROM rule (the unit, unitGamePos) | |difference| (x4, red where any channel differs by > 8/255),
with the item label, the frame, both anchors and the changed-pixel count."""
import sys, os, json, base64, io
from PIL import Image, ImageDraw, ImageChops
import numpy as np

src, outdir, sheet = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(outdir, exist_ok=True)
rows = []
for line in open(src, encoding='utf-8', errors='replace'):
    if not line.startswith(('PASS SHOT', 'FAIL SHOT')) or '  -- ' not in line:
        continue
    label, js = line.split('  -- ', 1)
    d = json.loads(js)
    if 'shots' not in d:
        print('no shots:', label, d.get('error')); continue
    it = d['it']; s = d['shots']
    imgs, bodies = {}, {}
    safe = ''.join(c if c.isalnum() else '_' for c in it['label'])
    for rule, sh in s.items():
        dec = lambda u: Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGB')
        imgs[rule] = dec(sh['url']); imgs[rule].save(os.path.join(outdir, '%s_%s.png' % (safe, rule)))
        if sh.get('body'):
            bodies[rule] = dec(sh['body']); bodies[rule].save(os.path.join(outdir, '%s_%s_body.png' % (safe, rule)))
    A = lambda im: np.asarray(im).astype(int)
    if bodies:
        # the effects alone: the frame less the same frame with the effects suppressed; the pose check: the two body frames
        fa = np.abs(A(imgs['cur']) - A(bodies['cur'])); fb = np.abs(A(imgs['unit']) - A(bodies['unit']))
        bodyd = int((np.abs(A(bodies['cur']) - A(bodies['unit'])).max(axis=2) > 8).sum())
    else:
        fa, fb, bodyd = A(imgs['cur']), A(imgs['unit']), None
    ma, mb = fa.max(axis=2) > 8, fb.max(axis=2) > 8
    # the sheet's third panel: the shipped rule's effect pixels in yellow, the ROM rule's in cyan, both white
    vis = np.zeros(fa.shape, np.uint8)
    vis[ma & ~mb] = (255, 220, 0); vis[mb & ~ma] = (0, 220, 255); vis[ma & mb] = (255, 255, 255)
    n = int((ma ^ mb).sum())
    s['_stats'] = dict(fxCur=int(ma.sum()), fxRom=int(mb.sum()), xor=n, bodyDiff=bodyd)
    rows.append((it, s, imgs['cur'], imgs['unit'], Image.fromarray(vis), n))
    print('%-44s fx px shipped %7d  ROM %7d  differ %7d  body-diff %s | cur f%s gid0 %s | unit f%s unit %s world0 %s/%s' % (it['label'], ma.sum(), mb.sum(), n, bodyd,
          s['cur']['f'], s['cur']['gid0'], s['unit']['f'], s['unit']['unit'], s['cur'].get('world0'), s['unit'].get('world0')))

if rows:
    W, H = rows[0][2].size
    sc = 0.5
    w, h = int(W * sc), int(H * sc)
    pad = 46
    out = Image.new('RGB', (3 * w, len(rows) * (h + pad)), (24, 24, 24))
    dr = ImageDraw.Draw(out)
    for i, (it, s, c, u, dv, n) in enumerate(rows):
        y = i * (h + pad)
        st = s['_stats']
        dr.text((6, y + 4), '%s  (%s L%s %s f%s)   effect px: shipped %d, ROM %d, in one only %d   body-pose diff px %s' % (it['label'], it['id'], it['list'], it['clip'], it['frame'], st['fxCur'], st['fxRom'], n, st['bodyDiff']), fill=(255, 255, 255))
        dr.text((6, y + 20), 'shipped: gid-0 anchor %s   |   ROM: unit %s   (game units; floor rule as shipped)' % (s['cur']['gid0'], s['unit']['unit']), fill=(200, 200, 200))
        for k, im in enumerate((c, u, dv)):
            out.paste(im.resize((w, h)), (k * w, y + pad))
        dr.text((6, y + pad + 4), 'SHIPPED (joint -1 = gid-0 bone)', fill=(255, 255, 0))
        dr.text((w + 6, y + pad + 4), 'ROM (joint -1 = the unit, model+0xb0)', fill=(0, 255, 255))
        dr.text((2 * w + 6, y + pad + 4), 'effect pixels: yellow shipped only, cyan ROM only, white both', fill=(255, 120, 120))
    out.save(sheet)
    print('sheet', sheet, out.size)
