import sys, os
from PIL import Image, ImageDraw
S = r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/shots'
OUT = r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/cs/m'
os.makedirs(OUT, exist_ok=True)
runs = sys.argv[1].split(',')
names = sys.argv[2].split(',')
for n in names:
    ims = []
    for r in runs:
        im = Image.open(os.path.join(S, 'colour-space-' + r, n + '.png')).convert('RGBA')
        bg = Image.new('RGBA', im.size, (60, 64, 70, 255)); bg.alpha_composite(im)
        bg = bg.convert('RGB'); w, h = bg.size
        # crop to content bbox of alpha
        bb = im.getchannel('A').getbbox() or (0, 0, w, h)
        x0, y0, x1, y1 = bb; pad = 20
        ims.append((r, bg.crop((max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)))))
    W = max(i.size[0] for _, i in ims); H = max(i.size[1] for _, i in ims)
    sc = min(1.0, 620 / W)
    W2, H2 = int(W * sc), int(H * sc)
    m = Image.new('RGB', (W2 * len(ims), H2 + 24), (30, 30, 30)); d = ImageDraw.Draw(m)
    for k, (r, i) in enumerate(ims):
        i = i.resize((int(i.size[0] * sc), int(i.size[1] * sc)))
        m.paste(i, (k * W2, 24)); d.text((k * W2 + 6, 6), r + '  ' + n, fill=(255, 255, 255))
    m.save(os.path.join(OUT, n + '.png')); print(os.path.join(OUT, n + '.png'), m.size)
