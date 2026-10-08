# em084_00 Nakarkos — shell06 (base06): the persistent aura, read whole

Research agent for the Viewer agent, 2026-10-05. Target: Raven's "Still missing Nakarkos's blue miasma effect". Scope:
base06 (`uShellEmBase06`) and `uShellEm084_sp_06`'s overrides, so the viewer can run the aura that `0x106aa48` holds.
Static reads with `efx/armdis.py` (scratch wrapper `naka_shells/dd.py`); one unicorn cross-check of the placement
(scratch `s06/emu_place.py`, §8). The efx recorder / lift were NOT used.

Read first: `dev/rom-map.md` (shell infrastructure rows 100-120, the Nakarkos section, rows 195-197 / 694 / 734 for
`0x19176b0` and `0xc164c`), `dev/em084-shells-spec.md` §1 / §4c / §8, `dev/em084-class-effects.md`,
`docs/render/shells.js` (base04 / base55 / base00 / base01 runtimes, `effectRequest`, `rockRequest`, `stepBreath`,
`slotsOf011` / `slotStep`, `stepShells`), `docs/render/rom/effect/schedule.js` (how a shell's effect hangs from it),
`build/hitzone-states/state-decodes.md` (NAKARKOS), the task board's Nakarkos entries.

**Status words:** READ = the consuming instruction was read in this session. INFERRED = anything else (a name, a shape,
another note's reading). "spec" = `dev/em084-shells-spec.md`.

---

## 0. Headline

- **base06 is a joint- (or owner-) anchored shell with no motion of its own and no timer in Nakarkos's data.** Its init
  places it and starts ef 0 ONCE, on itself (READ). Its move re-places the shell every frame (`+0x40` and the angle words
  `+0xfe8..`) and never touches the effect (no `0x329c9c` / `0x329d04` anywhere in its call closure — control: base04's
  move has four, §7). **The effect follows because it hangs from the shell** (requester `+0xd0` = the shell's model
  interface), which is exactly how the viewer already runs a rock's flight effect (`place: null`, `angles` set →
  `host.setParentAngles`).
- **Placement, per frame (READ, unicorn-checked):** modes 5 / 6: the BODY's joint 200 / 203 position + (0, −150, −300)
  through that joint's 3×3; angle words = the joint matrix as Euler. Mode 0: the body's joint 1 position + (0, 0, 800)
  turned about Y by the owner's facing word only (no pitch / roll, no scale); angle words = the owner's angle words.
- **Life (READ):** float 0 (life) = 0.0 in all three modes, so the shell lives exactly as long as **hit slot 0** (byte
  `+0x13ad`) is set. Flag bit 2 re-registers the hit every **30** frames (float 1) and the hit record is (delay 0,
  duration **99**), so the slot never lapses: **the aura lives until something ends it.** No motion test, unlike
  base04 / base55 (control, §7).
- **Ending (READ):** the manager (`0x106aa48`) and the body's destructor (`0x1064be0`, body vt `+0`) end it through
  `0x1089c00` = base06's end `0x401c88(shell, 0)` → **`0x43b058` → `0x329c40(h, 0)`, the graceful stop**; the shell then
  waits (frozen, not re-placed) until the effect's unit is gone or 1800 frames pass, and deletes itself.
- **What the viewer evaluates (§9):** with the arm byte at its per-frame value 1 (READ: the only store of 1, §6c), the
  conditions collapse to: **charge rungs / case-A actions → no aura at all; stance 1 → u 41 on joint 200 and u 42 on
  joint 203, each off while its tentacle is Exposed; stance 2 → u 40 at joint 1 + 800 forward, off while either tentacle
  is Exposed.** u 40 / 41 / 42 are **not exported** in `docs/effects/em084_00.json` (§9e) — the runtime alone will draw
  nothing until they are.

---

## 1. The classes and their vtables (Q1, READ)

| | vtable | length | source |
|---|---|---|---|
| `uShellEmBase06` (DTI `0x1885d18`) | **`0x174ed48`** | `+0x000..+0x15c` (88 slots) | found as the third holder of `0x401a18` / `0x4014f8` / `0x401c88` / `0x401dc8` / `0x401dcc` / `0x401498` in `.data` (`s06/findw.py`); ctor `0x4013b8` stores `[0x1835cec]` = `0x174ed40` + 8 |
| `uShellEm084_sp_06` (DTI `0x188d6e8`) | `0x17f6d80` | `+0x000..+0x15c` | spec §1; ends where the next vtable (shell11's `0x17f6ee8`) is preceded by two zero words, as `0x17f6d80` itself is |
| `uShellEm058_sp_06` (Amatsu, DTI `0x188cd48`) | `0x17d4d68` | `+0x000..+0x15c` | the only other holder (§7) |

Extent: every one of the three has two zero words at `−8` / `−4` and two at `+0x160` / `+0x164`; slot words differ
after that (`s06/cmp.py`). Derived, not chosen.

**Slots that differ from the base (complete list):**

| slot | base06 | Nakarkos sp_06 | Amatsu sp_06 | what |
|---|---|---|---|---|
| `+0x04` | `0x4014b0` | `0x1089eb8` | `0xf10028` | deleting dtor: base dtor `0x401498` then free (READ for sp_06: `0x1089eb8` → `0x401498`, `b 0x49fbe4`) |
| `+0x14` | `0x401db8` | `0x1089ec8` | `0xf10038` | DTI getter (READ: returns `0x188d6e8` = `uShellEm084_sp_06`) |
| `+0x14c` | **0** (pure) | `0x1089c08` | `0xf0ff20` | the reader |
| `+0x158` | `0x401c20` | **`0x1089e50`** | (base) | the hit registration |
| `+0x15c` | `0x401d10` | **`0x1089d14`** | (base) | the angle words |

Everything else is base06's or the shell base's: `+0x00` dtor `0x401498`, **`+0x24` move `0x401a18`**, `+0x13c` init
`0x4014f8`, `+0x140` `0x43a8b0` (hit slot registration), `+0x148` end `0x401c88`, `+0x150` `0x401dc8` (`bx lr`), `+0x154`
`0x401dcc` (`bx lr`), `+0x138` effect start `0x4a119c`, `+0x40` `0x4a1810` (the unit delete — NOT READ), `+0x130` the model
interface getter `0x53a874`.

**Ctor `0x4013b8` (READ):** shell base ctor `0x43a78c`; `+0x15c8` = 0 (ef), `+0x15cc` = −1 (hit), `+0x15d0` = −1
(joint), `+0x15d4` = `+0x15d8` = 0; **`+0x15dc`, `+0x15e0`, `+0x15e4`, `+0x15e8` = the pointer `0x19176b0`** (the engine's
shared empty vec3, rom-map rows 195-197 / 734 — zero); `+0x15ec..+0x15f8` = 0 (flags word included); `+0x1600..+0x1608` =
the zero vec's contents, `+0x160c` = `+0x161c` = 0; `+4` = 0; `+0x15a8` = 6.

## 2. The reader and the data (READ)

`0x1089c08` (spec §8, re-read here): ef 0 → `+0x15c8`; hit 0 → `+0x15cc`; **int 0 → `+0x15d0` (joint)**; flags
`+0x15ec`: **bit 0 = (int 1 ≠ −1)**, **bit 2 = (int 2 ≠ −1)** (`bfc` / `orrne`, the rest of the word kept: the ctor's 0);
float 0 → `+0x15d4`; float 1 → `+0x15d8`; vec 0 → `+0x15dc`; vec 1 → `+0x15e8`. **It never writes `+0x15e0` or `+0x15e4`**,
so for Nakarkos both stay the ctor's empty vec (READ: no store in the reader; the ctor's store at `0x40140c..0x401424`).
Bit 1 (the ground snap, §3) is never set by this reader.

Data (`em084_00_shell06`, `naka_shells/arcmodes.json` + `_hit###` / `_hitdata` dumped here):

| mode | ef | ints | → joint / flags | floats (life, hit period) | vec 0 | vec 1 (deg) | hit → record (delay, duration) |
|---|---|---|---|---|---|---|---|
| 0 | `[0, 40]` = u 40 | 1, 0, 0 | **1** / bits 0 + 2 | **0.0**, **30.0** | (0, 0, **800**) | (0, 0, 0) | 0 → (0, **99**) |
| 5 | `[0, 41]` = u 41 | 200, −1, 0 | **200** / bit 2 | 0.0, 30.0 | (0, **−150**, **−300**) | (0, 0, 0) | 1 → (0, 99) |
| 6 | `[0, 42]` = u 42 | 203, −1, 0 | **203** / bit 2 | 0.0, 30.0 | (0, −150, −300) | (0, 0, 0) | 2 → (0, 99) |

ShellScale 1.0 for all three. ef list 0 = `em084_00u` (spec §1). `_hitdata` header `HDS`, three records of `0x38` bytes
from `+0x10`, s16 `+0` / `+2` = (0, 99) each, read the way shells.js reads Rathian's (`slotsOf011`).

## 3. Init `0x4014f8` (vt `+0x13c`, READ)

1. Gate: `0x43a850` (records `+0x15a4`; `0x4a188c(shell)` == 1 and the owner's byte `+0x1052` == 1 → `+0x1374` = 1,
   pass) and the resource `[shell+0x1384]` with byte `+0x50` bit 0. Fail → vt `+0x40`, return 0. **The same gate base04's
   init runs (`0x3ff1bc..0x3ff1dc`), which shells.js takes to pass**; meanings NOT READ.
2. vt `+0x14c` (the reader).
3. Copy `*[+0x15e0]` → `+0x1600..+0x1608` (`+0x160c` = 0) and `*[+0x15dc]` → `+0x1610..+0x1618` (`+0x161c` = 0).
4. vt `+0x15c` (the angle words, §4a), then **`0x4016ac(shell, [+0x15e0])`** (the placement, §4b).
5. State byte `+4` = 1; **`+0x15f0` = float 0** (life), **`+0x15f4` = float 1** (hit period).
6. If ef `+0x15c8` ≠ 0: requester (`0x40a54`) filled by **`0x4a10c8(shell, req, vt+0x130 (the model interface), 0,
   byte +0x1054, &shell+0x40, −1)`** → `+0xc0` = **the shell's `+0x40` as placed in step 4**, `+0xd0` = the model
   interface, `+0x1c |= 3`, `+0x14 |= 0x40000000`, scale `+0x40..+0x48` = the ShellScale by the mode's index (−1 →
   `[[shell+0x136c]+8]`), `+4` = 0, byte `+0xc`. **Nothing sets `+0x14` bit 2 / `+0x30..`: no rotation override** (base04
   does, `0x3ff6bc..0x3ff6ec`; base06 does not). Then `0x4a11e4(shell, ef, req)` → handle **`+0x15f8`**. This is
   shells.js's `rockRequest` shape exactly.
7. vt `+0x158` (sp_06 `0x1089e50`: hit slot 0 registration, §5). Return 1.

## 4. The placement (Q2, READ)

### 4a. The angle words — sp_06 `+0x15c` = `0x1089d14`

- **Flags bit 0 clear (modes 5 / 6):** `0xc15a4(owner, joint, m)` (the joint's world matrix), `0x7c3a38(e, m)` (Euler,
  shells.js `eulerOf`), each word = `uxth(s32(0.5 + e × 10430.378))` → `+0xfe8` / `+0xfec` / `+0xff0`. No offset.
- **Bit 0 set (mode 0):** words = the owner block's `[owner+0x1428]+0x50 / +0x54 / +0x58`, then each `+= uxth(s32(0.5 +
  vec1[i] × 182.0444))` (`uxtah`: the low half of the s32 added to the whole 32-bit word). vec 1 = (0, 0, 0) → **the
  owner's words unchanged**.
- base06's own `0x401d10` (Amatsu) is the bit-0-set arm only, unconditionally.

### 4b. The point — base06 `0x4016ac(shell, vecC)`

1. `P` = `0xc164c(owner, joint)` — the joint's position (rom-map row 694 reads `0xc164c` as that) — into `+0x40` **and**
   `+0x1000`. The owner is `0x4a0f00(shell)`, i.e. **the body for all three modes** (the manager spawns with owner E).
2. A = `*[+0x15dc]` (vec 0) → `+0x1610..`; B = `*[+0x15e0]` → `+0x1600..` (Nakarkos: zero).
3. **Bit 0 clear:** A and B through the joint's 3×3, row vectors, in this float order (READ, `0x4017c4..0x40187c`):
   `x' = ((m4·y) + m0·x) + m8·z`, `y' = ((m5·y) + m1·x) + m9·z`, `z' = ((m6·y) + m2·x) + m10·z`.
   **Bit 0 set:** A and B turned about Y by the u16 word `+0xfec` (× 9.58738e-05, sinf / cosf): `x' = x·cos + z·sin`,
   `y' = y`, `z' = z·cos − x·sin` (`0x401884..0x401918`). No pitch, no roll, no matrix: vec 0 is NOT scaled by the
   joint's scale on this arm.
4. `C = P + A'`; **`+0x40` = C + B'**, **`+0x1000` = C − B'** (`0x401938..0x4019a0`); `+0x100c` = 0. (Amatsu's B = (0, 250,
   700) makes this a capsule; Nakarkos's B = 0, so `+0x40` = `+0x1000` = P + A'.)
5. Bit 1 (never set for either class's data path here): `+0x44` / `+0x1004` = `[owner+0x1428]+0x5b4` (ground) + B'.y.
6. `+0x1600..+0x1608` = `*vecC` (the argument), `+0x160c` = 0 — restores B unturned for the hit side. Init passes
   `[+0x15e0]`, the move `[+0x15e4]` (both the empty vec for Nakarkos).

**So per frame:** modes 5 / 6: `+0x40` = joint 200 / 203 position + (0, −150, −300)·M3×3, words = Euler(M). Mode 0:
`+0x40` = joint 1 position + (800·sin Y, 0, 800·cos Y), words = the owner's (Y = the owner's facing word).

### 4c. Does the effect follow?

**It is placed once and follows through its parent.** The init starts ef 0 at `+0x40` with the shell's model interface
as `+0xd0` (§3.6); the move (§5) re-places `+0x40` and the words every frame and calls nothing that places the effect
(census §7). That the parent link carries the shell's position and angle words to the effect every frame is the
reading `schedule.js` already runs for base00 rocks (`host.setParentAngles`, `0x539cd4 → 0x8a4dfc`; INFERRED here, not
re-read). In state `0xfe` the move does not re-place: a stopping aura's parent freezes where the shell last was (READ:
the `0xfe` branch `0x401a78..0x401ad0` has no placement call).

## 5. The move `0x401a18` (vt `+0x24`) and the life (READ)

Every frame, in order:

1. `0x4a1698(shell)`: `+0x137c` = `+0x1378`; **the owner's unit (`[shell+0x136c]+0xc`) not in state 1 / 2 → vt `+0x40`
   (delete)** — no `0x43b058` on this path. (shells.js calls `0x4a1698` "hit side, not visual"; it is also this delete.)
2. The effect handle `+0x15f8`: its unit left states 1 / 2 → handle = 0.
3. State `0xfe` (ending): `+0x15f0 += [shell+0x1c]` (dt); **> `[0x162493c]` × 60 = 1800 → vt `+0x40`**; else handle still
   set → wait; else word `+4` = `0xff`, vt `+0x40`.
4. State 1 → `0x401ae0`:
   - `0x4a0f38(shell)` (owner unit in state 1 / 2 and owner vt `+0x88` ≠ 0) false → **end** (vt `+0x148(shell, 0)`).
   - vt `+0x15c` (§4a), `0x4016ac(shell, [+0x15e4])` (§4b).
   - **Flags bit 2** (all three modes): `T = +0x15f4`; T > 0 → T −= dt, stored clamped at 0, and if T (unclamped) ≤ 0 →
     re-register; T ≤ 0 → T = 0, re-register. Re-register = vt `+0x158` (sp_06 `0x1089e50`), then `+0x15f4` = float 1 (30).
   - **Life** `L = +0x15f0`: L < 0 → L = 0, end. L > 0 → L −= dt (clamped at 0); ≤ 0 → end. L == 0 (Nakarkos) or still
     > 0 → **byte `+0x13ad` (hit slot 0) clear → end; set → vt `+0x150` (`bx lr`)**.
5. No motion test anywhere in the move's closure (control §7: base04's `0x3ffd98` tests `+0x15d8` against `+0x4b4`).

**Hit registration `0x1089e50` (vt `+0x158`, READ):** `0x4a1ad8(shell)` == 1 (the resource `[shell+0x1384]` with its
`+0xbc` and `+0xc0` both non-null — INFERRED to be the `_hitdata` / `_hitsize` the folder ships) and hit param `+0x15cc`
≥ 0 → vt `+0x140` (`0x43a8b0`)`(shell, 0, hit, −1, 0x1b, 2, halfword +0x1588)` — slot 0. Identical to base06's
`0x401c20` but for the `0x1b` (base `0x1f`; meaning NOT READ). The slot side (byte `+5` = 1, delay / duration from the
record, the countdown `0x168d30`) is shells.js's READ transcription (`slotsOf011` / `slotStep`); who runs `0x168d30` and
when is NOT READ there either.

**So:** life 0.0, record (0, 99), re-armed every 30 frames → slot 0 never lapses → the shell lives until ended
(INFERRED only in that it rests on the unread slot step running once per frame with dt ≤ ~3).

## 6. Who ends it (Q3)

### 6a. The end `0x401c88(shell, flag)` (vt `+0x148`, READ); `0x1089c00` = `(shell, 0)`

Not already ending (`([+4] & 0xfe) != 0xfe`): **`0x43b058(shell, [+0x15f8], flag)`** → when the handle is set and (its
byte `+0xca` ≠ 0 or its state `([h+0xc] & 7)` == 1) → **`0x329c40(h, flag)`**; then `0x4a1de4(shell)` (hit side, NOT
READ), vt `+0x154` (`bx lr`), byte `+4` = `0xfe`, `+0x15f0` = 0. Flag 1 → also vt `+0x40` and `+4 |= 0xff` (no caller here
passes 1). **Every Nakarkos end is flag 0: the graceful stop**, then §5.3's wait.

### 6b. Callers of `0x1089c00` and every use of the three handles (census, READ)

Every immediate `#0xcbbc` / `#0xcbc0` / `#0xcbc4` in the body + arm + shell band `0x1064ae0..0x108b550` (25 sites):

| site | function | what |
|---|---|---|
| `0x1064da0..0x1064dfc` | **`0x1064be0` = body vt `+0`** (`0x17f11fc`; the destructor: it re-stores the class vtable first) | all three: `0x1089c00`, handle = 0 |
| `0x106632c..0x10663ac` | `0x1066168` = **body vt `+0x1dc`** (`0x17f13d8`) | each handle whose unit left states 1 / 2 → 0 (no end call) |
| `0x1069bec` | `0x1069b88` (vt `+0x2a8`), after the manager | body handle set and stance ≠ 1 → `0xbaafc(E, 2, 2)` (Face damage row, state-decodes.md) |
| `0x106aa7c..0x106ae80` | **`0x106aa48`**, the manager | spawn (`0x40137c` → `0x48b884`) / end (`0x1089c00`, handle = 0) — spec §4c's table, re-read here and confirmed bit for bit, including the status switch `0x106abb4` (7: 0x33..0x35 / 0x3c..0x3e by mask `0xe07`; 10: 0x0d, 0x14, 0x5f, 0x6a (bit 11 of `0x80801`), 0x72 (bit 19), 0xaf; 11 and 13 → case A; 8, 9, 12 → case C) |

- The manager runs unconditionally inside vt `+0x2a8` (`0x1069b88..0x1069bd8`: no early return). Who calls vt `+0x2a8`,
  and whether it runs while the monster is dead or captured: NOT READ.
- **A motion change ends nothing**: no motion test in base06 (§5.5) or in the manager (its inputs are the action, flags
  and part states only).
- **Owner death:** the destructor ends all three (graceful); the shell also deletes itself (no stop) when the owner's
  unit leaves states 1 / 2 (`0x4a1698`), and ends gracefully when `0x4a0f38` fails. When the death sequence starts any of
  these: NOT READ.
- A shell that ends itself keeps its handle in E until its unit is deleted (body vt `+0x1dc` drops it only then); the
  manager's `0x1089c00` on such a shell is a no-op (already `0xfe`); the next frame after the delete, the manager
  spawns a fresh one if still wanted.

### 6c. The arm byte `[arm+0xcad8]` (READ, the writes; meaning INFERRED)

Census of `#0xcad8` in the arm band: every store from action code writes **0** (`0x1081e28`, `0x1082028` (r8 = 0 at
`0x1081f5c`), `0x108231c` (r6 = 0 at `0x1082254`), `0x10823f8`, `0x1083624`, `0x10837a4`; init `0x107d0bc`, ctor
`0x107b330`). **The one store of 1** is `0x107d5cc` (`strb r5, [r0]`, r0 = `arm+0xcad8` from the write-back load at
`0x107d520`), at the tail of **`0x107d408` = arm vt `+0x1dc`** (`0x17f6674`; arm vtable `0x17f6498`), which every path of
that function reaches. The same function copies the body's position block into the arm (`0x107d4cc..0x107d50c`) and
the body's angle words, offset by `+0xcb04..`, into the arm's (`0x107d58c..0x107d678`); when it found the byte 0 it sets
`+0xcad4` = 2. `0x107f060`: byte ≠ 0 → `0x8a4dfc` (parent angles) path, else `0xca06c`.
**Reading (INFERRED): 1 = "the arm is riding the body this frame"; an arm action that detaches it clears it.**
Correction to the spec's §4c gloss ("set in arm status 2 / 6 code"): those action-side stores write 0. Which arm
actions clear it: spec says (7,0x29..0x2c); not re-mapped here. Order of the body's and the arms' updates in a frame:
NOT READ.

## 7. Census and controls (Q4)

- **Who uses base06 (READ, two independent routes):** the setup-DTI table `0x175c3e8` (`shelltable.json`, rom-map row
  105) names `cSetupParamEmBase06` exactly twice: **id `0xff` `uShellEm058_sp_06` (Amatsu)** and **id `0x16f`
  `uShellEm084_sp_06`**. The vtable route agrees: `0x401a18` (base06's move) appears at `+0x24` of exactly three vtables
  in `.data` — base06 `0x174ed48`, Amatsu `0x17d4d68`, Nakarkos `0x17f6d80`.
- **Amatsu as the positive control for the field roles (READ, reader `0xf0ff20` + `em058_00_shell06` data):** his reader
  writes vec 1 → **`+0x15e0`**, vec 2 → **`+0x15e4`**, vec 3 → `+0x15e8`, int 2 → **bit 1** (not bit 2), float 0 only;
  data: ef `(999, −1)` (no effect — 0x4a11e4 refuses list > 7), life **70 / 60**, B = (0, 250, 700), ints [1, 0, 0],
  hitdata (0, 120), (0, 60). So base06's `+0x15e0` is the init's half-extent, `+0x15e4` the move's, `+0x15e8` the degree
  vec, and life > 0 ends it by time — the paths Nakarkos's data does not exercise are exercised by Amatsu's. His
  spawner was not read.
- **No placement call (negative, with control):** the transitive call closure (depth 2, `s06/closure.py`) of base06's
  init / move / end / `0x401c20` / `0x401d10` and sp_06's `0x1089c08` / `0x1089d14` / `0x1089e50`, plus the virtual
  targets `0x43a8b0`, `0x4a1810`, `0x53a874` (37 + 2 functions) contains **no** `0x329c9c` / `0x329d04`; it finds the init's
  `0x4a10c8` / `0x4a11e4` and `0x43b058`'s `0x329c40`. **Control:** the same script over base04's move `0x3ff938` finds four
  (`0x3ffe38`: `0x329c9c` ×2, `0x329d04` ×2).
- **No motion test (negative, with control):** no `#0x4b4` / `0xb0944` / `0xb0950` in `0x4014f8..0x401dd0`; the same
  grep over base04's `0x3ffd98..0x3ffe38` finds `+0x15d8` vs `+0x4b4`.

## 8. Unicorn cross-check (`s06/emu_place.py`)

`0x1089d14` then `0x4016ac(shell, empty vec)` run as the move runs them, on a stub shell / owner, with `0x4a0f00`,
`0xc164c`, `0xc15a4` and the PLT `sinf` / `cosf` / `atan2f` / `asinf` stubbed in Python (float32). Joint matrix: a
yaw 0.7 / pitch 0.3 / roll −0.2 rotation at (120, 950, −340).

- Modes 5 / 6 (flags 4): `+0x40` = `+0x1000` = the §4b formula to the bit; words = `eulerOf` → u16 to the bit; the joint
  asked is 200 / 203 (matrix, position, position, matrix — `0x1089d14`'s `0xc15a4` first).
- Mode 0 (flags 5), the owner's Y word 0 / 0x4000 / 0x2aaa / 0xe38e: `+0x40` = P + (800 sin Y, 0, 800 cos Y) (≤ 1.2e-5
  off, float order); words = the owner's words; only `0xc164c(…, 1)` is asked (no matrix).
- vec 1 = (10, 90, −45) (not in the data): the `uxtah` adds as §4a says. **ALL OK.**

## 9. What the viewer needs (Q5)

### 9a. SHELL_DATA (the files' values)

```
em084_00 … shells: { shell06: { id: 0x16f, cls: 'uShellEm084_sp_06', base: 'base06', reader: 0x1089c08,
  folder: 'shell\\em\\em084_00_shell06',
  modes: { 0: { ef: [[0, 40], …], sh: { ints: [1, 0, 0], floats: [0.0, 30.0], vecs: [[0, 0, 800], [0, 0, 0]] }, hit: [0], scale: 1.0 },
           5: { ef: [[0, 41], …], sh: { ints: [200, -1, 0], floats: [0.0, 30.0], vecs: [[0, -150, -300], [0, 0, 0]] }, hit: [1], scale: 1.0 },
           6: { ef: [[0, 42], …], sh: { ints: [203, -1, 0], floats: [0.0, 30.0], vecs: [[0, -150, -300], [0, 0, 0]] }, hit: [2], scale: 1.0 } },
  hitdata: [[0, 99], [0, 99], [0, 99]] } }      // lists[0] = em084_00u
```

### 9b. The runtime, in shells.js's conventions (base06)

```
// sp_06's reader 0x1089c08 (vt +0x14c): +0x15e0 / +0x15e4 are never written -> the ctor's empty vec (B = C = 0)
params06(sh) = { joint: I(0),                                   // +0x15d0
                 flags: (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0),   // +0x15ec
                 life: F(0), period: F(1),                       // +0x15d4 -> +0x15f0, +0x15d8 -> +0x15f4
                 vec0: V(0), deg: V(1) }                         // +0x15dc, +0x15e8
// vt +0x15c 0x1089d14 then 0x4016ac: J = the body's joints, own = the owner block's words {x, y, z} (u32)
place06(S, J, own):
  M = jointMatrix(J, k.joint); P = [M[12], M[13], M[14]]        // 0xc164c (the joint position)
  if (k.flags & 1) {                                             // mode 0
    A = [own.x + u16(s32(0.5 + deg.x*DEG_TO_U16)), own.y + …, own.z + …]   (32-bit adds, as uxtah)
    r = u16(A[1]) * U16_TO_RAD; s = sinf(r), c = cosf(r)
    v = [f(f(x*c) + f(z*s)), y, f(f(z*c) - f(x*s))]              // vec0 = (x, y, z)
  } else {                                                       // modes 5 / 6
    e = eulerOf(M); A = [u16(s32(mla(0.5, e.x, RAD_TO_U16))), …y, …z]
    v = [mla(mla(f(M[4]*y), M[0], x), M[8], z), mla(mla(f(M[5]*y), M[1], x), M[9], z), mla(mla(f(M[6]*y), M[2], x), M[10], z)]
  }
  S.position = S.anchor = [f(v[0] + P[0]), f(v[1] + P[1]), f(v[2] + P[2])]   // +0x40 = +0x1000 (B = 0)
  S.angles = A                                                   // +0xfe8 / +0xfec / +0xff0
init06: place06; S.state = 1; S.life = k.life; S.hitT = k.period; slot 0 = (0, 99) on;
        S.start = rockRequest(D, mode, 0, S.position, 'aura')   // +0xc0 = +0x40, parent = the shell, NO rotation
        S.effect = { param: 0, key }
step06 (vt +0x24 0x401a18), each step, S.place = null always:
  effect unit gone -> S.effect.gone (0x401a24..0x401a50)
  state 1:  place06(S, J, input.owner)
            if (flags & 4): T = S.hitT; if (T > 0){ T2 = f(T - dt); S.hitT = max(0, T2); if (T2 <= 0) rearm } else { S.hitT = 0; rearm }
                            rearm = slot 0 back to (0, 99) on, S.hitT = k.period
            L = S.life: L < 0 -> 0, end; L > 0 -> L = f(L - dt) (stored clamped), <= 0 -> end;
            then slot 0 off -> end; else keep
  state 0xfe: S.timer += dt; > 1800 -> 0xff; else effect gone -> 0xff   (frozen: no place06)
end06 (vt +0x148 0x401c88(S, 0)): state 0xfe, S.timer = 0, S.stop = { param 0, request 0, key }  (0x43b058 -> 0x329c40(h, 0))
```

`stepShells`: dispatch `base06` to `step06` on `J` (the body's joints — all three modes are the body's, joints 200 / 203
included; the body glb has gids 200, 201, 203, 204 — `efx/joints/em084_00_shells_rest.json`). `prevJoints` must also
snapshot 1, 200, 203 (the `shellJoint` loop will, if `shellJoint` returns `ints[0]`). **Do not** let a base06 shell fall
through to `stepBreath` (it would run base04's lifetime and the motion test) and **do not** give it base01's
"no `hitLife` → end at move 1" default: with slot 0 unmodelled it must live (§5).

### 9c. The manager `0x106aa48`, as a per-frame hook (`D.perFrame`, line 4, before line 18)

```
handles: L (mode 5), R (mode 6), B (mode 0); a handle whose shell was removed (state 0xff) -> null   (body vt +0x1dc)
caseA = cb14 === 2 || charge || actionIsCaseA          // 0x106aa50..0x106ac60
if (caseA){
  armL === 1 ? endIf(L) : spawnIf(L, 5);  armR === 1 ? endIf(R) : spawnIf(R, 6);  endIf(B)
} else if (stance === 1){
  endIf(B)
  (armL === 1 && exposedL) ? endIf(L) : spawnIf(L, 5)
  (armR === 1 && exposedR) ? endIf(R) : spawnIf(R, 6)
} else {
  endIf(L); endIf(R)
  (exposedL || exposedR) ? endIf(B) : spawnIf(B, 0)
}
spawnIf(h, m): h == null -> make shell06 mode m (0x48b884: init at once, on the previous pose's joints, as every
               line-4 spawn in stepShells; moved in line 18 the same step), store it
endIf(h):      h != null -> end06(h) (0x1089c00), h = null
```
Plus: the viewer dropping the monster (its destructor, `0x1064be0`) ends all three gracefully.

### 9d. The inputs and the conditions, as the viewer can evaluate them

| ROM input | ROM read | viewer source | status |
|---|---|---|---|
| charge flag `E+0xcadc` | set (7,0x32), cleared (7,0x33..0x35), (10,0xaf), any group 11 (class-effects §2, READ) | **State rung Charge 1 / 2 / 3 → 1; Calm / Enraged → 0** | evaluable (INFERRED: the rungs stand for the flag being set) |
| action ∈ case A | status / number `E+0x73e0` / `+0x73e1` (READ, §6b) | the clip: L2 M82 / M83 (shots), L3 M63 (group 11), L3 M4 + L0 M17 (group 13, also (10,0x14/0x72) in stance 1), L3 M16 / M9 / M10 ((10,0x5f)), L3 M76..78 / M23..25 ((10,0x6a)), L3 M64..66 ((10,0xaf) st 2), L3 M50 / L3 M1 ((10,0x14/0x72)) — clips per state-decodes.md (READ there) | **partly**: L3 M50 is also (1,0x3a), L3 M4 / L0 M17 serve other actions too, and (10,0x0d)'s clip is not known — a clip names an action only where one action plays it |
| `E+0xcb14 == 2` | `0x10694c0` (action start): (6,2) / (6,4) → 2 (L0 M18); (6,3) → 0 (L0 M17); any group 11 → 0; (7,0xc) → 3; (10,0xaf) while 2 → 4 (READ, §6b re-read of state-decodes' row) | none | **cannot evaluate** directly; a sticky rule "after L0 M18 until L0 M17 / L3 M63 / L3 M64" would be INFERRED. Default: not 2 |
| stance `E+0xcac4` | set per action at its start (state-decodes.md, READ there); 3 = keep | the clip: idle L0 M1 → 1, L0 M50 → 2 (Raven's rule) | **not a function of the clip**: most clips are played by actions of both stances (`nak-clips.json`: 27 of 30 clips appear under both). Needs a sticky stance (last idle seen) or a Stance control — viewer rule, not ROM |
| left / right Exposed | part state `[E+0x1428]+0x3c8` (left, dtt part 1) / `+0x3bc` (right, part 0) == 3 (READ) | the tentacle form dropdowns: Exposed = group g1 = part state 3 | evaluable |
| arm byte `[arm+0xcad8]` (left arm `E+0xcc00`, right `E+0x19750`) | 1 every frame from arm vt `+0x1dc`; 0 in frames of detaching arm actions (§6c) | none | **cannot evaluate**; use **1** (its per-frame value; INFERRED for any arm clip that clears it) |
| joints 1 / 200 / 203, the owner's angle words | §4 | body joints (gid), `input.owner` | evaluable |

**With the arm byte at 1 and `cb14` not 2, the table the viewer runs is:**

| viewer state | u 41 @ joint 200 (L) | u 42 @ joint 203 (R) | u 40 @ joint 1 + 800 fwd |
|---|---|---|---|
| Charge 1..3, or a case-A clip | off | off | off |
| stance 1 (e.g. L0 M1) | on unless left Exposed | on unless right Exposed | off |
| stance 2 (e.g. L0 M50) | off | off | on unless either Exposed |

### 9e. The effect records

u 40 / u 41 / u 42 in `em084_00u` (`em084_00_002`, spec §4c) are **not in `docs/effects/em084_00.json`** (READ: no record
with key 40 / 41 / 42 or path `em084_00_002`; control: the same scan finds u 90 / u 94). They must be exported as `'shell'`
records (`when: 'shell'`, pel `em084_00u`) for `schedule.js` to hang them from the shell. That export goes through the
effects tooling; the recorder / lift slot is shared and needs an announcement — not touched here.

## 10. Not read / open

- `0x4a1810` (vt `+0x40`, the delete) — whether it does anything to a still-running effect; `0x4a1de4` (the end's hit side).
- The init gate's meanings (`0x4a188c`, owner byte `+0x1052`, resource byte `+0x50` bit 0); `0x4a1ad8`'s `+0xbc` / `+0xc0` as
  the hit tables (INFERRED); the `0x1b` vs `0x1f` argument of the registration.
- Who runs the hit slot step `0x168d30`, when, with which step (shells.js: NOT READ) — the aura's life rests on it (§5).
- Who calls body vt `+0x2a8` and whether it runs during death / capture; the frame order of body vs arm updates.
- What `E+0xcb14` means; which arm actions clear `[arm+0xcad8]` (spec: (7,0x29..0x2c)) and whether any viewer clip shows one.
- What the em084_00_002 records draw (4 billboard + 7 model rows per the task board) — the effects lane's.
- Amatsu's sp_06 spawner (id `0xff`).

## 11. Proposed `dev/rom-map.md` rows (NOT written — this lane's brief allowed only this note)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x174ed48` | base06's vtable (88 slots, `+0..+0x15c`): init `+0x13c` `0x4014f8`, move `+0x24` `0x401a18`, end `+0x148` `0x401c88`, `+0x158` `0x401c20`, `+0x15c` `0x401d10`, `+0x14c` pure, `+0x150` / `+0x154` `bx lr`; ctor `0x4013b8` (vec ptrs `+0x15dc..+0x15e8` = `0x19176b0`) | uShellEmBase06 | R | dev/em084-shell06-aura.md §1 |
| `0x4016ac` | base06 placement: P = joint position (`0xc164c`); vec `[+0x15dc]` and `[+0x15e0]` through the joint 3×3 (flags bit 0 clear) or turned about Y by word `+0xfec` (set); `+0x40` = P + A' + B', `+0x1000` = P + A' − B'; bit 1 ground snap | uShellEmBase06 | R (unicorn) | §4b, §8 |
| `0x401a18` / `0x401ae0` | base06 move: `0x4a1698`, handle hygiene, `0xfe` wait (1800), state 1: owner test, `+0x15c`, `0x4016ac`, bit 2 hit re-arm every float 1, life float 0 then **slot 0 byte `+0x13ad` keeps it alive**; no motion test, no effect placement | uShellEmBase06 | R | §5, §7 |
| `0x401c88` | base06 end `(shell, flag)`: `0x43b058(+0x15f8)` → `0x329c40(h, flag)`, `0x4a1de4`, vt `+0x154`, state `0xfe`; `0x1089c00` = flag 0 | uShellEmBase06 | R | §6a |
| `0x4014f8` | base06 init: ef 0 started ONCE at `+0x40` on the shell (`0x4a10c8`, no rotation override), handle `+0x15f8`; then vt `+0x158` | uShellEmBase06 | R | §3 |
| `0x1089d14` / `0x1089e50` | sp_06 `+0x15c` (angle words: joint Euler if bit 0 clear, else owner words + vec 1 deg) / `+0x158` (slot 0, arg `0x1b`) | uShellEm084_sp_06 | R (unicorn) | §4a, §5 |
| `0x175c3e8` base06 census | ids `0xff` (Amatsu `uShellEm058_sp_06`, vtable `0x17d4d68`, reader `0xf0ff20`) and `0x16f`; `0x401a18` at `+0x24` of exactly these + the base | uShellEm*_sp_06 | R | §7 |
| `0x1064be0` / `0x1066168` | body vt `+0` (dtor: ends the three auras, `0x1089c00`) / vt `+0x1dc` (drops aura handles whose unit left states 1 / 2) | uEm084_00 | R | §6b |
| `arm+0xcad8` / `0x107d408` | arm byte: set to 1 every frame by arm vt `+0x1dc` (`0x107d5cc`), cleared (0) by arm action code; INFERRED "riding the body" | uEmOstgaloaArm | R (writes) / I (meaning) | §6c |
| trap | shells.js's "`0x4a1698` (hit side, not visual)": it also **deletes the shell** (vt `+0x40`) when the owner's unit leaves states 1 / 2 | — | R | §5 |
| trap | spec §4c "arm byte set in arm status 2 / 6 code": action-side stores write 0; the 1 comes from arm vt `+0x1dc` | — | R | §6c |

## 12. What to implement

1. **SHELL_DATA `em084_00`**: the shell06 entry of §9a (base `'base06'`, reader `0x1089c08`, hitdata).
2. **`params06` / `place06` / `init06` / `step06` / `end06`** as §9b; dispatch `S.base === 'base06'` in `stepShells`'s
   line-18 loop before the `stepBreath` fallthrough; report `position` / `angles` every step with `place: null`
   (schedule.js's existing `setParentAngles` path does the following); request via `rockRequest` (no rotation).
3. **The manager** (§9c) as a per-frame hook (like `perFrame003`), with the §9d inputs: charge from the State rung, the
   two Exposed dropdowns, a stance (sticky from the idle, or a control), case-A from the clip where one action plays it,
   arm bytes 1, `cb14` not 2. Name the two it cannot evaluate (`cb14`, the arm byte) in `out.refused`-style notes rather
   than guessing beyond the defaults above.
4. **Export u 40 / u 41 / u 42** (`em084_00u`, `em084_00_002`) as `'shell'` records — through the effects lane (shared
   recorder slot). Without this step the runtime spawns shells that draw nothing.
5. Check on screen (Raven): stance 2 idle L0 M50 should show u 40 ahead of joint 1; stance 1 idle L0 M1 the two arm-socket
   auras; any Charge rung none.
