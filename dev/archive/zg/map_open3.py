# map_open3.py: the three open items, read (2026-10-19) -> rom-map rows + a Withdrawn entry + spec bullets; append-only
import io
DEV = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
P = DEV + r'\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
lines = t.split(nl)
# 1. the rows, after the survey's OPEN row
i = next(k for k, l in enumerate(lines) if l.startswith('| -- OPEN, not settled | **Deviljho / Savage c 30**'))
rows = [
"| payload `+0x43` -> core `+0xd3` -> unit `+0x2a3`: THE EFFECT RUNS AT ITS PARENT'S RATE (READ 2026-10-19) | the placement 0x31d16c, when `[desc+0x83]` (unit +0x2a3) != 0: result speed = `[desc+0xdc]` (unit +0x2fc) x `[parent+0x50c]` (`0x31f980..0x31f9a0`, r9 the parent unit -- the same pointer whose +0x60..+0x68 scale it reads above); 0x327188 stores the result speed to the unit's +0x100 (`0x327300`), and 0x9b4140 makes each step +0xfc = DT x +0x100 x (+0xf8 / rate). `+0x50c` is the unit's own time scale (a shell's life -= owner[+0x50c] x dt, row `0x3fbe60`). The viewer's (and the recorder's) stand-in parent left it 0, so the only two records with +0x43 set -- **Deviljho / Savage c 30** (cm202_000) -- froze on their first frame (alpha 1/255). **FIXED**: host.js createParent and efx/parent.py set +0x50c = 1.0; c 30 now lights (109 / 145 samples, no refusal) | effect core / unit | R | host.js createParent; efx/parent.py |",
"| the base step's spawn-height test `0x329390` | `ldrb r0, [r4, #0xd0]` -- a BYTE: payload +0x40 alone enables it (not the word +0x40..+0x43) | effect core | R | this row |",
"| Basarios u 201 (em004_00_004, L4 M5 f75 / f112, L4 M20 f130: one-frame bits) -- settled | 3 generators (MASK1 4) are made and hold no particle after their first update; the bit-off a frame later ends the unit (`+0xc 0x14cb3`). The recorder's native run of the same record and bit (add_em004_00_u201 / _near) calls the effect draw 0x9b75e8 twice and no generator draw either: the ROM draws nothing for it on these inputs. The generators' first-emission rule NOT read | data | R (both runs) | this row |",
"| Khezu u 31 / u 61 (shells) -- settled by the shells agent | shell01 children (base01, no timer float) live on their hit slot (0xd218c4: hit 0 -> +0x15d8; HDS (0,60) (0,10) ...); SHELL_DATA lacked `hit` / `hitdata`, so the viewer ended them at move 1, before the effect activated. Fixed in shells.js (the shells agent); re-measured: both draw (lit 18 / 21, 39 / 54) | uEm003_00 shells | R | shells.js SHELL_DATA.em003_00.shell01 |",
"| the viewer's TEMPORARY hide `HIDE_MODELS` (live.js, 2026-09-15) | Khezu's flash cm100_000 and Rajang's cm101_000 model draws are skipped (the alpha the ROM routes to mc.transparency did not reach them; \"still looks the same\", Raven 2026-09-19). The meter counts them as hidden by HIDE_MODELS (Khezu u 31: 18, u 61: 44) -- still open | viewer | open | live.js HIDE_MODELS |",
]
lines[i + 1:i + 1] = rows
# 2. the withdrawn claim
w = next(k for k, l in enumerate(lines) if l.startswith('### Withdrawn'))
w = next(k for k in range(w, len(lines)) if lines[k].startswith('|---')) + 1
lines.insert(w, "| rom-map \"the draw survey\" OPEN row (2026-10-19, effects lane): Deviljho c 30's payload \"+0x43 = 1 (the spawn-height check on, limit 900.0)\" | the base step tests the BYTE core+0xd0 (`0x329390 ldrb`), i.e. payload +0x40 alone; +0x43 (core +0xd3 -> unit +0x2a3) is a different flag | +0x43 = the effect runs at its parent's rate (`0x31f980..0x31f9a0`); the row \"payload `+0x43` -> ...\" |")
io.open(P, 'w', encoding='utf8', newline='').write(nl.join(lines))
for f, b in {
 'em043_00-effects-spec.md': "* **c 30, read and fixed (2026-10-19):** payload +0x43 makes the effect run at its parent's rate: speed = unit+0x2fc x parent+0x50c (0x31f980..0x31f9a0). The stand-in parent's +0x50c was 0, so c 30 froze on its first frame. host.js createParent (and efx/parent.py) now set it to 1.0, and c 30 lights. The earlier \"spawn-height check\" reading is withdrawn.",
 'em003_00-effects-spec.md': "* **u 31 / u 61, settled (2026-10-19):** their shell01 lives on its hit slot. SHELL_DATA lacked `hit` / `hitdata` (fixed in shells.js by the shells agent). Both draw now.",
}.items():
    p = DEV + '\\' + f
    s = io.open(p, encoding='utf8', newline='').read(); n2 = '\r\n' if '\r\n' in s else '\n'
    io.open(p, 'w', encoding='utf8', newline='').write(s.rstrip() + n2 + n2 + b + n2)
print('ok')
