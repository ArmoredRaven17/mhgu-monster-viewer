# map_draws.py: the draw meter survey (2026-10-19) -> rom-map rows (effects lane's section) + spec bullets; append-only
import io, os
DEV = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
P = DEV + r'\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
lines = t.split(nl)
h = next(i for i, l in enumerate(lines) if l.startswith("### Effects open items -- the sweep's reads"))
j = h + 1
while j < len(lines) and not lines[j].startswith('|'): j += 1
while j < len(lines) and lines[j].startswith('|'): j += 1
S = '<scratchpad>'
rows = [
"| THE DRAW SURVEY (draw meter, 2026-10-19): every clip with records on all 94 monsters with effects, every runtime (Seltas on the Queen, Nakarkos's arms), calm then enraged | **4,114 records measured on 89 + 5 rerun monsters; 4,088 DRAW (lit pixels)**; the rest below, each diagnosed. Shell records the shells agent asked about (Gore em071_00u 0, Shagaru u 90, Alatreon u 211, Valstrax u 500) and all 54 of Neset's draw. NOT MEASURED: records that never started in a single play of each clip (picks that cycle per play, clip copies `#B`, shells needing snow / tusks / a carried object) -- listed per monster in %s/ms/, not claimed | all | R (measured) | %s/ms/<id>.out, msreport.py; dev/effect-runtime-engine.md E16 |" % (S, S),
"| -- FIXED (viewer): effect models and textures loaded on first use | a record shorter than a load drew nothing the first time it played: Kirin u 264 (L4 M9, 27 frames, waiting on cm120_020), Lagiacrus u 0 (em037_00_000). live.js attach now starts every model glb and texture the effect file names; re-measured, both draw | live.js | built | live.js attach (the preload) |",
"| -- the ROM draws nothing: the record's own MASK1 selects no row of its efl | Fatalis / Crimson u 202 (MASK1 0x4; em013_00_003 rows 0x1 / 0x2); Brachydios c 64 (0x100000; rows 1 / 2 / 4); Gravios u 241 (0x2, construct.js); Seltas u 272 (0x2). The unit ends at once, no generator (+0xc 0x14cb3) | data | R (rows read live) | this row |",
"| -- the ROM builds only on a FLOOR with a flag: the named stand-in (no floor attribute under the monster, MASK2 = 3) | rows whose w04 needs another MASK2 (0x41c74's floor arms): Tigrex / Grimclaw c 25 and Seltas Queen c 210 / 220 / 230 / 240 (cm200_067, rows 0x20: a flag-8 floor), Barroth c 130 (cm200_041, rows 0x14), em060_04 u 120 (row 0x354). In the game they build on such floors. A ground-type control would be Raven's call -- listed, not built | data + viewer stand-in | R (rows) / control not built | rom-map c 25 row; `0x41c74` row |",
"| -- draws OFF CAMERA (lit when the meter looks at its units) | Nakarkos u 220 (L3 M63): its payload offset (5000, 50000, 5000), space 2, joint -1 -- an absolute point 500 m up, the ROM's data. SHELLS far ahead of the monster (the camera stands in front of it): Dreadking u 21 (z 16159, y -1086), Kushala u 120 (z 15625), Zinogre u 1, Brachydios u 12 / Raging u 12 (z 26413 / 31230), Tetsucabra u 22 (the rock landings, z 4260: behind the camera), Shagaru u 124 (-9130, 25146), Seltas u 10 (z 3013), em079_04 u 80 (z 5948, y -632) -- the shells' end points, for the shells lane to confirm against the game | shells / data | R (measured; u 220 placement READ) | %s/ms/; sent to the shells agent |" % S,
"| -- OPEN, not settled | **Deviljho / Savage c 30** (cm202_000, L2 M1 / M2 / M5 / M6): one model draw (cm101_000 mesh 8) whose colour alpha byte is 1 (globalTransparency 1/255) for its whole life -- the ROM's own generator colour (modeldraw.js reads colour +3); its twins on the same efl draw (Diablos / Fatalis c 30); its payload differs: joint -1, +0x43 = 1 (the spawn-height check on, limit 900.0), +0x53 = 1 -- the colour path NOT READ. **Khezu u 31 / u 61** (shells, L2 M61 / M75): the unit stays in state 1 (built, 5 / 7 generators, never activated) and the request ends 2 frames after its start -- the shell ends at once in the viewer (shells lane). **Basarios u 201** (L4 M5 / M20): 3 generators in state 2 submit nothing over the request's 2-frame life -- emission after its end, NOT READ | uEm043_00 / uEm003_00 / uEm004_00 | open | this row |",
]
lines[j:j] = rows
io.open(P, 'w', encoding='utf8', newline='').write(nl.join(lines))
SPECS = {
 'em013-effects-spec.md': "* **Draw meter (2026-10-19):** u 202 draws nothing in the game either: its MASK1 0x4 selects no row of em013_00_003, whose rows carry 0x1 / 0x2. Every other record draws.",
 'em061_00-effects-spec.md': "* **Draw meter (2026-10-19):** c 64 draws nothing in the game either: its MASK1 0x100000 selects no row; the rows carry 1 / 2 / 4. u 12's shell draws off camera, at z 26413 (shells lane).",
 'em043_00-effects-spec.md': "* **Draw meter (2026-10-19): c 30 (cm202_000) never lights** -- its one model draw carries colour alpha 1/255 for its whole life, from the ROM's own generator colour. Its twins on the same efl draw. OPEN: the colour path is NOT READ (rom-map \"the draw survey\" rows).",
 'em003_00-effects-spec.md': "* **Draw meter (2026-10-19):** shells u 31 / u 61 start, but their request ends 2 frames later with the unit still in state 1, so nothing draws. OPEN (shells lane: the shell's life).",
 'em084_00-effects-spec.md': "* **Draw meter (2026-10-19):** 73 of 74 records draw (the body, 34; each arm, 20). u 220 (L3 M63) draws at its payload's absolute point (5000, 50000, 5000), space 2, off camera -- the ROM's data.",
 'em011_00-effects-spec.md': "* **Draw meter (2026-10-19):** u 264 drew nothing on its first play while its model glb was still loading. Fixed: live.js preloads every effect model and texture. It draws now.",
}
for f, b in SPECS.items():
    p = DEV + '\\' + f
    if not os.path.exists(p): print('no spec', f); continue
    s = io.open(p, encoding='utf8', newline='').read()
    n2 = '\r\n' if '\r\n' in s else '\n'
    s = s.rstrip() + n2 + n2 + b + n2
    io.open(p, 'w', encoding='utf8', newline='').write(s)
    print('ok', f)
