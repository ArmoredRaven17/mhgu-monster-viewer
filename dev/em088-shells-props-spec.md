# em088_00 Ahtal-Ka -- his shells and his props (the rubble he swings and throws)

Shell / prop implementation agent for the Viewer agent, 2026-10-15. Raven: *"They use additional models in their
attacks, things like broken dragonators"*, *"So, similar to Nakarkos, we will have multiple models to contend with."*
Static reads with `efx/armdis.py` (PIC- and GOT-resolving helpers in the scratchpad `ahtal/`: `picrefs.py`,
`gotrefs.py`, `seqdump.py`, `shldump088.py`, `resids088.py`, `eflres.py`); the effect lists' model resources from the
game's own loader (`efx_load.LoadedEffect`); headless probes `ahtal/rubble_probe.js` / `ahtal/fx_probe.js` (nothing
they do ships). The efx recorder / lift were not used. Read first: `dev/rom-map.md` (the Ahtal-Ka states section and the
`0x6d1b4` / uEm088_00 enable-word rows), `C:\MHGU-RE\offline\decode\notes\states-em088_00.md` (the states agent's, same
day), `dev/effects-triage/em088_00.md`, `dev/shell-map.md`, and **`dev/em088_00-effects-spec.md`** (the enable-word agent's, same day: `e+0xcb0c` = the carried
object, the setter, the pending bytes, the silk-thread pass and the web anchors -- this file adds what draws the objects,
which shells are which, and the rows its harness could not run). E = the uEm088_00 enemy; "CU" = the fight's global that
spec calls **G** (GOT `0x1832980` -> `0x2132968`: `+0x3c+k` slot state 1 at its spot / 2 carried / 3 free, `+0x50+16k`
the spot, `+0xb0+4k` the free unit). Its functions (`0x10ae6c0`, `0x10aebac`, `0x10aed04`, ...) sit in the band of
`uEm087_088_ControlUnit` (DTI `0x184aa18`, vtable `0x17fa07c`, getDTI `0x10aee0c`, code `0x10ad9f4..0x10aeef8`), so G is
INFERRED to be that unit.

READ = the consuming instruction was read. INFERRED = said so where it stands.

---

## 0. Headline

- **The props are Ahtal-Neset's three rubble models**, which Ahtal-Ka's arc carries under em087's folder (byte-identical
  to em087_00.arc's, md5 checked) and which the viewer already stages: `docs/models/monsters/em087_00_rubble_01/02/03.glb`.
  No new glb is needed.
  - `em087_00_rubble_01` (res `0x8679`) -- a long spiked pole, **the broken Dragonator** (26 m; the same shape as the
    effect model `effect\base\em087_00_001`, below).
  - `em087_00_rubble_02` (res `0x867a`) -- **a wheel** (a siege engine's).
  - `em087_00_rubble_03` (res `0x867b`) -- **a broken siege frame** (a ballista / cannon carriage).
  The names are by shape (and the arc's own sound names `em088_vf_atk_hit_pole / _wheel / _pillar`, `..._3item_*`):
  INFERRED. Which file is which index is READ (`0x10a40f4`).
- **Two things draw them** (both READ):
  1. **the held prop** -- one `uEm088_Rubble` unit (a uModel, 0xfe0 bytes) Ahtal-Ka makes at vt+0x18, parented to **his
     joint 130** while he holds a piece. It draws `rubble_0(id+1)`, `id = E+0xcb0c` (0 / 1 / 2; 4 = none).
  2. **shell57** (`uShellEm088_sp_57`, base57) -- the piece **in flight**: pulled to him, thrown, or dropped. base57's
     init sets the shell's own model to the owner's rubble model by the request's id.
- **The effect models are a second set of "broken dragonators"**: `effect\base\em087_00_001` (a 26 m Dragonator spike)
  and `effect\base\em087_00_000` (a ballista ball with a bolt) are drawn as effect MODEL ROWS by Ahtal-Ka's effect lists
  `em088_00_000` (u 200..229 / c 30 on his swing clips; u 60..62 / 70 / 310 / 311 / 321 / 330 on shells) and
  `em088_00_021` (u 300 / 301, shells 60 / 61), and by Neset's `em087_00_009 / _010` (u 150..152, shell48). The u 200..229
  set is **already exported and drawing** (screenshot §8).
- **Seven shells, none in shells.js.** Runtime status: base00 / base01 exist but his sp_00 / sp_01 override the INIT
  (and more); **base48, base57, base58, base60, base61 have no runtime**. Nothing of his could be wired on the existing
  runtime without new code -- see §7 for exactly what each needs.
- **One viewer finding for the effects lane:** his u 200..229 come in three sets, one per rubble id, chosen in the ROM by
  `E+0xcb0c` through the enable word (`0x10bc340`: id 0 / 1 / 2 -> bits 18-20 / 21-23 / 15-17). The viewer has no rubble
  id, so **all three sets fire at once** (probe: L2 M4 live 201, 203, 211, 213, 221, 223; L2 M6 200, 201, 210, 211, 220,
  221, 223). The rubble choice should drive both the prop and that bit group.

---

## 1. The props -- where they are drawn and when

### 1a. The models (READ)

| E field | resource | file | loaded by |
|---|---|---|---|
| `E+0xcb00` | `0x8679` (rModel) | `enemy\em087\em087_00\mod\em087_00_rubble_01` | `0x10a40f4(E+0xcb00)`, called from uEm088_00 `0x10b3254` (vtable slot `0x1804484`); released in the dtor `0x10b2f84` |
| `E+0xcb04` | `0x867a` | `..._rubble_02` | " |
| `E+0xcb08` | `0x867b` | `..._rubble_03` | " |

(`0x152530(rm, id, dti)`; ids resolved against the arc by `~crc32(path)`, `0x159daa0`: `ahtal/resids088.py`.) The same
loader serves Ahtal-Neset. `0x867c` is `em087_00_rocket` -- **not** in Ahtal-Ka's arc; base59 (Neset's
`uShellEm087_sp_59`, init `0x434da8`) is what draws it (`0x4350f0..0x435118`), not any shell of his.

### 1b. The held prop: `uEm088_Rubble` (READ)

- Class DTI `0x184ab18` (name `uEm088_Rubble`, base `uEm087_088_RubbleBase` `0x184aad8`), vtable `0x17fa234`
  (getDTI `0x10af440` at +0x14). Factory `0x4e994` -> RubbleBase ctor `0x10aeef8` (owner `+0xfd0` = 0, index `+0xfd4` =
  -1, current id `+0xfd8` = 4).
- Made once, in uEm088_00 vt+0x18 `0x10b30a4`: stored at **`E+0xcb18`**, registered on move line 4 (`0xc03670`), then
  `0x10af1b4(unit, E, 0)` (owner E, index 0).
- Every frame (RubbleBase move `0x10aef80`; Ahtal-Ka's overrides at vt+0x88..+0xa8):
  - id = vt+0x98 `0x10af364` -> `0x10b3e70` = **`E+0xcb0c`**; when it changed, vt+0x90 `0x10af300` -> `0x10bb5d0(E, id)`
    = `[E+0xcb00 + 4 id]` (null for id 4) -> vt+0x58 = setModel. (id 3 would read `E+0xcb0c` itself: never set.)
  - held = vt+0xa0 `0x10af394` -> byte **`E+0xcb10`**, which E's frame update writes every frame as
    **`E+0xcb10 = (E+0xcb0c != 4)`** (`0x10b4044..0x10b4064`).
  - held: vt+0x94 `0x10af348` sets `+0x34 = 0x82`, the unit's position `+0x40` from a global vector, then vt+0x48
    `0x457c8(unit, E, 0x82)` -> uCoord **parent = E, parent joint = 0x82 (130)** (`+0x30` / `+0x34`). Not held:
    vt+0x48(unit, 0, -1).
  - drawn: vt+0x88 `0x10af1f8` sets the unit's draw bit (`+0xc` bit 11) iff `E+0xcb10` and the owner's `+0x139c`
    (the owner drawn). So **the piece shows exactly while `E+0xcb0c` is 0..2**.
  - vt+0x8c / `0x10af0d0`: `E+0xcb14` (set to 0xff each frame by E, and to 7 by the event table on L2 M4 / M6 / M8 / M17,
    §3a) != 0xff -> `0x2b3c8(global, 3, value, &pos)` at the piece -- what that request makes is UNREAD (INFERRED: the
    ground-scrape the arc's `vf_atk_rubbing_ground` sounds name).
  - vt+0xa8: `E+0xcb1c` -> the unit's `+0x110` bit 1. Meaning UNREAD.
- Ahtal-Neset's twin, `uEm087_Rubble` (vtable `0x17fa180`), parents its pieces to **Neset joints `0x82 + id`** (130 / 131 /
  132, `0x10af334`) -- so em087's rubble belongs ON the Neset, not fanned beside it as the viewer shows it now. Not
  pursued (em087's own visibility getters `0x10ada5c` / `0x10ada70` unread).

### 1c. Which rubble, and when he holds it (READ unless marked)

`E+0xcb0c` is written only by `0x10b62f4(E, id)` (and the network copy `0x10bb0bc`, and the drop / throw below):

| writer | from | on | when |
|---|---|---|---|
| `0x10bd2e8` in (1, 3) `0x10bd064` | `E+0xd470` | **L2 M14** (setMotion `0x20e`, blend 4) | crossing **frame 150** (`0xb0968`, literal `0x10bd31c`); he first turns and moves to the CU's spot for that piece (`[CU]+0x50 + 16 id`) |
| `0x10c00e0` in `0x10bfd64(E, r5, r6)` = (1, 5) / (1, 0xd) / (1, 0xe) / (1, 0x13) | `E+0xd471` | **L2 M20** (r5 != 2) / **L2 M38** (r5 == 2), set at the same step, frame 0 | after shell57 (the piece pulled in, §2) ends or 600 frames: L2 M19 / M37 first, shell57 made at **frame 92** (tune float 15) |
| `0x10bd9f0` in (1, 0x12) `0x10bd6c0` | `E+0xd471` | after L0 M1 (motion 1) and a shell57 pull | timer; then L0 M4 |

`E+0xd470` / `E+0xd471` (each cleared to 4 after use) come from the **command stream**: EMC op 0xa3 -> vt+0x218
`0x10bae18(E, b1, b2)` (table `0x10bae38`, index b1 - 1) writes b1 1 -> `d470`, 3 -> `d471` (also 2 -> `d3fc`, 4 ->
`d472`, 5..8 -> `d434..d437`, 9 -> `d499 = 1`, 10 -> `d438`), then `0x6d1a4` (b1 0 -> `e+0xcac8`, the states note). So **his AI script picks the piece**.

Dropping / throwing (the action-change handler vt+0x204 `0x10b4828`, status-1 table `0x10b4bac` (index number - 1),
status-7 `0x10b4c90` (number - 0x10)) -- statically, for the starts the effects spec's harness faulted on:
- (1, 6) / (1, 0x20) -> `0x10b5298`: `0x10b613c(E, id, 1)` -- **shell57 drop** -- then `E+0xcb0c = 4`.
- (7, 0x10) / (7, 0x32) -> `0x10b51e4` -> `0x10bb7c0(E, 0x211, req)`: **shell57 throw** (mode from `0x10aed44(CU, id)`),
  then `E+0xcb0c = 4`, then setMotion **L2 M17**. So on L2 M17 the piece flies as shell57 from frame 0; the held prop
  is gone.
- The emulated list (effects spec §1.1): (0, 2), (1, 2), every ailment / reaction / death start ((10, 0x1d..0x20 / 0x2a /
  0x2b / 0x44 / 0x45 / 0x94 / 0x9b / 0xa1 / 0xa9 / 0xab / 0xbb..0xbe / 0xc5), (11, *)) also drop it.

**The clips he swings it on** (INFERRED -- the evidence, all READ: his u 200..229 records sit on joint 130 and on these
clips; the enable word gives one of three bit groups per `E+0xcb0c`; the event table sets `E+0xcb14` = 7 -- the held
piece's request -- on L2 M4 f134-190, L2 M6 / M8 at 50, L2 M17 f140-160): **L2 M4, M6, M8, M9, M10, M11, M12, M23, M36,
M40** (the (7, n) attacks, status-7 `0x10be758`). The (7, n) -> clip map is the states agent's.

**For the viewer, per clip:** L2 M14 from f150 to the end; L2 M20 / L2 M38 whole; the swing clips above whole; L2 M17
none (shell57); L2 M19 / M37 none (shell57 pulling the piece in from f92).

---

## 2. The shells -- inventory (READ unless marked)

Ids `0x17b..0x181` (table `0x175c3e8`, rows 379..385; registered for preload by `0x10bb1a4`), every `.shl` lists one
effect list, `effect\pel\em\em088_00u` (ef slot 0 = u). Folders `shell\em\em088_00_shellNN` (ids resolved, res
`0x8ac8..0x8ace`). Values: `ahtal/shl088.txt` (the files' own, `shellef.load_typed` -- shell57 / 58 / 60 carry a
ShellCmnParam that `load()` would have hidden).

| shell | id | class (vtable) | setup DTI -> base | own slots | draws | ef records (efl, its models) | spawned by | clip / frame |
|---|---|---|---|---|---|---|---|---|
| shell00 | `0x17b` | `uShellEm088_sp_00` (`0x1809838`) | own `cSetupParamEm088_00` (64 B); vtable **base00** | **init +0x13c `0x10c315c`**, +0x24 `0x10c312c`, reader `0x10c34c0`, +0x150 `0x10c389c`, +0x158 `0x10c3224` (makes shell00 mode 1, `0x10c341c`), +0x15c `0x10c3454`, +0x168 `0x10c375c` | nothing of its own | mode 0: u 30 flight (`em088_00_008`: 4 x `em088_00_102` -- a spiked silk ball -- + cm151_000, cm102_003), u 32 / u 34 (`em088_00_009`: `em088_00_102`, cm101/151/102); mode 1: u 31 (008), 32, 34 | event table type 8 (§3a) -> `0x10bb298`: mode 0, request `+0x30` = the entry's word (raw float bits: 5.0 / -25.0 / 3.0 / 30.0, meaning UNREAD) | **L2 M26** f8 (seq 17); seq 21: seq-time 12 / 44 / 78; seq 36: 44 |
| shell01 | `0x17c` | `uShellEm088_sp_01` (`0x18099b4`) | base01 | **init `0x10c3a80`**, +0x98 `0x10c3bfc`, reader `0x10c3b08`, +0x150 `0x10c3c98`, end create +0x154 `0x10c3f50` (shell01, `0x10c3f40`), +0x15c `0x10c3bc4` | nothing | modes 0 / 1: u 90 / u 91 (`em088_00_010_s` / `_011_s`: 25 model rows each of `em088_00_100 / 101 / 103` silk strands + `_104` a strand web); modes 3 / 4 / 5: none (hit only) | `0x10b6320` by `E+0xd3fc` (1: mode 0; 2: mode 1; 3: both), from the frame update (`0x10b40fc`, timer `E+0xd404`) and at (1, 0xc) / (1, 0x17) / (1, 0x19) (`0x10b4c50`) -- `d3fc` from EMC op 0xa3 b1 2 | not clip-bound: arena silk lines (hit data 90 / 1800 frames) |
| shell48 | `0x17d` | `uShellEm088_sp_48` (`0x1809b24`) | base48 (init `0x426abc`) | reader `0x10c415c`, +0x160 `0x10c42fc`, +0x164 `0x10c443c` | nothing | u 150 (`em087_00_009`: 5 x `em087_00_000` ballista ball), u 151 / 152 (`em087_00_010`) | vt+0x1dc `0x10b345c` per frame: when CU byte `+0xc6 + k` (k 0 / 1, `0x10aead0`) -- from action-tune vec 13 / 14 (-3000, 2150, -5500) / (5500, 2150, -2000) toward unit `CU+0xc8+k` (`0x10aeae4`, `0x27482c`) | not clip-bound (what sets the CU bytes: UNREAD) |
| shell57 | `0x17e` | `uShellEm088_sp_57` (`0x1809c94`) | base57 (init `0x42f070`; base57 is **only** this class) | reader `0x10c4598` | **the rubble model** (§1) | per mode `4k + j` the rubble j (0 pole / 1 wheel / 2 frame): u 61 / 62 / 60 (`em088_00_000`), u 201 / 202 / 200 (`em087_00_014`, UNIQUE array), u 231 / 232 / 230 (`em088_00_017`), u 261 / 262 / 260 (`em087_00_004`), u 70 (modes 8..10, 24..26), u 320 / 321 (modes 20..22) | the CU's `0x10aebac(CU, rec)` (handle at `CU+0xb0+4 id`): the pull `0x10c0048` (mode `id + 8`, `0x10aed04`), the throw `0x10bb8b8` (`0x10aed44`), the drop `0x10b62d8` (`0x10b613c`), (1, 0x12) `0x10bd988`, `0x10b5f44` (`0x10b6058` / `0x10b610c`) | L2 M19 / M37 f92 (pull), L2 M17 f0 (throw), (1, 6) / (1, 0x20) start (drop) |
| shell58 | `0x17f` | `uShellEm088_sp_58` (`0x1809dec`) | base58 (init `0x4336e8`) | reader `0x10c4924` | nothing (base58 sets no model; the rocket is base59's) | u 0 / u 1 -- **not in em088_00u**: draws nothing | event table type 10 -> `0x10bb34c`: mode = entry word 0, `+0x14` = s16 angle of word 1, `+0x18` = word 2 | **L2 M17** (seq 50 / 51, mode 0); **L2 M33** (seq 52 mode 1; seq 53 mode 1 at 0 / +15 / -15 deg); seq-time 0 |
| shell60 | `0x180` | `uShellEm088_sp_60` (`0x1809f58`) | base60 (init `0x435d28`) | reader `0x10c4cf0`, +0x150 `0x10c5010` | nothing -- **the five web ANCHORS** of the effects spec §3.3 (handles `E+0xd420..+0xd430`), INFERRED a Dragonator spike each by their u 300 / 301 | u 332 (002), **u 300 / 301 (`em088_00_021`: 2 x `em087_00_001` Dragonator spike)**, u 330 / 310 / 311 (000), u 331 (`em088_00_023_s`: `em088_00_104` web, `_102`), u 231 (017) | action change (1, 0x1d) / (1, 0x23) `0x10b54e4`: up to five, slot k's byte `E+0xd434+k` (EMC op 0xa3 b1 5..8, 10) -> mode 0..4 / 6..14 (`0x10b5548`; 5..13 aim at `[E+0x1428]+0x1d0`), handle `E+0xd420+4k` (re-aimed by (7, 0x2c / 0x2f / 0x31 / 0x36), `0x4380e4`) | **L2 M31** start (`0x10c03d8`), after the L2 M30 wind-up (1, 0x1c / 0x22) |
| shell61 | `0x181` | `uShellEm088_sp_61` (`0x180a0b4`) | base61 (init `0x438838`) | reader `0x10c5144` | nothing -- the three / four web anchors (`E+0xd450..`) | u 332, u 300, u 330, u 331, u 360 (017), u 310, u 311 | action change (1, 0x1f) `0x10b59e8`: modes 0, 1, 2; (1, 0x25) `0x10b5be4`: modes 0, 1, 2, 3 (each behind its own test, not transcribed) | **L2 M31** start (`0x10c03d8` r1 2 / 3) |

(1, 0x1d / 0x1f / 0x23 / 0x25) -> `0x10c03d8(E, 0 / 2 / 1 / 3)` setMotion `0x21f` = L2 M31; (1, 0x1c / 0x1e / 0x22)
play L2 M30 (`0x21e`) and chain into them (`0x10bcf3c`); the enable word's L2 M30 bits 27 / 28 (rom-map) are the
same set of numbers.

cmn / modes in brief (the files'): shell57 cmn vec (6, 180, 2); its sh int 0 is a joint (130 / 131 / 255), floats 0..4
and vecs 0..4 per mode (`shl088.txt`). shell58 cmn ints (207, 208, 209, 210), float 1000 (byte-identical in Neset's
arc, shell-map.md). shell60 cmn float 2500. shell00 mode 0 sh ints (146, 0, -1, 0, -1, -1), floats (35, 0, 180, -45, 45,
-90, 90, 0.5), vec 1 (0, 200, 0).

---

## 3. The spawn systems (READ)

### 3a. The motion event table (shared em087 / em088 layer)

- `0x10bc53c` (uEm088_00) -> `0x6d4c8(E, 0x1808a00, 0x1f0)`: `E+0xcac4` = a table of **62 pairs of list pointers**,
  `E+0xcac0` = 62. `E+0xcacc` = `&table[E+0xcac8]` (`0x6cc74..`), the selector set by EMC op 0xa3 b1 0 (`0x6d1a4`).
- Each list: 0x2c-byte entries, `+0` type (0 ends), `+4` motion id, `+8` condition kind (0..0xd; kind 0xd is applied at
  motion start by the +0x13c layer `0x6d1b4`), `+0xc` / `+0x10` frames, `+0x1c..+0x28` arguments.
- The per-frame walker `0x6c590` (called from E's frame update `0x10b4040`): kinds 1 / 2 / 4 / 5 / ... test the motion
  (`0xb0950`) and a frame crossing / window (`0xb0968`, or the sequence clock `E+0xcad0` for kind 5); types 1 / 2 ->
  vt+0x488, 3 -> speed `0xb07b4`, 4 -> `0x783fc`, 6 -> `0x78600`, **> 6 -> vt+0x480 = `0x10bb22c`** (Ahtal-Ka's):
  type 7 `E+0xcb14 = (u32)arg0`; **8 shell00**; 9 `E+0xd48c = 1`; **10 shell58**; **11 shell01** (no entry of type 11
  exists).
- The rows of types 7..10: `ahtal/seq088.txt` (all 323 rows). Type 9 windows: L2 M4 f340-400, M14 f128-290, M23 f170-300,
  M20 / M38 f64-210, M36 f316-360, M46 f170-300.

### 3b. The action-change handler vt+0x204 `0x10b4828`

Status switch `0x10b4b38` (0 / 1 / 7 / 10 / 11), status-1 table `0x10b4bac` (number - 1, 0x25 entries), status-7 table
`0x10b4c90` (number - 0x10, 0x2a entries). Rows used here: (1, 6) / (1, 0x20) drop; (1, 0x1d) / (1, 0x23) shell60;
(1, 0x1f) / (1, 0x25) shell61; (1, 0xc) / (1, 0x17) / (1, 0x19) shell01; (7, 0x10) / (7, 0x32) throw; (7, 0x2c / 0x2f /
0x31 / 0x36) re-aim the shell60s.

### 3c. The action code (status 1 `0x10bc764`, number `E+0x73e1`, table `0x10bc790`)

(1, 3) -> `0x10bd064` (L2 M14, pick up at f150); (1, 5) / (1, 0xd) / (1, 0xe) / (1, 0x13) -> `0x10bfd64` (L2 M19 / M37
then M20 / M38, shell57 pull at f92); (1, 0x12) -> `0x10bd6c0`.

---

## 4. Effect models (the effect lists' rModel loads, `efx_load.LoadedEffect`, READ)

| effect model | what it is (by shape) | used by efl -> records |
|---|---|---|
| `effect\base\em087_00_001` | a 26 m Dragonator spike | `em088_00_000` (2 rows) -> u 200..222, 540, c 30, u 60..62 / 70 / 310 / 311 / 321 / 330; `em088_00_021` (2) -> u 300 / 301 |
| `effect\base\em087_00_000` | a ballista ball with a bolt (1.3 x 2 m) | `em088_00_000` (2); `em087_00_009` (5) -> u 150; `em087_00_010` (3) -> u 151 / 152 |
| `em088_00_102` | a spiked silk ball (1.4 x 2 m) | `em088_00_008` (4) / `_009` -> u 30..34 (shell00); `_014` -> u 290 / 291; `_023_s` -> u 331 |
| `em088_00_100` / `_101` / `_103` | 10 m silk strand segments | `_003_s` (u 10..15, 400..410), `_010_s` / `_011_s` (u 90 / 91), `_016`, `_022_s`, `_900..902` |
| `em088_00_104` | a 85 x 65 m strand web | `_010_s`, `_011_s`, `_023_s` |
| `em088_00_000` / `_004` / `_007` | wind ribbons / a silk knot / a ring | `_004`, `_012`, `_014`, `_016`, `_018`, `_019` |

Staged today in `docs/effects/files`: em087_00_000 / 001, em088_00_000 / 004 / 007 / 101 / 102 / 103 meshes;
**`em088_00_100` and `_104` are not** (no exported record uses them yet; `export_effects.py` stages them with the first
record that does).

---

## 5. What the viewer runs today

- `docs/render/shells.js` bases with runtimes: **base00, base01, base02, base03, base04, base05, base06, base07, base11,
  base13, base14, base15, base31, base50, base54, base55**. His: base00 / base01 (with his own init and other overrides),
  **base48, base57, base58, base60, base61 -- new**. No `SHELL_DATA.em088_00`.
- `docs/effects/em088_00.json`: the PSL-bound records (u 200..262, 290 / 291, 320, 350, 380..382, 410..430, 480, 510, c 0..30,
  100, 3000) and the shared events. **No shell record and no class UNIQUE record is exported** (u 10..15, 20, 30..34, 60..
  62, 70, 90 / 91, 120, 130, 150..152, 200..202 UNIQUE, 230..232, 260..262 UNIQUE, 300 / 301, 310 / 311, 320 / 321, 330..
  332, 340..345, 360, 400..410, 420, 600).
- `docs/models/monsters/em087_00_rubble_01..03.glb`: staged (from em087_00.arc), mounted only for em087_00 (fanned).
- monsters.json em088_00 `parts: []`; no ROM_ATTACHED_BODY / ROM_PARTNER_BODY row.

**Wired by this agent: nothing in the repo** -- every piece needs a runtime that does not exist (§7). The two probes
below only demonstrate the reads.

---

## 6. Verification (headless, `run_locked.sh` + `probe.mjs`; shots read)

- `ahtal/rubble_probe.js` -- the three rubble glbs (untextured, one flat colour each) on **joint 130 with an identity local
  transform**, i.e. the uEm088_Rubble unit as read in §1b, on L2 M4 f140 (all three), L2 M14 f200 (pole), L2 M20 f120
  (wheel), L2 M36 f250 (frame): `dev/shots/em088-rubble/*.png`, plus `L2M4_f140_rubble01_top.png` (top view, joint 130
  marked magenta). Read: the pole's butt sits at his foreclaw tips with the spike out ahead (M4 top view, M14 f200); the
  wheel and the frame hang off the claws (M20, M36). The piece's origin is its file's joint 0, 8.75 m along the pole from
  the butt (the glb's inverse bind) -- so joint 130 rides the piece's middle, which is where the silk would hold it.
  **The placement is READ in code; the look is for Raven to judge.**
- `ahtal/fx_probe.js` -- the exported u 200.. set live: L2 M6 f60 shows the `em087_00_001` Dragonator spikes flying in
  the dust (`dev/shots/em088-fx/L2M6_f60.png`); the live lists are the three rubble sets at once (headline).

---

## 7. What each still needs (the exact runtime)

### 7a. The held prop -- a new, small runtime (proposed name `ROM_HELD_PROP`, render/monster.js data + index.html mount)

```
em088_00: { joint: 130, models: ['em087_00_rubble_01', 'em087_00_rubble_02', 'em087_00_rubble_03'],  // E+0xcb00..08
            choose: 'variant',   // E+0xcb0c from the AI (EMC op 0xa3 b1 1 / 3): a viewer choice, Pole / Wheel / Frame
            show: { '2|Motion[14]': [150, null], '2|Motion[20]': [0, null], '2|Motion[38]': [0, null],
                    '2|Motion[4]': [0, null], '2|Motion[6]': [0, null], '2|Motion[8]': [0, null], '2|Motion[9]': [0, null],
                    '2|Motion[10]': [0, null], '2|Motion[11]': [0, null], '2|Motion[12]': [0, null],
                    '2|Motion[23]': [0, null], '2|Motion[36]': [0, null], '2|Motion[40]': [0, null] } }
```
- Mount: load the glb with the viewer's own material path (loadMonster of a part), keep it OUT of the body's pose
  driver (the body driver maps bones by gid and drives the rubble's joint 0 as Ahtal-Ka's joint 0 -- seen in the probe),
  and every frame set its matrix = joint 130's world matrix with its scale removed, times the world group's size
  (`rubble_probe.js` `follow()`); visible only inside the `show` windows. Reset every node of the glb to its file rest
  (the glbs carry no TRS).
- The same choice should select the enable word's bit group (id 0 / 1 / 2 -> bits 18-20 / 21-23 / 15-17,
  `0x10bc340`), so the u 2x0.. set that fires matches the piece shown -- for the enable-word agent / psl-mask.js.
- The swing-clip list is INFERRED (§1c); the (7, n) -> clip rows from the states agent would make it READ.

### 7b. shell57 (the piece in flight) -- base57 (new; `0x42f03c..0x4336e8`, init `0x42f070`, move `0x433180`)

Reads still needed: base57's init placement switch on request `+0x18` (`+0x163c`: 1 / 2 / 3; the pull uses 3, `0x42f1e4`:
position `+0x30`, angles `+0x40`), its move / end (+0x148 `0x433180`), the reader `0x10c4598` (ef 0..4 -> `+0x15c8..+0x15d8`,
hit 0..1, ints 0..2, floats 0..8, vecs 0..4 -> `+0x15dc..+0x1628`), the CU record layout `0x10aebac` copies (`+0x0` id,
`+4` mode, `+8` owner, `+0xc` / `+0x10`, `+0x14` the joint-130 point, `+0x18..` angles), and what ends it (`0x4307c0`, the
pull's wait). Draws: setModel = the owner's rubble (`0x42f18c` / `0x42f178` for Neset owners, `+0xb5f4 == 0x57`).
Then SHELL_DATA.em088_00.shells.shell57 (27 modes, `shl088.txt`) and rows for the pull (L2 M19 / M37 f92, mode id + 8),
the throw (L2 M17 f0) and the drop.

### 7c. The other shells

- **shell00** (silk ball, L2 M26): base00's runtime exists, but sp_00's init `0x10c315c`, reader `0x10c34c0`, landing
  `0x10c389c`, +0x158 `0x10c3224` (its mode-1 child), +0x15c, +0x168, +0x24 and the setup `cSetupParamEm088_00` (the
  `+0x30` float) are unread; the event-table spawn (kind 1 / kind 5 on the sequence clock `E+0xcad0`) has no viewer
  driver -- `kind 5` needs the clock's rule (`0x6c5b8..0x6c620`: `E+0xcad4 = E+0xcad0`, then `E+0xcad0 += 0xb0900(E) x E+0x1c`;
`0xb0900` unread).
- **shell01** (arena silk lines): base01 exists; sp_01's init `0x10c3a80`, +0x98, reader `0x10c3b08`, +0x150, +0x154,
  +0x15c unread. Stage / AI driven (`E+0xd3fc`), not clip-bound -- a viewer row would be a choice.
- **shell48** (CU-requested ballista shots from two fixed points): base48 (`0x426abc` / `0x427294`) and its reader; the
  CU's `+0xc6 + k` request bytes; a target. Not clip-bound.
- **shell58** (L2 M17 / M33): base58 (`0x4336e8..0x434da8`); **draws nothing for Ahtal-Ka** (u 0 / 1 absent) -- a hit
  shape only. Lowest priority.
- **shell60 / shell61** (L2 M31: the web anchors, each with its u 300 / 301 Dragonator spike): base60 (`0x435d28`, `0x438214`) and base61
  (`0x438838`, `0x43a3ac`) with their readers; the five queued slot bytes (EMC op 0xa3 b1 5..8, 10) are an AI choice.

### 7d. The effect records to export / record (the Viewer agent's lane)

shell00: u 30, 31, 32, 34 (`em088_00_008`, `_009`). shell01: u 90, 91 (`_010_s`, `_011_s`; stage `em088_00_100`,
`_104`). shell48: u 150, 151, 152 (`em087_00_009`, `_010`). shell57: u 60, 61, 62, 70, 200 / 201 / 202 (UNIQUE,
`em087_00_014`), 230, 231, 232, 260, 261, 262 (UNIQUE), 320, 321. shell60 / 61: u 300, 301 (`em088_00_021`), 310, 311, 330,
331 (`_023_s`), 332, 231, 360. (UNIQUE 200..202 / 260..262 are a different array from the SEQUENCE keys of the same
numbers.)

---

## 8. Not read (NR)

- What the CU's per-slot bytes `+0x3c + id` / `+0xc6 + k` mean and who sets them; `0x10ae6c0` / `0x10ae730` / `0x10ae868`
  / `0x10ae870` (CU getters called around the rubble).
- `E+0xcb14`'s request `0x2b3c8(global, 3, value, pos)`; `E+0xcb1c` -> the unit's `+0x110` bit 1.
- `E+0xd48c` (type 9 windows) beyond its one reader in the frame update (`[E+0x1428]+0x5d34 = 2` when 0).
- `[E+0x1428]+0x3b4` |= 0xe000 then &= `0x16a37e8[id]` each frame (`0x10b4068..0x10b40a4`): a per-piece mask, INFERRED
  the held piece's hit parts.
- base57, base48, base58, base60, base61 entire; sp_00 / sp_01 overrides; shell61's per-mode tests.
- The (7, n) -> clip rows (states agent) that would turn the swing-clip list from INFERRED to READ.
- Whether the uCoord parent joint `+0x34` is a joint NUMBER or an index (`0x457c8` stores it; the consumer not read).
  The probe's coherent placement and Ahtal-Ka having only 43 joints (index 130 impossible) say number: INFERRED.
