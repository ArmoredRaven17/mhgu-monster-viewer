import sys, os
from PIL import Image, ImageDraw
S = r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/shots'
name, box, out = sys.argv[1], [int(x) for x in sys.argv[2].split(',')], sys.argv[3]
runs = sys.argv[4].split(',') if len(sys.argv) > 4 else ['before', 'A', 'B']
ims = []
for r in runs:
    im = Image.open(os.path.join(S, 'colour-space-' + r, name + '.png')).convert('RGBA')
    bg = Image.new('RGBA', im.size, (60, 64, 70, 255)); bg.alpha_composite(im)
    ims.append((r, bg.convert('RGB').crop(box)))
w, h = ims[0][1].size
m = Image.new('RGB', (w * len(ims), h + 20), (20, 20, 20)); d = ImageDraw.Draw(m)
for k, (r, i) in enumerate(ims): m.paste(i, (k * w, 20)); d.text((k * w + 5, 4), r, fill=(255, 255, 255))
m.save(out); print(out, m.size)
