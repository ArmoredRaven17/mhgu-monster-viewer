# em084_00 Nakarkos, phase 2: what base00 and base01 do with his values (research agent for the Viewer agent, 2026-10-06)

Context: `dev/em084-shells-spec.md` §5 / §6 / §8, and rom-map's "Nakarkos -- the tentacle-form shells, phase 1". Four
questions block the arm shells shell00 11..59 (base00) and shell01 15..85 (base01). All reads are static (`efx/armdis.py`),
with two unicorn cross-checks and one census run from the scratchpad (`p2bases/uc_check.py`, `p2bases/census.py`). The
shared efx slot was not used. **R** = READ (the consuming instruction was read); **I** = INFERRED.

Conventions follow `docs/render/shells.js`: `u16`, `s32`, `mla`, `DEG_TO_U16` (0x43360b61 = 182.04445), `U16_TO_RAD`
(0x38c90fdb), `rotXYZ`, `launchVelocity`, `gravityOf`, `groundAngles`, `slotsOf011` / `slotStep`.

---

## 0. Short answers

1. **base00 with flight 0.0 neither flies until it lands nor ends at once.** It lives while a hit slot is on: a move
   with `+0x15fc <= 0` skips the timer and runs the collide (vt `+0x168`) while hit-slot byte `+0x13ad` (slot 0) or
   `+0x1465` (slot 1) is set. When both are clear it ends on that move (vt `+0x148(0)`). base00 registers slot 0 from hit
   int 0. His modes 11..59 name record 2 = (delay 0, duration 200), so the shell flies for up to about 200 frames and its
   landing ends it sooner (**R**; unicorn agrees). With 45..50° up, speed 22..30 and gravity 0.5, it lands well inside
   200 frames (**I**, by arithmetic).
2. **base01 flag 0x20 has one test site: `0x3fb104` in the state-1 move.** It sends the move to vt `+0x164` =
   `0x3fb3a4` (base01's own; sp_01 does not override it). That method is an **effect switch at the hit's onset**:
   - The condition: `+0x15d0` (ef 1) is non-null and slot 0's delay `+0x1404` minus the frame step
     `[[0x211f764]+0x68]` is <= 0.
   - Then it hard-stops the handles `+0x1624` / `+0x1628` / `+0x162c` (flag 1).
   - It starts ef 1 at `+0x40` into `+0x162c`. With flag `0x40` set it also calls `0x43ac04(+0x15e8)`. Last, it clears
     `+0x15d0`, so the switch fires once.

   On his modes 15..62 that is u_r 13 → u_r 14 at about frame 100, and on 82..85 u 36 → u 35 (etc.) at about frame 120
   (**R**). The census found no other site, and its positive controls came back (§2c).
3. **`+0x160c` is added per word, each component to its own word, BEFORE the position and BEFORE the ground-normal
   angles:** `A[i] = (A[i] + u16(s32(mla(0.5, deg[i], DEG_TO_U16)))) >>> 0` (uxtah, 32-bit store), at
   `0x3fa5b4..0x3fa638`, right after the words are copied from setup `+0x30..` (**R**; unicorn agrees).
   - The turned-offset position uses the new words.
   - `0x43b1a0` reads the new **Y** word as the heading and overwrites all three words. So with flag 8 only the yaw
     offset survives, as the heading; the X and Z offsets are discarded.
   - On 82..85 (flags `0x20`, no snap) the X offset survives: −90 → word `0xc001`.
4. **More that shells.js does not transcribe yet:**
   - his sp_01 reader puts ef 1 at **`+0x15d0`, not `+0x15cc`**, so base01's init never starts it. `make001` starts
     params 0 and 1.
   - base00's init turns the offset by **`rotXYZ` of the angle words when flag bit 3 is set**, not by the joint matrix
     (his modes 0 and 2..8).
   - base00 tests `0x800` and `0x400` after all (a map correction).
   - his sp_00 landing needs a `LANDING` entry.
   - shell01's ending must also wait on the third handle `+0x162c`.

   Details in §4.

---

## 1. base00 for shell00 11..59 (and 0..8, 65, 66)

### 1a. His reader `0x1088c5c` (R, re-read; agrees with the spec §8)

`0x4a22f0(0..3)` → `+0x15c8` / `+0x15cc` / `+0x15d0` / `+0x15d4`; `0x4a23f4(0)` → `+0x15d8`; `0x4a2470(0)` → `+0x15dc`
(joint).

The flags word `+0x15e8` (ctor 0) takes one bfc/orrne per bit:
- bit 3 = int 3 ≠ −1 (`0x1088d18`)
- `0x10` = int 1 ≠ −1 (`0x1088d40`)
- `0x20` = int 2 ≠ −1 (`0x1088d68`)

Floats (`0x4a24f8`) and vecs:
- float 0 → `+0x15ec` (degX), float 1 → `+0x15f0` (degY), float 3 → `+0x15f4` (vz), float 2 → `+0x15f8` (vy),
  float 4 → `+0x15fc` (flight).
- vec 0 → `+0x1610`.
- **`+0x1614` = 0 (a null pointer, `0x1088e20`)**. Its only readers are `0x3f93f0` / `0x3f9d3c`, inside the bit-0 / bit-1
  aim arms, which he never takes (**R**).
- vec 1 → `+0x161c`.

His words, from the arc (`naka_shells/arcmodes.json`):

| modes | ints | flags | joint | flight | hit rec (delay, dur) |
|---|---|---|---|---|---|
| 0, 2..8 | [12, −1, −1, 0] | `0x08` | 12 (arm) | 500 | 0 (0, 300) |
| 1 | [−1, 0, −1, 0] | `0x18` | −1 | 1000 | 1 (0, 300) |
| 11..59 | [12, −1, −1, 0] | `0x08` | 12 (arm) | **0.0** | **2 (0, 200)** |
| 65 / 66 | [212 / 213, −1, −1, −1] | `0x00` | 212 / 213 (body) | **0.0** | 3 (0, 300) |

So 65 / 66 are slot-lived too. Hit records come from `em084_00_00_hit###` / `_hitdata` (HDS v0x20160209, 4 × 0x38 B), read
with `p2bases/hitdump2.py`.

shell00 11..59, floats (degX, degY, vy, vz). vy is 0, flight 0, vec 0 is (0, 0, 0) and gravity is (0, −0.5, 0)
everywhere:

| modes | degX | degY | vz | | modes | degX | degY | vz |
|---|---|---|---|---|---|---|---|---|
| 11 / 12 / 13 | −45 | 120 / 70 / 20 | 22 | | 40 / 41 / 42 | −45 | 180 / 90 / 20 | 27 / 22 / 22 |
| 18..20 | −50 | 90 | 30 | | 45 / 46 / 47 | −50 | −30 / −30 / −140 | 26 / 30 / 30 |
| 25 / 26 / 27 | −45 | −120 / −70 / −20 | 22 | | 52 / 53 / 54 | −45 | −180 / −90 / −20 | 27 / 22 / 22 |
| 32..34 | −50 | −90 | 30 | | 57 / 58 / 59 | −50 | 30 / 30 / 140 | 30 |

### 1b. The init `0x3f8b80` with flags `0x08` (R)

1. **Angle words (`0x3f8c60..0x3f8c98`, 0x20 clear).** `+0xfe8` = `[[owner+0x1428]+0x50]` (0 with `0x200`),
   `+0xfec` = `[[owner+0x1428]+0x54]`, `+0xff0` = 0. The owner `0x4a0f00(shell)` is the ARM: the pointer is
   `r1 = owner+0x1428` after the `ldr r0,[r1,r0]!` at `0x3f8c30`. These are shells.js's `ownerX` / `ownerY` of the arm
   block (ownArm084; that the arm block is the attached body's frame is **I**, as phase 1 says).
2. **Timer.** `+0x162c = +0x15fc` (`0x3f8cc8`), which is 0.
3. **Base point (`0x3f8d58..0x3f8d84`, 0x10 clear, joint 12).** `0xc15a4(arm, 12, &M)`, then `+0x40` = M row 3. This is
   the ARM's joint 12.
4. **The offset, bit 3 SET (`0x3f8e68` → `0x3f8ed0..0x3f8f8c`).** The vec is turned by the angle words X, Y, Z (each
   `ldrh × U16_TO_RAD`). The operation order is **identical to shells.js `rotXYZ`**: I compared it term by term, and
   base01's `0x3fa65c` is the same code. Times the owner's size (`0xbe518`) only with `0x80`.
   - This first pass uses the words BEFORE the degree offsets. Its point (`+0x40` + offset) goes only to the X / Y adjust
     functions as their aim point.
   - After the offsets, **when `(flags & 0x108) == 8`** (`0x3f903c`), the offset is recomputed with the NEW words
     (`0x3f904c..0x3f9134`). That second offset is the one added at `0x3f9140`.
   - Bit 3 clear: the offset goes through M's 3×3 (`0x3f8e70..0x3f8ec0`). This is exactly shells.js `launchPoint`.
   - For 11..59, vec 0 = (0, 0, 0), so the position is joint 12's row 3 exactly.
5. **Degree offsets.** X: `0x3f9378`, bit 0 clear → `u16(s32(mla(0.5, degX, DEG_TO_U16)))`, added to `+0xfe8` by a
   32-bit `add` (`0x3f8fec`). Y: vt `+0x16c` = base `0x3f9cc4` (sp_00 does not override it), bit 1 clear → the same with
   degY, added to `+0xfec` (`0x3f9034`). Constants `0x3f95a0` / `0x3f9ef0` = 182.04445. An owner of 0 adds 0. **Agrees
   with init00** (`S.angles` lines 3272..3274).
6. **Position and anchor.** `+0x40 += offset`, anchor `+0x1000` = `+0x40` (`0x3f9140..0x3f918c`).
7. **Gravity.** vt `+0x170` = `0x3f9f98`: `+0x1020` = (gz·sY, gy, gz·cY) with the Y word AFTER the offset. For (0, −0.5, 0)
   that is (0, −0.5, 0). **Agrees with `gravityOf`.**
8. **Velocity (`0x3f91a0..0x3f928c`).** (0, vy, vz) turned by Z, then X, then Y (new words). **Agrees with
   `launchVelocity`** (re-read). Mode 11: X word `ownerX + 0xe001`, so with ownerX = 0 the climb is +15.56 and the
   forward speed 15.56, then turned by `ownerY + 0x5555`.
9. **Flight effect.** ef `+0x15c8` → `0x4a10c8` / `0x4a11e4` at `+0x40`, handle `+0x1624` (`0x3f928c..0x3f92f8`).
10. **Flags `0x800` / `0x400`.** `0x3f9304` `ldrb r0,[sb,#1]` / `tst #8` = **flag `0x800`** → byte `+0x15ac` = 0.
    `0x3f9338` `ldrb [sb,#1]` / `tst #4` = **flag `0x400`** → `0x43ab74(shell, 0xbe518(owner))`, the shell scaled by the
    owner's size. `sb` = shell+0x15e8 from `0x3f8c64` and is never rewritten. See §4d. Not his bits.
11. **Slot 0 registration.** vt `+0x164` = `0x3f9aec` (`0x3f932c`): if `0x4a1ad8(shell) == 1` and `+0x15d8 >= 0`, it calls
    vt `+0x140` (`0x43a8b0`)`(shell, 0, +0x15d8, −1, s0 = 1.0, 0x1f, 2, halfword +0x1588)`. That is **slot 0 only**; base00
    never registers slot 1. It is the same chain as base01's `0x3fb158` slot 0, except s0 = 1.0 where base01 passes
    `+0x13bc`.
    - The gate `0x4a1ad8` = the resource `[shell+0x1384]` has non-null `+0xbc` and `+0xc0` (**R** code). That those are
      the `_hitdata` / `_hitsize` the folder ships is **I** (as in em084-shell06-aura.md). His shell00 folder ships both.
    - Slot k = shell + 0x13a8 + 0xb8·k (`0x4a1bd4..0x4a1bec`, **R**). `0x168a2c` sets byte `+5` = 1, `+0x5c` = s16
      delay, `+0x60` = s16 duration (**R**). So `+0x13ad` / `+0x1465` are the slot bytes and `+0x1404` is slot 0's delay.

### 1c. The move with flight 0 (R; unicorn agrees)

vt `+0x24` = `0x3f96a0` drops dead handles, then state 1 → vt `+0x158` = `0x3f9738`:

```
0x3f9738  vt+0x160 (0x3f98f4: anchor = +0x40, 0x539224 integrate, X/Y words from the velocity unless 0x40)   -- move00 as is
0x3f9750  0x4a0f38(owner active) == 0  -> vt+0x148(0)                                                     -- always active in the viewer
0x3f9760  +0x15fc > 0 ?  (vcmpe / ble: NaN and <= 0 both go to the slot arm)
            yes -> the timer +0x162c (flightTimer as transcribed)
            no  -> 0x3f97bc: byte +0x13ad != 0 or byte +0x1465 != 0 -> vt+0x168 (0x3f99e0, the collide)
                                                         else      -> vt+0x148(0) (the end)
```

The flight step always runs first. So with no slot on, the shell moves one step and ends without querying the stage.

**Unicorn (`uc_check.py` B, `0x3f9738` alone, owner stubbed active):**

| flight | timer | `+0x13ad` | `+0x1465` | exits through |
|---|---|---|---|---|
| 0 | — | 0 | 0 | +0x160 then **+0x148 (end)** |
| 0 | — | 1 | 0 | +0x160 then **+0x168 (collide)** |
| 0 | — | 0 | 1 | +0x160 then +0x168 |
| 500 | 10 | 0 | 0 | +0x168, timer 9 (control) |
| 500 | 0 | 1 | 1 | +0x148, slots ignored (control) |
| 500 | 0.5 | 0 | 0 | +0x148, timer clamped 0 (control) |

**So in shells.js terms:** `flightTimer` must not throw. For `!(flight > 0)` it returns
`(slot 0 on || slot 1 on) ? 'query' : 'end'`, after the flight step. These are the same semantics as `move011`'s
`T <= 0` arm and the same slot model (`slotsOf011` / `slotStep`, input.hitLife).
- For 11..59: slot 0 = record 2, `{ delay: 0, duration: 200 }`.
- Without input.hitLife there are no slots, so the shell ends on move 1. That is the same named behaviour as the timer-0
  shell01s.
- The ending is unchanged: base00's end `0x3f9ef4` sets `+0x162c = [0x162493c] × 60.0` (GOT `0x1835c58`; shells.js ENDING_FRAMES) whatever the
  flight was (**R**). Flight 0 does not shorten the ending.

### 1d. The landing (R): stepRock's model is right; his class needs its own entry

- `0x3f99e0` (vt `+0x168`) calls `0x43ac8c(shell, &pt, &type, &result, 0)`. Only when it returns 1 does it copy the result
  to `+0x1060..` / normal `+0x1080..` and call vt `+0x150(shell, &pt, &result, type)`. The collide never ends the shell
  itself.
- His `+0x150` = `0x1088e38`:
  - **only in state 1** (`[shell+4] == 1`, else return).
  - type 0 → ef `+0x15cc` (param 1, (999, −1) on 11..59: the requester refuses it); type 2 → `+0x15d4` (param 3, u_r 35);
    type 1 → `+0x15d0` (param 2, u_r 35) **and**, by mode (jump table at `0x1088e9c`, index = mode ≤ 0x42), a shell01:
    - modes 0, 2..8, 65, 66 → shell01 **0**
    - mode 1 → shell01 **1**
    - 11..13, 18..20, 25..27, 32..34, 40..42, 45..47, 52..54, 57..59 → shell01 **6**
    - all others → none (decoded entry by entry; agrees with spec §6)
  - The child request (0x40 B, `0x3fa2bc`): id `0x16d`, mode, owner = `0x4a0f00(shell)` (the arm),
    `+0x10..` = the contact point, `+0x20..` = the zero vector, `+0x30..+0x38` = **this shell's words
    `+0xfe8/+0xfec/+0xff0` at the landing**, `+0x3c` = halfword `+0x13dc`. It is made with `0x48b884` (the init at once).
  - **The child is made BEFORE the landing effect.** Then `0x3f8970(shell, ef, &pt)` (null ef → nothing) and vt
    `+0x148(0)`.
- So **stepRock's "hit → LANDING → 'end'" is correct** for him: the landing always ends a state-1 shell.
- What differs from landing04: **type 1 also starts its own ef** (param 2). Also, the child's words are the ones move00
  rewrote from the velocity this move (flag `0x40` clear): pitch `atan2(−vy, h)`, yaw `atan2(vx, vz)`, Z the init's 0.
  shell01 6 (all ints −1 → flags 0) then sits exactly at the contact (bit 0 clear, vec 0) with those words. No snap.

---

## 2. base01 flag 0x20 (Q2)

### 2a. The test (R)

The state-1 move `0x3fb048`:
- owner check;
- the timer arm (`+0x1614 > 0`: `+0x1618 += dt`, `> T` → end) or the slot arm (`T <= 0`);
- the `0x100` re-arm (`0x3fb098`);
- **`0x3fb0fc..0x3fb118`: `ldrb [+0x15ec]` / `tst #0x20` → vt `+0x164`**;
- then vt `+0x160` (`0x3fb550`, `bx lr`) and the tail to vt `+0x150` (`0x3fb548`, `bx lr` for sp_01).

The test runs on every state-1 move that did not end. It sits after the timer check, so the move that ends the shell
never switches.

### 2b. vt +0x164 = `0x3fb3a4` (R)

```
if ([+0x15d0] == 0) return;                                   // ef 1 (his reader: 0x4a22f0(1) -> +0x15d0, 0x1089208)
if (!( [+0x1404] - [[0x211f764] + 0x68] > 0 )) {              // vsub / vcmpe / bhi: NaN also fires
  0x43b058(shell, [+0x1624], 1); 0x43b058(shell, [+0x1628], 1); 0x43b058(shell, [+0x162c], 1);
  requester at +0x40 (0x4a10c8: byte +0x1054, -1, the model interface vt+0x130) ; [+0x162c] = 0x4a11e4(shell, [+0x15d0], req);
  if ([+0x15ec] & 0x40) 0x43ac04(shell, [+0x15e8]);           // via the post-indexed r5 = shell+0x15ec (0x3fb44c)
  [+0x15d0] = 0;                                              // once
}
```

- `[0x1831cb0]` = `0x211f764`, the global whose `+0x68` rom-map names as the slot countdown's step (**R** for this load;
  that it is the frame step is **I**, as in the map).
- `+0x1404` = slot 0's delay (§1b.11, **R**).
- `0x43b058(h, 1)` → `0x329c40(h, 1)` = core vt `+0xa4`, then `+0x30 = 2` (rom-map row 353, **R**). It is not the end's
  flag-0 graceful stop. Reading it as "stopped at once" is **I**.
- The stopped handles are not zeroed here. The next step's liveness pass (`0x3faeec..`) zeroes a handle whose unit left
  states 1 / 2 (**R** code; that the killed unit leaves at once is **I**).

**In shells.js terms (one move, after the timer check):**

```
if ((k.flags & 0x20) && S.ef15d0 && !(f(slot0.delay - ctx.dt) > 0)) {
  stop S.effect, S.effect2, S.effect3 (flag 1); S.effect3 = start(ef param 1 at S.position); S.ef15d0 = null;
}
```

Here `slot0.delay` is the slot's current delay before this step's `slotStep`. That matches shells.js's INFERRED order:
slots count after every shell's move.

His modes:

| modes | ef 0 (init) → ef 1 (switch) | hit rec | switch at | timer (end) |
|---|---|---|---|---|
| 15..17, 22..24, 29..31, 36..38, 48, 51..53, 57, 60..62 | u_r 13 → u_r 14 | 8 (100, 10) | move ≈ 100 / dt | 120 |
| 82 / 83 / 84 / 85 | u 36 → u 35 / u 116 → u 115 / u 38 → u 37 / u 118 → u 117 | 12 / 13 (120, 10000) | move ≈ 120 / dt | 220 |

The slot governs only the switch. These timers are > 0, so the life is the timer.

### 2c. Census of every 0x20 test site, with controls (R)

`p2bases/census.py` does a recursive-descent disassembly:
- **entry points:** every slot of sp_01's vtable `0x17f6a94` (92 slots, base01's methods plus his four overrides)
- **followed:** control flow, so function extents are derived, not chosen
- **transitive calls:** `bl` / far `b` / vtable `blx` (resolved liberally on the same vtable)

It ran to depth 2 (318 functions, 37 285 instructions) and depth 3 (442 functions, 55 703 instructions).

It reports every immediate in `0x15ec..0x15ef` (the field) and every flag-shaped instruction on the bit (tst / ands /
bics / teq / and / bic / cmp / orr with `#0x20`, `ubfx #5`, `lsl #26` / `lsr #5`).

**Field references in the whole closure: five, all base01's own or the reader's.**
- `0x3fa560`, the init. Its pointer `sl` = shell+0x15ec (`ldr r0,[sl,r0]!`, kept at `[sp+0x1c]`) feeds the tests `0x800`
  `0x3fa56c`, `0x80` `0x3fa59c`, `1` `0x3fa64c`, `2` `0x3fa864` / `0x3fa98c`, `4` `0x3faae0`, `8` `0x3fabbc`, `0x200`
  `0x3fac20`, `0x400` `0x3fac58`, `0x40` `0x3fae10`, and byte 1 `0x10` = `0x1000` `0x3fae24`. **No 0x20.**
- `0x3fb098`, the move (`+0x15ed` bit 0 = `0x100`).
- `0x3fb0fc`, the move: **the 0x20 test at `0x3fb104`**.
- `0x3fb444`, `0x3fb3a4`: the `0x40` test at `0x3fb4a4` through the post-indexed `r5`.
- `0x1089234`, the reader (the writer, `orrne #0x20` at `0x1089330`).

The pointer `sl` is never passed to a callee (`0x43b1a0` gets `&+0xfe8` / `&+0xfec`, the rest get the shell), so a callee
could test the flags only by naming the offset, and none does. The flag-shaped `#0x20` hits elsewhere in the closure
(`0x877f00`, `0x939344`, `0x94b3c4`, ...) are in functions with no `0x15ec` reference, so they test other words.

**Positive controls** (the same script, other bits):
- bit `0x800` finds `0x3fa56c` and the reader's `0x1089308`;
- bit `0x40` finds `0x3fae10` and `0x3fb4a4`;
- bit `0x100` finds `0x3fb0a0` (byte `+0x15ed` / `tst #1`) and `0x3fa64c`.

**Caveat:** unresolved indirect calls (a few `bx r3`, one jump table in `0x16969c`) and the depth bound.

---

## 3. sp_01 vec 1 → `+0x160c` (Q3, R; unicorn agrees)

base01's init `0x3fa498`:
1. Words: `+0xfe8..+0xff0` = setup `+0x30..+0x38` (`0x3fa594..0x3fa5a8`).
2. Branch on `0x80` (`0x3fa59c`). **The `0x80` arm (owner's ground) skips the offset entirely.**
3. Otherwise (`0x3fa5b4..0x3fa638`):

```
p = [+0x160c] || 0x1831a78's shared zero vec (stored back)
+0xfe8 = +0xfe8 + u16(s32(mla(0.5, p.x, 182.04445)))   // uxtah: the low half zero-extended, added to the full 32-bit word
+0xfec = +0xfec + u16(s32(mla(0.5, p.y, 182.04445)))   // a fresh 0.5 each (vmov s6, s4 before each vmla)
+0xff0 = +0xff0 + u16(s32(mla(0.5, p.z, 182.04445)))
```

4. The position, **with the new words**:
   - flag 1 clear: the setup point + `rotXYZ(vec0, A') × 0xbec34(owner)` (`0x3fa65c`);
   - flag 1 set: joint `0xc15a4`, then flag 2 → `rotXYZ(vec0, A')` + row 3 (`0x3fa9f4`), or flag 2 clear → M's 3×3
     (`0x3fa994`).
5. Flag 4: the ground snap (ctor reach 500 up / 500 down; his reader leaves both).
6. Flag 8: `0x43b1a0(shell, &+0xfe8, &result, &+0xfec)`, which reads **`ldrh [r3]` = the new Y word** for fwd = (sin Y, 0,
   cos Y), builds the frame with the ground normal, and **writes all three words `uxth`** (`0x43b24c / 0x43b274 /
   0x43b294`).

So for his flag-8 modes the yaw offset survives only as the heading of the ground frame. **shells.js `groundAngles(A, n)`
already uses `A[1]`, so passing the offset words is enough.**

Values (f32, as the ROM rounds them): +30 → `0x1555`, −30 → `0xeaac`, +40 → `0x1c72`, ±45 → `0x2000` / `0xe001`,
±60 → `0x2aab` / `0xd556`, ±75 → `0x3555` / `0xcaac`, +90 → `0x4000`, **−90 → `0xc001`** (−16384 + 0.5 truncates to
−16383). Unicorn on the block alone (`uc_check.py` A), words in (0x1234, 0xfff0, 0):
- (0, −60, 0) → Y `0x1d546`
- (−90, 0, 0) → X `0xd235`
- (0, 40, 0) → Y `0x11c62`
- (0, −75, 0) → Y `0x1ca9c`

The sums are unmasked 32-bit and match the formula. Every later read is `ldrh` / `uxth`, so `>>> 0` with `u16` on read is
right.

**init011's `add` becomes:** `A = A.map((w, i) => (w + u16(s32(mla(0.5, k.deg[i], DEG_TO_U16)))) >>> 0)`, in the same
place (after the copy, inside the `0x80`-clear arm, before the position). His modes:

| modes | flags | vec 0 | deg (vec 1) | what the offset does |
|---|---|---|---|---|
| 15..17 / 29..31 | `0x2f` | (−500,0,400) / (0,0,900) / (500,0,400) | Y −60 / 0 / +60 | turns vec 0 about joint 12 and sets the snapped heading |
| 22..24 / 36..38 / 48 / 51..53 / 57 / 60..62 | `0x2f` | 0 | Y 0, 40, 75 / 0, −45, −75 / 0 / 90, 45, 0 / 0 / −90, −45, 0 | heading only (vec 0 = 0) |
| 43 / 46 | `0x0f` | (300, 100, −300) | Y +90 | turns vec 0, heading |
| 70..72 / 76..78 | `0x0f` | (0, 20, 0) | Y −30, −60, −90 / +30, +60, +90 | heading (vec 0 vertical) |
| 82..85 | `0x20` | 0 | **X −90** | words (0xc001, 0, 0) on the setup's zero words: pitched; no snap, so it survives |
| 44 / 45 | `0x00` | 0 | 0 | — (the parent's point and words) |

`0x2f` / `0x0f` = joint path (bit 0) with the turned vec and no scale (bit 1), snap (bit 4), ground angles (bit 8), plus
`0x20` on the first group. Joint 12 = the ARM's (the owner of an arm request).

---

## 4. Other reads shells.js needs (Q4) — agreements and corrections

### 4a. Agreements (R)

| shells.js | read | verdict |
|---|---|---|
| `init00`'s degree adds (lines 3272..3274) | `0x3f9378` / `0x3f9cc4` bit-0 / bit-1-clear arms, 32-bit add | agrees |
| `gravityOf`, `launchVelocity` | `0x3f9f98`, `0x3f91a0..0x3f928c` | agree; both run with the post-offset words |
| `move00` order, `flightTimer` for flight > 0 | `0x3f9738..0x3f97f8` | agree (unicorn controls) |
| `stepRock` hit → landing → end | `0x3f99e0`, `0x1088e38` | agrees for his class |
| `rotXYZ` | base00 `0x3f8ed0` / `0x3f904c` and base01 `0x3fa65c` / `0x3fa9f4` | one operation order in all four |
| `init011` joint / snap / ground-angle arms | `0x3fa830..0x3fabe0` | agree; the 500 / 500 reach stands for him |
| `move011` timer arm | `0x3fb05c..0x3fb094` | agrees: his timers 120 / 300 / 220 govern the life; the slots do not |
| `endCreate084` | — | unchanged |

### 4b. Corrections

1. **`flightTimer` throws on flight ≤ 0** (lines 3313..3314). It should be the slot arm (§1c). This blocks shell00 11..59
   and 65 / 66.
   - base00 shells need `S.slots` (slot 0 from `mode.hit[0]`, from vt `+0x164` `0x3f9aec`).
   - `stepShells`'s `slotStep` loop (line 6852) already steps any `S.slots`.
2. **`make001` starts ef params 0 AND 1 at the init** for every base01 reader (lines 5938..5946). base01's init starts
   only `+0x15c8` → `+0x1624` and **`+0x15cc`** → `+0x1628` (`0x3fad08..0x3fadf8`, **R**).
   - His reader writes ef 1 to **`+0x15d0`** (`0x1089208`, **R**) and leaves `+0x15cc` at the ctor's 0. So for
     `uShellEm084_sp_01` the init starts ef 0 only, and ef 1 is the 0x20 switch's.
   - Today this is harmless only because phase 1's ef 1 is (999, −1). On 15..62 it would start u_r 14 at spawn.
   - Key it per reader: which ef index, if any, is at `+0x15cc`.
3. **`init00`'s joint arm uses `launchPoint(M, vec)` whatever bit 3 says** (line 3264). With bit 3 SET (and `0x100` clear)
   the offset is `rotXYZ(vec, A')` with the post-offset words, plus the joint's row 3 (§1b.4).
   - His modes 0 and 2..8 (vec (−40, −30, 400), (0, −30, 0), (40, −50, 400)) take this.
   - 11..59 are unaffected (vec 0).
   - The same holds for the `joint == −1` arm (owner matrix `+0xb0..+0xec`'s 3×3 with bit 3 clear, `rotXYZ` with it
     set). That arm's yaw-only turn is right only when X = Z = 0.
   - The same holds for the `0x10` arm (lines 3224..3227). The ROM turns by all three words with `U16_TO_RAD`
     (`0x38c90fdb`), not a yaw by `0.0001`. His mode 1 (vec (0, 7000, 0), flags `0x18`) takes this arm.
   - Bit 3 clear in the `0x10` arm turns by the static matrix at `[0x1832afc]` → `0x19177b0` (**I**: identity, rom-map
     "base01's no-joint 4×4").
4. **The `params084s01` refusals** for `0x20` and `deg` are now read. Replace them with §2b and §3. Its `why` for a mode
   SHELL_DATA lacks stays.
5. **`end011` and the ending** know two handles. base01's end `0x3fb264` stops `+0x1624`, `+0x1628` **and `+0x162c`**
   (flag 0). The ending `0x3fafd0..0x3fb010` deletes when `+0x1624|+0x1628` and `+0x162c|+0x1630` are all gone (`orrs` /
   `orrseq`, **R**). A 0x20 shell's ef 1 handle (`+0x162c`) must be stopped at the end and waited on.
6. **`move011`'s comment** "flag 0x20 → vtable +0x164 (never set by these readers)" (line 5749) is no longer true:
   Nakarkos sets it.

### 4c. His sp_00 needs (not in shells.js yet)

- **`READER00.uShellEm084_sp_00`:** `{ joint: I0, flags: (I3≠−1?8:0)|(I1≠−1?0x10:0)|(I2≠−1?0x20:0), degX: F0, degY: F1,
  vz: F3, vy: F2, flight: F4, vec: V0, gravity: V1 }`.
- **`LANDING.uShellEm084_sp_00`:** `[1, 2, 3][type]` at the contact and, for type 1, the child (table §1d) made first with
  the shell's current words and the arm as owner.
- **`rockInputs`** demands a target (line 3434). His arm shells never read one (bits 0 / 1 clear, `0x20` clear: no
  aim-by-mode). Requiring it would refuse a shell the ROM fires.

### 4d. A map correction found on the way: base00 DOES test 0x800 and 0x400

- rom-map row "base00 flag **0x800** | no test in base00's own band" lists `0x3f9308` as a **bit 3** control. That is
  wrong. `0x3f9304` is `ldrb r0,[sb,#1]` and `0x3f9308` is `tst r0,#8`, which is bit 11 = **0x800**: clear byte
  `+0x15ac`.
- `0x3f933c` (`ldrb [sb,#1]` / `tst #4`) is likewise **0x400**: `0x43ab74(shell, owner size)`.
- The consumer of `+0x15ac` is `0x43a8b0` (the hit registration vt `+0x140`, `0x43a8f0..0x43a8fc`): with the byte 0 it
  skips the block after `0x4a1b24` (owner byte `+0xb720`, `0xcad9c(owner, +0x15bc)`, ...). That is hit side; its meaning
  is NOT READ.
- base01's `0x1000` does the same to `+0x15ac` (`0x3fae24`).
- **Plesioth's beam child (flags `0x870`) takes it**, so its "no consumer" row should be withdrawn (below).
- The rom-map base00 row `0x3f9140` ("a yaw-rotated offset is then ADDED") is also imprecise: it is the 3×3 or `rotXYZ`
  of §1b.4.

---

## 5. Not read / open

- Who runs `0x168d30` and when (the slot countdown's place in the frame), and whether its step is `[[0x211f764]+0x68]`.
  This decides whether the 0x20 switch lands on the move before or after the hit turns on. It is a one-frame question.
- What `0x329c40`'s flag-1 arm (core vt `+0xa4`, `+0x30 = 2`) does to the drawn effect. Read as an immediate stop: **I**.
- `+0x15ac`'s meaning in `0x43a8b0` (hit side, not visual).
- The owner of shell00 1 (made by shell11 modes 2..4's create, `0x108a508..`, unread) and so the words its `0x10` arm
  turns (0, 7000, 0) by.
- The census's unresolved indirect calls and its depth bound (§2c).

---

## 6. Proposed `dev/rom-map.md` rows (NOT written; the brief allowed only this note)

Section "Nakarkos -- phase 2: the bases under his values (research agent for the Viewer agent, 2026-10-06;
dev/em084-phase2-bases.md)":

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x3f97bc..0x3f97d8` | base00 move, flight `+0x15fc` ≤ 0 (or NaN): byte `+0x13ad` or `+0x1465` set → vt `+0x168` (collide), both clear → vt `+0x148(0)`; the flight step vt `+0x160` already ran | uShellEmBase00 | R | §1c; unicorn `uc_check.py` B with controls. shells.js `flightTimer` throws here |
| `0x3f9aec` | base00 vt `+0x164`: slot 0 only, `0x4a1ad8 == 1` and `+0x15d8 >= 0` → vt `+0x140(shell, 0, +0x15d8, −1, 1.0, 0x1f, 2, +0x1588)` | uShellEmBase00 | R | §1b.11 |
| `0x3f8e68` / `0x3f8ed0` / `0x3f903c..0x3f9134` | base00 init offset: bit 3 SET → `rotXYZ(vec, words)` (pre-offset words for the aim point; recomputed with the post-offset words when `(flags & 0x108) == 8`, the one added at `0x3f9140`); bit 3 clear → the base matrix's 3×3 (joint / owner `+0xb0` / `[0x1832afc]`) | uShellEmBase00 | R | §1b.4; corrects row `0x3f9140`'s "yaw-rotated" |
| `0x3f9304` / `0x3f9338` | base00 init: flags byte 1 bit 3 = **0x800** → byte `+0x15ac` = 0; byte 1 bit 2 = **0x400** → `0x43ab74(shell, 0xbe518(owner))` | uShellEmBase00 | R | §4d |
| `0x43a8f0..0x43a8fc` | `+0x15ac == 0` skips the second half of the hit registration (`+0xb720`, `0xcad9c(owner, +0x15bc)`) | enemy-shell base | R (branch) / I (meaning) | §4d |
| `0x4a1bd4..0x4a1bec` | hit slot k = shell + `0x13a8` + `0xb8`·k; with `0x168a2c`: byte `+0x13ad` / `+0x1465`, slot 0 delay `+0x1404`, duration `+0x1408` | enemy-shell base | R | §1b.11 |
| `0x1088c5c` | sp_00 reader verified: ef 0..3 → `+0x15c8..+0x15d4`, hit 0 → `+0x15d8`, int 0 → joint `+0x15dc`; `+0x15e8` bit 3 int 3, `0x10` int 1, `0x20` int 2; floats 0 / 1 / 3 / 2 / 4 → `+0x15ec` / `+0x15f0` / `+0x15f4` / `+0x15f8` / `+0x15fc`; vec 0 → `+0x1610`, **`+0x1614` = 0**, vec 1 → `+0x161c` | uShellEm084_sp_00 | R | §1a |
| `0x1088e38` / table `0x1088e9c` | sp_00 landing verified: state 1 only; type 0 / 1 / 2 → ef `+0x15cc` / `+0x15d0` / `+0x15d4`; type 1 child BEFORE the effect: shell01 0 (0, 2..8, 65, 66), 1 (1), 6 (11..13, 18..20, 25..27, 32..34, 40..42, 45..47, 52..54, 57..59), at the contact with the shell's current words, owner the shell's; then vt `+0x148(0)` | uShellEm084_sp_00 | R | §1d |
| `0x1089208` | sp_01 reader: ef 1 → **`+0x15d0`** (not `+0x15cc`), so base01's init never starts it; only vt `+0x164` does | uShellEm084_sp_01 | R | §4b.2 |
| `0x3fa5b4..0x3fa638` | base01 init: words += `u16(s32(0.5 + [+0x160c][i] × 182.04445))` per component (uxtah), after the copy from setup `+0x30`, before the position; skipped on the `0x80` arm | uShellEmBase01 | R | §3; unicorn `uc_check.py` A |
| `0x43b1a0` | ground angles: `ldrh [r3]` (the post-offset Y word) for the heading; writes all three words `uxth` | enemy-shell base | R | §3 |
| `0x3fb0fc..0x3fb118` | base01 move: the ONLY `0x20` test (census over sp_01's 92 slots, depth 3, 442 functions; controls `0x800` / `0x40` / `0x100`) → vt `+0x164` | uShellEmBase01 | R | §2a, §2c |
| `0x3fb3a4` | base01 vt `+0x164`: `+0x15d0` set and slot 0 delay `+0x1404` − `[[0x211f764]+0x68]` ≤ 0 → `0x43b058(h, 1)` on `+0x1624` / `+0x1628` / `+0x162c`, ef `+0x15d0` at `+0x40` → `+0x162c`, `0x40` → `0x43ac04(+0x15e8)`, `+0x15d0` = 0 | uShellEmBase01 | R | §2b |
| `0x3fafd0..0x3fb010` | base01 ending: deletes when `+0x1624`, `+0x1628`, `+0x162c`, `+0x1630` are all gone, or past `[0x162493c] × 60.0` (GOT `0x1835c58`) | uShellEmBase01 | R | §4b.5 |
| tooling | scratchpad `p2bases/census.py` (recursive-descent field / bit census over a vtable's closure; validated on base01 bits 0x800 / 0x40 / 0x100) and `p2bases/uc_check.py` (unicorn: base01 offset block; base00 move exits) | — | — | not in the repo |

**Withdrawn (proposed):**

| claim | why wrong | correction |
|---|---|---|
| "base00 flag **0x800**: no test in base00's own band; controls bit 3 at `0x3f8e68` / `0x3f9308`" (beam-base section) | `0x3f9308` follows `ldrb r0,[sb,#1]` (`0x3f9304`), so it tests flags bit 11, not bit 3 | base00's init tests `0x800` at `0x3f9308` (byte `+0x15ac` = 0, read by `0x43a8b0`) and `0x400` at `0x3f933c`. Plesioth's child (`0x870`) takes the `0x800` arm. Research agent, 2026-10-06 (dev/em084-phase2-bases.md §4d) |
| "`0x3f9140`: in all three cases a yaw-rotated offset is then ADDED" (base00 init placement rows) | the offset is the base matrix's 3×3 (bit 3 clear) or a full X-Y-Z turn by the angle words (bit 3 set) | §1b.4 |

Note index row: `em084-phase2-bases.md` | em084_00 Nakarkos, phase 2: what base00 and base01 do with his values (flight
0, flag 0x20, +0x160c) | 2026-10-06 | ~20 KB.

---

## 7. What to implement (docs/render/shells.js)

1. **SHELL_DATA.em084_00.shells.shell00:** id `0x16c`, `uShellEm084_sp_00`, base00, reader `0x1088c5c`. Modes 0..8, 11..59
   (§1a), 65 / 66 from arcmodes.json; `hit` = [record] and `hitdata` = [[0, 300], [0, 300], [0, 200], [0, 300]].
2. **`params084s00` in `READER00`** (§4c).
3. **`flightTimer` / `move00`:** `!(flight > 0)` → the slot arm (§1c), not a throw. Give base00 shells `S.slots` from
   `mode.hit[0]` (slot 0 only) under input.hitLife, as `make001` does for base01.
4. **`init00`, bit 3:** with `(flags & 8)` and not `0x100`, the offset is `rotXYZ(k.vec, S.angles)` with the
   post-offset words, × size with `0x80`, added to the base point. This applies on the joint, owner and `0x10` arms.
   Without bit 3: the matrix's 3×3 (launchPoint on the joint arm; the owner's matrix on the owner arm).
5. **`landing084`** in `LANDING` (§1d): child first (`CHILD084` from table `0x1088e9c`) via `ctx.create(S, 'shell01',
   { mode, position: hit.point, angles: S.angles })`, then `contactStart(S, D, [1, 2, 3][type], ...)`.
6. **`init011`:** the per-component `+0x160c` add (§3), using `k.deg`. Drop `params084s01`'s two refusals.
7. **`make001`:** for `uShellEm084_sp_01` start ef 0 only at the init. Keep ef 1 as `S.ef15d0` for the switch.
8. **`move011`:** after the timer check, the `0x20` switch (§2b) into a third handle `S.effect3` (`+0x162c`), stopping the
   others with flag 1. With no `S.slots` (no input.hitLife), name a refusal rather than guess the delay.
9. **`end011` / the ending:** stop and wait on `S.effect3` as well (§4b.5).
10. **`rockInputs`:** do not demand a target for a class whose flags take no aim arm (§4c).
