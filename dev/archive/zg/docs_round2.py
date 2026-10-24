import os
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
def rd(p): return open(p, encoding='utf8', newline='').read()
def wr(p, s): open(p, 'w', encoding='utf8', newline='').write(s)
def app(name, text):
    p = os.path.join(D, name); s = rd(p); NL = '\r\n' if '\r\n' in s else '\n'
    wr(p, s.rstrip() + NL + NL + text.strip().replace('\n', NL) + NL); print('appended', name)

# ---- rom-map
p = os.path.join(D, 'rom-map.md'); s = rd(p); NL = '\r\n' if '\r\n' in s else '\n'
L = s.split(NL)
i = next(k for k, l in enumerate(L) if l.startswith('### The Elder Dragons and the Gore line'))
j = next(k for k in range(i + 1, len(L)) if L[k].startswith('### '))
while L[j - 1].strip() == '': j -= 1
rows = [
"| `0x9fe88` (script op 0xfe) | NOT an end: with a non-null arg it CHANGES THE ACTION to the arg's two bytes through `0x768c8` (a null arg ends the script, 0x9ffb4). scrdump.py printed every 0xfe as `end(fe)` -- read the arg | shared | R | dev/em058_00-effects-spec.md 8 |",
"| Amatsu (10, 0x72) 0x17cca80 | one op, 0xfe -> 0x17cc84c = (1, 0x14): phase 0 L3 M9 (posture 0, the fall), phase 1 L3 M8 (posture 3). The sever 0xc2274(e, 0, 0, 0x8e) at the action start + the same-update follow = the tail leaves at L3 M9 frame 0. Only 0xfe naming (1, 0x14) in the data image. Controls (same trace): Rathian 0x1794c10 L3 M15, Glavenus part 6 0x17ebbe0 L3 M15, Kushala part 2 0x17b4450 L3 M15 -> M16. Cut-tail descriptor [0x172ba68][46] = 0x1597594 (em058_00_tail via 0x159daa0[0x7d0a]); .dtp +0x78 row 0.8 / 20.0 | uEm058_00 | R + E | spec 8 |",
"| genType 20 | cParticleGeneratorSizeBillboard: factory arm 0x9bb150 -> alloc 0xa7e274 (0x1d0) / ctor 0xa7e2b0 (vtable 0x178918c, GOT 0x183c8b4); getDTI 0xa81ef4 -> MtDTI 0x211c6ac, registered at 0xa82014 with that string. Own slots: 6 0xa7e300, 8 0xa7e348, 15 0xa7e3ac, 17 0xa78598, 21 0xa7e41c, 23 0xa7faa0, 24 0xa80180. Was skipped by construct.js in Kirin u 0 / u 230, Chameleos u 290, Uragaan c 211 and Amatsu c 1600 / c 1601 (cm200_050_s) | effect runtime | R; built (construct.js GENERATOR_TYPES[20] + lift roots) | spec 8 |",
"| `0xe10f7c` (Teostra vt+0x208) | u 0 (id 1001) held while P+0x5e08 bit 1 clear and P+0x1bb not 0 / 0xff (the Fire Aura control), u 10 (1002) instead while P+0x5cb6 == 1 (writer NOT READ: left out), u 1 (1003) once as it goes out; no dying gate. Driven by the control since 2026-10-18 (Raven: \"follows the Fire Aura control\") | uEm027_00 | R | dev/em027_00-effects-spec.md 7 |",
"| Soulseer P+0x1bb bit 1 (the soul flame) | readers in uEm082_00: 0x1038f4c (the word, bits 27-29), 0x1036314 (u 300's hold on e+0xcbc0 with e+0xcb45 == 0), 0x1035ee8 (the shells' getter: 0x1039ae4, 0x103b790, 0x103c90c, 0x103cd14, 0x103cf84, 0x103cff0), 0x103778c (EMC op 0x6f selector 8), 0x1035c6c (tune 0x85 / 0x86 / 0x87). His part pass 0x10384dc and material pass 0x1037fa8 test only bits 2 / 3 (the furs). Writer 0x1039320 (the rage roars' ends); cleared in vt+0x204's tail 0x10374b0..0x10374f0 | uEm082_00 | R | dev/em082-effects-spec.md 5 |",
"| efx/proofunit.py unit_frame + vecdrawsched.py draw_all | (2026-10-18, go-ahead from the coordinator) the walker's end order: state 3 -> 4 (0xc045c0) on the next update pass, destroyed (state 0, vt+4) on the pass after (0xc045e0); and the draw gated on (+0xc & 0x4807) == 0x4802 (0xc03cd0). Sample re-recorded on both harnesses (2 w01 + 6 monster sets): every vector difference is at or after the unit's finish frame | efx harness | R | spec 7 |",
]
L[j:j] = rows
w = next(k for k, l in enumerate(L) if l.startswith('### Withdrawn'))
h = next(k for k in range(w, len(L)) if L[k].startswith('|---'))
L[h + 1:h + 1] = [
"| dev/em058_00-effects-spec.md 7 / rom-map (2026-10-18, this lane): Amatsu's tail sever \"has no clip ... the tail leaves over the motion already running\" | the script's 0xfe was read as an end; 0xfe with an arg changes the action ((1, 0x14)) | L3 M9 frame 0 (the Amatsu (10, 0x72) row); CUT_TAIL.em058_00 + '3\\|Motion[9]' drops |",
"| dev/em013-effects-spec.md 5 and dev/em024_00- / em027_00-effects-spec.md 6 relied on scrdump.py's `end(fe)` | an `end(fe)` with an arg is an action change, not an end | checked 2026-10-18: the sleep holds' 0xfe (0x17b4378 / 0x17b5aa8 / 0x17b7218) and Amatsu's 0x17ccaf8 have a NULL arg -- real ends, they stand; Amatsu's (10, 0x8e) 0x17cca88 -> (1, 2) = L1 M13 (the HP State's entry plays it) |",
]
s = NL.join(L)
wr(p, s); print('rom-map ok')

app('em058_00-effects-spec.md', """
## 8. The tail sever, re-read with controls (Raven, 2026-10-18: "monsters normally react to their tail being cut off")

**Section 7's "no clip" is wrong, and is withdrawn.**
- (10, 0x72)'s script 0x17cca80 is one op, 0xfe, with arg 0x17cc84c. The stepper's op 0xfe (0x9fe88) does not end the
  script: a non-null arg changes the action to its two bytes through 0x768c8, here **(1, 0x14)**. scrdump.py had printed it
  as `end(fe)`.
- (1, 0x14), traced:
  - phase 0: posture 0 (0xbc7f4), height calls 0xbf4d4 / 0xbf700, **L3 M9** (the fall);
  - phase 1, at its end: **L3 M8** (posture 3).
- vt+0x204 0xf08e7c cuts the tail (0xc2274(e, 0, 0, 0x8e), joint 142) at (10, 0x72)'s start. The follow runs in the same
  update, so the tail leaves at **L3 M9 frame 0**. The same holds in every posture (0..7) and only for part 6.
- **Controls, by the same trace:** Rathian (10, 0x72) -> 0x1794c10 L3 M15; Glavenus part 6 -> 0x17ebbe0 L3 M15; Kushala
  part 2 -> 0x17b4450 L3 M15 -> M16. Each is the clip the viewer's drop row is on.
- **Nothing else reaches it:** no other 0xfe in the data image names (1, 0x14), and no traced action plays L3 M9 / M8.
- **Wired:**
  - '3|Motion[9]': tail sets 13 -> 12, u 900, drops.
  - CLIP_ACTIONS (1, 0x14).
  - CUT_TAIL.em058_00: joint 142, above 20 (the .dtp +0x78 row is 0.8 / 20.0), landing u 905.
  - Descriptor [0x172ba68][46] = 0x1597594, whose resource 0x159daa0[0x7d0a] = jamcrc(em058_00_tail).

## 9. c 1600 / c 1601 and generator type 20

- **Type 20 is cParticleGeneratorSizeBillboard, read.** The chain:
  - the factory arm 0x9bb150 allocates through 0xa7e274 and constructs with 0xa7e2b0 (vtable 0x178918c);
  - getDTI 0xa81ef4 returns MtDTI 0x211c6ac;
  - 0xa82014 registers that DTI with the string.
- **Built:**
  - construct.js GENERATOR_TYPES[20] and registerCode for slots 6 / 8 / 15;
  - its own slots added as lift roots;
  - the sets that carry type-20 rows re-recorded: Kirin u 0 / u 230, Chameleos u 290, Uragaan / Crystalbeard c 211, these two.
- **c 1600 / c 1601 (cm200_050_s):** (10, 0x6c) is L3 M18 -> M12 and (10, 0x6d) is L3 M14 -> M15 -> M17 -> M18 -> M12. The
  arm 0xf09240 requests c 1600 once and holds c 1601 until L3 M12. Rows on L3 M18 A / B, L3 M14, M15, M17; exported and recorded.
""")

app('em027_00-effects-spec.md', """
## 7. u 0 follows the Fire Aura (Raven, 2026-10-18)

- Section 2's "u 0 stays on the rage" is superseded by Raven's call: u 0 follows the Fire Aura control, as the ROM does.
- vt+0x208 0xe10f7c holds id 1001 = u 0 while P+0x5e08 bit 1 is clear and P+0x1bb is not 0 / 0xff. When the aura goes out
  it stops the handle and fires id 1003 = u 1 once.
- Id 1002 (u 10) replaces u 0 while P+0x5cb6 == 1. That byte's writer is not read: u 10 is left out, named.
- **Wired:** CLASS_TIMERS.em027_00; u 0 retagged from rage to event; u 1 exported and recorded. The elders check now holds u 0
  with Fire Aura on, lets it go when off, and expects u 1 as it goes out.
""")

app('em082-effects-spec.md', """
## 5. The Soul Flame control (Raven, 2026-10-18)

- **The state:** P+0x1bb bit 1.
  - Set only by 0x1039320, at the ends of his four rage roars (1, 0x10..0x13).
  - Cleared in vt+0x204's tail (0x10374b0..0x10374f0) at an action start once EMC request 0x13 armed e+0xcb46. That clear
    also ends the rage.
- **What reads it** (every 0x1bb operand in the class band, 51, scanned):
  - the enable word 0x1038f4c (bits 27-29 in place of 24-26);
  - u 300's hold, vt+0x208 0x1036314: id 1001 on e+0xcbc0 while bit 1 is set and e+0xcb45 == 0, stopped otherwise, no dying
    gate;
  - the shells' getter 0x1035ee8 (six makers);
  - EMC op 0x6f selector 8;
  - a tune pick 0x1035c6c (floats 0x85 / 0x86 / 0x87).
  - His part pass 0x10384dc and material pass 0x1037fa8 test only bits 2 / 3 (the furs). **No part set or material clip
    changes with the flame.**
- **Wired:**
  - CLASS_CONTROLS.em082_04, "Soul Flame" Off / On (the label is a working one, for Raven);
  - the word reads it as `soulFlame`;
  - CLASS_TIMERS.em082_04 holds u 300 by the ROM's rule (e+0xcb45 is the P310 rows' `eyesOff`);
  - u 300 retagged from rage to event.
- **u 200 / 201 / 210:** the soul-flame bubbles' shell records. Exported as shell records and recorded (rec_shellrec). Taking
  the arms is the shells lane's (told).
""")
print('ok')
