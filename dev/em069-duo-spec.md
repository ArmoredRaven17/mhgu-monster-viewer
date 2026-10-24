# Seltas Queen (em069_00) + Seltas (em076_00) -- every clip of hers, combined or not, and his clip under it

Seltas duo agent, 2026-10-17. Raven: *"Review all Seltas Queen and Seltas combined animations"*, *"Ensure we do not
allow them to be combined when they are not meant to be combined"*, *"ensure Seltas is in the correct form (mainly
his claws) while combined"*, *"There are also some animations where Seltas is grabbed by the Queen ... But not all"*,
*"the animations where she grabs him to smash him to death, he freezes up currently"*, *"We need to ensure their
animations are sync'd up more."*

ROM: `C:\MHGU-ROM\exefs` main.text. Her class uEm069_00 (vtable `0x17e0eb8`, action main `0xf9973c`), his uEm076_00
(vtable `0x17e5e84`, action main `0xfd8efc`). Command tables `scratch-em\em069_00\...\em069_00_cmdtbl.emc` and
`em076_00_cmdtbl.emc`. Earlier reads this builds on: the board's duo section (`C:\Coding Repos\MHGU-TASKS.md`,
"Seltas Queen + Seltas duo form"), `states-em069_00.md` §10. **Status words**: READ = the consuming instruction was
read; EMULATED = the instructions ran under the tracer (below) and the gate address is the instruction that read the
field; INFERRED / NOT READ as written.

## 0. Bottom line

**LAYOUT AND RELEASE (2026-10-17, latest -- §9.3, §15):** her raw lists 0 / 3 / 4 play the Queen ALONE; one list,
**"Combined (with Seltas)"** (id `duo`), holds every animation the ROM plays with him: 44 required clips of hers, the
joined S. Motion[76]-[79], 5 clips of hers where he LEAVES her (request 7, `+ Seltas leaves`: released at her frame 0 into
world space, his M46 then M47), his 7 own clips, and 95 of her both clips with him on his own decision loop
(`+ Seltas free`) -- 152 entries. The Off / Combined row and the Special list (it held only the duo clip) are gone.
**The male she carries back on her back after the tail grab is NOT dead**: his 1:0x21 freezes him (speed 0) for a
1200-frame timer and he stays linked; her M79 carries joint 200 back onto her back, so he rides there rigid until about
844 frames after her M79 ends, then his 1:0x22 unlinks him and he drops off (§15). What the viewer shows under M78 / M79
is that ROM state; the joined clip is not extended (no clip of hers holds the drop).

**FINAL STATE (2026-10-17, after the full audit, §14 -- supersedes the counts below where they differ):** of her 158
clips **combined (he is required, mounted whatever the row says) 44, both 95, solo 3, release 5, unresolved 11**. The
22 "solo" of the first re-read are `both` again (her awareness event groups issue them with no link test). His frozen
M78 / M79 pose is his M79 **frame 6** (read to the frame: 186 advances mod the game period 60), not 4; his M79 under her
M77 runs at period 60.

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

## 1. Method and tooling (<archive> `duo/`)

| tool | what it does | control |
|---|---|---|
| `tracer.py` | runs ONE action phase of either class under unicorn (notice-scratch/probe.py's model) and records every setMotion (`0xafce8/0xafe84/0xafe8c/0xafef0/0xb032c`, two-layer `0xb03f8/0xb04d0`), script (`0xa1290`), change (`0x768c8/0x75230/...`), partner test (`0x6fe88` on the partner, answered by scenario), READ of `P+0x1bb` / `e+0x7420` / `[+0xcac0]+0x18/+0x35/+0x38` with the reading pc, writes of the same, and every call made with r0 = the partner | reproduces the board's 1:0x21..0x24 / 1:0x1f..0x22 read exactly (M76..M79, M35, M79, the speed-0 call, M77 + L3 M11 + L3 M29) |
| `census.py` | every (status, n) x phase 0..7 x link 0/1 x 4 scenarios, both classes | -- |
| `agg.py` / `ctx.py` | motions per action and per link side; the LINK CONTEXT of every action = the EMC issue tags propagated along the actions' own changes | -- |
| `emclink.py` | the command table walked with the link bit as context: op 0x6f selector 0 evaluated (both classes' callback case 0 is `P+0x1bb & 1`: hers `0xf89c5c`, his `0xfc528c` -> `0xfc532c`), **op 0x92 (variant) evaluated for variant 0** | without op 0x92 her 7:0x50 (g1 s82) and his 7:0x34 / 0x39 from g0 s4 read as reachable; with it 7:0x4d (g1 s81, from g0 s13's variant-0 part) stays and 7:0x50 goes -- the variant switch is what decides, the walk sees both |
| `hook204.py` | runs each class's on-action-start hook (vt+0x204) for every action, records the request written to `[+0xcac0]+0x18`, `P+0x1bb` writes, link / unlink calls | -- |
| `j200.py` | every clip on her three pose lists whose joint 200 has an animated track | finds exactly the board's carriers (L4 M27, M28, M76..M79, M96; L3 M12 / M18 rotation); L4 M47 constant (§7) |
| `table.py` | the §6 table | -- |
| `dev/checks/em069_00.mjs` | headless page check (§9) | -- |

## 2. Who asks, who answers

### 2.1 The link

* **His bit is the link; hers is a copy.** Her vt+0x1dc (`0xf8a978`) every frame: partner `[+0xcac0]+0` alive ->
  `P+0x1bb` bit 0 = his (`0xf8aae8` tst, `0xf8ab00` set / `0xf8aaf4` clear); partner dead (`vt+0x3f4` = 1) ->
  cleared (`0xf8aa90`). EMULATED + READ.
* **He links at the START of his actions** (his vt+0x204 = `0xfc4728`, EMULATED for every action): **1:0x1a** (the grab
  combine) `0xfc4b94` with the size-difference offset, bit set `0xfc4bbc`; **1:0x2** (the landing) `0xfc516c`,
  `0xfc5194`; 1:0x20, 3:0x33, 6:0x4 also `0xfc4b94`; 13:1 `0xfd7dc8` (the board's "combine action"). A start with the bit
  set and no link relinks with offset (0, 0, 80) (`0xfc48e0`).
* **He unlinks at the start of 1:0x13, 1:0x22** (`0xfc5054`, bit cleared `0xfc5088`) and **1:0x12** (`0xfc521c`), at
  his 7:0x3f when she is in status 10 (number != 0x69) (`0xfd58e4` -> `0xfd5950`), and every frame when she is gone
  (`[partner+0xc] & 7` not 1..2, `0xfc59c8` -> `0xfc5b40`). His death clears the bit (`0xfc5eac`, status 0xb).

### 2.2 Her requests and his answers

Her on-action-start hook (vt+0x204 = `0xf89228`) writes a request k into `[+0xcac0]+0x18`; her frame pass `0xf8ae90`
(jump table `0xf8aed8`, k - 2) waits until he is in the action k names and then clears it; he runs **his event group 7
stream k** (em076_00_cmdtbl.emc g7 sk). Requests EMULATED (hook204.py); his streams READ from the file; his actions
EMULATED (`s_answers.txt`).

| k | her actions that ask (link) | his stream g7 sk | his action: motion (blend, start) and what ends it |
|---|---|---|---|
| 2 | (4,0) (linked) `0xf894b0` | 3:0x38 | L4 M6 b0 `0xfcfb88`; when she leaves (4,0) -> 1:0 (`0xfcfc64` / `0xfcfc90`); his M6 ending first -> 3:0x3d (M5 loop) |
| 3 | 7:0x32 / 0x34 / 0x39 / 0x41 (linked) `0xf89924` | 3:0x3c, or 3:0x42 when her class (0xfc5540) is 4 (7:0x3a / 0x41) | 3:0x3c: L4 M9 b4 `0xfcfeac` -> M5 b0 at its end `0xfd0000`; 3:0x42: M5 b4 `0xfd05fc`; when she leaves 7:0x32/34/39/41/3a/1:0x26 -> 1:0 (`0xfd0054` / `0xfd072c`) |
| 4 / 0xa / 0xf | 7:0x0 / 7:0x14 / 7:0x47 (UNlinked) `0xf89b08` / `0xf89b28` / `0xf89b98` | flights (3,3) / (3,5) / (3,0x20) / (1,1) / (1,3) / ... | his flight to her; they end in **1:0x2** (L4 M8, link at start) or 1:0x1a -- the call-and-land combine (§7) |
| 5 | (4,4) (linked) `0xf89824` | 3:0x39 | L4 M7 b0 (wings 2) `0xfcfb88`; she leaves (4,4) -> 1:0 |
| 6 | 7:0x37 (linked) `0xf89b48` | 3:0x3a | L4 M16 b0 `0xfcfd88`; its end -> 3:0x3d |
| 7 | 1:0x1a (linked) `0xf8972c`; (10,0x8), (10,0x25) linked; every status 11 linked `0xf8975c` | 1:0x13 | **unlink at start** (`0xfc5054`); L4 M46 b4 -> M47 b0 (`0xfc8e84`), wings 2; then 1:0 only if linked |
| 8 | 7:0x3b (linked) `0xf89b68` | 3:0x3b | L4 M14 b0 `0xfcf6dc` -> M3 b20 at its end `0xfcf63c`; she leaves 7:0x3b -> 3:0x35: L4 M4 b0 `0xfcf760`; she leaves 7:0x36 -> 1:0 |
| 9 | 7:0x3c (linked) `0xf89b88` | 3:0x3e | L4 M3 b40 `0xfcf6b8` (-> M3 b20); she leaves 7:0x3c -> 3:0x35 (M4) |
| 0xb | 7:0x3d / 0x3e / 0x40 / 0x42 / 0x43 / 0x44 (linked) `0xf898d0` | 3:0x3f | L4 M71 b0 `0xfd017c`; she in 7:0x3f -> 3:0x40: L4 M73 b0 `0xfd0340` (`0xfd02a8`); otherwise she leaving the set -> 1:0 |
| 0xc | 1:0x21 (linked) `0xf89a98` | 3:0x41 then 1:0x1f | 1:0x1f: L4 M35 b0 `0xfc9710`; she in 1:0x22 -> 1:0x20: L4 M79 b4 `0xfc985c`; she in 1:0x23 -> 1:0x21: **speed 0** `0xfc99fc`, 1200-frame timer -> 1:0x22 (unlink, M77, L3 M11 on landing, L3 M29) |
| 0xd | 1:0x26 (linked) `0xf89ab8` | 3:0x36 | L4 M48 b0 `0xfcf8e0`; its end -> 3:0x3d |
| 0xe | 7:0x1a..0x21, 7:0x23..0x2a (linked) `0xf8964c` | 7:0x3b | L4 M45 b10 `0xfd5850`; its end -> 1:0 |
| 0x10 | 7:0x4e `0xf89bec` | 7:0x3f | turn record `0x16a16d4` (L4 M33 x3 variants + M35) via `0x7a258` (`0xfd5a38`), repeated through `[+0xcac0]+0x6c` (up to 3), flag `+0x6b` for her (`0xfd92e0`); NOT fully read (§10) |
| 0x11 / 0x12 | 7:0x50 / 7:0x49 | 7:0x40 / 7:0x42 | variant 1 only (§7.3) |
| none | every other action | -- | **his 1:0 ride: L4 M35 b10 (`0xfc7dd4`)**, wings 0 |

### 2.3 What makes a clip combined, solo or release (the gates)

* The command table: g0 s2 sends linked (`6f 00 00 | 6f 01 01`) to g0 s4 / s13 (combined streams), else g0 s5 (partner
  in her area) / s3. `emclink.py` gives her linked-only actions: 1:0x1a, 1:0x21, 4:0, 7:0x0a, 7:0x32, 0x34, 0x37, 0x39,
  0x3b, 0x3d, 0x42, 0x43, 0x44, 0x4d (and 1:0x1c / 2:0x16, §2.4); unlinked-only 1:0x02, 2:0x19, 7:0x15.
* Arms inside her actions that read the bit (EMULATED, the pc is the read): 4:0 `0xf92b08` (M17 only linked);
  7:0x32/34/39 `0xf949a4` / `0xf94a18` (linked: M10 then 7:0x33; else 1:0x20); 7:0x35/0x3b `0xf94fe0` (M15 only linked);
  7:0x3a/0x41 `0xf95a00`; 7:0x37 `0xf9543c`; 7:0x38 `0xf95588`; 7:0x3c `0xf95c14`; 1:0x26 `0xf8fd4c` / `0xf8fda4`
  (L3 M24 only linked); 7:0x3d.. `0xf95d14..0xf95d6c`. 7:0x36 is entered only from the linked M3 phases
  (`0xf950ac`, `0xf95c0c`, each behind `0x78b78(e, 0, 0x92 / 0x180)`, whose meaning is NOT READ).
* Combined chains: 1:0 (her M8) is entered only by 7:0x0 / 0x4 / 0x47 seeing him in his 1:0x2 (`0xf931a0`); 1:0x1f (M28)
  only from 1:0x1e seeing his 1:0x1a (`0xf8f33c`); 1:0x22..0x24 only from the previous one seeing his answer.
* **solo**: L0 M16 -- 1:0x1c, issued from g1 s46 only when selector 4 (partner exists, DEAD, same area; `0xf89c5c` case 4)
  holds; a dead male has no bit (`0xfc5eac`, `0xf8aa90`). L4 M29 -- 1:0x1e's timer arm when he never reached 1:0x1a
  (`0xf8f3a8`).
* **release**: request 7 at frame 0 -- L4 M68 (1:0x1a, she shakes him off) and the death-only reaction clips L3 M12,
  M18, M35, M36 (every action that plays them is status 11, whose hook writes request 7 when linked, `0xf8975c`).
  Clips shared between a release action and another stay `both` (L3 M5, M7, M10, M11, M14, M21, L0 M19).

### 2.4 Context corrections the walk needed

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

## 3. The pairs the viewer plays (render/monster.js `ROM_PARTNER_BODY.em069_00.pairs`)

Her clip -> his clip and time rule. `start` is his frame when her clip starts: his clip continues across her second
clip of the same action (one motion of his under two of hers -- the lengths agree to a frame: his M6 195 = her M6 137 +
M17 57 + 1; M7 97 = 49 + 47 + 1; M14 119 = 37 + 81 + 1; M4 227 = 39 + 187 + 1; M48 239 ~ her L3 M23 181 + M24 61).

| her clip | his clip, rule | from |
|---|---|---|
| L4 M6 / M17 | M6 play from 0 / from 137 | k 2 |
| L4 M7 / M24 | M7 play from 0 / from 49 (also her 1:0x20, which makes no request -- (4,4) taken) | k 5 |
| L4 M16 | M16 play | k 6 |
| L4 M9 / M10 | M9 play (b4), then M5 loop / M5 loop | k 3 |
| L4 M11, M13 (7:0x33) | ride (he returned to 1:0 when she left 7:0x32) | -- |
| L4 M14 / M15 / M3 loop | M14 from 0 / from 37 then M3 pose (b20) / M3 pose | k 8 |
| L4 M25 | M3 pose (b40) | k 9 |
| L4 M4 / M26 | M4 from 0 / from 39 | his 3:0x35 |
| L4 M71 / M72 loop / M73 | M71 start + loop / M71 loop from 9 / M73 | k 0xb |
| L4 M83, M86, M93, M95 (+ their layer-2 M82, M84, M85, M87, M92, M94) | M45 loop (b10) | k 0xe |
| L4 M8 | M8 play (his 1:0x2, the landing) | his flight |
| L4 M27 start / loop, M28 | M27 loop / M27 loop from 26, M28 | 1:0x1a / 1:0x1b |
| L3 M23 / M24 | M48 from 0 / from 181 | k 0xd |
| L4 M76 / M77 / M78 / M79 | ride / M79 loop (b4) / M79 loop held at 4 / held at 4 | k 0xc |
| any other `both` clip | his ride 1:0: M35 loop on her time (by the ROM near-still; at his frame 180 his own table picks again -- ride or a riding attack, not tied to her clip) | -- |

## 4. Timing (Raven: "sync'd up more")

1. **Start frame.** Her request is written at her setAction (vt+0x204 runs inside it, states-em043.md §0 step 3); his
   event stream sets his motion at its phase 0. With the two in one frame he starts on her frame 0. **The update order
   of the two enemies is the slot order of the enemy manager (`0x5cdf8`, ten slots), which follows spawn order --
   NOT READ for any quest** (the unit manager's loop over the +0x24 / +0x28 passes was searched for and not found
   here); if he updates first, every answer starts one frame late. The viewer starts him on her frame 0.
2. **The link reads her joint after her motion advanced**: the link is applied in his +0x28 pass (`0xae370` ->
   `0xc210c`), her motion advance is in her +0x24 (states-em043.md §0); INFERRED that every unit's +0x24 runs before
   any +0x28 (two passes). The viewer places him on her joint as drawn this frame.
3. **The freeze is lag-proof**: his M79 starts when he sees her 1:0x22 and freezes when he sees her 1:0x23; both
   transitions carry the same lag, so the held frame is (her M77 length) mod (his M79 loop) = 187 mod 61 = **4** either
   way.
4. **Blends** are the setMotion s0 of each change (listed in §2.2 / §3) and are now modelled where a clip is
   joined (render/monster.js composeClip `blend`: linear weight, quaternion slerp -- the ROM's blend curve itself is NOT
   READ): her M77 b4 and M79 b4 in S. Motion[76]-[79], his M79 b4, M3 b20 / b40, M9 b4, M45 b10. A single clip played
   alone has no previous pose to blend from.
5. **Speeds**: his only speed change is the 1:0x21 freeze (0.0). Her enraged rate (1.25, states-em069_00.md 4.2) is not
   in the viewer for either.
6. **One clock**: his driver's time is set from hers on every step (stepAttached), never advanced on its own; a
   composed pick is her clip's own length in whole frames (seqFrames), a `wrap` is (start + her time) mod his length.

## 5. His form while combined

* **Claws** -- stage `[+0xcac0]+0x38` (float), state `+0x35`, machine `0xfc5ec0` (in his frame pass): 1 = grow +1.0 a frame
  (`0x7264c`) to 12, then 2 = held at 12 (`0xfc5f4c`), 3 = shrink -1.0 a frame (`0x7206c`) to 0, 0 = stage 0
  (`0xfc5f84`). **His vt+0x204 zeroes both at every action start** (`0xfc4808`, `0xfc4810`, EMULATED for every action).
  Writers of state 1 / 3: 7:0x0 / 0x1 / 0x8 / 0xd (`0xfd180c`, `0xfd18dc`, `0xfd1a6c`, `0xfd1a90`), 7:0x14 / 0x15
  (`0xfd43dc..0xfd4478`) -- solo L2 attacks -- and **his riding attacks 7:0x32 (L4 M31: grow at f30 `0xfd4698`, shrink at
  f134 `0xfd46bc`) and 7:0x33 (L4 M32: f22 `0xfd47ac`, f190 `0xfd47d0`, and at its end `0xfd47f4`)**. None of his
  answers in §2.2 writes it. Set by stage (`0xfc63d8..0xfc651c`): < 4 set 4 (part 10), <= 8 set 9 (11), < 12 set 10 (12),
  else set 11 (103). **So under every one of her clips: stage 0, part 10.** His own riding attacks (7:0x32 / 0x33 /
  0x34 / 0x39 / 0x3a / 0x3c / 0x3d / 0x3e: L4 M31, M32, M33, M34) are chosen by HIS command table while combined (g0
  s4 / g1 s1, s3, s64, s73, s74), independent of her clip -- not pairable to a clip of hers.
* **Glow** -- group 8 (part 9) while his bit is set (`0xfc6468`): on, every mounted clip. `ride_on` on XfB__m01_eye when
  the bit changes (`0xfc6378`): kept.
* **Wings** -- `[+0xcac0]+0x49` per answer (EMULATED writes): 0 in 1:0, 1:0x1f, 1:0x20, 1:0x1b, 3:0x38, 3:0x3f, 3:0x40,
  3:0x36, 7:0x3b; **2 (sets 6, all four cards) in 3:0x39 (M7), 3:0x3a (M16), 3:0x35 (M4), 3:0x3c's M5, 3:0x42, 3:0x3e
  (M3), 3:0x3b's M3, 1:0x13 (M46 / M47), 1:0x1a (M27)**; 1 (set 5) in 3:0x3b's M14 (`0xfcf6c8`). The cards are scaled by
  `0xfc66f8` (flapping) while +0x49 != 0. The viewer keeps Raven's Wings Away on the mounted Seltas, as on solo
  (part-review.json) -- a viewer rule; the ROM shows wings out on those answers.
* **Horn** -- break 0 group 3 (intact): unchanged.

## 6. Every clip of hers

`class`: combined / solo / release / both as §2.3; **unresolved** = no action of hers plays it at variant 0.
`her actions`: the action, blend b and start s of the setMotion and its site, or the status-10/11 scripts
(probe: parts 0 / 2 / 4 / 6, direction 0), or the motion record.

| list | clip | frames | her actions (stream context) | he is | why | his clip, frames | his form (claws / glow / wings in the ROM) |
|---|---|---|---|---|---|---|---|
| 0 | Motion[1]_loop | 301 | (0,0x0) code chain only; (0,0x1) code chain only; (0,0x7) code chain only; (1,0x1f) code chain only; (1,0x2a) code chain only; (12,0x0) shared reaction / death; (6,0x3) event-only; (7,0x4d) AI-linked; (7,0x50) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[2] | 371 | (1,0x1f) code chain only; (1,0xb) event-only; (1,0xf) AI-both+E; (13,0x0) shared reaction / death | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[4] | 441 | (1,0x29) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[5] | 263 | (1,0x2d) code chain only; (1,0x2e) event-only; (1,0xd) AI-both+E; (10,0xbd) shared reaction / death; (10,0xbe) shared reaction / death; status 10/11 scripts: (10,0xbd) (10,0xbe) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[7]_start | 50 | (2,0x1a) AI-both; (2,0x1b) AI-solo+E; (2,0x1c) event-only; (2,0x4) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[7]_loop | 100 | (2,0x1a) AI-both; (2,0x1b) AI-solo+E; (2,0x1c) event-only; (2,0x4) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[8]_start | 130 | (16,0x3) shared reaction / death; (2,0x1) AI-both; (2,0x13) AI-both+E; (2,0x16) AI-linked; (2,0x19) AI-solo; (2,0x2) AI-solo+E; (2,0x3) AI-both+E; (6,0x2) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[8]_loop | 120 | (16,0x3) shared reaction / death; (2,0x1) AI-both; (2,0x13) AI-both+E; (2,0x16) AI-linked; (2,0x19) AI-solo; (2,0x2) AI-solo+E; (2,0x3) AI-both+E; (6,0x2) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[9] | 65 | (16,0x4) shared reaction / death; (2,0x1c) event-only; (7,0x51) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[10] | 157 | (2,0x18) AI-solo+E; (2,0x18) turn record 0x16a0cd4 (0x7a258 / 0x7a27c) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[11] | 157 | (2,0x18) AI-solo+E; (2,0x18) turn record 0x16a0cd4 (0x7a258 / 0x7a27c) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[12] | 143 | (2,0x0) AI-linked+E; (2,0x15) AI-both; (2,0x0) / (2,0x15) turn record 0x16a0ee4 via table 0x17e1330 (0x7a284 / 0x7a2a8) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[13] | 143 | (2,0x0) AI-linked+E; (2,0x15) AI-both; (2,0x0) / (2,0x15) turn record 0x16a0ee4 via table 0x17e1330 (0x7a284 / 0x7a2a8) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[14]_loop | 301 | (0,0x2) code chain only; (1,0x10) AI-both; (1,0x13) code chain only; (1,0xe) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[16]_start | 104 | (1,0x14) code chain only; (1,0x1c) AI-linked | **solo -- not shown** | not on her (L0 M16: the dead male eaten; L4 M29: he never came) | - | - |
| 0 | Motion[16]_loop | 216 | (1,0x14) code chain only; (1,0x1c) AI-linked | **solo -- not shown** | not on her (L0 M16: the dead male eaten; L4 M29: he never came) | - | - |
| 0 | Motion[17] | 203 | (1,0x15) code chain only; (1,0x1d) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[18] | 307 | (1,0x16) code chain only; (1,0x2b) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[19]_loop | 171 | (1,0x16) code chain only; (10,0x1e) shared reaction / death; (10,0xbb) shared reaction / death; (11,0x10) shared reaction / death; status 10/11 scripts: (10,0x1e) (10,0xbb) (11,0x10) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[21] | 29 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[22] | 37 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[23] | 51 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[24] | 85 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[25] | 41 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[26] | 149 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[27] | 75 | (2,0x14) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[28]_start | 12 | (2,0x14) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[28]_loop | 44 | (2,0x14) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[36] | 65 | (2,0x18) AI-solo+E; (2,0x18) turn record 0x16a0cd4 (0x7a258 / 0x7a27c) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[65] | 143 | (2,0x6) AI-both+E; (7,0x4e) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[33] play | claws 10 (stage 0), glow on, wings folded (0) |
| 0 | Motion[66] | 197 | (2,0x11) AI-both+E; (6,0x0) event-only; (6,0x4) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[67] | 17 | (2,0x11) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[68] | 177 | (2,0x11) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[69] | 77 | (2,0x12) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[70] | 7 | (2,0x12) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[71] | 191 | (12,0x0) shared reaction / death; (2,0x12) AI-both+E; (6,0x3) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 0 | Motion[72] | 45 | (6,0x0) event-only; (6,0x4) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[1] | 221 | (10,0x6e) shared reaction / death; (10,0x7) shared reaction / death; (10,0x94) shared reaction / death; status 10/11 scripts: (10,0x6e) (10,0x7) (10,0x94) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[2] | 319 | (10,0x14) shared reaction / death; (10,0x7) shared reaction / death; status 10/11 scripts: (10,0x14) (10,0x7) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[3] | 75 | (10,0x14) shared reaction / death; (10,0xa7) shared reaction / death; status 10/11 scripts: (10,0x14) (10,0xa7) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[4] | 75 | (10,0x14) shared reaction / death; (10,0xd2) shared reaction / death; status 10/11 scripts: (10,0x14) (10,0xd2) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[5]_loop | 111 | (10,0x14) shared reaction / death; (10,0x53) shared reaction / death; (10,0x8) shared reaction / death; (10,0xa7) shared reaction / death; (10,0xb5) shared reaction / death; status 10/11 scripts: (10,0x14) (10,0x53) (10,0x8) (10,0xa7) (10,0xb5) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[6]_loop | 111 | (10,0x14) shared reaction / death; (10,0x20) shared reaction / death; (10,0xd2) shared reaction / death; status 10/11 scripts: (10,0x14) (10,0x20) (10,0xd2) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[7] | 137 | (10,0x14) shared reaction / death; (10,0x25) shared reaction / death; (10,0x53) shared reaction / death; (10,0x8) shared reaction / death; (10,0x96) shared reaction / death; (10,0xa7) shared reaction / death; (10,0xb5) shared reaction / death; status 10/11 scr | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[8] | 137 | (1,0x17) code chain only; (1,0x2c) code chain only; (10,0x14) shared reaction / death; (10,0x20) shared reaction / death; (10,0x44) shared reaction / death; (10,0x45) shared reaction / death; (10,0xbc) shared reaction / death; (10,0xd2) shared reaction / death | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[9] | 225 | (10,0x1b) shared reaction / death; (10,0x52) shared reaction / death; (10,0xb4) shared reaction / death; status 10/11 scripts: (10,0x1b) (10,0x52) (10,0xb4) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[10]_start | 66 | (10,0x25) shared reaction / death; (10,0x53) shared reaction / death; (10,0x8) shared reaction / death; (10,0x96) shared reaction / death; (10,0xb5) shared reaction / death; (11,0x1) shared reaction / death; status 10/11 scripts: (10,0x25) (10,0x53) (10,0x8) ( | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[10]_loop | 40 | (10,0x25) shared reaction / death; (10,0x53) shared reaction / death; (10,0x8) shared reaction / death; (10,0x96) shared reaction / death; (10,0xb5) shared reaction / death; (11,0x1) shared reaction / death; status 10/11 scripts: (10,0x25) (10,0x53) (10,0x8) ( | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[11] | 67 | (10,0x25) shared reaction / death; (10,0x53) shared reaction / death; (10,0x8) shared reaction / death; (10,0x96) shared reaction / death; (10,0xb5) shared reaction / death; status 10/11 scripts: (10,0x25) (10,0x53) (10,0x8) (10,0x96) (10,0xb5) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[12] | 47 | (11,0x1) shared reaction / death; status 10/11 scripts: (11,0x1) | **release -- not shown** | request 7 at frame 0: he unlinks and flies off | - | - |
| 3 | Motion[13]_start | 10 | (10,0x1f) shared reaction / death; (10,0x6e) shared reaction / death; status 10/11 scripts: (10,0x1f) (10,0x6e) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[13]_loop | 216 | (10,0x1f) shared reaction / death; (10,0x6e) shared reaction / death; status 10/11 scripts: (10,0x1f) (10,0x6e) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[14] | 379 | (10,0x1d) shared reaction / death; (11,0x10) shared reaction / death; status 10/11 scripts: (10,0x1d) (11,0x10) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[17] | 267 | (1,0xc) event-only; (10,0x2a) shared reaction / death; (10,0x2b) shared reaction / death; (10,0x44) shared reaction / death; (10,0x45) shared reaction / death; (10,0x70) shared reaction / death; (10,0xa7) shared reaction / death; (10,0xa9) shared reaction / de | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[18] | 479 | (11,0x0) shared reaction / death; (11,0x1) shared reaction / death; status 10/11 scripts: (11,0x0) (11,0x1) | **release -- not shown** | request 7 at frame 0: he unlinks and flies off | - | - |
| 3 | Motion[19] | 203 | (10,0x60) shared reaction / death; (10,0x67) shared reaction / death; (10,0x69) shared reaction / death; status 10/11 scripts: (10,0x60) (10,0x67) (10,0x69) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[20]_loop | 197 | (10,0x61) shared reaction / death; status 10/11 scripts: (10,0x61) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[21] | 409 | (10,0x63) shared reaction / death; (10,0x65) shared reaction / death; (10,0x66) shared reaction / death; (11,0x12) shared reaction / death; (11,0x7) shared reaction / death; status 10/11 scripts: (10,0x63) (10,0x65) (10,0x66) (11,0x12) (11,0x7) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[22] | 175 | (10,0x62) shared reaction / death; (10,0x68) shared reaction / death; status 10/11 scripts: (10,0x62) (10,0x68) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[23] | 181 | (1,0x26) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[48] play | claws 10 (stage 0), glow on, wings folded (0) |
| 3 | Motion[24] | 61 | (1,0x26) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[48] play from 181 | claws 10 (stage 0), glow on, wings folded (0) |
| 3 | Motion[26] | 201 | (10,0x20) shared reaction / death; status 10/11 scripts: (10,0x20) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[35]_loop | 71 | (11,0x0) shared reaction / death; (11,0x1) shared reaction / death; status 10/11 scripts: (11,0x0) (11,0x1) | **release -- not shown** | request 7 at frame 0: he unlinks and flies off | - | - |
| 3 | Motion[36]_loop | 36 | (11,0x12) shared reaction / death; (11,0x7) shared reaction / death; status 10/11 scripts: (11,0x12) (11,0x7) | **release -- not shown** | request 7 at frame 0: he unlinks and flies off | - | - |
| 3 | Motion[50] | 41 | (10,0x9b) shared reaction / death; status 10/11 scripts: (10,0x9b) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[51] | 103 | (10,0xa1) shared reaction / death; status 10/11 scripts: (10,0xa1) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[52] | 419 | (1,0x11) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[53]_loop | 231 | (1,0x12) event-only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 3 | Motion[54] | 223 | (10,0xab) shared reaction / death; (10,0xad) shared reaction / death; status 10/11 scripts: (10,0xab) (10,0xad) | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[3]_loop | 25 | (7,0x35) code chain only; (7,0x3b) AI-linked; (7,0x3c) AI-both | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[3]_loop hold | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[4] | 39 | (7,0x36) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[4] play | claws 10 (stage 0), glow on, wings out (2) -> 0 |
| 4 | Motion[5]_loop | 201 | (0,0x6) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[6] | 137 | (4,0x0) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[6] play | claws 10 (stage 0), glow on, wings out 0 |
| 4 | Motion[7] | 49 | (1,0x20) event-only; (4,0x4) AI-both+E | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[7] play | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[8] | 41 | (1,0x0) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[8] play | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[9] | 103 | (7,0x32) AI-linked+E; (7,0x34) AI-linked; (7,0x39) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[9] play b4 then Motion[5]_loop wrap | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[10] | 79 | (7,0x32) AI-linked+E; (7,0x34) AI-linked; (7,0x39) AI-linked; (7,0x3a) AI-both; (7,0x41) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[5]_loop wrap | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[11]_start | 48 | (7,0x33) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[11]_loop | 60 | (7,0x33) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[12]_start | 80 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[12]_loop | 50 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[13] | 171 | (7,0x33) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[14] | 37 | (7,0x35) code chain only; (7,0x3b) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[14] play | claws 10 (stage 0), glow on, wings 1 |
| 4 | Motion[15] | 81 | (7,0x35) code chain only; (7,0x3b) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[14] play from 37 then Motion[3]_loop hold b20 | claws 10 (stage 0), glow on, wings 1 |
| 4 | Motion[16] | 273 | (7,0x37) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[16] play | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[17] | 57 | (4,0x0) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[6] play from 137 | claws 10 (stage 0), glow on, wings out 0 |
| 4 | Motion[18] | 129 | (4,0x1) AI-both; (4,0x2) AI-both; (4,0x1) / (4,0x2) turn record 0x16a0d94 | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[19] | 129 | (4,0x1) AI-both; (4,0x2) AI-both; (4,0x1) / (4,0x2) turn record 0x16a0d94 | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[20]_start | 88 | (7,0x38) AI-both | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[20]_loop | 30 | (7,0x38) AI-both | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[21] | 207 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[23] | 53 | (4,0x1) AI-both; (4,0x2) AI-both; (4,0x1) / (4,0x2) turn record 0x16a0d94 | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[24] | 47 | (1,0x20) event-only; (4,0x4) AI-both+E | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[7] play from 49 | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[25] | 139 | (7,0x3c) AI-both | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[3]_loop hold b40 | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[26] | 187 | (7,0x36) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[4] play from 39 | claws 10 (stage 0), glow on, wings out (2) -> 0 |
| 4 | Motion[27]_start | 26 | (1,0x1e) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[27]_loop wrap | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[27]_loop | 70 | (1,0x1e) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[27]_loop wrap from 26 | claws 10 (stage 0), glow on, wings out (2) |
| 4 | Motion[28] | 295 | (1,0x1f) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[28] play | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[29] | 73 | (1,0x1e) code chain only | **solo -- not shown** | not on her (L0 M16: the dead male eaten; L4 M29: he never came) | - | - |
| 4 | Motion[32] | 301 | (7,0x0) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[33] | 147 | (7,0x1) AI-both+E; (7,0x5) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[34]_start | 22 | (7,0x1) AI-both+E; (7,0x5) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[34]_loop | 70 | (7,0x1) AI-both+E; (7,0x5) code chain only | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[35] | 235 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[36] | 263 | (7,0x2) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[37] | 263 | (7,0x3) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[38] | 357 | (7,0x22) AI-both+E; (7,0xf) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[39] | 307 | (7,0x7) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[41] | 403 | (7,0x16) AI-both+E; (7,0x19) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[42] | 353 | (7,0x4f) code chain only; (7,0x9) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[43] | 351 | (7,0x15) AI-solo; (7,0xa) AI-linked+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[44]_loop | 121 | (1,0x3) code chain only; (1,0x9) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[45]_loop | 121 | (1,0x4) code chain only; (1,0xa) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[46] | 293 | (7,0xb) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[47] | 293 | (7,0xc) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[48] | 53 | (1,0x2) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[49] | 103 | (1,0x5) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[50] | 103 | (1,0x6) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[51] | 71 | (1,0x7) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[52] | 71 | (1,0x8) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[55]_loop | 125 | (2,0xb) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[56]_loop | 125 | (2,0x9) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[57]_loop | 125 | (2,0xd) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[58]_loop | 125 | (2,0xe) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[59]_loop | 125 | (2,0xc) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[60]_loop | 125 | (2,0xa) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[61]_loop | 125 | (2,0xf) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[62]_loop | 125 | (2,0x10) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[66] | 177 | (1,0x1) AI-both+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[68]_loop | 181 | (1,0x1a) event-only | **release -- not shown** | request 7 at frame 0: he unlinks and flies off | - | - |
| 4 | Motion[69] | 343 | (7,0x17) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[70] | 343 | (7,0x18) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[71] | 149 | (7,0x3d) AI-linked; (7,0x40) code chain only; (7,0x42) AI-linked+E; (7,0x43) AI-linked; (7,0x44) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[71]_start play then Motion[71]_loop wrap | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[72]_loop | 35 | (7,0x3d) AI-linked; (7,0x40) code chain only; (7,0x42) AI-linked+E; (7,0x43) AI-linked; (7,0x44) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[71]_loop wrap from 9 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[73] | 233 | (7,0x3f) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[73] play | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[74] | 217 | (7,0x3e) code chain only; (7,0x3e) turn record 0x16a0dd4 -- (7,0x3e) has NO ENTRY at variant 0 (no EMC op, no code f | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[71]_start play then Motion[71]_loop wrap | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[75] | 217 | (7,0x3e) code chain only; (7,0x3e) turn record 0x16a0dd4 -- (7,0x3e) has NO ENTRY at variant 0 (no EMC op, no code f | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[71]_start play then Motion[71]_loop wrap | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[76]_start | 26 | (1,0x21) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[35]_loop wrap | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[76]_loop | 40 | (1,0x21) AI-linked | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[35]_loop wrap from 26 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[77] | 187 | (1,0x22) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[79]_loop wrap b4 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[78]_loop | 159 | (1,0x23) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[79]_loop hold (187 mod 61 = 4) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[79] | 197 | (1,0x24) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[79]_loop hold (187 mod 61 = 4) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[82] | 157 | second motion layer of L4 M83 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M83 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M83) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[83] | 157 | (7,0x1a) AI-solo+E; (7,0x1b) code chain only; (7,0x1c) code chain only; (7,0x1d) code chain only; (7,0x1a) b4 s0 layer2[0x452,0x454]@0xf94494 | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[84] | 157 | second motion layer of L4 M83 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M83 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M83) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[85] | 157 | second motion layer of L4 M86 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M86 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M86) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[86] | 157 | (7,0x1e) AI-solo+E; (7,0x1f) code chain only; (7,0x20) code chain only; (7,0x21) code chain only; (7,0x1e) b4 s0 layer2[0x455,0x457]@0xf94494 | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[87] | 157 | second motion layer of L4 M86 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M86 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M86) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[88]_start | 44 | (4,0x3) AI-both | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[88]_loop | 194 | (4,0x3) AI-both | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[89] | 83 | no action found | **unresolved -- mounted if the row is On** | no action of hers plays it at variant 0 (§6.1): treated as both | - | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[90] | 135 | (1,0x27) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[91] | 135 | (1,0x28) AI-solo+E | **both -- mounted if the row is On** | issued with and without him, asks nothing: the row decides; his own logic | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |
| 4 | Motion[92] | 167 | second motion layer of L4 M93 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M93 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M93) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[93] | 167 | (7,0x23) AI-solo+E; (7,0x24) code chain only; (7,0x25) code chain only; (7,0x26) code chain only; (7,0x23) b4 s0 layer2[0x45c]@0xf94850 | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[94] | 167 | second motion layer of L4 M95 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850); second motion layer of L4 M95 (0xb04d0 / 0xb03f8 at 0xf94494 / 0xf94850) | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 (layer-2 motion of M95) | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[95] | 167 | (7,0x27) AI-solo+E; (7,0x28) code chain only; (7,0x29) code chain only; (7,0x2a) code chain only; (7,0x27) b4 s0 layer2[0x45e]@0xf94850 | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | Motion[45]_loop wrap b10 | claws 10 (stage 0), glow on, wings folded (0) |
| 4 | Motion[96] | 301 | (7,0x14) AI-both+E; (7,0x4) AI-both+E; (7,0x47) code chain only | **combined -- mounted** | required: her action asks him (request) or is a linked-only coupling (§11 / §14) | his own logic: ride M35 to 180, then his draw (M31 / M32 / ride) | claws 10 (stage 0), glow on, wings folded (0); claws grow in his M31 / M32 |

### 6.1 Unresolved (named, not guessed)

* **L0 M21..M26, L4 M12, M21, M35, M89**: no setMotion site, script, or motion record (`0x7a258 / 0x7a27c / 0x7a284 /
  0x7a2a8`, records `0x16a0cd4..0x16a0f24`) of her class plays them in any action phase, link side or scenario of the
  census; nor do her status-10 / 11 scripts. Not searched: the shared idle chooser vt+0x3dc (`0x75168`) and its idle
  tables, and shared code outside her class. Control: the same census finds every clip the board had already read.
* **L4 M74, M75**: in 7:0x3e's turn record `0x16a0dd4` (with M73); 7:0x3e has no entry at variant 0 -- no op 0x00 in her
  table, no code follow (searched: every `#0x3e` immediate in her band).

## 7. The grab clips (her tail takes him) -- their own class

`j200.py` scanned all 158 clips: joint 200 is animated in exactly **L4 M27 start/loop, M28, M76 start/loop (0.026,
barely), M77, M78 loop, M79, M96** (position and rotation) and **L3 M12, M18** (rotation). Control passed: these are the
board's own (2026-09-14), and L4 M47 is constant. **No new carrier clip exists.**

| clip | earlier read | holds? | link | his clip | his form |
|---|---|---|---|---|---|
| L4 M27 | board: joint 200 at a fixed point above her | yes -- and newly: **he is LINKED** from his 1:0x1a start (`0xfc4b94`, bit `0xfc4bbc`) | combined | M27 loop | claws 10, glow on, wings 2 |
| L4 M28 | board: carries him in her pincers, sets him down at 118..124 | yes | combined (1:0x1f entered only seeing his 1:0x1a) | his 1:0x1b: M28 b0 (M43 b4 after 341) | claws 10, glow, wings 0 |
| L4 M76..M79 | board: test case | yes, re-read: her 1:0x21..0x24, his 1:0x1f..0x22 | combined | ride / M79 loop / frozen frame 4 | claws 10, glow, wings 0 |
| L4 M96 | board: joint 200 moves | **newly**: 7:0x4 / 0x14 / 0x47 -- her CALL: joint 200 is carried up to a point above her (as in M27) and her pincers reach it (closest 2.58 at frame ~140, never closing on it); unlinked 7:0x14 / 0x47 make request 0xa / 0xf (his flight in), so in the call he is flying, not held; linked (7:0x4) no request -- he rides joint 200 there | both | his own loop (§12) | claws 10 |
| L3 M12, M18 | board: rotation tracks | **newly**: death clips (11,1) / (11,0) -- request 7, he has left at frame 0; and her pincers never come within 4.9 of joint 200 in them (geometry, §13): the rotation track is joint 200 following her body, not a hold | release | -- | -- |
| L4 M8 | -- | **newly found**: the LANDING combine -- his 1:0x2 (L4 M8, link at start `0xfc516c`) answered by her 1:0 (L4 M8) | combined | M8 | claws 10 |
| L4 M68 | -- | **newly found**: she shakes him off -- request 7, his 1:0x13 unlinks at start | release | (M46 -> M47, flying off) | -- |
| L4 M46 / M47 | board: "what moves him: NOT FOUND" | still nothing: 7:0x0b / 0x0c (`0xf93dfc`) are a variant choice of motion and attack 0x11 -- a hunter grab; no request, no partner call, no joint-200 track; and (re-read) only her UNLINKED streams issue them | **solo** | -- (fixes the freeze) | -- |

### 7.1 The tail-tip relink correction, re-checked

The board's 2026-09-14 correction ("`0xfd5e38` / `0xfd6c1c` relink him to joint 144 / 0 / 200 only after variant-1
actions") holds. They sit in his **7:0x40** (answers her 7:0x50..0x52, request 0x11) and **7:0x42** (answers her
7:0x49, request 0x12). Her 7:0x50 is issued only from g1 s82, which only g0 s13's variant-1 block calls (`92 02 ..
14 52`); 7:0x49 only from g1 s87 / s88, unreached at variant 0; her 7:0x50..0x52 play L4 M119 / M125 / M168 / M169,
past her LMT (97 slots). **Positive control**: the same variant-0 walk does reach her 7:0x4d (g1 s81 from g0 s13's
variant-0 part), and without op 0x92 evaluated 7:0x50 reads as reachable -- the method sees both outcomes.
(7:0x48, also variant-only by its motions, IS issued at variant 0 from g0 s2 / g8 s0 but requests L4 M101 / M119, past
her LMT: it plays nothing.)

## 8. The kill grab

Raven: *"the animations where she grabs him to smash him to death, he freezes up currently."*
* **What the ROM has**: her linked stream g1 s52 runs 1:0x21 (the M76..M79 tail grab and swing: M78 arms attack 0x2b
  at frames 0, 84, 156) and then calls g1 s46, which -- **if the male is dead** (selector 4) -- walks to him (2:0x15 /
  0x16) and eats him (1:0x1c, L0 M16). So the table expects that he may be dead after the swing.
* **What kills him: NOT READ.** Neither class kills the other in code: every call her actions and hooks make on the
  partner object is a test (`0x6fe88`), `vt+0x3f4` (isDead), `0xfd931c` (selector 12) or `0xfd92e0` (his 7:0x3f flag)
  -- census of every action x phase x link x scenario plus her vt+0x204 / +0x1dc / +0x24 / +0x208 / +0x210 / +0x2a0 /
  +0x214 (positive control: `0xfd92e0` from 7:0x4e and `0xfd931c` from selector 12 are found). His death would come
  through the shared hit system (her attack 0x2b hitting him) -- the hit-target filter is NOT READ.
* **His side if he dies**: status 11 clears his bit (`0xfc5eac`), his next action start unlinks (`0xfc4894`), his death
  clip plays where he is; her eat clip L0 M16 is solo (not mounted).
* **The freeze**: in M78 / M79 it is the ROM (§4.3). On M46 / M47 it was the viewer's same-number rule (fixed).

## 9. In the viewer (2026-10-17)

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

### 9.3 The combined list (2026-10-17, supersedes the row and S_4 of §9 / §9.1 / §9.2)

Raven: *"leave Queen's raw animations uncombined in case people want to see them."*

* **Her raw lists 0 / 3 / 4** (and Special, which now holds no duo clip) play her alone: `partnerWanted` is true only on
  the combined list. The Seltas Off / Combined row is removed (`buildPartnerRow` no longer called).
* **"Combined (with Seltas)"** (`ROM_PARTNER_BODY.em069_00.partnerList`, id `duo`), built in index.html, in this order:

| group | entries | named | he plays |
|---|---|---|---|
| required | 44 | `Queen L<list> <clip>` | her clip's ROM pair (§3 / §11; the `combined` class of §6 / §14) |
| joined | 1 | `S. Motion[76]-[79]` | the tail grab with its blends (moved here from her Special list) |
| leaves | 5 | `Queen L<list> <clip> + Seltas leaves` | released at her frame 0 (§15): L4 M68 loop (shake-off 1:0x1a), L3 M12, L3 M18, L3 M35 loop, L3 M36 loop |
| his | 7 | `Seltas Motion[N]` / `Seltas Motion[33] with her 7:0x4e` | his clip leads; her side laid on his frames (M43, M35, M31..M34, the 7:0x3f / 7:0x4e pair) |
| free | 95 | `Queen L<list> <clip> + Seltas free` | his own decision loop, seeded per entry (§12) |

* **Decisions**: one entry per animation; the leading clip comes first in the name. His S_4 entries whose clip a required
  clip of hers already leads (M6, M7, M14, M4, M48, M3, M5, M71, M73, M45, M8, M27, M28, M79, M16, M9) are not repeated:
  her entry plays the same pair. The solo clips (L0 M16, L4 M29) and the 11 unresolved stay off it.
* **Her records fire on every entry as on the raw clip** (fixed 2026-10-17; the first layout left them off): index.html
  `seqMotionNow` -> `partnerMotionNow` routes an entry to the clip of hers it plays now -- a her-led entry IS that clip
  (`whole`: the raw clip's own motion-state call, copy row and frame), the joined entry walks its pieces (a split motion's
  _start + _loop as one), his entries walk the layout of her side (`partnerBodyShown.layout`). Every list|clip consumer
  reads it: the effect schedule (`setClip` key, CLIP_EFFECTS), the PSL word (CLIP_ACTIONS / psl-mask, `playNow`),
  ACTION_EFFECTS, MOTION_STATES (parts, rage, tired, puff / drool gates, class holds), CLIP_VARIANTS (her copies offered
  on her entries), heat, turn / steer, posture box, air height, the hit-zone mode (`clipZoneMode` via `herClipOf`).
  The check plays raw and combined side by side (L0 M65's PSL bit, L0 M5 rage, L0 M8 hold, L3 M35 / M36 death rows on
  the leaves entries): schedule key and frame, PSL word, state row, her parts and the records started are equal; the
  joined entry is on L4 M77 at its own frame 20 inside that piece; a view file opened on a combined entry and the Hit
  Zones panel hold / give back the entry.
* **His side**: MOTION_STATES.em076_00 has no list-4 row, so no state record of his applies to anything he plays on the
  combined list. His PSL bits on L4 M31..M34 (his riding attacks, which his free loop plays) run on an effect runtime of
  his own since 2026-10-17 (§9.4).

### 9.4 His own effect runtime (effects agent, 2026-10-17)

In the game he is an enemy unit of his own: his PSL walker reads HIS motion and frame and HIS enable word, his effects hang
from HIS joints. The viewer now runs a second runtime for him while he is mounted.

* **Built**: render/rom/effect-mounts.js `attachPartnerEffects` / `detachPartnerEffects` / `partnerEffectRuntime` -- a
  second LiveEffects on his model (his effects json em076_00, his joints, his unit = the frame index.html carries him on:
  her joint 200 at his size, or where he was released; live.js `unitSource`). index.html `drivePartnerEffects` reconciles it
  every frame (made while he is mounted and her runtime is up; dropped with him, with hers, on a monster change and by
  `__view.effectRuntime(false)`) and feeds it `partnerFxClip`: his clip and own frame from `partnerLocalAt` (the answer
  stepAttached poses him by -- ROM pairs, free loop, frozen hold, release), keyed `em076_00|4|Motion[N]` as solo Seltas's
  clip is; a new piece of his timeline or a new pick is a new motion start. `effectRuntimeInstance()` stays hers, so the
  shell captures, soaks and checks that read it are unchanged. live.js: a runtime's frame driver does nothing inside
  another runtime's depth pass (`depthPasses`), and an unhook never cuts another runtime's onAfterRender out of the chain.
* **His enable word**: his vt+0x13c is the base `0xca170` (psl-mask.js BASE_ONLY, the vtable word): bits 0-5 always and
  the state group from HIS rage `P+0x518` / tired `P+0x505`; it does not read the link bit `P+0x1bb`. **His rage is not
  hers**: his band `0xfc40ec..0xfd963c` calls none of `0x81670` / `0x81688` / `0x81614` / `0x81634` and touches no
  `+0x518` / `+0x505`; her band's calls (`0xf8a214`, `0xf966a0`, `0xf8a434`, `0xf8e558`) are all on herself (READ,
  `duofx/ragescan.py`, control `0xca170`). His own rage comes from the shared anger system (hits -- not in the viewer): his
  runtime runs calm, not tired (word 0x1ff).
* **Link-gated effects**: none. His word ignores the link; the link-bit glow (group 8) is a part and `ride_on` a material
  clip, not effect records. After a release (`+ Seltas leaves`) his runtime follows his released M46 / M47 (no PSL bits).
* **What fires for him now** (check, the duo block's last 13 assertions): his L4 M31 (entry `Seltas Motion[31]`) u 362 at
  his frame 66 -- records, frames and the walker's key / word / frame identical to solo Seltas's L4 M31; his free loop's
  M32 under her L4 M41 (from her frame 180) c 211 / c 221, the same records as solo L4 M32; M33 / M34 (his 7:0x3f entry and
  the op-0x77 bands the viewer does not take) take the same path to their calm triple (bit 6, u 201) -- not asserted
  separately. Under his frozen M79
  (S. Motion[76]-[79], her M78) no frame passes and nothing starts. Under every answer he plays to her required clips (L4
  M3..M9, M14, M16, M27, M28, M45, M48, M71, M73, M79, M35) his PSL has no bit: nothing to fire. Soaks em069_00 85 / 0
  refused, em076_00 48 / 0 refused -- no record of his needed a lift.
* Check: dev/checks/em069_00.mjs duo block, 61 assertions (raw lists never mount him; each of the 152 entries mounts
  him with its pair; the release test of §15).

### 9.5 The effect audit of every combined entry (effects lane, 2026-10-18; Raven: "not all environment effects from their combined attacks are showing")

Instrument: `<archive>/zg/duoaudit.mjs` -- plays each of the 152 entries once from frame 0 and records her schedule's and his runtime's clip key / frame every frame and every request either runtime starts (by request identity, baseline taken before the pick); the ROM's expectation is each PSL bit of the clip played (monster.js CLIP_EFFECTS) whose `on` window holds a frame played and whose bit the enable word passes (hers with the link, his the base 0xca170). Control: the raw-clip records of the check's raw / combined pairs come out equal.

* **Missing, fixed: her u 500 (em069_00_014, bit 18) on L4 M71 / M72 / M73 / M74 / M75 -- the linked sand.** Her word sets bits 18-20 on those five motions only while P+0x1bb bit 0 (the link) is set (psl-mask.js em069_00 `seltasLink`), and index.html never passed `seltasLink` to the word, so the combined entries ran with the link off. Now `seltasLink: herLinkedForShells()` (Seltas mounted, not released). u 500 starts on the M72 / M73 / M75 entries (M71's window f111-147 and M74's are reached on their entries the same way).
* **Every other entry: what the ROM fires, fires** -- her clip bits, his bits on his runtime (L4 M31 u 362, M32 c 211 / c 221, M33 / M34 bit 6), her shells' records (u 10 / 20 / 21) and his spits. Her copy B of L0 M8 (the burrow (6, 2), sunk) fires no footfall c 0 / c 10, as her word says (bits 15-16 unless sunk).
* **Class requests**: her action main asks only (6, 2) u 1400 (copy B of L0 M8, wired); his asks none (reqtrace.py over both). No stage-ray record on either monster: every PSL-bound record of both plans 'ok' (add_effects.py plan()). Both runtimes take their floor from rockInput.floorY (monsterFloorY).
* **Routed entries' inputs** (the same day): the combined list's whole entries now step the motion states with the raw clip's full input (class bytes, Boulder, the play's action, the snow map) -- index.html `userIn`.

## 11. Every coupling, frame for frame (2026-10-17; Raven: "anytime they sync up we need to sync them up")

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
| 11 | the tail grab, request 0xc, 1:0x21 -> 0x24 | M76 @0, she loops M76 (600-frame wait) until he is in 1:0x1f; M77 @0 b4 (her M76 end AND his 1:0x1f, `0xf8f868`); M78 @0 b0 (M77 end AND his 1:0x20, `0xf8f974`); M79 @0 b4 (M78 end AND his 1:0x21, `0xf8fb34`) | 1:0x1f M35 @0 b0; 1:0x20 M79 loop @0 b4 when he sees her 1:0x22 (`0xfc9754`); 1:0x21 when he sees her 1:0x23: **speed 0, frozen on M79 frame 6** (186 mod 60, §14.1); at her M79 frame 80 `0xc0368`; 1200-frame timer -> 1:0x22 | `0xf89a98`, `0xfc9710`, `0xfc985c`, `0xfc99fc`, `0xfc99c0`, `0xfc9a88` | pairs; S. Motion[76]-[79] (Special list) |
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
* **READ since** (§14.2): op 0x77 switches on his distance to the hunter; the viewer shows band 0. Op 0x1d (g1 s1) passes; selector 5 ([+0xcac0]+3) and 7 (her [+0xcac0]+0x3e) read 0.
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
  1:0x23 -- the held frame is **6**, read to the frame in §14.1 (the 2026-10-17 "187 mod 61 = 4" took the clip's 61 frames for
  the game's period and was a frame-count slip). The blend (4 frames)
  has long finished. `0xb07b4` writes P+0x398 = 0 and multiplies it into the layer speed passed to `0x5393d0` (layer 0)
  and the second layer (`0xb0848..`); nothing in 1:0x21 sets a motion again.
* (c) Nothing else poses him: his vt+0x2a0 only scales the wing joints 150..153 (+0x49 = 0 here: hidden, as Wings Away);
  her vt+0x2a0 writes HER joints 2..9 (`0x7237c` on her); the link writes his root only (mode 3, `0xc210c`).
* (d) The viewer holds exactly its frame: his pose under her M78 equaled his M79 played solo at the held frame (then 4:
  0.006 rad; frames 3 / 5 differ by 0.14 / 0.13). The held frame is now 6 (§14.1). The hold samples the raw
  clip (no composeClip) at 4 / 60, a key time; bind fills are the same as solo.
* **So the odd pose is the ROM's**: his M79 is a struggle loop (per-frame bone turns of 0.3..0.7 rad all through it, a
  1.52 rad jump at its wrap on gid 90), and frame 4 is one instant of it -- held rigid for her whole M78 and the first
  ~130 frames of M79: his joint 5 (node `9:5`) is turned 1.41 rad (81 degrees) from his ride pose, joint 9 (`13:9`) 0.56,
  his leg joints 80 / 40 / 50 / 90 and joint 144 0.37..0.45 each. Nothing to fix in the viewer.

## 14. The audit of every clip, and the reads that closed (2026-10-17)

Raven: *"I also see animations I know Seltas is required, but he is not being enabled"*, *"consult the ROM and follow how it
handled each animation"*. Every one of her 158 clips is in §6 (regenerated by `duo/table3.py` from the census, the
command-table walk `emclink2.py`, the hooks, the scripts and records); every coupling is §11.

### 14.1 The freeze frame, read to the frame

* **The layer's length is numFrames - 1** (`0x951810`: `ldr r1, [motion, #8]; sub r1, r1, #1` -> `+0x504`), its loop point
  the header's loop frame (`+0x508`, negative = hold, bit 4). The layer update (`0x94ecf0..0x94fca0`, rom-map) adds the
  step each update, sets bit 2 (the ended flag `0x94dc04`) on the update whose frame reaches the length (`0x94f374`) and
  wraps onto the loop point plus the overshoot -- so a looping motion's period is **length - loop**. Positive control:
  Rajang's L2 M8 (145 frames, loop 92) ends at 144 and again at 196 (rom-map `0xde8864`), = 144 + (144 - 92).
* Her M77 (187 frames, no loop): length 186. Her 1:0x22 sees the ended flag on the update after her frame reached 186:
  186 advances after her M77 started. A follow (`0x768c8` -> `0x76098` mode 5, `+0x73ea` = 1) re-runs the action main
  in the same update (`0xa5af4..0xa5b14`), so her 1:0x23 starts on that update. His 1:0x20 started on the update he saw
  her 1:0x22, his 1:0x21 (speed 0, before his own advance) on the update he sees her 1:0x23: the same order lag on
  both, so he has advanced his M79 exactly 186 times. His M79: 61 frames, loop 0 -> length 60, period 60. **186 mod
  60 = 6.** The order of the two units (slot order) does not enter. The viewer holds 6 (`holdAt`) and runs his M79
  under her M77 at period 60 (`period`).

### 14.2 Op 0x77 (his draw), read

`0x84f78`: mode 0 goes to `0x8589c`: the switch value comes from the op's own byte 3 (`77 00 00 01` -> 1) with kind 0x15
into `0x8e088`, whose kind-0x15 arm (`0x8e188` -> `0x8e924..0x8ea18`) is **the distance from him to his target**
(target slot from the op, `[P]+0x1d0 + 16 x slot`, against his position plus a yaw-turned offset, `0x710a8` /
`0x710d4`, `+0x168`). So his cases 0 / 1 / 2 / default are **distance bands to the hunter**: case 0 (the band the
viewer shows: 20 M31 / 70 M32 / 10 ride), case 1 (50 M31 / 35 M32 / 15 M32 + ride), case 2 and default (with g1 s73 /
s74: his M33 attacks 7:0x34 / 0x39 / 0x3c / 0x3d). They all apply while he is linked; which one is the hunter's
distance, which the viewer has none of -- so it shows band 0 (the band thresholds themselves NOT READ).

### 14.3 His 7:0x3f, in phase order (table `0xfd59cc`)

0 (`0xfd59e4`): M33 by the turn record `0x16a16d4` (`0x7a258`), counter `+0x6c` = 0, her flag `+0x6b` = 0; 1 (`0xfd5a90`):
the turn (`0x7a27c`) to frame 40, then 20.0 on `P+0x1bc`; 2 (`0xfd5ad8`) / 3 (`0xfd5b08`): while `+0x6c` <= 2 -- the
repeats: `0xfd4924` / `0xfd4b00(e, 1 or 2)` (NOT READ), at frame 100 `+0x6c` += 1 and M33 again from 100, b4
(`0xfd5d48`); 4 (`0xfd5a40`): at frame 105, `P+0x1bc` = 300, flag `+0x6b` = 1 -> her 7:0x4f (M42 from 90); 5 (`0xfd5b2c`):
he waits while she is in 7:0x4d..0x4f (or her status 10 cuts it, `0xfd58e4`), then rides. The viewer shows one M33 to its
flag frame 105 and on (list S_4); how many repeats come first depends on `0xfd4924` / `0xfd4b00`: NOT READ.

**Rebuilt 2026-10-17 from the shells agent's read** (dev/em069-em076-shells-spec.md 2b; the repeats are unconditional): the entry
`Seltas Motion[33] with her 7:0x4e` now plays his 7:0x3f phase by phase -- M33 0..60 (the turn to f40, phase 2's 20 frames to f60),
M33 from 40 b4 (spits at 68 / 88 / 96, two a crossing), M33 100..120 b4, from 40 again, 100..120, from 40 a third time (one spit a
crossing, `0xfd4b00(e, 1)` at +0x6c == 2), the flag at its f105 = entry frame 285; her L0 M65 loops to 285, then her L4 M42 from 90
b8. His 15 spits land at entry frames 88 88 108 108 116 116 168 168 188 188 196 196 248 268 276, hers at 295 / 305 / 315 (asserted;
the third set is the shells.js row `7:0x3f/3`, named by index.html partnerRockInput from the layout's `spitSet`). His turns
(+-11 / +-22 degrees, `0x76dd0`) are not shown.

### 14.4 Her event groups 3 / 4 / 5 (the awareness transitions), read

The forced-transition family that `0x7f010` belongs to selects them: **group 5** at `0x7e1e8` / `0x7e678`, **group 4**
(the notice, dev/notice-marks.md) at `0x7e9c8` / `0x7ed80`, **group 3** at `0x7f36c`, each gated on her awareness byte
`P+0x2c0`, her area bytes and the current group -- **none tests the link**. Their streams (g3 / g4 / g5) call g1 s18 / s39,
which reach her attacks and moves; so the 22 clips that only her unlinked AI streams pick (M44..M50, M55..M62, M69,
M70, M90, M91, L0 M10 / M11 / M36) do also run with him on her: back to `both`. g12 / g18 (area moves / burrows) are
selected outside this family (their selector NOT READ); g2 s0 / s1 shake him off before burrowing.

### 14.5 What changed on screen (her clip: old -> new, evidence)

| her clip(s) | old | new | evidence |
|---|---|---|---|
| L4 M7, M24 | both | **combined** | (4,4) writes request 5 linked (`0xf89824`) -> his 3:0x39 M7 |
| L4 M10 | both | **combined** | 7:0x32 linked phase / 7:0x3a request 3 (`0xf89924`) -> his M5 |
| L4 M25 | both | **combined** | 7:0x3c request 9 (`0xf89b88`) -> his M3 |
| L4 M82..M87, M92..M95 | both | **combined** | 7:0x1a..0x2a request 0xe (`0xf8964c`) -> his M45 |
| L3 M23 | both | **combined** | 1:0x26 request 0xd (`0xf89ab8`) -> his M48 |
| L0 M65 | both | **combined** (his M33) | 7:0x4e request 0x10 (`0xf89bec`); also her (2,6) -- shared, the coupling shown |
| L4 M74, M75 | unresolved | **combined** (his M71) | 7:0x3e's turn record `0x16a0dd4` with M73; 7:0x3e writes request 0xb (`0xf898d0`); its entry at variant 0 NOT FOUND |
| L4 M96 | both | **combined** (his own logic) | joint 200 carried up to his hover point (§13); unlinked 7:0x14 / 0x47 call him in (requests 0xa / 0xf) |
| L4 M44..M50, M55..M62, M69, M70, M90, M91, L0 M10, M11, M36 | solo (first re-read) | **both** | §14.4: also issued by her awareness event groups, which have no link test |
| L4 M78, M79 (his hold) | his M79 frame 4 | **frame 6** | §14.1 |
| L4 M77 (his M79) | period 61 | **period 60** | §14.1 |
| L4 M42 | both | both (not changed) | 7:0x9 plays it from frame 0 in both states with no request; the coupled 7:0x4f plays it from 90 -- that one is on list S_4 |
| L4 M68, L3 M12 / M18 / M35 / M36 | release | release (not changed) | he unlinks at frame 0 (request 7); his flight is code-driven |

Mechanics checked in the page: a required clip mounts him with the row Off and the row then reads Combined -- on a list
change, after switching to another monster and back, on the Special list's joined clip, on his own list, and for a clip
picked while a list change is still loading.

## 15. The end of the tail grab, and every unlink (2026-10-17)

Raven: *"does she place the Dead Seltas back on her body? Seems odd and Seltas uses the stiff pose during this."*

**The end of the tail grab, read** (his 1:0x21, phases at `0xfc99c0..0xfc9aa8`):
* Phase 0: `0xb07b4(0.0)` (`0xfc99fc`): his motion speed 0 -- the freeze; `P+0x1bc` = 1200.0 (`movt #0x4496`,
  `0xfc9a18`).
* Phase 1: if `[+0x50]` (her object) is set, only the countdown runs: `0x7206c(&P+0x1bc, 1.0)` (`0xfc9a88`), which
  (`0x539d5c`) subtracts the unit's frame delta `e+0x1c` times 1.0 -- not his motion speed, so it runs while he is frozen.
  On expiry: `0x768c8(.., 1, 0x22)` (`0xfc9aa4`) -- his 1:0x22. With no partner: back to his table (`0xbc984`,
  `0x75230`, `0x82454`). Her side: at her M79 frame >= 80 `0xc0368` clears `P+0x3a2` (`0xfc99d0`).
* So **through her M78 and M79 he is frozen AND linked** (mode 3 on joint 200); her M79 brings joint 200 back onto her
  back (§13: within 1.1 of her pincers to frame ~128, back on her back by ~150), so he is set back on her back, rigid.
  The freeze starts with her M78 (§13); her M78 + M79 run about 356 frames from there; the timer runs 1200, so he stays rigid on her
  back for about **844 frames after her M79 ends**, under whatever her table plays next.
* Then **1:0x22** (`0xfc9ab4`): unlink (`0xc20f4`), bit 0 of `P+0x1bb` cleared, L4 M77 b0 (`0xfc9be4`), yaw + 0x8000,
  `P+0x14` = -10, `+0x24` = -1 (he drops); on landing (`0xbf0bc`) L3 M11 (`0xfc9c88`), at its end L3 M29 (`0xfc9ce4`),
  then `vt+0x3dc`.
* **He is not dead.** No code of either class kills him (§8). Her g1 s46 eat (1:0x1c, L0 M16) runs only if he is dead
  (selector 4) -- by the shared hit system, NOT READ.
* **The joined clip is not extended**: the drop is not inside any clip of hers (her next action is her table's), so
  S. Motion[76]-[79] ends where her M79 ends, with him frozen on her back -- the ROM's state at that frame. A separate
  "Seltas 1:0x22 drop" entry could show his M77 -> L3 M11 -> L3 M29, but the 844-frame wait and her clip under it are her
  table's pick; not added.
* **Difference from Raven's reading**: the stiff male is alive, held by a timer, and his "stiff pose" is his M79 frame 6
  (§14.1), the ROM's.

**Every mid-clip unlink, audited** (his link sites, rom-map `0xfc5054` row):

| unlink | when | which clip of hers | viewer |
|---|---|---|---|
| 1:0x13 (`0xfc5054`, bit `0xfc5088`) | at its own start, his answer to request 7 (her hook at her action start: 1:0x1a `0xf8972c`; (10,8) / (10,0x25) / all status 11 `0xf8975c`) | L4 M68 loop (the shake-off), L3 M12, L3 M18, her deaths L3 M35 loop / M36 loop -- at her frame 0 | `+ Seltas leaves`: released at her frame 0 in world space, M46 b4 then M47 b0 (`0xfc8e84`); unlinked he does not ride again (`0xfc8e9c`); glow off (`0xfc6468`) |
| 1:0x22 | the 1200-frame timer above | none -- after her M79 ends | S. Motion[76]-[79] ends linked, frozen |
| 1:0x12 (`0xfc521c`) | its trigger NOT READ | no clip of hers is known to issue it | -- |
| 7:0x3f cut (`0xfd58e4` -> `0xfd5950`) | she enters status 10 (number != 0x69) while he runs 7:0x3f | a flinch interrupting her 7:0x4e / 7:0x4f -- not a clip of its own | -- |
| her `[+0xc] & 7` not 1..2 (`0xfc59c8` -> `0xfc5b40`) | every frame she is gone | none (she is not drawn) | -- |
| his death (status 11, `0xfc5eac` / `0xfc4894`) | by damage, NOT READ | none | -- |

Clips shared between a request-7 action and a linked one (L3 M5, M7, M10, M11, M14, M21, L0 M19, §2.3) stay `both`: he is
on her under them on the combined list (`+ Seltas free`).

**In the viewer**: `ROM_PARTNER_BODY.em069_00.leaves` = M46 b4, M47; index.html `partnerClipOf` gives a leaves entry a
`release` pick; `releaseMatOf` samples her joint 200 at HER frame 0 from her own pose driver (put back after), so a late
load, a scrub or a pause cannot move it, and `attachFrame` holds his frame there. The check: at her frame 0 his frame is
joint 200's; at frames 40 / 80 his frame is unchanged while joint 200 has moved > 1; he plays M46 then M47; glow group 8
off; control: on L4 M36 + Seltas free his frame follows joint 200 frame by frame and group 8 is on.

## 16. His wings (2026-10-17; Raven: "Seltas wing parts are not being toggled during flying sections") -- solo and on her

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

## 18. Unlinked: the dismounts in world space, and what he does next (2026-10-17; Raven: "once delinked Seltas follows his normal logic")

* **How a unit moves** (the shared move pass `0xae370`): linked, the link modes place his unit on her joint; unlinked, the
  unit `P+0x40..` moves only by code -- the frame's move request `P+0x530` (`P+0x540`), velocities (`0x7d65c`), direct
  writes -- and the body is drawn from joint 0 on the unit. **The clip's `reference` track is not drawn**: his 1:0x13 jump
  (0, 1392.5, 245) x size at M46's end equals M46's last joint 0 minus M47's first ((0.03, 13.80, 2.446) model units); with
  M47's reference (0, 13.932, 0) drawn instead, M47 would start 2.4 behind M46. The viewer plays the unlinked partner with
  the reference held (pose.js `holdReference`) and moves his frame by the code.
* **Built** (render/monster.js `ROM_PARTNER_BODY.em069_00.dismounts`; index.html `dismountPlan` / `unlBaseOf` /
  `unlFrameAt`): the unit starts where joint 200 is at her frame 0, upright (pitch / roll 0), at his yaw + hers, kept in the
  world group's space.
  * **leave** (request 7: `Queen L4 M68 / L3 M12 / M18 / M35 / M36 + Seltas leaves`, her clip held or looped to 300 frames):
    L4 M46 b4; at its end the unit jumps up 1392.5 and forward 245 x size; L4 M47 b0; then vt+0x3e0's (0, 3), L1 M1 b10, the
    hover. Wings flap from frame 0 and on across the pieces; glow off.
  * **drop** (`Seltas Motion[77] drop off her (1:0x22)`, a new entry of his; her side her idle L0 M1, 600 frames): turned
    180 degrees at frame 0; L4 M77 b0; falling -10 / frame, -1 / frame^2 to her ground (the grid floor) -- 15 frames from
    her back in the check; on the ground L3 M11 b0 (start + one loop pass), L3 M29 b0, then vt+0x3dc's (0, 0), L0 M1 b10.
  * The "+ Seltas leaves" static hold is gone; the combined list has 153 entries (his 8).
* **What his table does next, unaware** (the EMC ops read for it, rom-map "EMC ops -- the shared table"): g0 s0 on a fresh
  walk (latches `0x73f0 / 0x73f3 / 0x73f4` 0) -> the posture switch (posture 4: (6, 3)) -> just-exhausted test (op 68:
  `P+0x527` bit 0) -> the awareness switch (op 0a, `P+0x2c0`; 0 -> default) -> the link (0) -> g0 s1 -> op 4e (the wander
  state s8 `e+0x73d3` < 0) -> op 97: **THE WANDER** state machine over the stage's navigation (`0x8b1fc`, RNG
  `0x7c9234`). That is where the unaware Seltas goes, and it needs the area's navigation data the viewer does not have --
  NOT READ through; the viewer holds his idle there (L0 M1 on the ground, L1 M1 in the air). **No unaware stream of his
  re-combines him**: he goes back onto her only when she asks (her requests 4 / 0xa / 0xf, his 1:0x2 / 1:0x1a answers).
* **His effects** (his own runtime, §9.4 -- the earlier "not built" here was wrong): index.html partnerFxClip keys an
  unlinked piece on its own list (L1 M1, L3 M11 / M29, L0 M1); his unit is the unlinked frame. L3 M11's PSL bit 0
  (cm202_020 key 121, frames 1..2) starts on landing (asserted). Not built: a seeded pick loop for the wander (the
  wander itself is not readable without navigation).
* **The hit system**: read in §19 -- her records cannot hit him while he is linked to her (`0x168f20`).
* Checks (duo block): leave -- unit at joint 200 at frame 0, unmoved while her joint moves, the jump at frame 31 to the
  read offset, the root continuous across the seam, the hover after M47, glow off; drop -- 180 degrees, the fall at frame 5
  to the formula, on the floor at the landing frame with L3 M11, then L3 M29 and L0 M1, his root coming down; control: a
  linked entry follows joint 200.

## 19. Can her attacks hit the male? (the hit system, 2026-10-17)

* **Read to the instruction** (rom-map `0x7db70`, `0x16acf0`, `0x168f20`): every enemy attack is a hit object with an owner,
  the owner's area and a target mask (0x17 by default: bits 0, 1, 2, 4). The hit manager's pair pass (`0x16acf0`) tests it
  against the hunters (bit 0), the ENEMIES (bit 1), a third set (bit 2) and other attacks. On the enemy pass, besides area,
  history and the target's own flags (`e+0xb5f9`, `e+0x7652`, `P+0x1a0`, `0x81958`), it calls `0x168f20`, which EXCLUDES a
  target that is linked to the attack's owner (`0x168f94..0x168fc8`: the target linked and its link target `P+0x5c30` is
  the owner), and an owner linked to the target.
* **So her attacks cannot hit him while he is linked to her** -- through the whole tail grab (his 1:0x20 struggle and his
  1:0x21 freeze keep the link) her 0x2b in M78 passes over him. Positive control: the hunter pass has no such call, so the
  same record (mask 0x17) hits a hunter. Unlinked (after his drop, or after he leaves), the exclusion no longer holds and her
  attacks can reach him if his own flags allow (`e+0xb5f9` etc., per instance -- not read for him).
* **The answer to "left on the ground for the Queen to consume"**: the ROM's smash does not hurt him. Her eat (g1 s46,
  selector 4) runs right after the grab chain and needs him dead; he is frozen and linked then, alive, for 1200 frames. He
  dies there only from a HUNTER's damage (the hunter pass has no partner exclusion) -- a fight the viewer has no hunter for.
  So the smash -> death -> eat chain is not built; the ROM differs from Raven's account on the smash killing him.

## 20. The static audit, and M78 / M79 proven (2026-10-18; Raven: "static in some instances of the grab animations", "78 mainly", "Seltas dies, but then is dropped back onto the queen's body")

* **M78 / M79, dynamically**: his 1:0x21 (entered when she enters her M78, §17) calls `0xb07b4(e, 0.0)` (`0xfc99fc`). Emulated
  (`duo/emu_freeze.py`): `P+0x398` 0 and BOTH motion layers' speed 0 (`e+0x50c` via `0x5393d0`, `e+0x64c` via `0x53942c`);
  the layer step (`0x94ecf0..0x94ef08`: frame += speed x dt) keeps frame 6.0 for 60 updates on each layer, where the control
  (speed 1, his struggle) advances 7, 8, 9 ... He plays one layer (his 1:0x20 / 1:0x21 set M79 by setMotion0 only; no
  two-layer call in either, census). His class writes no joint but the wing cards' scales (0xfc66f8, all 0 at +0x49 = 0); the
  link writes his unit only. Every setMotion resets the rate to 1.0 (`0xafd3c`) and 1:0x21 sets none, so the hold lasts until
  his 1:0x22's M77. So through ALL of her M78 and M79 he is frozen at his M79 frame 6 -- the ROM's; not changed.
* **Does she kill him there?** No, on three reads: (1) her hits cannot reach him while he is linked to her (`0x168f20`, §19);
  (2) her class -- every status-1 action, every phase, link and scenario, and every vtable method -- writes NOTHING into his
  memory and calls nothing on him but `0x7fed4` (isDead) (`duo/pwrites.py`; control: a store through the partner pointer is
  caught); (3) he is not unlinked in M78 / M79 (only his own 1:0x22, 1200 frames after the freeze, unlinks him). No status
  script of hers runs in 1:0x21..0x24. So in the game, when a hunter does not kill him, he stays frozen on her back through
  M78 and M79 and after it, then drops (his 1:0x22: the entry "Seltas Motion[77] drop off her (1:0x22)"). Her eat (g1 s46)
  runs only if he is already dead (selector 4); only a hunter's damage can get him there.
* **The audit** (`duo/probe-static2.mjs`; 153 entries; >= 10 frames with every bone under 0.005 rad / frame):

| entry | frames | his clip there | verdict |
|---|---|---|---|
| Queen L4 M78 loop, L4 M79, S. M76-M79 from 252 | all | M79 @ 6 held | ROM: the 1:0x21 freeze (above) |
| Queen L4 M3 loop, L4 M25 | all | M3 held | ROM: his M3 is a one-frame motion (0 frames) |
| Seltas M43 / M31 / M32 / M33 / M34 | after his clip | his last frame held | **FIXED**: at each action's end the ROM rides on (1, 0) -- M34 via 3:0x3d's M5 -- now appended (ride M35 b10) |
| Seltas M33 with her 7:0x4e | 353.. | M33 @ 173 held | ROM: 7:0x3f phase 5 waits while she is in 7:0x4f (`0xfd5b2c`), M33 a non-looping motion held at its end |
| every free entry, the ride under M76, his M35 entry, M71 / M74 / M75 60..84, M73 1..14, M15 70..80, M26 95..112, the drop's L3 M11 / L0 M1 | stretches | his clip ADVANCING | ROM: the clips' own near-still frames (the ride M35, the landing's lie, ...) |

  No pick resolved to the bind pose, past a clip's end or to a missing clip.
* Check (duo block): every entry's clip advances at 15 / 40 / 65 / 90 % except the ROM's holds; his own entries ride on
  after their clip; his M3 is a one-frame motion; the freeze's hold at M79 frame 6 (§13 checks).

## 21. HER M79 KILLS HIM -- what was missed (2026-10-22; Raven, for the third time: "Seltas when doing the grab animation stops animating, enters static pose then is placed back onto the queen's body once she is done")

**WITHDRAWN**: §8 / §15 / §17 / §19 / §20's "he is not dead", "her records cannot hit him while linked", "nothing of hers kills
him", and "he rides her back frozen ~844 frames, then drops" as the outcome (rom-map Withdrawn table).

* **What was missed**: the partner exclusion `0x168f20` has an early out -- a hit object whose `+0x30` has bit 0x40 / 0x80 is
  never excluded -- and her M79 arms exactly such a hit: her 1:0x24 at its start (`0xf8fc8c`) calls `0x7db70(e, 0, 0x23, 0x400)`
  (`duo/arm23.py`), and flag 0x400 becomes `+0x30` bit 0x80 (`0x7de08`). Record 0x23 (em069_00_attackdata) is kind 0x0a, and its
  shape set (byte 0x19 = 18, em069_00_hitsize.hts) is ONE sphere of radius 200 on JOINT 200 -- the joint he rides. The write
  census of §20 stubbed shared code, which is where this goes.
* **The kill** (the damage step `0x97d20`, `0x98e14..0x98ff0` and `0x990cc`): a pending hit of kind 0x0a on a unit frozen by his
  1:0x21 (`P+0x3a8` bit 0x80, set at `0xfc9a08`) -- in the air only for em 0x4c, Seltas -- sets his HP to max x `P+0x380` (-1.0,
  the spawn default; no class sets it: 0) and asks (11, 8). Emulated (`duo/emu_kill.py`): HP 0, reaction 0xf, (11, 8);
  controls (kind 2 = her M78's 0x2b, not frozen, em 0x45) give an ordinary flinch.
* **When**: his 1:0x21 sets the reaction lock `P+0x3a2` = 2 every frame and clears it only when her motion is L4 M79 and her
  frame >= 80 (`0xfc9980..0xfc99d0`, literal 80.0); locked, the damage step does nothing (emulated) and the hit stays pending
  (INFERRED: it is reset only by `0x1721a0` on a processed flag). So **he dies at her M79 frame 80**.
* **His death** (11, 8), script `0x17e7350`: posture air, L4 M77 b0 (start, loop) until the ground, posture 0, L4 M78 b0 (start,
  loop): he lies dead. Status 11 clears his link bit (`0xfc5eac`) and the action start unlinks (`0xfc4894`): her joint 200 no
  longer carries him -- **he is not put back on her body**. The fall rate of the airborne death is not read (the viewer uses his
  1:0x22's -10 / -1 per frame as a stand-in).
* **Then she eats him**: her g1 s46 after the grab: selector 4 (`0xf89d48`: he is dead -- status 11 -- and in her area) -> walk
  (2:0x15 / 2:0x16, L0 M8 b12) -> 1:0x1c, L0 M16 b4.
* **Unchanged by this**: the freeze's timing (§17: he struggles, M79 loop at speed 1, through her M77, frozen from her M78) and
  its mechanics (§20, emulated: both layers' speed 0). So Raven's "stops animating, enters static pose" is the ROM during her M78
  and M79 to frame 80; "placed back onto the queen's body" was the viewer's error -- he dies and drops at her M79 frame 80. The
  1:0x22 drop entry stays as the path when that hit does not land (e.g. he is out of the sphere).
* **In the viewer**: render/monster.js pairs `'4|Motion[79]'` `death: { at: 80 }`, `dismounts.death`, the joined `S.
  Motion[76]-[79]` now with `deathAt` (her M79 piece, frame 80), ending where it ended (her M79's end). **Her eat is NOT joined**
  (no new joining before Raven's combining review): in the ROM it follows -- g1 s46 -> 2:0x15 / 2:0x16 (L0 M8 b12, her walk to
  him; steering not read) -> 1:0x1c (L0 M16 b4) -- a CANDIDATE for that review; index.html `partnerClipOf` death pick (linked pre-part from the pairs, then the
  unlinked death), `dismountPlan` / `unlFrameAt` (the kill frame), `releaseMatOf(a, at)`, the glow off once dead. Check: on her
  M79 entry and the joined entry -- linked and frozen to frame 79, dead at 80 with M77, falling in world space away from joint
  200, lying (M78) on her ground.

## 10. Not read

* What selects her event groups 12 / 18 (§14.4); the band thresholds of his op 0x77 (§14.2); his 7:0x3f helpers
  `0xfd4924` / `0xfd4b00` and so its repeat count (§14.3).
* The enemy update order (§4.1) and the +0x24 / +0x28 pass split across units (§4.2).
* The ROM's blend curve (§4.4).
* His 7:0x3f in full: the turn record pick, the repeat count and start frame (`[+0xcac0]+0x6c`, phase 2 `0xfd5d48`
  start 20) -- her 7:0x4e (L0 M65) / 7:0x4f (L4 M42 from frame 90) combined attack, issued from g1 s81 (selector 12).
  L0 M65 and L4 M42 are also her ordinary (2,6) and (7,9), so they stay `both` with the ride.
* What `0x78b78(e, 0, 0x92 / 0x180)` tests (her 7:0x36 entry) and the condition behind her 7:0x3d -> 7:0x3f follow
  (`0xf95f5c`).
* Whether a dead Queen's `[+0xc] & 7` leaves 1..2 (which would unlink him every frame at `0xfc5af0`) -- he leaves at
  her death by request 7 anyway.
* Her M78 attack 0x2b against him (§8).
* What issues his 1:0x12 (`0xfc521c`, §15).
