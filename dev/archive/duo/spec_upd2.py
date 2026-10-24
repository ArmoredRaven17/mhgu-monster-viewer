# spec_upd2.py: grabs (geometry), the M79 pose, every coupling's frames, his decision loop -> dev/em069-duo-spec.md
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = io.open(P, encoding='utf-8').read()
assert '## 11. Every coupling' not in s
s = s.replace('| L3 M12, M18 | board: rotation tracks | **newly**: death clips (11,1) / (11,0) -- request 7, he has left at frame 0 | release | -- | -- |',
              '| L3 M12, M18 | board: rotation tracks | **newly**: death clips (11,1) / (11,0) -- request 7, he has left at frame 0; and her pincers never come within 4.9 of joint 200 in them (geometry, §13): the rotation track is joint 200 following her body, not a hold | release | -- | -- |')
s = s.replace("| L4 M96 | board: joint 200 moves | **newly**: 7:0x4 / 0x14 / 0x47, issued both ways; unlinked 7:0x14 / 0x47 make request 0xa / 0xf (his flight in), linked none -- so linked he rides joint 200 through it | both | ride | claws 10 |",
              "| L4 M96 | board: joint 200 moves | **newly**: 7:0x4 / 0x14 / 0x47 -- her CALL: joint 200 is carried up to a point above her (as in M27) and her pincers reach it (closest 2.58 at frame ~140, never closing on it); unlinked 7:0x14 / 0x47 make request 0xa / 0xf (his flight in), so in the call he is flying, not held; linked (7:0x4) no request -- he rides joint 200 there | both | his own loop (§12) | claws 10 |")
a = s.index('## 10. Not read')
s = s[:a] + r'''## 11. Every coupling, frame for frame (2026-10-17; Raven: "anytime they sync up we need to sync them up")

His frame 0 is her frame 0 of the asking action unless noted (her request is written at her setAction, his event stream
sets his motion at its phase 0; one frame later if he updates before her -- NOT READ, §4). "b" = setMotion blend.

| # | coupling | her clip @ frame | his clip @ frame | addresses | viewer |
|---|---|---|---|---|---|
| 1 | request 2, (4,0) | L4 M6 @0; M17 @0 (M6's end) | M6 @0 b0; M6 @137 | `0xf894b0`, `0xfcfb88`; he returns to 1:0 when she leaves (4,0) `0xfcfc64` | pairs M6 / M17; list S_4 M6 -> her M6 + M17 |
| 2 | request 5, (4,4) | L4 M7 @0; M24 @0 | M7 @0 b0; M7 @49 | `0xf89824`, `0xfcfb88` | pairs; S_4 M7 |
| 3 | request 6, 7:0x37 | L4 M16 @0 | M16 @0 b0; at its end 3:0x3d (M5) | `0xf89b48`, `0xfcfd88` | pair; S_4 M16 |
| 4 | request 3, 7:0x32 / 0x34 / 0x39 | L4 M9 @0; M10 @0 (M9's end, linked); 7:0x33 M11 @0 | M9 @0 b4; M5 @0 at his M9's end (103 = hers); ride M35 b10 when she enters 7:0x33 | `0xf89924`, `0xfcfeac`, `0xfd0000`, `0xfd0054` | pairs M9 / M10; M11 / M13 his own loop |
| 5 | request 8, 7:0x3b -> 7:0x36 | L4 M14 @0; M15 @0; M3 pose; 7:0x36 M4 @0; M26 @0 | M14 @0 b0; M14 @37; M3 b20 at his M14's end; 3:0x35 M4 @0 when she enters 7:0x36; M4 @39 | `0xf89b68`, `0xfcf6dc`, `0xfcf63c`, `0xfcf694`, `0xfcf760` | pairs; S_4 M14, M4 |
| 6 | request 9, 7:0x3c | L4 M25 @0 | M3 pose b40 | `0xf89b88`, `0xfcf6b8` | pair; S_4 M3 -> her M25 |
| 7 | request 0xb, 7:0x3d.. -> 7:0x3f | L4 M71 @0; M72 loop; 7:0x3f M73 @0 | M71 start @0 b0, its loop; 3:0x40 M73 @0 when she is in 7:0x3f | `0xf898d0`, `0xfd017c`, `0xfd02a8`, `0xfd0340` | pairs; S_4 M71 / M73 |
| 8 | request 0xd, 1:0x26 | L3 M23 @0; L3 M24 @0 (linked) | M48 @0 b0; M48 @181 | `0xf89ab8`, `0xfcf8e0` | pairs; S_4 M48 |
| 9 | request 0xe, 7:0x1a..0x2a | L4 M83 / M86 / M93 / M95 (+ layer-2) @0 | M45 loop @0 b10; at its end 1:0 | `0xf8964c`, `0xfd5850` | pairs; S_4 M45 -> her M83 |
| 10 | request 0x10, 7:0x4d -> 0x4e -> 0x4f | 7:0x4d L0 M1 one frame, 7:0x4e L0 M65 @0 b8, looped until his flag; 7:0x4f L4 M42 **from 90** b8 | 7:0x3f M33 @0 (record `0x16a16d4`); at his frame **105** he sets [+0xcac0]+0x6b; M35 b8 @0..40 (the record's 2nd triple); M33 **from 100** b4 | `0xf977d0`, `0xf9720c`, `0xfd92e0` -> `0xf96ecc`, `0xf93c5c`; his `0xfd5a38`, `0xfd5a40..0xfd5a88`, `0xfd5aa0`, `0xfd5d48` | S_4 "M33 with her 7:0x4e": her M65 to 105, M42 from 90; his M33 / M35 / M33 from 100. The repeats (counter +0x6c, up to 3) NOT READ |
| 11 | the tail grab, request 0xc, 1:0x21 -> 0x24 | M76 @0, she loops M76 (600-frame wait) until he is in 1:0x1f; M77 @0 b4 (her M76 end AND his 1:0x1f, `0xf8f868`); M78 @0 b0 (M77 end AND his 1:0x20, `0xf8f974`); M79 @0 b4 (M78 end AND his 1:0x21, `0xf8fb34`) | 1:0x1f M35 @0 b0; 1:0x20 M79 loop @0 b4 when he sees her 1:0x22 (`0xfc9754`); 1:0x21 when he sees her 1:0x23: **speed 0, frozen on M79 frame 187 mod 61 = 4**; at her M79 frame 80 `0xc0368`; 1200-frame timer -> 1:0x22 | `0xf89a98`, `0xfc9710`, `0xfc985c`, `0xfc99fc`, `0xfc99c0`, `0xfc9a88` | pairs; S. Motion[76]-[79] (Special list) |
| 12 | the grab combine, 1:0x1e -> 1:0x1f | M27 @0 b8 (start + loop; 600-frame wait, M29 at its end alone); M28 @0 b8 when her M27 ends with him in 1:0x1a (`0xf8f358`); L0 M2 b6 at M28's end; L0 M1 till he leaves 1:0x1b (max 180) | 1:0x1a (LINKED at start, `0xfc4b94`) M27 loop @0 b0; 1:0x1b M28 @0 b0 when he sees her 1:0x1f (`0xfc92e0`); M43 b4 at its end; 1:0 | `0xf8f298`, `0xf8f44c`, `0xfc9118`, `0xfc93cc`, `0xfc9428` | pairs M27 / M28; S_4 M27, M28 (+ her L0 M2), M43 -> L0 M2 |
| 13 | the landing | her call 7:0x0 / 0x4 / 0x14 / 0x47 (M32 / M96) -> he flies in (requests 4 / 0xa / 0xf); her 1:0 M8 @0 b8 when she sees him in 1:0x2 (`0xf931a0`) | 1:0x2 (LINKED at start, `0xfc516c`) M8 @0 b0 | `0xfc8064`, `0xf909e0` | pair M8; S_4 M8 |
| 14 | the shake-off and her falls / death, request 7 | L4 M68 @0 (1:0x1a); (10,8) / (10,0x25) L3 M10 ..; status 11 | 1:0x13: unlink at start (`0xfc5054`), M46 b4 -> M47, free flight | `0xf8972c`, `0xf8975c` | release: not shown (his flight is code-driven) |
| 15 | his separation after the freeze | (her own clip by then) | 1:0x22: unlink, M77 b0 falling, L3 M11 on landing (`0xbf0bc`), L3 M29 | `0xfc9b8c`, `0xfc9be4`, `0xfc9c88`, `0xfc9ce4` | not shown |
| 16 | her flinch cuts his answer | any status-10 clip (number != 0x69) | his answer leaves (14 tests); his ride and riding attacks do not | §2.5 | her flinch clips ask nothing -> his own loop |
| 17 | her wait for him | `0xf8ae90`: request k cleared when he reaches the named action -- a flag; her motion does not wait on it. Her actions that DO wait test his action directly (1:0x1e, 1:0x1f, 1:0x21..0x24, 7:0x0 / 0x4 / 0x47 above) | -- | -- | as above |

## 12. His own logic where nothing couples them (Raven: "Where he is mounted but free to make choices, we let Seltas follow his logic")

* **The ride** 1:0 (`0xfc7d74`): L4 M35 b10 (`0xfc7dd4`); at his frame 180 (`0xfc7dec`, `0xb0968` mode 1, 180.0 at
  `0xfc7e28`) `0x75230(e, 1, 0)` + `0x82454` hand him to his command table.
* **The draw**: his linked stream g0 s4 (variant 0) branches on selector 2 (her action class, `0xfc5540`: her 2:0 = 1,
  7:1 = 3, 7:0x3a / 0x41 = 4, 7:0x1a..0x2a = 5, 7:0x4d / 0x4e = 6, 7:0x50 = 7, else 0) and then op 0x77; under op 0x77's
  case 0 every class carries the same op 0x02 weights: **20 -> 7:0x32 (L4 M31, b8), 30 -> 7:0x33 (L4 M32, b8), 40 ->
  7:0x33 then g1 s76 / s30 (the ride), 10 -> the ride**. Op 0x02 draws `0x49634()` = the game's xorshift128 (`0x7c9234`:
  t = s0; s0..s2 shift down; t ^= t << 15; t ^= t >> 4; t ^= s3 ^ (s3 >> 21); s3 = t), low 16 bits (`0x3f76e4`), against
  cumulative weights out of 100 (`0x857dc..`). Each attack runs whole (claws on M31 grow at 30, shrink at 134; M32 at 22
  / 190) and queues the ride (`0xfd46e8`, `0xfd480c`). His attacks have no test of her flinch.
* **INFERRED** (named): op 0x77's case is 0 -- its value slot is written 0 for mode 0 (`0x84f8c`); the block parser
  `0x8e088` was not read through. Op 0x1d (g1 s1) passes; selector 5 ([+0xcac0]+3) and 7 (her [+0xcac0]+0x3e) read 0.
  Cases 1 / 2 / default of op 0x77 (with 7:0x34 / 0x39 / 0x3c / 0x3d -- his M33 attacks) are not taken.
* **The viewer** (render/monster.js `free`, `xorshift128`, `freeTimeline`; index.html `partnerFreeClip`): the same
  generator, seeded by her clip (FNV-1a of 'list|clip'), lays 60 s of his ride / draw / attack on one composed clip with
  the blends; her loop passes run on along it (a pass of hers does not replay the last one's choices); a scrub, a pause
  or a fresh play of her clip gives the same choices at the same frames. Every coupling (§11) overrides it. Checked: her
  L4 M41 gives ride 180, M32, ride, M32, ... (draws 68, 56, 33, 41, 4 -> M31 ...), reproducible on a scrub, the claws
  growing on the attack.

## 13. The grab clips by geometry, and the M79 pose

Distance from the midpoint of her tail pincers (joints 160 / 161) to his root, with him mounted, every 4th frame of all
158 clips (`duo/grab-scan.mjs`, `duo/grab-detail.mjs`):

| her clip | his root to her pincers | reading |
|---|---|---|
| L4 M27 loop | 1.80..2.00, every frame | she holds her pincers at him as he hovers (he is linked, his M27 loop) |
| L4 M28 | 0.43..1.96 frames 0..~220, then 2..9.5 | carried, set down on her back from ~224 |
| L4 M76 loop | 2.18..2.26 | her pincers over him on her back (the wait) |
| L4 M77 | 1.03..1.67, every frame | held in the tail (his M79 loop, struggling) |
| L4 M78 loop | 0.60..1.20, every frame | held, swung (frozen) |
| L4 M79 | 0.63..1.10 to frame ~128, then back to her back by ~150 | held, then returned |
| L4 M96 | 2.58 at best (frame ~140) | a reach toward the hover point -- not closing on him |
| L3 M12, M18 | joint 200 never within 4.9 of her pincers | not a hold; he has left (request 7) |

No other clip brings her pincers within 2.5 of joint 200 while it stays there (the closest others, her moves M49 / M50 /
M55..M62 at 2.9..4.1 with joint 200 riding her back, are solo). The check holds his root within 2.2 / 2.1 / 1.8 / 1.4 / 1.3
of her pincers through M27 loop / M28 (to 220) / M77 / M78 / M79 (to 128) -- max 2.00 / 1.96 / 1.66 / 1.20 / 1.10.

**The M79 pose (Raven: "not only stiff, but the pose is also odd looking"), every link checked:**
* (a) His 1:0x20 sets 0x44f = list 4 index 79 (`0xfc985c`); his LMT em076_00_4 entry 79 is 61 frames, loop frame 0;
  monsters.json's list 4 'Motion[79]_loop' (61 frames) is that entry. Same motion.
* (b) His M79 starts at his 1:0x20 phase 0, from frame 0, blend 4, when he sees her 1:0x22; it freezes when he sees her
  1:0x23, after her 187-frame M77 -- both changes carry the same lag, so the held frame is 187 mod 61 = 4 (3 or 5 if her
  "ended" flag, motion-layer bit 2 at `0x94dc04`, is raised a frame off -- NOT READ to the frame). The blend (4 frames)
  has long finished. `0xb07b4` writes P+0x398 = 0 and multiplies it into the layer speed passed to `0x5393d0` (layer 0)
  and the second layer (`0xb0848..`); nothing in 1:0x21 sets a motion again.
* (c) Nothing else poses him: his vt+0x2a0 only scales the wing joints 150..153 (+0x49 = 0 here: hidden, as Wings Away);
  her vt+0x2a0 writes HER joints 2..9 (`0x7237c` on her); the link writes his root only (mode 3, `0xc210c`).
* (d) The viewer holds exactly that frame: his pose under her M78 equals his M79 loop played solo on Seltas at frame 4
  (largest bone difference 0.006 rad; frames 3 / 5 differ by 0.14 / 0.13, frame 10 by 0.98). The hold samples the raw
  clip (no composeClip) at 4 / 60, a key time; bind fills are the same as solo.
* **So the odd pose is the ROM's**: his M79 is a struggle loop (per-frame bone turns of 0.3..0.7 rad all through it, a
  1.52 rad jump at its wrap on gid 90), and frame 4 is one instant of it -- held rigid for her whole M78 and the first
  ~130 frames of M79: his joint 5 (node `9:5`) is turned 1.41 rad (81 degrees) from his ride pose, joint 139 0.56,
  his legs (gids 28, 18, 23, 33) about 0.4 each. Nothing to fix in the viewer.

''' + s[a:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
