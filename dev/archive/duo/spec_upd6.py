P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = "| `<scratchpad>\\duo\\tracer.py` (+ `census.py`"
i = s.index(a); j = s.index(nl, i)
row = ("| `<scratchpad>\\duo\\wingemu.py` (+ `wingtable.py`, `wingjoints.py`) (Seltas duo agent, 2026-10-17) | his wing pass `0xfc66f8` "
       "frame by frame under unicorn (the +0x40 count added per frame as `0xfc5e54` does; `0x13ecc20` / `0x13ecc2c` answered as sinf / "
       "cosf; vt+0x3f4 / vt+0xd8 stubbed): the joint 150..153 scales and the `0x7237c` swings per +0x49 sequence; `wingtable.py` reduces "
       "the census's +0x49 writes to a value per motion; `wingjoints.py` reads the glb skin of parts 1..4 | the 0 -> 2 -> 1 -> 0 run "
       "reproduces the code's arms (all 0; 152 / 150+151+153 alternating every 2; 150+151) | the swing's joints are hidden when it runs; "
       "whether 0x7237c's matrix persists into the other phase is not read |")
s = s[:j] + nl + row + s[j:]
open(P, 'w', encoding='utf-8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "## 10. Not read" + nl
assert s.count(old) == 1
new = """## 16. His wings (2026-10-17; Raven: "Seltas wing parts are not being toggled during flying sections") -- solo and on her

* **The pass** (his vt+0x2a0 `0xfc66f8..0xfc75c0`, emulated frame by frame, `duo/wingemu.py`) scales the card joints
  150..153 to 0 or 1 by the flight state `[+0xcac0]+0x49`; the part set (`0xfc6520`: 0 set 1, 1 set 5, 2 set 6) draws
  them. The cards (the glb skin): part 1 on joints 150 + 151, part 2 on 152, part 3 on 153, part 4 on 150 + 151.
  | +0x49 | joints at 1 | cards shown |
  |---|---|---|
  | 0 (and dead) | none | none (folded) |
  | 1 | 150, 151 | part 4 (out) |
  | 2 | 152 / then 150, 151, 153 | FLAPPING: part 2 for 2 frames, then parts 1, 3, 4 for 2 -- period 4, from the first frame |
  The flap flips when `+0x40` reaches 2.0 (`0xfc6860`); `+0x40` counts 1 a frame in his per-frame pass (`0xfc5e54`).
* **Who writes +0x49**: his actions, at the phase that sets each motion (census `duo/s_census.json` -> `duo/wingtable.py`,
  94 motions): 0 on his ground and ridden motions (L0, L3 reactions, L4 M6 / M9 / M31 / M32 / M33 / M35 / M43 / M45 / M48
  / M71 / M73 / M77 / M79, L2 M5 / M29 / M32 / M57); 1 on L1 M24, L4 M1, M8 (his 1:0x2 landing on her), M14, M91, M93; 2 on
  his flight (L1 M1..M34 but M2 / M21 / M22 / M24, L2 M10..M38 but M29 / M32, L3 M63 / M65 / M70) and on L4 M3, M4, M5,
  M7, M16, M27, M34, M46, M47, M90, M94. A value changes inside a clip only at the action's exit.
* **The viewer** (render/monster.js `ROM_WINGS` / `wingPartsAt`; index.html `wingsNow` / `stepWings` for solo Seltas,
  stepAttached `a.wingParts` on her): where his clip's state is 1 or 2 the ROM draws the cards and wins over the Wings
  row; where it is 0 (folded) or the clip is not in the table, the row (Away / Out / Flapping, default Away) applies -- on
  her the row's default, Away (`partsOff`). Away is what the ROM draws at 0.
* **Differences from the row's options**: the ROM's "out" is part 4 (the row's Out is part 1); the ROM's flap alternates
  part 2 with parts 1, 3, 4 (the row's Flapping draws 2, 3, 4 at once).
* Checks: dev/checks/em076_00.mjs (new, solo, 9 assertions: L2 M24 start / loop flap and its phase over the slot, the row
  not overriding it, L1 M24 out, L2 M37, L0 M1 under each row choice); the duo block (M6 folded, M8 out, his M34 flap, his
  M46 leave flap, M31 folded).
* **Solo note**: this applies to every Seltas clip on his own lists; his claw stage (ROM_CLAW_SCHEDULE) is not applied to
  solo Seltas (his Claws row stays hidden at part 10).

## 17. The smash, his freeze, the eat, and the dismounts -- re-opened on Raven's account (2026-10-17)

Raven: *"Seltas during smash animations is still in a stuck pose and dropped onto the Queen's body"*, *"IIRC he should be
struggling during the smash animation"*, *"...and left on the ground for the Queen to consume"*.

* **The freeze's timing, read** (his 1:0x20 phase 1, `0xfc9874..0xfc98c8`): he leaves the struggle (M79 loop, speed 1)
  for 1:0x21 when `0x6fe88(her, 1, 0x23)` -- she is in her 1:0x23, the M78 swing -- or when his own 600-frame timer runs
  out. Positive control: his 1:0x1f starts his M79 by the same test form on her 1:0x22 (census). So he STRUGGLES through
  her M77 (the lift) and FREEZES from her M78's first frame, through the swing (her attack 0x2b at 0 / 84 / 156) and M79.
  The viewer's timing is the ROM's. If "the smash" is M78, the ROM differs from Raven: he does not struggle there.
* **She writes nothing to him in M78 / M79**: her 1:0x23 / 1:0x24 (and every action x phase, with her hooks) make no call
  on his object but action tests (census); no link field, request change (1:0x21's request 0xc stands), status, throw or
  release. His link (mode 3, joint 200) is his own and is cleared only by his 1:0x22 (`0xc20f4`), 1200 frames after the
  freeze. So joint 200 carries him back onto her back in M79 (§13 geometry), frozen and alive.
* **1:0x21 is not a stun or down state**: it is entered only from 1:0x20 as above; no hit, request or status leads there.
* **The eat** (her g1 s46 after the grab chain): selector 4 (`0xf89d48`) = he exists, his `vt+0x3f4` (`0x7fed4`: action
  status 11 or 14, or (12, 0xff)) and the same area. So she walks to him (2:0x15 / 2:0x16, L0 M8) and eats (1:0x1c, L0 M16
  b4) only if he is DEAD. Nothing in either class puts him in status 11 / 14 (his own (11, 0x26) at `0xfcee78` is his
  air-death fall, 3:0x1b); his death comes from damage, through the shared hit system. **Whether her attack 0x2b (record
  `00 00 14 00 1e 00 02 00 ... 40 ... 14 01 02 00 07`, em069_00_attackdata) can hit him is NOT READ**: the attack-record
  fields and the collision's target filter are the shared hit system's. So the ROM's chain is "if he is dead after the
  grab, she eats him" -- not "the smash kills him"; Raven's account would need that hit read. Not built: a joined "smash ->
  death -> eat" entry would assume the unread hit.
* **The dismounts, read**:
  * 1:0x13 (request 7: her shake-off M68 and her deaths): posture 1, wings 2, L4 M46 b4; at M46's end his unit moves by
    (0, 1392.5, 245) x his size, rotated by his angles (up and forward, `0xfc8d44..0xfc8e60`); L4 M47 b0, wings 2; at M47's
    end: unlinked -> vt+0x3e0 (his table), linked -> the ride.
  * 1:0x22 (the drop after the freeze): posture 1; yaw += her yaw (to world), unlink, his ground = hers; L4 M77 (its
    `_start` + `_loop`) b0; yaw + 0x8000 (180 degrees, snapped at frame 0); velocity -10 / frame down, -1 / frame^2
    (`0x7d65c`); on the ground (`0xbf0bc`) posture 0, L3 M11 (`_start` + `_loop`) b0; at its end L3 M29 b0; then vt+0x3dc.
  * His clip's root track is played in the viewer (the partner driver runs with anchorXZ off): on M46 his root rises 4.06
    above the release point and M47 starts where M46 ended (measured); how the engine adds the code's offset to the clip's
    root (whether it is the same motion counted twice) is the motion system's -- NOT READ.
* **NOT BUILT YET** (the next read): his UNLINKED logic after a dismount (vt+0x3dc / vt+0x3e0 hand back to his command
  table). Walking it needs the EMC interpreter's ops his unlinked root stream uses (0x61, 0x9e, 0x3f, 0x54, 0x0c, 0x68,
  0x0a, 0x24, 0x39; only 0x00 / 0x02 / 0x14 / 0x20 / 0x6f / 0x77 / 0x92 are read), with "no hunter" for the target ops; the
  1:0x22 drop as an entry, the code movement (1:0x13's offset, 1:0x22's fall to her ground, the 180-degree turn) and the
  landing on the floor follow it.

## 10. Not read
"""
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
