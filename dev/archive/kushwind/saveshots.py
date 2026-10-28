"""kushwind/saveshots.py <run.out> <outdir> [prefix]: write each SHOT line's PNGs (url, body) from a kwshot.mjs run, print the rest,
and the lit-pixel diff (render vs body alone) with its bounding box -- where the effect draws on screen."""
import sys, os, json, base64, io
from PIL import Image, ImageChops
src, outdir = sys.argv[1], sys.argv[2]
pre = sys.argv[3] if len(sys.argv) > 3 else ''
os.makedirs(outdir, exist_ok=True)
for line in open(src, encoding='utf-8', errors='replace'):
    if ' SHOT ' not in line or '  -- ' not in line: continue
    head, js = line.split('  -- ', 1)
    d = json.loads(js)
    if 'url' not in d: print(head, js[:300]); continue
    lab = pre + d['it']['label']
    ims = {}
    for k in ('url', 'body'):
        b = base64.b64decode(d[k].split(',', 1)[1])
        p = os.path.join(outdir, lab + ('' if k == 'url' else '_body') + '.png')
        open(p, 'wb').write(b); ims[k] = Image.open(io.BytesIO(b)).convert('RGB')
    diff = ImageChops.difference(ims['url'], ims['body']).convert('L').point(lambda v: 255 if v > 12 else 0)
    bb = diff.getbbox(); lit = sum(1 for v in diff.getdata() if v)
    print(lab, 'f', d['f'], 'joints(screen)', d.get('joints'), 'unit(screen)', d.get('unitScreen'), 'lit px', lit, 'bbox', bb, 'units', d['units'], 'failed', d['failed'], 'cpu', d.get('cpu'))
