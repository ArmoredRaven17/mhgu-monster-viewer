import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "## Monsters (`MHGU-Monster-Viewer`, built 2026-09-04, deployed as TEST)\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """- [x] (bug) **Load times crept up** (Raven, 2026-10-16: "load times seem to be taking longer" / "find the bottleneck in the
      current code"). PROFILED (headless Edge on the real GPU, CDP CPU profile + network + per-step marks). FIXED 2026-10-16,
      four bottlenecks: (1) render/rom/effect/live.js attach fetched every effect file ONE AFTER ANOTHER, a name again per
      effect naming it, each with a fresh ?v= stamp -- now all at once, once per name, cached per page load (a reload still
      refetches) -- 0.9-1.4 s of every switch; (2) render/rom/effect/mem.js copied memory a byte at a time with a page
      lookup per byte -- now a page at a time, u16 / u32 one lookup (byte-identical: effect-check vectors match the old code
      exactly) -- 1.1-1.6 s of CPU; (3) render/assets.js textures: every webp was decoded again INSIDE the GPU upload
      (three uploads unpremultiplied / no colour conversion) -- now ImageBitmaps decoded in the background with the same
      settings (three's GLTFLoader browser rule: <img> kept on Safari < 17 / Firefox < 98); (4) getTexture had no in-flight
      dedupe -- one map fetched and decoded up to 7 times per switch. Screenshots pixel-identical before / after
      (dev/shots/tex-before vs tex-after3). Numbers on the GPU: page load 3.1 -> 1.2 s; Ahtal-Ka switch 7.9 -> 0.66 s,
      Seregios 5.6 -> 0.62 s, Rathian (repeat) 4.0 -> 0.27 s. Why it crept: (1)'s cost grows with every effect file a
      monster's json names, which the effects work has been adding all along.
- [ ] **Port render/assets.js to the Armor Viewer** (it is a SHARED file, dev/sync-render.py; the Monster Viewer edit is
      marked in the file): the ImageBitmap texture path + the in-flight dedupe. Same gain there; tell the Armor Viewer agent.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
