# map_arms.py: rom-map rows for the Nakarkos build (tentacle runtimes, c 800), 2026-10-19
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
lines = t.split(nl)
# 1. section rows: after the last row of "Effects open items -- the sweep's reads"
h = next(i for i, l in enumerate(lines) if l.startswith("### Effects open items -- the sweep's reads"))
j = h + 1
while j < len(lines) and not lines[j].startswith('|'): j += 1
while j < len(lines) and lines[j].startswith('|'): j += 1
rows = [
"| Nakarkos's tentacle PSL records on their own runtimes (board PHASE 3, 2026-10-19) | each arm (uEmOstgaloaArm, vtable `0x17f6498`) walks ITS lists l_N / r_N with ITS word `0x107f0e4` (psl-mask.js `armMask084` / `armPlay084`: **emulated, every call native under unicorn, 5602 runs 0 mismatches; control (the always-set group dropped) mismatches**); records from its own pels: docs/effects/em084_00_left.json / _right.json (32 each) + CLIP_EFFECTS em084_00_left (72 motions) / _right (69), keys `'Ll_2 Motion[1]'`; one runtime per arm (effect-mounts.js `attachSideEffects`), its unit the frame the arm hangs on; index.html `driveArmEffects` | uEm084_00 arms | R (word) / built | dev/em084_00-effects-spec.md \"Tentacle PSL\"; dev/checks/em084_00.mjs; `<scratchpad>/zg/jscheckarm.py`, `arm_export.py` |",
"| `0xa55ea8` -> `0xa55f20` -- the destructor's +0xb8 != 0 case, reached by a STEP BACK on Nakarkos (2026-10-19) | the seek's clearClipEffects hard-releases the running generators; any em084_00_050 / em084_00_007 particle record alive (the arms' u 130 / u 135, the body's u 135 -- u 135 holds through every idle) takes `0xa55f04..0xa55f1c` with `[r4+0xb8] != 0` -> 0xa55f20, **unrecorded** (HEAD too: the body's own step back during L0 M2 throws; not from the arm runtimes); the throw leaves that runtime's host dead (next: \"image page 0x1782000 is not exported\"). The arms' runtimes take it as a named refusal (index.html seekTo: dropped and made again); the BODY's is open | effect runtime | R (code) / record OWED (efx slot) | dev/em084_00-effects-spec.md \"Tentacle PSL\"; `<scratchpad>/armseek*.mjs` |",
"| `0x106eff4` requester, READ whole (2026-10-19) | per i = 1..3 (`0x106f0dc..0x106f214`): old handle `E+0x26308+4i` killed `(h, 1)` and zeroed; `0x40a54(Q)` (+4 = 0, +8 = 0, +0xc = 0xfe); **+0xc = byte e+0x1054; +0xd0 = vt+0x130(e); +8 = 3; +0x1c \\|= 3; +0xc0.. = P+0x40.. + (x cos + z sin, y, z cos - x sin) x size (0xbe518), w 0; +0x14 \\|= 0x40000000; +0x40.. = vec 4, w 0**; vt+0x1cc(e, 0x3e9, Q) -> handle. Angle u16 P+0x54 x `0x38c90fdb` (literal 0x106f228); sin `0x13ecc20` / cos `0x13ecc2c` | uEm084_00 | R | index.html `c800Requesters` (transcribed); dev/em084-class-effects.md 3 |",
"| `0x1069d88..0x1069dc0` -- c 800's OTHER end | on motion `0x342` (L3 M66): `0x6f618(e, 0x27)` = tune float 0x27 = **172.0**, `0xb0968(e, 0, 0)` crossed -> if latch `E+0xcb20` -> `0x10698d0` (stop all three, zero the handles, clear the latch). So c 800 ends at L3 M66 f172 within (10, 0xaf), or at the next action start. **Corrects** em084-class-effects.md 3's \"through M66\" | uEm084_00 | R | dev/em084-class-effects.md 3 |",
"| em084_00_actiontune.fup layout | `FUP\\0`, 2, n-int 40, n-float 277, n-vec 9 at +0x10; ints at 0x14, floats at 0xb4, vecs (3 floats, 12 bytes) at 0x508 -- the file is 0x574, closes exactly; **control**: vecs 1..4 there = the four READ through `0x3cb35c` | file | R (layout by its control) / the loader not read | this row |",
"| c 800 x3 -- built, HELD OFF (2026-10-19) | exported `em084_00c 800 UNIQUE @event` (efl em084_00_200, efx add_effects.export: additions only); schedule.js `placeEvent` (requesters), index.html `stepC800` (latch per play, stop `holdEvent` off at every new play); the check: 3 requests, points and block bit for bit. **Its effect refuses: unverified 0xaf6734 in L_af63c4** on its first frames, and a refusal stops every Nakarkos effect -- `C800.on = false` until the efx recorder has an em084_00c 800 set and the lift carries it | uEm084_00 | built / record OWED (efx slot) | index.html C800; dev/checks/em084_00.mjs |",
]
lines[j:j] = rows
# 2. tooling rows: after the header of "## 2. Tooling"
k = next(i for i, l in enumerate(lines) if l.startswith('## 2. Tooling'))
k = next(i for i in range(k, len(lines)) if lines[i].startswith('|---'))
tools = [
"| `<scratchpad>/zg/jscheckarm.py [--control]` (2026-10-19) | Nakarkos's arm word 0x107f0e4, native under unicorn, against psl-mask.js armMask084: list-2 motions x body action x arm action x forms x side x rage / tired | 5602 runs, 0 mismatches; `--control` (one group dropped) mismatches | the body's P+0x518 / +0x505 are read through the ARM's P (the viewer gives the body's: I) |",
"| `<scratchpad>/zg/arm_export.py [--apply]` (2026-10-19) | the arms' own PSL records -> docs/effects/em084_00_left / _right.json + CLIP_EFFECTS blocks, over add_effects.plan() | 32 records each; 72 / 69 motions; frame counts tested | write_clip_block's kept-line regex does not see 'Ll_' keys: remove the old block before a rerun |",
"| `<scratchpad>/armsoak.mjs` (via run-check.mjs) | every Nakarkos clip (body and arm lists) on the page's own loop, the body's and both arms' runtimes read for a refusal | 254 clips, 0 refused, 698 arm starts | no seeks (see 0xa55f20) |",
]
lines[k + 1:k + 1] = tools
# 3. trap
last = max(i for i, l in enumerate(lines) if l[:4].rstrip('. ').isdigit() and l[:3].isdigit() and l[3:5] == '. ')
lines.insert(last + 1, "115. **A viewer seek is a release the game never makes (2026-10-19).** clearClipEffects hard-releases every running clip request, and Nakarkos's em084_00_050 / _007 generators then take 0xa55ea8's unrecorded +0xb8 arm: a step back during ANY Nakarkos idle throws (HEAD too). A soak that never seeks will not find it: probe a step back with a long record live (armseek.mjs). (T: the viewer's seek; G: the destructor's free list)")
io.open(P, 'w', encoding='utf8', newline='').write(nl.join(lines))
print('rows', j, 'tools', k, 'trap', last + 1)
