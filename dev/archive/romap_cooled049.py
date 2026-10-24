import os, io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
NOTE = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em049-cooled-glow-check.md'
s = io.open(P, encoding='utf-8').read()
lines = s.split('\n')

def find(prefix):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, (prefix, hits)
    return hits[0]

# 1. Agnaktor heat section: rows after the "transcribed" row
i = find('| **transcribed** | the six region machines')
rows = [
 "| `0xec2310` (`0xec22c8` state 0), `0xec24c4..0xec2520` | **cooled lava**: `cool_Loop` by findMatClipByName (index to `E+0xcb58+4k`), then setMatClip slots 0..3 at time 0 only when slot 0's clip (`0xb0cff0`) differs -> it starts at f0 on the call after 1 -> 0. All six `lav` materials' `cool_Loop` identical: fTransparency 0 / 0.1 (f60) / 0, linear, loop 120; fDiffuseColor 1 (cols 3). The lava's combine (feat 9, glob 17, `PS_MaterialStd`): ADDS tex x ((lights + SH) x fDiffuseColor x occ + fEmissionColor 1) x tex.a x fTransparency (BSAddAlpha): a faint pulse, peak ~0.1 x texel | uEm049_00 | R (code, data, mfx program; the clip's wall-clock rate NR) | dev/em049-cooled-glow-check.md §2 |",
 "| viewer, cooled lava (2026-10-17) | the soft glow IS `cool_Loop` on the 17 heated-group overlays: opacity 0 -> 0.0998 -> 0 per 120 f, colour 1, emissive 1 x texel, lit; same clip, curve and combine as the ROM, no fallback or default. **Phase differs**: monster.js's rest-clip return (comment \"a NAMED rest clip -- Agnaktor's cool_Loop\") plays it on the page clock; the ROM from f0 at state-0 entry. Fix: return `[[idx, machine.restT0]]` (the machine already records it). Death clip L3 M12 cooled: no overlay drawn (no glow), as `0xec1cec` | uEm049_00 | M | §1, §3, §4 |",
 "| Glacial Agnaktor | not in MHGU: `romfs\\nativeNX\\arc\\enemy` holds `em049_00.arc` and no other `em049_*` (control: em001_02 / _04, em002_02 / _04 -- 26 variant arcs) | -- | R (listing) | §5 |",
]
assert not any('em049-cooled-glow-check' in l for l in lines), 'already patched'
lines[i+1:i+1] = rows

# 2. row 245 upgrade (append, never delete)
j = find('| `0x88db14`, `0xb08b44`, `0xb09ae8`, `0xb09a3c` |')
old = lines[j]
assert '| I (R for 0xb09ae8 / 0xb09a3c) |' in old
new = old.replace(' materialAt / findMatClipByName as before]**',
                  ' materialAt / findMatClipByName as before]** **[UPGRADED 2026-10-17 (b): findMatClipByName `0xb08b44` READ -- crc `0x7c8ed8(name, ~0)`, match `[entry+0xc]` over `[ctl+0x10]` = {count, entries}, -1 if none; and the slot-clip getter `0xb0cff0` = `ldrsh [m+0x50+8s]` -- dev/em049-cooled-glow-check.md §2; materialAt still I]**')
new = new.replace('| I (R for 0xb09ae8 / 0xb09a3c) |', '| I (R for 0xb09ae8 / 0xb09a3c / 0xb08b44 / 0xb0cff0) |')
assert new != old
lines[j] = new

# 3. note index
k = find('| `dev/em023-fur-check.md` |')
size = os.path.getsize(NOTE) // 1024 + 1
lines[k+1:k+1] = ["| `dev/em049-cooled-glow-check.md` | Agnaktor's cooled lava glow checked against the ROM: `cool_Loop` (`0xec2310`, slot time zeroed by `0xb09ae8`) fTransparency 0 -> 0.1 -> 0, the lava's combine (PS_MaterialStd, FDiffuse's base body, FEmissionConstant); the viewer matches except the pulse phase; no Glacial Agnaktor in MHGU | 2026-10-17 | %d KB |" % size]

# 4. trap 70
t = find('69. **capstone')
lines[t+1:t+1] = ["70. **`feat.diffuse: False` is NOT \"no diffuse\" (2026-10-17).** build-materials writes False for a family left at ITSELF, and FDiffuse's own body runs: `(mc.diffuse + FAmbient(mc)) * CBMaterial.fDiffuseColor * mc.occlusion`, before `mc.diffuse += FEmission`. So fDiffuseColor scales the lighting (not the emission, not the albedo) on every such material -- rom/material.js's \"no diffuse\" wording on feature set 9 reads otherwise. Print the family base (`mfxprog.py FDiffuse`) before reading False as off; FEmission / FReflect / FTransparency's bases happen to be 0 / 0 / 1. (dev/em049-cooled-glow-check.md §6)"]

io.open(P, 'w', encoding='utf-8', newline='').write('\n'.join(lines))
print('ok', i, j, k, t)
