# em084_00 Nakarkos — shell31 (base31): the cannon shot, read whole

Research agent for the Viewer agent, 2026-10-05. Target: Raven, "List 2, Motion 82 does not fire the beam". Scope:
`uShellEmBase31`, `uShellEm084_sp_31` (id `0x172`), the shot `0x10767c0` that spawns it, and what the viewer needs to
run it. Static reads with `efx/armdis.py` (scratch wrapper `naka_shells/dd.py`); two unicorn cross-checks (scratch
`s31/emu31.py`: the placement; `s31/emumove.py`: the move's ends). The efx recorder / lift were NOT used.

Read first: `dev/rom-map.md` (shell rows, Nakarkos section, rows 59 / 66 / 68 / 228 / 237 / 700 / 741 / 743 / 994..1002),
`dev/em084-shells-spec.md` (§1, §4a, §8), `dev/em084-class-effects.md` §2, `dev/em084-shell06-aura.md`,
`docs/render/shells.js` (base02 `make02` / `step02` / `angles02`, base06, `owner001`, `stepShells`), the task board's
Nakarkos entries, `dev/effects-triage/em084_00.md`.

**Status words:** READ = the consuming instruction was read in this session. INFERRED = anything else (a name, a shape,
another note's reading). "spec" = `dev/em084-shells-spec.md`. Frames are L2 M82 MOTION frames unless "game frames".

---

## 0. Headline

- **Why L2 M82 fires nothing in the viewer:** shell31 has no runtime and no spawn row in `shells.js`, and its two
  effects, **u 100 (`em084_00_064`) and u 101 (`em084_00_062_s`), are not exported** in `docs/effects/em084_00.json`
  (only c 100 / c 101 are); `em084_00_062_s.efl` is not in `docs/effects/files/` (READ: file listing, json scan).
- **The spawn (READ):** the shot `0x10767c0` (all six shot actions), **phase 1 = the FIRST pass of L2 M82 only**, at the
  crossing of **motion frame 282** (tune float 11, op 0) — inside `Motion[82]_start` (380 frames; loop 80). **Two shells
  per shot, same frame, odd mode first:** (7,0x33) / (7,0x3c) → **1 then 0**; (7,0x34) / (7,0x3d) → **3 then 2**;
  (7,0x35) / (7,0x3e) → **5 then 4**. The setup carries **only the owner and the mode**. No rank, rage or stance test.
- **base31 (READ, placement emulated: 40/40 random cases exact):** a shell with no motion of its own. Every frame it is
  re-placed from **body joint 0's position + sh vec 0 turned by (its own angle words, then the owner's angle words)**;
  the segment `+0x1000` → `+0x40` (vec 1 / vec 2 turned the same way) gives the effect's rotation. The effect (ef 0) is
  started once at activation and **re-placed every frame** at that point with that rotation (`0x329c9c` / `0x329d04`).
  Modes 2..5 **sweep the yaw ±0.35°/frame between shell frames 240 and 412**. No target, no stage query, no travel.
- **Ends (READ, emulated):** graceful (`0x43b058` → `0x329c40(h, 0)`) on **the owner's motion leaving L2 M82** (in the
  game: M83 at the end of the shot's last pass), or life 1000, or the owner going inactive. Then it waits frozen until
  its effect is gone (or 1800 frames) and deletes itself.
- **Beam lifetimes that follow:** (7,0x33) 258 frames (282 → M83 at 540); (7,0x34/0x35/0x3d/0x3e) 338 (→ 620), the last
  ~97 of them sweeping (~34°); (7,0x3c) ≈ 75 game frames (one pass at rate 1.3).

---

## 1. The spawn (Q1)

### 1a. The action → r5 map (READ)

Body status dispatch `0x1069a74`: status byte `E+0x73e0`, table `0x1069a94`; status 7 → `0x1069b3c` → `b 0x1073a48`. There,
number byte `E+0x73e1`, table `0x1073a74` (offsets): **0x33 → `0x10740e8` (r1 = 0); 0x34 → `0x1073f80` (1); 0x35 →
`0x1073f8c` (2); 0x3c → `0x107413c` (3); 0x3d → `0x1073f80` (1); 0x3e → `0x1073f8c` (2)**; all → `0x1074144` → `b 0x10767c0`
(r5 = r1). This replaces the spec's driver-taken mapping with a read; they agree.

### 1b. The shot `0x10767c0` (READ)

Phase byte `P+0x1a1` (P = `[E+0x1428]`), table `0x1076808`: 0 → `0x1076818`, 1 → `0x10768a8`, 2 → `0x10768d0`, 3 → `0x1076948`.

| phase | what (READ) |
|---|---|
| 0 | `P+0x1a1` = 1; `0xbc7f4(E, 0)`; **setMotion `0xafce8(E, 0x252 = L2 M82, 0x11, 20.0, 0.0)`**. Pass count `P+0x1a2` = tune **int** (`0x6f62c` → tune vt `+0x44` `0x3cb30c`, the int array by index): **r5 0 → int 0xc = 3; r5 3 → int 0xd = 1; r5 1 / 2 → int 0xe = 4**. Arm orders `0x106e238(E, 1 / 2, 7, n)`: **(7,0x14)** both arms for r5 0 / 3, **(7,0x15)** for r5 1 / 2. The turn set-up (§1c). `P+0x1a3` = 0. |
| 1 (first pass) | r5 3 only: rate `0xb07b4` = tune float **0xf0 = 1.3**. The turn (§1c). **`0xb0968(E, 0, 0, tune float 0xb = 282.0, 0)` → the pair (jump table `0x1076bb8`): r5 0 → `0x106f820(E, 1)` then `(E, 0)`; 1 → 3, 2; 2 → 5, 4; 3 → 1, 0** (`0x1076bc8..0x1076c10`). The charge stop at 285 (`P+0x1a3`, `0x106d8f4`; class-effects §2). At the ended flag (`0xb09c8`): phase 2, count − 1; count 0 → phase 3 and **L2 M83 (`0xafe84(E, 0x253)`)**. |
| 2 (later passes) | r5 3: rate tune 0xf0. At each ended flag: count − 1; 0 → phase 3 and L2 M83. **No spawn, no turn** (`0x10768d0..0x1076944` calls neither `0x106f820` nor `0x76c08`). |
| 3 | r5 3: rate tune float **0xf1 = 1.3**. At M83's end → vt `+0x3dc` (the action ends). |

Tune values (`em084_00_actiontune.fup`, `beamsD/tune.py`, the getters `0x3cb30c` / `0x3cb330` read: plain index into the
int / float arrays): ints 0xc / 0xd / 0xe = 3 / 1 / 4; floats 0xb = 282.0, 0xf0 = 0xf1 = 1.3.

**Which pass:** frame 282 is crossed in phase 1 only, i.e. the first pass, which is `Motion[82]_start` (380 frames,
`docs/monsters.json`); the loop point is 380 and `_loop` is 80 frames. The ended flag rises on every wrap (rom-map row
68 / 808), so M83 starts at motion frame **380 + (count − 1) × 80**: 540 (r5 0), 620 (r5 1 / 2), 380 (r5 3). One pair per
shot.

### 1c. The body's turn before the spawn (READ; affects the beam's facing)

Phase 0 (`0x1076a28..0x1076b14`): a = tune float `[0x1592a68][r5]`, f0 = `[0x1592a78][r5]`, f1 = `[0x1592a88][r5]` —
**r5 0 / 3: a = 90.0, f0 = 0, f1 = 180; r5 1 / 2: 0, 0, 0** (floats 19 / 17 / 18 and 22, 25 / 20, 23 / 21, 24). The yaw to
the target `atan2(P+0x1d0 − P+0x40, P+0x1d8 − P+0x48)` → `P+0x200`; |delta from `P+0x54`| clamped to a (as u16) and
divided by (f1 − f0) → per-frame step `P+0x33a`. Phase 1 (`0x1076b20..0x1076b74`): `0xb0968(E, 9, &share, f0, f1)` →
`0x76c08(E, step × 0xb0900(E) × share, 0)`, which turns `P+0x54` toward the target (`0x76c08..0x76c78`; its bounded turn
`0xc0dbc` NOT READ). So **(7,0x33) / (7,0x3c) aim the body at the target (≤ 90°) over M82 frames 0..180, before the
spawn**; (7,0x34/0x35/0x3d/0x3e) do not turn and sweep instead (§2e). No turn after frame 180, so the owner's yaw is
fixed while the beam lives.

### 1d. The spawner `0x106f820(E, n)` and its setup (READ)

`n > 5` → return. Alloc `0x413858(0x10)` (the `cSetupParamEmBase31` factory, DTI `0x18869b8`), then **+0 = vtable
`[0x1835ea0]` + 8 (`0x1751174`), +4 = `0x172`, +8 = n, +0xc = E (the owner)** — nothing else (16 bytes: no position, no
angles, no target); `0x48b884(mgr, setup, 0, 0)`. The spawner keeps no handle (tail call), so a later shot never ends an
earlier pair. **Positive control:** Malfestio's spawner `0xff2604` builds the same 16 bytes (id from `E+0xcb5c`).

### 1e. Conditions (READ)

Calls in `0x10767c0`: `0x7fc00`, `0xb08bc` (results unused), `0xbc7f4`, `0xafce8`, `0x6f62c`, `0x106e238`, `0x6f618`,
`0xb07b4`, `0xb09c8`, `0xafe84`, `0x13ecba8`, `0xb0968`, `0xb0900`, `0x76c08`, `0x106f820`, `0x106d8f4`. **No quest rank
(`0x3a8430`), no rage (`0x81670`), no stance byte, no part test.** Positive control: Malfestio's site `0xffb34c` calls
`0x3a8430` and picks mode 0 / 2 by it — the same census finds it there. Stance enters only through which actions the AI
issues (issuers, spec §4a: (7,0x34) g0 s15 / g1 s117; (7,0x35) g0 s15 / g1 s116; (7,0x3c) g1 s227..229; (7,0x3d) /
(7,0x3e) g0 s15; (7,0x33) none found).

---

## 2. base31 (Q2)

### 2a. The classes and the vtable (READ)

Found as the holders of init `0x413ad4` / move `0x4147a8` in `.data` (`s06/findw.py`): three vtables, each with two zero
words at −8 / −4 and at **+0x158 / +0x15c** (the next object follows), so **extent `+0x000..+0x154` (86 slots)**, derived.

| | vtable | DTI |
|---|---|---|
| `uShellEmBase31` | `0x1750fec` (ctor `0x413894` stores `[0x1835ea4]` + 8) | `0x1886998` |
| `uShellEm079_sp_31` (Malfestio, both arcs) | `0x17ea9b4` | `0x188d328` |
| `uShellEm084_sp_31` | `0x17f71d8` | `0x188d748` |

**Slots sp_31 overrides (complete): `+0x04` deleting dtor `0x108b000` (→ `0x413aa0`), `+0x14` DTI getter `0x108b010`,
`+0x14c` the reader `0x108ae98`** (base: 0, pure). Everything else is base31's: `+0x00` dtor `0x413aa0`, **`+0x18`
activation `0x413c40`**, **`+0x24` move `0x4147a8`**, **`+0x13c` init `0x413ad4`**, `+0x140` `0x43a8b0` (hit slot),
`+0x144` `0x3fa078` (NOT READ), **`+0x148` end `0x414d18`**, `+0x150` / `+0x154` `bx lr`, `+0x40` `0x4a1810` (delete),
`+0x130` model interface `0x53a874`, `+0x138` `0x4a119c`. Base31 code band `0x413894..0x414dbc` (the ctor to the DTI
getter and two `bx lr`), its setup class beside it (`0x4137fc`, `0x413858`, vtable `0x1751174`).

### 2b. Ctor `0x413894` and reader `0x108ae98` (READ)

Ctor: shell base ctor `0x43a78c`; `+0x15c8` = 0 (ef); `+0x15cc` = −1; `+0x15d0` = 0; `+0x15d4` = `+0x15d8` = −1;
`+0x15dc..+0x15e8` = 0; **`+0x15ec..+0x15fc` = the pointer `0x19176b0`** (the shared empty vec3, rom-map 195..197);
`+0x1600..+0x1610` = 0; `+0x1620..` = zero; `+0x1630..+0x166c` = 16 words from `0x1917770`; `+0x1670..+0x1678` = the vec at
`0x1620e60`; `+0x167c` = 0; `+4` = 0; `+0x15a8` = 0x1f.

Reader (spec §8, re-read): ef 0 → `+0x15c8`; `_snd` int 0 → `+0x15cc`; `_snd` int 1 → `+0x15d0` (as float); hit int 0 →
`+0x15d4`; int 0 → `+0x15d8` (**joint**); floats 0..3 → `+0x15dc` (**life**), `+0x15e0` / `+0x15e4` (**sweep window**),
`+0x15e8` (**hit re-arm period**); vecs 0..4 → `+0x15ec..+0x15fc` (pointers). Malfestio's reader `0xffd878` is the same
instruction for instruction but stops at float 2 (his files have three floats; `+0x15e8` stays 0).

### 2c. Init `0x413ad4` (vt `+0x13c`, READ)

1. Gate `0x43a850` and the resource byte `+0x50` bit 0 (`0x4a100c`) — base06's gate; fail → vt `+0x40`, return 0.
2. vt `+0x14c` (the reader).
3. **`+0x160c` = the owner's `[+0x4b4]` = its current motion id** (rom-map row 59): 0x252 at the spawn.
4. **`+0x1670` / `+0x1674` / `+0x1678` = u16(s32(0.5 + vec3[i] × 182.044))** — the shell's own angle words (X, Y, Z) from
   sh vec 3 in degrees ((0, 0, 0) for Nakarkos; Malfestio (0, −60, 0) on modes 1 / 3).
5. state `+4` = 1; **`+0x1600` = `+0x15d0`** (the sound period); **`+0x1604` = float 0 (life)**.
6. `0x4a1ad8` == 1 and hit `+0x15d4` ≥ 0 → vt `+0x140(shell, 0, hit, −1, 0x1f, 2, 0xffff, 1.0)` (hit slot 0). Return 1.

No effect here.

### 2d. Activation `0x413c40` (vt `+0x18`, READ; run once as the unit goes live — INFERRED from rom-map row 741 /
shells.js `step02`, the same slot of base02)

`0x4a1694` (`bx lr`); **the placement `0x413d60`** (§2e); then if ef `+0x15c8` is non-null with record id ≥ 0: requester
(`0x40a54`) filled by **`0x4a10c8(shell, req, vt+0x130 (the shell's model interface), 0, byte +0x1054, &+0x1620, −1)`**
(position = **`+0x1620`, the start point**; ShellScale by mode), then **`+0x14 |= 2` and `+0x30..+0x38` = the words
`+0xfe8` / `+0xfec` / `+0xff0` × 0.00549316 (degrees), `+0x3c` = 0** (the rotation override); `0x4a11e4(shell, ef, req)` →
handle **`+0x1610`**; `0x40a94`. Then `0x4145ec` (the sound, §2g). The requester is base02's (`step02`: flags14
0x40000002, parent the shell).

### 2e. The placement `0x413d60` (READ; unicorn `s31/emu31.py`: single-axis probes and 40 random angle sets, 0 mismatches)

Owner O = `0x4a0f00(shell)`; B = `[O+0x1428]` (the owner block; note the pointer register `r6` becomes `O+0x1428` at
`0x414204` — the words below are read through it).

1. **J = joint int 0's position** (`0xc164c(O, [+0x15d8], &+0x1620)`; `0xc164c` → `0x539e08`: the joint whose id byte
   `[[O+0x498]+id]` names, else joint 0's). Nakarkos int 0 = **0** (all modes; Malfestio too).
2. **The sweep:** if `[+0x15e0] < clock +0x1608 < [+0x15e4]` (strict, before this frame's clock step), each local word
   `+0x1670 + 4i` = s32(word + q_i × `[shell+0x1c]`) with q_i = round-half-away(vec4[i] × 182.044) (a signed integer). vec4
   (0, ±0.35, 0) → **Y word ±64 per frame** (emulated: 0x40 / 0xffc0), between clock 241 and 411.
3. `+0x1630..+0x166c` = the owner's world matrix `O+0xb0..+0xec` — **stored, never read in the base31 band** (grep of
   `#0x163x..0x166x`: the ctor's and this function's stores only).
4. **R(v) = Rown(Rloc(v))**, each **R(wx, wy, wz)** = about Z, then X, then Y, with w × 9.58738e-05 rad:
   Z: x' = x c − y s, y' = x s + y c; X: y' = y c − z s, z' = y s + z c; Y: x' = x c + z s, z' = z c − x s.
   Rloc = the shell's words `+0x1670 / +0x1674 / +0x1678`; **Rown = B's words `+0x50 / +0x54 / +0x58`** (the owner's
   angle words, low halves).
5. **P = J + R(vec0) → `+0x1620`** (the effect's point); **`+0x1000` = P + R(vec1)**; **`+0x40` = P + R(vec2)**; `+0x100c`
   = `+0x4c` = 0.
6. d = `+0x40` − `+0x1000`: **`+0xfe8` = u16(s32(0.5 + atan2(−dy, √(dx² + dz²)) × 10430.378))**, **`+0xfec` = … atan2(dx,
   dz) …**, **`+0xff0` = … atan2(−dx, dy) …** (the roll is the same formula as shells.js `angles02`).

Nakarkos's values: **odd modes (u 101): vec0 (0, 0, 1000), vec1 0, vec2 (0, 0, 20000)** → the point 1000 ahead of
joint 0 on the facing, rotation = the facing (pitch 0, yaw = the owner's Y word + the sweep; the roll ±90° from
atan2(−dx, 0) when dx ≠ 0). **Even modes (u 100): vec0 (0, 0, 1075), vec1 (180, 0, 0), vec2 (−180, 0, 0)** → the
point 1075 ahead; d is sideways (−360 along the turned X), so yaw = facing − 90°, roll = +90° (for cos(facing) > 0) —
the frame u 100 is built to be drawn in (INFERRED purpose).

### 2f. The move `0x4147a8` (vt `+0x24`, READ; unicorn `s31/emumove.py`)

1. `0x4a1698` (base: deletes the shell when the owner's unit leaves states 1 / 2 — rom-map trap row 1002).
2. Handle `+0x1610`: a unit whose state `([h+0xc] & 7)` is not 1 or 2 → the handle is dropped (0).
3. **State 0xfe (ending):** `+0x1604 += dt`; **> 30.0 × 60 = 1800** (`[0x162493c]` = 30.0) → delete; else no handle →
   state 0xff, delete. (Emulated: no handle → deleted on the next move.)
4. **State 1 → the live step `0x414870`:**
   - `0x4a0f38(shell) == 0` (owner inactive) → end (vt `+0x148(shell, 0)`).
   - **`0x413d60`** (the placement, §2e).
   - Handle and owner present → for each unit i < `[h+0x15c]`: **`0x329c9c(h, &+0x1620, i)`** (position) and **`0x329d04(h,
     deg, i)`** with deg = (`+0xfe8`, `+0xfec`, `+0xff0`) × 0.00549316.
   - `0x414ac0` (the sound, §2g).
   - **clock `+0x1608 += dt`** (`[shell+0x1c]`).
   - **life:** `+0x1604` ≤ 0 → 0 and end; else max(0, life − dt), and ≤ 0 → end (emulated: life 5 ends on move 5).
   - **`+0x160c != [O+0x4b4]` → end** (the owner's motion is no longer the spawn's; emulated: ends the move it is seen).
   - float 3 `+0x15e8` > 0: `+0x167c += dt`; ≥ float 3 → 0 and **`+0x13dc` = `0x16b4b4(*0x1850710)`** (a fresh hit serial —
     INFERRED meaning: the beam may hit again) — every 120 frames on odd modes (emulated with 4: moves 4, 8, 12).
   - vt `+0x150` (`bx lr`).

**Negatives, with controls:** **no stage query, no collision, no travel, no target read** in base31: the band's whole
call list is `0x13ecba8` / `0x13ecc14` / `0x13ecc20` / `0x13ecc2c` (math), `0x16b4b4`, `0x275dc0`, `0x329c9c`, `0x329d04`,
`0x40a54` / `0x40a94`, `0x413d60`, `0x4145ec`, `0x414ac0`, `0x43a78c`, `0x43a81c`, `0x43a850`, `0x43b058`, `0x4a0f00`,
`0x4a0f38`, `0x4a100c`, `0x4a10c8`, `0x4a11e4`, `0x4a1694`, `0x4a1698`, `0x4a1ad8`, `0x4a1de4`, `0x4eeed0`, `0x4ef25c`,
`0x7a75a0`, `0x807984`, `0xc164c`, and no `P+0x1d0..0x1d8` load. Control: base02's move `0x3fbdc8..0x3fc070` calls the
stage query `0x3fc070` (rom-map rows 682 / 707), found by the same census. **No hit-slot life** (base06 lives on byte
`+0x13ad`, rom-map row 995; base31's live step has no such read).

### 2g. Sound (READ; not visual)

`0x4145ec` (activation) / `0x414ac0` (every move): the hunter `0x275dc0(*0x187ea38)`; the point of the line `+0x40` →
`+0x1000` nearest it (`0x807984`); `_snd` int 0 (228, odd modes; −1 even) played there (`0x4eeed0`) and replayed every
`_snd` int 1 = 100 frames, else moved (`0x4ef25c`). So **vec2's 20000 is the line the sound (and, INFERRED, the hit)
uses — the effect is never given a length** (only position and rotation, §2d / §2f). u 101's drawn length is its own.

### 2h. The end `0x414d18` (vt `+0x148`, READ)

`(shell, flag)`: state already 0xfe / 0xff → skip to the flag test; else **`0x43b058(shell, +0x1610, flag)`** (→ `0x329c40(h,
flag)`, rom-map row 996), `0x4a1de4`, vt `+0x154`, **state 0xfe, `+0x1604` = 0** (the ending clock); flag 1 → vt `+0x40`
(delete now), state 0xff. base31's own two calls pass **flag 0 — graceful** (`0x414a78`, `0x414a9c`); callers from
outside through vt `+0x148` were not censused. The only branch-census
callers of base31 code: the allocator from `0x106f848` and Malfestio's `0xff263c`; the ctor from the two sp_31 ctors; the
placement from `0x413c60` / `0x41489c`; the end through the vtable only.

---

## 3. What each mode draws (Q3, READ — data)

`em084_00_shell31` (`s31/arc31.py`): the `.shl` names one EffectList, `effect\pel\em\em084_00u` (slot 0), the pts
`sound\pts\em\em084_00u`, `_hitdata`, `_hitsize`; ShellScale 1.0 for every mode; no cmn param.

| mode | ef (list, key) | efl (triage) | ints | floats (life, sweep from, to, re-arm) | vec0 | vec1 | vec2 | vec3 | vec4 | hit | snd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | (0, **100**) | em084_00_064 (1 type 2, 4 model; placed 3/2, end 0) | 0 | 1000, 0, 0, 0 | (0, 0, 1075) | (180, 0, 0) | (−180, 0, 0) | 0 | 0 | 1 | −1, −1 |
| 1 | (0, **101**) | em084_00_062_s (1 polyline, 7 model; placed 3/2, end 1) | 0 | 1000, 0, 0, 120 | (0, 0, 1000) | 0 | (0, 0, 20000) | 0 | 0 | 0 | 228, 100 |
| 2 | (0, 100) | as 0 | 0 | 1000, 240, 412, 0 | as 0 | as 0 | as 0 | 0 | (0, **0.35**, 0) | 1 | −1, −1 |
| 3 | (0, 101) | as 1 | 0 | 1000, 240, 412, 120 | as 1 | 0 | as 1 | 0 | (0, 0.35, 0) | 0 | 228, 100 |
| 4 | (0, 100) | as 0 | 0 | 1000, 240, 412, 0 | as 0 | as 0 | as 0 | 0 | (0, **−0.35**, 0) | 1 | −1, −1 |
| 5 | (0, 101) | as 1 | 0 | 1000, 240, 412, 120 | as 1 | 0 | as 1 | 0 | (0, −0.35, 0) | 0 | 228, 100 |

`_hitdata` (HDS, two 0x38-byte records): s16 +0 / +2 = (22, 10000) in both (delay / duration by shells.js's base01
reading — INFERRED for base31, which does not consult the slot for its life). Neither u 100 nor u 101 is exported in
`docs/effects/em084_00.json`; `em084_00_064.efl` is in `docs/effects/files/` (for u 211), `em084_00_062_s.efl` is not.

---

## 4. Census: base31 elsewhere (Q4, READ)

Only two subclasses in `build/arm/dti.json` (parent DTI `0x1886998`): **`uShellEm079_sp_31` (Malfestio em079_00 /
em079_04)** and Nakarkos's. Malfestio as the positive control: same setup factory, same 16-byte setup (`0xff2604`, called
once from `0xffb360`, a tune-float-0x15 op-0 crossing, mode 0 / 2 by `0x3a8430 == 5`, or 1 / 3 on another arm), same reader
but three floats, and **his data exercises the parts Nakarkos leaves at zero**: modes 1 / 3 vec3 (0, −60, 0) (the start
yaw −60°), floats (180, 30, 160), vec4 (0, 0.85, 0) — a 110° sweep from −60° in 129 frames, life 180; modes 0 / 2 life 1000,
no sweep; vec0 (0, 50, 400/500), vec2 (0, 0, 1300 / 1500); ef list slot 1 (em079_00) / 0 (em079_04). Not run here.

---

## 5. What the viewer needs (Q5)

### 5a. SHELL_DATA (the files' values, READ)

```js
SHELL_DATA.em084_00.shells.shell31 = {
  id: 0x172, cls: 'uShellEm084_sp_31', base: 'base31', reader: 0x108ae98, folder: 'shell\\em\\em084_00_shell31',
  modes: {
    0: { scale: 1.0, ef: [[0, 100]], hit: [1], snd: [-1, -1], sh: { ints: [0], floats: [1000, 0, 0, 0],
         vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, 0, 0]] } },
    1: { scale: 1.0, ef: [[0, 101]], hit: [0], snd: [228, 100], sh: { ints: [0], floats: [1000, 0, 0, 120],
         vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, 0, 0]] } },
    2: { scale: 1.0, ef: [[0, 100]], hit: [1], snd: [-1, -1], sh: { ints: [0], floats: [1000, 240, 412, 0],
         vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, 0.35, 0]] } },
    3: { scale: 1.0, ef: [[0, 101]], hit: [0], snd: [228, 100], sh: { ints: [0], floats: [1000, 240, 412, 120],
         vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, 0.35, 0]] } },
    4: { scale: 1.0, ef: [[0, 100]], hit: [1], snd: [-1, -1], sh: { ints: [0], floats: [1000, 240, 412, 0],
         vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, -0.35, 0]] } },
    5: { scale: 1.0, ef: [[0, 101]], hit: [0], snd: [228, 100], sh: { ints: [0], floats: [1000, 240, 412, 120],
         vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, -0.35, 0]] } },
  },
};
```
(float32 in the runtime: 0.35 is `0x3eb33333`.)

### 5b. params / init / step / end (in shells.js's names)

- **params31(sh):** joint = ints[0]; life = floats[0]; sweep = [floats[1], floats[2]]; rearm = floats[3]; vec0..vec4.
- **make31 (spawn + init):** `motionId` = the owner's motion (0x252); local words = u16(s32(0.5 + vec3[i] × 182.044))
  (0 here); life; clock 0; state 1.
- **activation (first step, as `step02`'s `S.activated`):** place31, then the start: `{ param: 0, list 'em084_00u', key,
  requester: { position: P, rotationDeg: words × 360/65536, scale: [1, 1, 1], parent: 'shell', flags14: 0x40000002,
  flags1c: 3, type8: 3 } }`.
- **place31(S, J, own):** §2e exactly — J(joint) row 3 (`jointMatrix(J, 0)`), the sweep before the clock step, R = Rown ∘
  Rloc with `own.ownerX / ownerY / ownerZ`, P / A (`+0x1000`) / B (`+0x40`), the three words.
- **step31 (state 1):** owner inactive → end; place31; `S.place = { param: 0, position: P, rotationDeg: words × 360/65536 }`
  while the effect lives; clock += dt; life (§2f); **`ctx.ownerMotion !== S.motionId` → end**; (re-arm: hit only).
- **end31 (flag 0):** `S.stop = { param: 0, request: 0, key }`, state 0xfe, timer 0; **state 0xfe:** timer += dt, > 1800 or
  the effect gone → 0xff. The same as `end02` / `end06`.
- Dispatch in `stepShells` line 18: `else if (S.base === 'base31') step31(...)`, on this frame's joints.

### 5c. The spawn rows (list `2`, clip `Motion[82]` = `_start`, motion frame 282, the pair in this order)

| action | modes | passes (int) | M83 at | rate | turn before | sweep | pick |
|---|---|---|---|---|---|---|---|
| (7,0x33) | 1, 0 | 3 (0xc) | 540 | 1.0 (INFERRED: no `0xb07b4` call) | ≤ 90° to the target, f0..180 | none | AI |
| (7,0x34) | 3, 2 | 4 (0xe) | 620 | 1.0 | none | +0.35°/f, shell f241..411 | AI |
| (7,0x35) | 5, 4 | 4 | 620 | 1.0 | none | −0.35°/f | AI |
| (7,0x3c) | 1, 0 | 1 (0xd) | 380 | **1.3** (tune 0xf0; M83 0xf1) | as (7,0x33) | none | AI |
| (7,0x3d) | 3, 2 | 4 | 620 | 1.0 | none | + | AI |
| (7,0x3e) | 5, 4 | 4 | 620 | 1.0 | none | − | AI |

Row shape: `{ action: [7, 0x34], code: 0x10767c0, args: [1], list: '2', clip: 'Motion[82]', frame: 282.0, shell:
'shell31', modes: [3, 2], leave: 620, pick: ... }` — `leave` being the motion frame at which the game sets M83 (the viewer
loops M82; ending the shells there is what the game's motion change does).

### 5d. Inputs, and what the viewer cannot supply (named)

- Has: joint 0's matrix (`state.prevJoints(0)` is already snapshot), the owner's angle words (`input.owner`), dt.
- **The action** (six share L2 M82: three different mode pairs and pass counts) — not in the clip; needs a pick
  (`input.rock.variant`-style), as Rathian's and the beams' do.
- **The target** — only for the body's own turn in (7,0x33) / (7,0x3c) (§1c); the shell reads no target. Take
  `input.owner.y` as the facing at frame 282, as shells.js does for every turn it does not run (NOT READ: `0xc0dbc`).
- **The motion change to M83** — the viewer's M82 loops; `motionIdOf` returns null for `Motion[82]_start` / `_loop`
  (only `Motion[N]` matches), so the motion-change end needs both clips mapped to 0x252 or the `leave` frame.
- **(7,0x3c)'s rate 1.3** — the viewer plays at 1.0; the shell's clock and life are game frames.
- **u 100 / u 101 unexported**, `em084_00_062_s.efl` missing: export, then recording / lift for any unlifted routine —
  the shared efx slot (announce).
- Not visual, not modelled: the hit slot (record 0 / 1, re-arm every 120), the sound (needs the hunter), the arm actions
  (7,0x14) / (7,0x15) the shot orders (their own clips).

---

## 6. Not read / open

- `+0x144` `0x3fa078`; `0x43a8b0` / `0x4a1ad8` (hit registration and gate); `0x16b4b4`'s serial; what consumes `+0x1630..`
  (the owner-matrix copy) outside base31, if anything.
- Who calls vt `+0x18` and when (INFERRED: once at going live, from base02's row 741).
- `0xafce8`'s rate (INFERRED 1.0 for r5 0..2), `0xc0dbc` (the bounded turn).
- u 100 / u 101's own geometry (how 062_s's polyline gets its length; INFERRED: from its own data).

---

## 7. Proposed `dev/rom-map.md` rows (NOT written — the brief allowed only this note)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1750fec` (+0x000..+0x154, 86 slots) | uShellEmBase31 vtable: +0x18 activation `0x413c40`, +0x24 move `0x4147a8`, +0x13c init `0x413ad4`, +0x148 end `0x414d18`; subclasses uShellEm079_sp_31 `0x17ea9b4`, uShellEm084_sp_31 `0x17f71d8` (override +0x4 / +0x14 / +0x14c only) | uShellEmBase31 | R | dev/em084-shell31-cannon.md §2a |
| `0x413ad4` | base31 init: `+0x160c` = owner motion `[+0x4b4]`; local words `+0x1670..` = vec3 deg; life `+0x1604` = float 0; hit slot 0; no effect | uShellEmBase31 | R | §2c |
| `0x413c40` | base31 activation: placement, ef 0 at `+0x1620` with rotation override = words `+0xfe8..` (deg), handle `+0x1610` | uShellEmBase31 | R | §2d |
| `0x413d60` | base31 placement: P = joint int 0 + Rown∘Rloc(vec0) → `+0x1620`; `+0x1000` / `+0x40` = P + R(vec1 / vec2); words = pitch / yaw / atan2(−dx, dy) of `+0x40 − +0x1000`; the sweep vec4 × 182.044 × dt while float1 < clock `+0x1608` < float2 | uShellEmBase31 | R (unicorn 40/40) | §2e |
| `0x4147a8` / `0x414870` | base31 move: re-place every frame, effect placed by `0x329c9c` / `0x329d04`; ends (flag 0) on life, owner motion ≠ `+0x160c`, owner inactive; hit serial re-armed every float 3; ending wait 1800 | uShellEmBase31 | R (unicorn) | §2f |
| `0x414d18` | base31 end `(shell, flag)`: `0x43b058(+0x1610, flag)`, state 0xfe, `+0x1604` = 0; flag 1 deletes | uShellEmBase31 | R | §2h |
| `0x4145ec` / `0x414ac0` | base31 sound: `_snd` int 0 at the point of `+0x40`→`+0x1000` nearest the hunter, replayed every `_snd` int 1 | uShellEmBase31 | R | §2g |
| `0x1073a48` / table `0x1073a74` | body status-7 action switch (`E+0x73e1`): 0x33 / 0x34 / 0x35 / 0x3c / 0x3d / 0x3e → `0x10767c0` r1 0 / 1 / 2 / 3 / 1 / 2 | uEm084_00 | R | §1a |
| `0x10767c0` | the cannon shot: L2 M82, passes tune int 0xc / 0xe / 0xe / 0xd by r5; turn ≤ 90° to target over f0..180 (r5 0 / 3); **shell31 pair at f282 of the first pass** (1+0 / 3+2 / 5+4 / 1+0); rate 1.3 for r5 3; L2 M83 at the count's end | uEm084_00 | R | §1b, §1c |
| `0x106f820` | shell31 spawner: setup 0x10 bytes {vtable, 0x172, mode, owner} only | uEm084_00 | R | §1d |
| `0xff2604` ← `0xffb360` | Malfestio's shell31 spawner (same setup); mode by `0x3a8430` | uEm079_00 | R | §4 |
| trap | `motionIdOf` maps only `Motion[N]`, so a `_start` / `_loop` clip has no motion id and a base02 / base31 "owner's motion changed" end never fires on such a clip | — | R | §5d |

---

## 8. What to implement

1. **Export u 100 and u 101** (`em084_00u` UNIQUE 100 → em084_00_064, 101 → em084_00_062_s) with `when: 'shell'`; record /
   lift whatever routine 062_s's polyline needs — through the shared efx slot, announced.
2. **`SHELL_DATA.em084_00.shells.shell31`** as §5a.
3. **A base31 runtime** — `params31`, `make31`, `place31` (§2e, float32 with `f()` on every VFP step, `u16(s32(…))` for the
   words), `step31` with the one-time activation, `end31`; dispatch `S.base === 'base31'`.
4. **Six spawn rows** on L2 `Motion[82]` frame 282 (the first pass only), each making its pair odd mode first, with an
   action pick (no clip names it) and `leave` = 540 / 620 / 380.
5. Map `Motion[82]_start` / `_loop` to motion 0x252 for the motion-change end, or end at `leave`.
6. Name in the UI what it stands in for: the AI's action pick, the body's turn to the target in (7,0x33) / (7,0x3c)
   (facing = `input.owner.y`), (7,0x3c)'s rate 1.3.
