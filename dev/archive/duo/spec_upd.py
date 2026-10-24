# spec_upd.py: the 2026-10-17 follow-up (Raven: "Seltas still is not moving") into dev/em069-duo-spec.md
import io, re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
T = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\table2.md'
s = io.open(P, encoding='utf-8').read()
a = s.index('## 0. Bottom line'); b = s.index('## 1. Method')
s = s[:a] + '''## 0. Bottom line

**Re-read 2026-10-17, after Raven's look** (*"Seltas still is not moving during the Queen animations"*, *"if Seltas
is supposed to be present for animation, he needs to be enabled"*, *"akin to Nakarkos ... multiple models at the same
time"*): the `both` class was re-read against her command table's own split (§2.5) and 22 clips moved to `solo`; his
own combined clips are now on her Animation list (§9.1).

* **Classes of her 158 clips** (§6 has every one): **combined 25** (22 motions: he is on her back -- mounted whatever
  the row says, the row reads Combined), **solo 25** (24 motions: he is not on her -- never mounted; 22 of them from the
  re-read: actions only her UNLINKED streams issue), **release 5** (he leaves at the clip's frame 0 -- never mounted),
  **both 90** (her LINKED streams issue them as well -- the row decides), **unresolved 13** (12 motions no action of
  hers plays at variant 0 -- named in §6.1; treated as both).
* **What he plays where he is present**: under the 25 combined clips and the both clips that ask for him, HIS ANSWER
  (§2.2 / §3) -- measured moving in the check (max bone turn 0.65..2.19 rad). Under a both clip that asks for nothing
  he is, by the ROM, in his ride 1:0 (`0xfc7d74`): L4 M35, blend 10 (`0xfc7dd4`), **near-still** (0.072 rad over 4 s in
  the check), and at his frame 180 (`0xfc7dec`, `0xb0968` mode 1, literal 180.0 at `0xfc7e28`) he hands back to his
  own command table (`0x75230(e, 1, 0)` + `0x82454`), which picks again -- the ride, or by weight one of his riding
  attacks (L4 M31 / M32 / M33 / M34, §5). That pick is his AI's, not tied to her clip; the attacks are on her list as
  his own clips (§9.1).
* **His clip under hers is HER REQUEST, not a shared motion number** (§2). The 2026-09-14 list-4 same-name / same-number
  rule is gone; her M46 / M47 (the hunter grab that froze him) are now solo -- her linked streams never issue them.
* **The freeze in her M78 / M79 is the ROM's**: his 1:0x21 sets his motion speed to 0 (`0xb07b4(0.0)` at `0xfc99fc`,
  P+0x398 = 0, both layers multiplied by it at `0xb0844`) while the link (mode 3, `0xc210c` in his +0x28 pass) keeps
  him on joint 200 -- which her M77..M79 carry 2.2..2.7 from her tail pincers. So in game he is a rigid body swung by
  her tail: what the viewer shows. Kept; it is lag-proof (§4).
* **No Queen action kills Seltas** (§8). The "smash" is the tail grab M76..M79; the command table eats a DEAD male after
  it (g1 s52 -> s46: walk, then L0 M16) but nothing in either class deals the death -- whether her attack 0x2b in M78
  hits him is the shared hit system's, NOT READ.
* **His claws are part 10 (retracted) under every one of her clips** (§5); his own riding attacks grow them (M31: the
  massive claw, part 103, from frame 42 -- asserted). The viewer's part 103 of 2026-09-14 (Raven's choice) is
  replaced -- a difference from Raven's call, reported.

''' + s[b:]
a = s.index('### 2.4 Context corrections the walk needed'); b = s.index('## 3. The pairs')
s = s[:a] + '''### 2.4 Context corrections the walk needed

* 1:0x1c / 2:0x15 / 2:0x16 (walk to and eat the dead male) read COMBINED in the walk because g1 s46 is called after
  1:0x21 inside a linked stream; selector 4 cannot hold with him linked (above), so they are solo.

### 2.5 The re-read of `both` (2026-10-17): her linked streams vs her unlinked streams vs her events

`duo/emclink2.py` walks her table from g0 s0 (where g0 s2 splits on selector 0: linked -> g0 s4 / s13, else g0 s5 /
s3) and SEPARATELY from her event groups (g2..g20, link context unknown), op 0x92 evaluated. **Positive control**: the
split finds her known linked-only attacks (7:0x32, 0x34, 0x37, 0x39, 0x3b, 0x3d, 0x42, 0x43, 0x44, 0x4d, 1:0x21, 4:0)
on the linked side only, and her unlinked-only (7:0x15, 2:0x19) on the other.

* **Issued by her LINKED streams too** (so he can be on her): walks / turns 2:0x0, 0x1, 0x3, 0x6, 0x11, 0x12, 0x13,
  0x15, 0x1a; (4,1..4); attacks 7:0x1, 0x2, 0x3, 0x7, 0x9, 0xa, 0xf, 0x14 / 0x4 / 0x0 (M96 / M32, her calls), 0x16,
  0x19, 0x22, 0x38, 0x3a, 0x3c; 1:0x1, 0x7, 0x8, 0xd, 0xf, 0x10.
* **Issued only by her UNLINKED streams (+ event groups) and with no linked arm in their code** -> **solo** (the 22 of
  the re-read): 1:0x2 (L4 M48), 1:0x5 / 0x6 (M49 / M50), 1:0x9 / 0xa (M44 / M45), 1:0x27 / 0x28 (M90 / M91), 2:0x9..0x10
  (M55..M62), 2:0x18 (L0 M36 / M10 / M11, turn record `0x16a0cd4`), 7:0xb / 0xc (M46 / M47), 7:0x17 / 0x18 (M69 /
  M70). INFERRED for their event-group paths: those streams (g3 / g4 / g5 call g1 s18 / s39) test no selector 0 and
  their triggers are NOT READ. Kept `both` despite the same shape, because their code HAS a linked arm: 7:0x1a / 0x1e /
  0x23 / 0x27 (her hook writes request 0xe only when linked, `0xf8964c`).
* **Event groups only**: 1:0xb (g5), 1:0xc (g8 / g9), 1:0x11 / 0x12 (g13), 1:0x2b / 0x2e (g16), 1:0x20 (her g7, the
  answer group), 2:0x4, 2:0x1c, status 6 (burrow: g2 s0 / s1 first shake him off when linked -- `6f 00 00 | 6f 01 01 |
  00 01 1a` before `00 06 00`; g12 s0 / g18 issue status 6 with no link test): kept `both`.
* **His side of her flinch**: in his ride 1:0 nothing tests her; every answer of his (3:0x34..0x42, 7:0x3f / 0x40 /
  0x42, 1:0x1a, flights) tests her status 10 (number != 0x69) and leaves (`0xfc7e5c`, `0xfcf4a8`, `0xfcf9e8`, ...,
  14 sites) -- so a flinch of hers ends his answer.

''' + s[b:]
# §3: the ride sentence
s = s.replace('| any other | ride: M35 loop on her time | -- |',
              '| any other `both` clip | his ride 1:0: M35 loop on her time (by the ROM near-still; at his frame 180 his own table picks again -- ride or a riding attack, not tied to her clip) | -- |')
# §7: M46 / M47 now solo
s = s.replace('| L4 M46 / M47 | board: "what moves him: NOT FOUND" | still nothing: 7:0x0b / 0x0c (`0xf93dfc`) are a variant choice of motion and attack 0x11 -- a hunter grab; no request, no partner call, no joint-200 track | both | ride (fixes the freeze) | claws 10 |',
              '| L4 M46 / M47 | board: "what moves him: NOT FOUND" | still nothing: 7:0x0b / 0x0c (`0xf93dfc`) are a variant choice of motion and attack 0x11 -- a hunter grab; no request, no partner call, no joint-200 track; and (re-read) only her UNLINKED streams issue them | **solo** | -- (fixes the freeze) | -- |')
# the table
a = s.index('| list | clip | frames | class |'); b = s.index('### 6.1 Unresolved')
s = s[:a] + io.open(T, encoding='utf-8').read().strip() + '\n\n' + s[b:]
# §9
a = s.index('## 9. In the viewer'); b = s.index('## 10. Not read')
s = s[:a] + '''## 9. In the viewer (2026-10-17)

* render/monster.js `ROM_PARTNER_BODY.em069_00`: `classes` (with the §2.5 solos), `pairs` (`seq` pieces), `claws`,
  `partnerList`; `partnerClassOf`, `partnerPairOf`, `ROM_CLAW_SCHEDULE` / `clawStageAt` / `clawSetOf`; composeClip
  `blend`; S. Motion[76]-[79] carries her blends (piece third number) -- it is on her **Special** list, not list 4.
* index.html: `syncPartner` (every clip change mounts / drops him by class and row, also on a fresh load and a list
  change), the row locked on combined / solo / release clips with the reason as its title and its value showing
  whether he is on, `partnerClipOf` / `partnerSequenceClip` (the ROM pairs, composed on her frame counts, `layout` for
  his clip at her frame), stepAttached's one-clock time rule and the per-frame claw set, `__view.partner()` reads back
  class / mode / layout / local / clawStage / clawSet / herSide / rowValue.

### 9.1 His own clips on her Animation list (the Nakarkos model)

Raven: *"Seltas and Queen will be akin to Nakarkos where we had the tentacle animations, multiple models at the same
time"*. As Nakarkos's arms have their own l_N / r_N lists beside the body's, her Animation list now carries **S_4,
"Seltas (combined)"**: 23 of his list-4 clips (`Seltas Motion[N]`), each played on HIM while SHE plays her side of it
(`partnerList.clips`, the inverse of §3: his M6 -> her M6 + M17, M7 -> M7 + M24, M14 -> M14 + M15, M4 -> M4 + M26,
M48 -> L3 M23 + M24, M3 -> M25, M5 -> M10, M71 -> M71 / M72, M73, M45 -> M83, M8, M27, M28 (+ L0 M2), M43 -> L0 M2, M79 ->
M77, M16, M9). His ride M35 and his riding attacks M31 / M32 / M33 / M34 have no clip of hers (his table picks them
while she does anything); her side there is her L0 M1 loop, a viewer choice -- and M31 shows his claws grow to the
massive claw from frame 42. Her side is laid on his clip's frames (partnerListBodyClip); he is always mounted there.

### 9.2 The check

dev/checks/em069_00.mjs, the duo block: 42 assertions -- classes (combined M6 mounts with the row Off; solo L0 M16, L4
M29 and the re-read's M46, M47, M55, M90, L0 M10; release L4 M68, L3 M18, L3 M35; both M36 follows the row), pairs (M6,
M17 from 137, M24 from 49, M10, M83, M73, L3 M24 from 181, M77, M78 held at 4), **movement** (max bone turn over the
clip: M6 1.98, M16 0.73, M73 2.02, M83 0.91, M28 2.19, M77 2.13, M9 1.68, M14 1.57, M4 0.65 rad -- all >= 0.2; the
ride under M36 0.072, the ROM's), his list S_4 (M31: mounted with the row Off, the row reads Combined, she idles, the
claws retracted at 10 and part 103 at 50, he moves 0.99; M6: her M6 + M17), enabled after a reload and a list change
and on S. Motion[76]-[79] (Special list), sync (M72 loop across her wrap, a scrub, a pause), claws (stage 0 / set 4 /
part 10, the M31 schedule, the stage -> set rule), glow and wings, the joined layout, the blend.

''' + s[b:]
s = s.replace('* The enemy update order (§4.1)', '* Her event groups\' triggers (§2.5) -- what fires g3 / g4 / g5 / g12 / g18, so whether her\n  solo-stream moves and attacks ever run with him on her through them.\n* The enemy update order (§4.1)')
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok', len(s))
