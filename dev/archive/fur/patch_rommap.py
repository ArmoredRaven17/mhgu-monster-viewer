# Patch dev/rom-map.md in place (re-read fresh): the em023 fur-strobe section, the row-245 upgrade, the note index,
# the tooling rows and trap 69. Each anchor must match exactly once or nothing is written.
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
def once(anchor):
    n = s.count(anchor)
    if n != 1: sys.exit('anchor count %d: %r' % (n, anchor[:80]))
if 'em023-fur-check.md' in s: sys.exit('already patched')

SECTION = """### Rajang / Furious -- the fur strobe (research agent for the Viewer agent, 2026-10-17; dev/em023-fur-check.md)

Raven: "Both Rajangs: Double check the fur rendering, it is currently strobing". The strobe is the VIEWER's: m01_hairline's 1-frame looping `Angry` (fDiffuseColor 1.0 @0 -> 0.6 @1) sampled at `(t*60) % 1`; the class never names `Angry`.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xb09ae8` | setMatClip(m, slot, idx): `[m+0x50+8s] = u16 idx`, `[m+0x54+8s] = 0`; nothing else (no chain) | engine | R | em023-fur-check §2 |
| `0xb09a3c` | clearAllSlots(m): 4 slot words 0xffff / times 0, then every auto clip (`clip+4` bit 1) into the next free slot | engine | R | §2 |
| `0xb0cf1c..0xb0cfd4` | material-clip time step per slot: `time += [+0x20]*dt`; >= frameCount and `clip+4` bit 0 clear -> time = frameCount (HELD, index untouched); bit 0 set -> wrap | engine | R | §2; material.js stepOneSlot |
| `0xc2210` | (e, name, mat, slot) -> 1 while the slot's time < the named clip's frameCount; writes nothing | shared | R | §2 |
| `0xde1ae0` / `0xde2888` | re-read: set-up (ids 0x33 / 0x34 -> slot 0 = names[ctl+0x58] at s16 = 0 / 60 (variant 5)), the machine (variant 5 skips it, `0xde28a0`; rage edge -> Angry_Start t0, calm edge -> Angry_End t0, on ctl+0x34/+0x38/+0x3c) -- **no hand-off to `Angry`: the fur HOLDS Angry_Start's f60 (0.6, fTransparency 1) while enraged; Furious holds it from spawn** | uEm023_00 | R | §2; states-em023_05.md 1.2 / 2 confirmed |
| `0xde3da8..0xde3e98` | vt+0x1dc `ctl+0x75` bookkeeping: `0xc2210` on +0x34 / +0x38 (names[1 + (b&1)]), both done -> clear bits, `0x88bcf8`; no clip set | uEm023_00 | R | §2 |
| band `0xde1a08..0xdee058` | every pc-relative string (word-by-word decode, 12,659 / 12,692): clip names Angry_End / Angry_Start / Normal / PumpUp only, never `Angry`; 12 setMatClip sites, 0 clearAllSlots. Control: Akantor's band gives `'Angry'` at `0xe37810` | uEm023_00 | R | §2 |
| `0x74094..0x740b8` | shared: `"overheat_End"` on MRL-id-4 materials with a clip list only (Rajang's id 4, m04_pumpup_fur, has none) | shared | R | §2 |
| `0x92c084` (jump table `0x92d450`; vtable slot `0x183b3bc` -> `0x92d178`) | a data-driven set-clip-by-name interpreter (name `[r4+0xc]+8`, MRL-id filter `[r4+8]`); owner NOT traced | engine | NR | §2 |
| `ctl+0x3c` (fp 2, id 3) | written for the eye then m03_pumpup_arm (both .mrl and .mod order) -> **the eye never gets a clip**; the viewer ramps it 1 -> 2 on rage | uEm023_00 | I (`[e+0xf8]` order not read) | §3.4 |
| viewer | cause: monster.js clipPicker start->steady (`:11217..11225`) + STATE_NAMES.enraged.steady `'Angry'` (`:9779`). Fix: `SUPPRESS_CLIP.em023_00` `Angry` on m01_hairline / m02_hair_a; `ROM_SPAWN_CLIP.em023_05` m01_hairline / m02_hair_a = `Angry_Start` -- measured in-page, strobe gone | -- | R (measured) | §0, §4 |

"""
anchor_sec = '### Deviant special pigments -- index -> Deviant'
once(anchor_sec)
s = s.replace(anchor_sec, SECTION.replace('\n', nl) + anchor_sec, 1)

old245 = 'materialAt / findMatClipByName / setMatClip / clearAllSlots — **names from my own tool table, INFERRED**; structure corroborates, no callee read | I |'
once(old245)
s = s.replace(old245, 'materialAt / findMatClipByName / setMatClip / clearAllSlots — **names from my own tool table, INFERRED**; structure corroborates, no callee read. **[UPGRADED 2026-10-17: setMatClip `0xb09ae8` and clearAllSlots `0xb09a3c` READ -- dev/em023-fur-check.md §2; materialAt / findMatClipByName as before]** | I (R for 0xb09ae8 / 0xb09a3c) |', 1)

# the in-repo note index: after the air-height row
lines = s.split(nl)
idx = [i for i, l in enumerate(lines) if l.startswith('| `dev/air-height.md` |')]
if len(idx) != 1: sys.exit('air-height row %d' % len(idx))
lines.insert(idx[0] + 1, '| `dev/em023-fur-check.md` | Rajang / Furious -- the fur strobe checked against the ROM: the viewer\'s 1-frame `Angry` loop on m01_hairline; the class holds Angry_Start f60 (Furious from spawn); setMatClip / clearAllSlots / the clip time step read; fix = SUPPRESS_CLIP.em023_00 + ROM_SPAWN_CLIP.em023_05 | 2026-10-17 | 9 KB |')
# tooling: after the basshell row
idx = [i for i, l in enumerate(lines) if l.startswith('| `scratchpad/basshell.py` (this session)')]
if len(idx) != 1: sys.exit('basshell row %d' % len(idx))
lines.insert(idx[0] + 1, '| `<scratchpad>\\fur\\strscan.py <lo> <hi>` / `fur\\blscan.py <targets..>` / `fur\\fdis.py` (2026-10-17) | every pc-relative address (ldr lit + add pc) a code band forms, as strings; every B/BL in main.text to given targets; ARM disassembly with literals | strscan finds Akantor\'s `\'Angry\'` at `0xe37810` and Rajang\'s four clip names; blscan finds the 12 em023 setMatClip sites the note lists | strscan decodes WORD BY WORD -- capstone\'s md.disasm over a range stops at the first data word (trap 69) |')
lines.insert(idx[0] + 2, '| `<scratchpad>\\furprobe.mjs` / `furfix.mjs` + `furshow.py` (2026-10-17, via run-check.mjs / run_locked.sh) | per-frame log of every clip-carrying material\'s uniforms / colours, mesh visibility and joint 150 across State rungs and clips; furfix sets table entries in the page first | Rajang\'s hairline strobe measured 231..239 changes / 240 f; with the fix 0 outside the 60-frame fades | the page\'s own rAF loop: wall-clock material time, so per-frame values jitter with frame timing |')
s = nl.join(lines)

trap = '69. **capstone\'s `md.disasm(code, va)` stops at the first word it cannot decode (2026-10-17).** A sweep over a class band that holds a jump table or literal pool silently ends there: the em023 string scan first "found" 5 references (the set-up only) and Akantor\'s none of his `Angry`. Decode word by word (`md.disasm(TEXT[a:a+4], a)`) and print the decoded / total count, or a negative from the sweep is a truncated read.'
s = s.rstrip('\r\n') + nl + trap + nl
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched')
