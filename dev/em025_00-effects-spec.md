# Chameleos (em025_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm025_00`; his word is the BASE `0xca170` (`BASE_ONLY`, already in psl-mask.js). No states note existed. Scratch:
`<archive>/zg/c025.asm`, `pp025.asm`, `hook204b.py`, `states060.py`, `partscr.py`, `scrdump.py`.

## 3. The states -- R

- Status 10: (10, 7) parts 0 / 6 -> L3 M3, 1 / 2 / 3 / 7 -> L3 M12 -> L3 M2, 4 / 5 -> L3 M12 -> wait 240 -> L3 M6 -> L3 M7; (10, 0x72)
  part 0 -> L3 M3, 1..7 -> L3 M13 -> L3 M14; exhaust L3 M2; sleep (10, 0x1d) L3 M11 -> L3 M7 -> L3 M10, (10, 0x1e) op 1 (no motion
  named: the fall's last clip L3 M10 held -- I), wake L3 M7 -> L3 M10; paralysis L3 M9 held; the stun (every side) L3 M12 -> wait 240
  -> L3 M6 -> L3 M7; recoveries L3 M10; no shock trap; death L3 M8.
- vt+0x204 `0xdff4f0` on (10, 0x72) (emulated): part 0 -> P+0x3b4 |= 2 and `0x9d438(e, 0)` (the horn, u 1000); part 6 ->
  `0xc2274(e, 0, 0, 0x8f)` (`0xdffd18`) -- the tail sever at joint 143.
- The part pass vt+0x210 `0xe00eb4` (set calls `0xe011fc..0xe01298`, READ): set 0; P+0x3b4 bit 1 -> 4 : 3 (horn); part 7 vs row 1
  (level 2) -> 6 : 5 (wings, u 1036); bit 0 -> 8 : 7 (tail). Its head re-flags hit records (the invisibility). No eye applier, no
  tired case. Rage: g6 s0 ends (7, 0x14) L4 M1.
- **The puff pick** vt+0x2a4 `0xe025f0` (READ whole): 1 (u 1120) iff the angle's low 16 bits, bit 0 dropped, exceed 0x1555 (30
  degrees; a negative angle's low bits do too); P+0x5d04 = 4 (`0xdff2dc`). `chameleosPuffPick`; RAGE_PUFF em025_00; `_autoOnRage`.
- CUT_TAIL: descriptor [24] `0x159640c` -> em025_00_tail, joint 143, 20.

## 4. Implemented / results

CLIP_ACTIONS / CLIP_VARIANTS (the status-10 copies); MOTION_STATES.em025_00; RAGE_PUFF + pick; CUT_TAIL; `--apply` +1, recorded.
Check dev/checks/elders.mjs pass. Soak **54 motions, 0 refused**.

## 8. The invisibility (2026-10-18; Raven approved an Invisible control)

### 8.1 The state, the setters, the clears
ctl = [e+0xcac0]: +0xc requested, +0x13 2 full (horn intact) / 1 shimmer (horn broken, or (1, 0x16)), +0x14 the clip family, +0x15
the phase, +0x16 a latch across action changes, +0x17 also fade the model alpha; P+0x5cfc bit 0 cloaked or uncloaking. Set by (1, 0x11)
/ (1, 0x03) at L0 M16 f70, (1, 0x16) at L3 M32's start, (2, 0x14) at L2 M30 f0, the demo (13, 0), and vt+0x3cc 0xe0def4 (no caller
found); (1, 0x11) and (2, 0x14) behind the area gate 0x5bfb8 / 0x5c1a8 (NOT READ). Cleared at nearly every action start (vt+0x204) and
by about twenty action bodies; no timer.

### 8.2 What it shows (vt+0x210 0xe00eb4)
Cloaking: body / wing stealth_start_S (30 frames, transparency 1 -> 0), the light fade_out, the eyes off (vt+0x1c8: set 9). Full: at
30 frames the hit zones switch to the second meat block and the model alpha goes to 0 -- e+0x158 = 0, the model is not drawn (0x892098).
Shimmer: stealth01 / stealth02 into material slots 1 / 3, stealth_start (15), then the stealth loop (alpha stays 1). Uncloaking: the
stealth materials with stealth_end (30) and the alpha back over 60, then the normal materials with stealth_end_S (30), then the light
fade_in (30); the eyes return when the phase reaches 4. The unit word e+0x110 / +0x11c copy is overwritten the same frame (no effect).

### 8.3 What else keys on it
His PSL starts: refused while fully cloaked (vt+0x12c 0xdff12c). Effects: no class request is gated on it (the two vt+0x1d0 sites are
outside). Shells: his sp_01 footfalls are not hidden. AI parameters (vt+0x1dc, vt+0x214): not visual.

### 8.4 In the viewer
The **Invisible** control (CLASS_CONTROLS.em025_00, working label "Invisible", Off / On) -- the full cloak: ROM_STAGE_CLIPS em025_00
(body / wing stealth_start_S held, light fade_out held; Off: stealth_end_S, fade_in, then the rest), STATE_OVERLAY.em025_00 (set 9),
index.html stepCloak025 (the model not drawn from 30 frames after On; the schedule's pslRefuse). NOT SHOWN, named: the shimmer path
(the material-slot swap -- the viewer has none), the 60-frame alpha ramp back, the hit-zone meat switch, the area gate. Check: elders
(the Invisible row, the eyes, stealth_start_S, not drawn + PSL refused at 30 frames, back on Off). Soak em025_00 54 / 0.

### 8.5 The gaps closed (2026-10-18)

- **The model alpha:** the full cloak CUTS to alpha 0 at phase 1 (30 frames; 0xe01a38 -- no fade going in on this path; (1, 0x11)'s +0x17 path is the one that fades over 30); the uncloak ramps 0 -> 1 over 60 frames (0xe01764), drawn translucent while below 1. index.html applyCloakAlpha025 scales every model material's opacity (blended); at 0 the model's meshes are not drawn -- their materials, not the root, since the effect runtime's frame driver and its effects hang from the root (hiding the root stopped the runtime).
- **The shimmer's material-slot swap:** horn broken (P+0x3b4 bit 1, the part pass's set 4) -> at 30 frames stealth01 / stealth02 (#a525c570 / #15178149) take slots 1 / 3 -- the body and the wing (the glb's material order: 0 eye, 1 body, 2 light, 3 wing) -- with stealth_start (15) then the stealth loop (120). Built on the existing runtime swap (STATE_MATERIAL_SWAP.em025_00 `stealth`, applyMaterialSwap: the swap-ins are built through the mount's own buildMesh); the clips through ROM_STAGE_CLIPS' new `manual` machines, driven by the phase machine (stepCloak025).
- **The uncloak's phases:** stealth_end (30) on the stealth materials (swapped in for the full cloak too), then the body / wing back with stealth_end_S (30), then the light's fade_in (30); the eyes back at phase 4 (frame 90: STATE_OVERLAY's `cloakEyes`).
- **The hit zones:** slots 0-6 on table-1 rows while cloaked (0xbaafc(e, k, k)): ROM_MEAT_SWITCH.em025_00 under `ctl` (the class byte); the Damage Table's state list is the Invisible control's options.
- Still named: the area gate (0x5bfb8 / 0x5c1a8).
- Checks: elders 401 / 0 (the Invisible row, eyes, stealth_start_S, the model not drawn with the runtime still stepping and PSL refused, the translucent uncloak with stealth01 swapped in, the eyes and materials back, the damage table on the byte, the shimmer with stealth01 / 02 drawn and the gate open).

### 8.6 The breaks and the cloak (2026-10-22; Raven: "one breaking caused him to no longer be able to go full invisible and that both broken would prevent him from going invisible at all"; Off / On with live breaks)

The rows are in rom-map "Chameleos's invisibility levels".

* **The level is the horn's, chosen when a cloak starts.** Every setter but two picks it from the horn (vt+0x370(e, 2), P+0x3b4
  bit 1): intact full (+0x13 = 2), broken semi (1). They are 0xe03b70 ((1, 3) / (1, 0x11)), 0xe06a0c ((2, 0x14)) and a fourth one
  found now, 0xe0a098's phase 7 after L2 M30 (status-7 attacks (7, 0xf / 0x11 / 0x26 / 0x2a)). (1, 0x16) is always semi; the demo
  (13, 0) and vt+0x3cc always full. **No setter reads the tail.** Nothing rewrites +0x13 while a cloak runs.
* **A break while cloaked ends the cloak.** A break or a sever starts his status-10 reaction, and vt+0x204's status-10 arm ends any
  cloak at that action's start, latch or not (0xdff778..0xdff810). ROM-RUN with a control: the latched cloak survives status 1 / 2 / 3
  starts. So the horn breaking does not turn a full cloak into a semi one live: the cloak ends, and the next one is semi. The tail
  sever ends it too, with the horn intact or broken (the earlier "only with the horn already broken" is withdrawn).
* **The AI.** The command table's cloak (g0 s18, (1, 3)) needs selector 0 = the area gate AND the horn intact: **once the horn is
  broken the AI no longer picks that cloak.** The tail's selector (2, 0xe01e48) is read only while cloaked, and its one consumer
  (g1 s15) picks between two cloaked walks; "both broken" (0) takes the same branch as "tail severed" (1). The always-semi (1, 0x16)
  is picked by g13 s0 with no break test.
* **Against Raven's description.**
  - "One break -- no full invisibility": **the horn** does it (every horn-picking setter goes semi, and the AI's (1, 3) cloak is no
    longer chosen). **The tail alone does not**: with only the tail severed every setter still gives the full cloak.
  - "Both broken -- no invisibility at all": **not found.** With both broken the setters give semi and nothing in the class code or
    the command table refuses a cloak for the pair. Still unread, so the place it may live: who starts group 13 (the (1, 0x16)
    cloak's stream) and who issues (1, 0x11), (2, 0x14) and (7, 0xf / 0x11 / 0x26 / 0x2a) -- no op 00 and no follow in the census
    reaches them. Raven's statement stands; the search has not found the mechanism.
* **Built.** The Invisible control is Off / On. On = the cloak at the horn's pick; a break or a sever while cloaked ends it on that
  frame (the uncloak plays), and with On still set the next cloak starts 90 frames later at the new level. Breaks set before On take
  effect at once. The (1, 0x16) always-semi and the (1, 0x11) fading look are no longer options. Note: the AI's command-table cloak
  (1, 3) is 0xe03b70, which sets +0x17 = 1 -- the FADING look (alpha 1 -> 0 over 30) with the horn intact; On drew 0xe06b04's cut (superseded in 8.7: On now fades)
  (as asked). Draw meter (`<archive>/chmeter2.mjs`): On -> horn -> tail: full, uncloak, semi, uncloak, semi; On -> tail -> horn:
  full, uncloak, full, uncloak, semi; set before On: none full, horn semi, tail full, both semi. Elders 403 / 0.

### 8.7 Every cloak entry, and the breaks (2026-10-22, second pass)

The rows are in rom-map "Chameleos's invisibility levels" (the entries table, the issuers, the shared EMC).

* **The entries, and what the breaks do to each** (both broken in the last column):

  | entry | who starts it | level | timing | gate | both broken |
  |---|---|---|---|---|---|
  | (1, 3) | the command table, g0 s18 | horn: full (FADE, +0x17 1) / semi | AI choice | area gate + selector 0 = horn intact | **refused** (selector 0 = 0) |
  | (1, 0x16) | g13 s0; group 13 runs while e+0x758c > 0 (a 1200-frame timer, I: leave the area) | always semi | the timer | none read | **reachable** (census) |
  | (7, 0xf / 0x11 / 0x26), (7, 0x2a) | vt+0x2f8: accumulated damage >= a threshold | horn: full (cut) / semi | the threshold | area gate | **reachable** (census) |
  | (1, 0x11), (2, 0x14) | no issuer found | horn | -- | area gate | -- |
  | (13, 0) | the demo | always full | opening | -- | demo only |
  | vt+0x3cc | no caller | always full | -- | -- | -- |

* **A break or a sever while cloaked** ends the cloak (8.6). **The tail** never sets a level and never gates an entry; its only AI
  read (selector 2) picks between two cloaked walks.
* **Against Raven.** "One break -- no full invisibility": the HORN (the setters go semi; (1, 3) is refused). "Both broken -- no
  invisibility at all": **no instruction found**; with both broken (1, 0x16) and the status-7 cloaks still start, semi. The places
  searched: every cloak entry and its issuer (above), the shared EMC (no break read), his selectors (only 0 and 2 read breaks), every
  break read in his band. Still unread: the issuers of (1, 0x11) / (2, 0x14) (no immediate anywhere: a computed issue?).
* **Built (viewer).** Off / On. On: the horn intact -> the (1, 3) fade; broken -> semi. A horn or tail break -- or a RESTORE, which the
  game never does (the viewer mirrors the break) -- while cloaked ends the cloak; the next starts 90 frames later at the new level.
  **The 90 frames are a stand-in.** Draw meter (chmeter2.mjs, 10 / 10): On -> horn -> tail: full, uncloak, semi, uncloak, semi;
  On -> tail -> horn: full, uncloak, full, uncloak, semi; On -> horn -> horn restored: full, uncloak, semi, uncloak, full; On -> tail
  -> tail restored: full, uncloak, full, uncloak, full; both broken, On, restore the horn, the tail: semi, uncloak, full, uncloak,
  full; set before On: none fade -> full, horn semi, tail fade -> full, both semi. Elders 403 / 0.
* **Open choices for Raven** (the ROM gives several; the viewer has one control):
  - the look with the horn intact: the (1, 3) fade (built), the status-7 cut, or both;
  - the (1, 0x16) always-semi leave-area cloak: shown or not (it ignores the horn);
  - the re-cloak wait after a break (90 frames now, a stand-in: the game's timing depends on the AI, the leave timer or the damage
    threshold);
  - both broken: semi (the ROM as read) or not cloaked (his description, no instruction found).

### 8.8 Verify pass: does horn + tail stop the cloak? (2026-10-22; Raven: "I have seen a lot of people claim breaking both prevents him cloaking")

The rows are in rom-map "Chameleos's invisibility levels" (the VERIFY PASS rows) and the Withdrawn table. Scratch `<archive>\cv\`.

* **No.** No instruction refuses a cloak because both parts are broken. With both broken he still cloaks, semi.
* **Correction to 8.6 / 8.7.** "Once the horn is broken the AI no longer picks (1, 3)" is withdrawn. The table issues (1, 3)
  three times. Only g0 s18's issue, a stage and area-3 special path, sits behind selector 0 (the area gate AND the horn intact).
  **g1 s49 issues it again in its else branch with no horn test**, and g1 s49 is the regular combat chain: g0 s13 / s14 call g1 s47
  (24 times) and g1 s53 (6 times), and those go to s49 unless the stream called before was s47 / s53 / s49 / s50. The (1, 3) body
  `0xe03b70` needs only the area gate, no cloak up and P+0x5cfc bit 0 clear. ROM-RUN (`cloak13.py`): with the gate, the breaks
  none / horn / tail / both write +0x13 = 2 / 1 / 2 / 1. Without the gate (the control), no setter runs.
* **Per entry** (intact / horn / tail / both):

  | entry | issuer | intact | horn | tail | both |
  |---|---|---|---|---|---|
  | (1, 3), g1 s49 | regular combat chain (gate held) | full (fade) | semi | full (fade) | **semi** |
  | (1, 3), g0 s18 | map 0xf7, area 3 only: **no shipped quest** (below) | full (fade) | refused | full (fade) | refused |
  | (1, 0x16) | g13 under the 1200 timer (status-10 reactions n 0xa0..0xa5 / 0xbc / 0xbd / 0xc0 / 0xc1 / 0xd9 / 0xdb) | semi | semi | semi | semi |
  | (7, 0xf / 0x11 / 0x26 / 0x2a) | damage >= 500 / 600 / 650 (+50) with a 1800-frame cooldown; **only when `0x3a8430` = 5** (I: G rank) | full (cut) | semi | full (cut) | semi |
  | (1, 0x11), (2, 0x14) | no issuer found | -- | -- | -- | -- |
  | demo (13, 0) | the opening | full | full | full | full |

* **Searched, with controls:** every writer of ctl+0x4c / +0x50 (init, the accumulator, the area restore; none break-related), of
  e+0x758c (setAction's status-10 / 11 arms), of P+0x5cfc bit 0 (only the cloak ends; cleared by vt+0x210), and of the area gate's
  slots (his ctl+0x49 machine / (7, 0x14), and a shared object create). The EMC interpreter's whole reach, plus the 60 shared vtable
  defaults it calls, reads no break state in any form. Control: the same scan finds Blangonga's `0x9d36c` and his own selector-0
  vt+0x370. The cloak bodies reach only their horn picks. One break reader the earlier census missed is vt+0x24c `0xe01fb8` (part 7
  -> P+0x3b4 bit 3, a register-offset store). It is not a cloak input.
* **The tail** sets no level and gates no entry. Its only AI read is selector 2, which picks between two cloaked walks (8.6). A
  sever, like any status-10 reaction, ends a cloak that is up, and he cloaks again later.
* **What may explain the player claim (INFERRED, not ROM):** the horn turns every regular cloak into the semi look: the stealth
  materials at alpha 1, so he stays drawn. Players may count semi as "not cloaking". The tail's sever then adds a flinch that ends the
  cloak up at that moment. The ROM itself keeps him cloaking.
* **Viewer:** the built Off / On with live breaks already gives semi with both broken. Nothing to change on this question. Open
  choice for Raven unchanged.
* **g0 s18's "area 3" -- of what map (Raven's follow-up, same day).** **Of none that ships.** The path's three conditions:
  - **op 2a case 0xf7 = the quest's map number** (e+0x1053, from cQuestData mMapNo folded % 100 % 28), compared on the byte. All 1,849
    quest files use maps 1..27 and 101..104, which fold to 1..27. Every writer of the source byte gives 0, 0xff, -1 or that fold, so
    no quest puts him on map 0xf7. His quests are on maps 2 Verdant Hills, 7 Marshlands, 17 Forlorn Arena, 23 Jungle and 24 Ruined
    Pinnacle (names from build-map-backgrounds.py, which takes them from quest text). He tests map 0xf7 at four more places in his own
    code, and Kushala tests it with area 3 too: a map value from another build, INFERRED.
  - **op 07 case 3 = area (zone) 3** of the current map (e+0x1054), an exact match.
  - **op 79 = `0xb71ec(e, 0)`**, a code for how his target stands to him. 0x1000 means another area or a plain zone link. 0x2000 /
    0x4000 mean a zone-link record of certain kinds (its +5 flag 0 / not 0). The low 0x41 is the default posture with no special
    position flags. So 0x1041 is the plain case, and 0x2041 / 0x4041 are the same with such a link. The link records come from the
    stage's area data and their meaning was NOT READ.
  - So the horn-gated g0 s18 (1, 3) **never fires in the game**: on shipped maps 0x2041 goes to g0 s9 and 0x4041 to g0 s10. The
    same dead map test sits in g1 s49 (its restart arm), so s49 always reaches its (1, 3). **In practice no AI path stops his
    cloak for a horn break**: the horn only changes full to semi.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **The area gate `0x5bfb8` / `0x5c1a8` -- READ: area data.** Each asks a global object's timed slots (+0x29b8.., +0x2a08) whether a
  state is running in his area (e+0x1054). It is the quest / area side's state, not his: category a, named.
* **(10, 0x1e)'s op 1 -- READ by the Kushala row** (rom-map Withdrawn row on em024_00 spec 3, "op 1 sets no motion (0x9fea8)"): the
  clip (10, 0x1d) leaves running is held -- L3 M10 here. The I above is R.

## 9. The levels, the horn and the tail (effects lane, 2026-10-22)

Raven's lead: "has a semi invisible state we are not currently displaying ... based on part breaks, horn and tail". The ROM rows are in
rom-map "Chameleos's invisibility levels".

* **Three setters.** Each sets ctl+0x13 / +0x17:
  - **(1, 0x11)**: fading; +0x13 = 2 with the horn intact, 1 with it broken.
  - the plain cloak: full with the horn intact, semi with it broken.
  - **(1, 0x16)**: always semi.
* **What each level draws:**
  - **Full** (cut): the model is gone at 30 frames.
  - **Full** (fading): the alpha ramps from 1 to 0 over frames 0..30.
  - **Semi**: the stealth materials from frame 30; the alpha stays 1.
* **The horn** picks full or semi. **The tail** ends a cloak only when it is severed while the horn is already broken (0xdffd1c). No
  setter tests the tail, and its EMC condition is AI-only. **(Withdrawn 2026-10-22 in part: any break or sever while cloaked ends it,
  8.6.)**
* **Built.** The Invisible control: Off / On (the horn's pick) / Semi-invisible / On (fading). stepCloak025 implements the sever's end.
  The measured look of every combination is in the rom-map row.
