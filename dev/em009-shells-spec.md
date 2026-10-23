# Gypceros (em009_00) -- his shells (shells agent, 2026-10-20)

Class `uEm009_00`: vtable `0x179c5d8`, action main `0xd5d424`, band `0xd52e04..0xd619c8`.
* Emulator check `dev/shells-gypceros-check.mjs` (tool `<scratchpad>/fb/mk009.py`): 23 / 23 (18 cases, 4 controls each failing, the
  contract). Page 5 / 5.
* `R` = the consuming instruction read.
* Code in `docs/render/shells.js`: the GYPCEROS block (`params009s00` .. `SHELL_DATA.em009_00`).
* **This is the first transcription of base44, base52 and base53** (section 3).

He registers six shell ids, all immediates (`0xd52f1c`):

| id | shell | base | vtable |
|---|---|---|---|
| 0x76 | sp_00 | base00 | `0x179da38` |
| 0x77 | sp_01 | base01 | `0x179dbb4` |
| 0x78 | sp_13 | base13 | `0x179dd24` |
| 0x79 | sp_44 | **base44** | `0x179dea0` |
| 0x7a | sp_52 | **base52** | `0x179dffc` |
| 0x7b | sp_53 | **base53** | `0x179e15c` |

## 1. What creates

### 1.1 Actions (census of his reach; trgen `g09cap.py`, and `g09sw.py`: every status x action x phase, also with the ctl clocks primed)

| action | clip at the maker | frame | shell, modes |
|---|---|---|---|
| (2, 0x0b) | L4 M4 (phase 0 a turn `0x7a284`; phase 1's end L4 M4 0x404) | phase 2: 48 / 74 | sp_00 10 / 11 |
| (7, 0x1b) / 0x25 / 0x33 / 0x3a | L4 M4 | 48 / 74 | sp_00 10 / 11 |
| (7, 0x19) / (7, 0x1a) | L4 M6 | 32 | sp_00 3 / 0 |
| (7, 0x17) | L4 M6 | 32 | sp_13 1 |
| (7, 0x46 / 0x4a), (7, 0x47 / 0x4b), (7, 0x48 / 0x4c) | L4 M6 | 31 | sp_00 12, 13, 14 |
| (7, 0x02) | L2 M21 (phase 2) | from 10, the clock | sp_01 1 (1.3) |

L4 M4 ships as `_start` (28) + `_loop`. Frames 48 / 74 are the `_loop`'s, so on the page they fire from the `_loop` pick (rom-map trap 120).

### 1.2 The frame handler `0xd5d508` (vt+0x208; R whole; per-frame census `pf_em009_00.txt`)

By the motion id, at a channel-1 crossing (`0xb09b0`), the handler makes shell01 0x77:
* setup `0x3fa2bc(0x40)`;
* +0x10 the block's +0x40;
* +0x30 the block's words +0x50..;
* +0x3c 0xffff.

There is no height test.

| motion | frame | mode |
|---|---|---|
| L1 M4 (0x104) | 2 | 4 |
| L1 M5 (0x105) | 46 | 3 |
| L1 M14 (0x10e) | 52 | 4 |
| L1 M17 (0x111) | 2 | 3 |
| L1 M19 / M102 (0x113 / 0x166) | 2 | 3 |
| L1 M103 (0x167) | 2 | 3 |
| L1 M105 (0x169) | 2 | 3 |
| L1 M106 (0x16a) | 2 | 3 |
| L1 M1 / M2 (0x101 / 0x102; `0xd5db30` / `0xd5dc04`) | the clock: `0x7264c(e, ctl+0, 1.0)` every update, >= 100.0 -> 0 | 2 |

* The rest of the handler is camera shakes and hit ids.
* **The clock ctl+0 is his own.** vt+0x1dc (`0xd536f4`, a part-break bit) does not touch it, so, unlike Kut-Ku's L1 M1, this site
  fires: one shell per 100 updates of L1 M1 / M2.
* The per-frame census missed L1 M1 / M2, because the clock was 0 (rom-map trap 125).

### 1.3 (7, 0x02) phase 2 (`0xd5a4cc`; R)

This is Kut-Ku's hover shape on Gypceros's clock:
* L2 M20 plays, then L2 M21 (0x215).
* From frame 10 (`0xb0968` mode 1), ctl+0 += dt; at >= 16.0 it resets to 0.
* The shell is sp_01 **mode 1** at (block x, his ground +0x5b4, block z), with **GOT-zero words** (not his).
* The clock is the same ctl+0 as L1 M1 / M2.
* The viewer's clock starts at 0 with the shell state, as the ROM's does at his spawn, and counts the updates where the clip advances
  (shells.js `perFrame009`).

## 2. His classes

### sp_00 (reader `0xd5f698`, R whole)

* Reader:
  - ef i -> +0x15c8 + 4i; hit 0.
  - int 0: the joint. int 1 -> 8, int 3 -> 0x80, int 4 -> 0x100, int 5 -> 0x200.
  - floats: 0 vz, 1 vy, 2 the flight, 3 X deg, 4 Y deg.
  - &vec 0: the offset. &vec 1: the gravity.
  - Bytes +0x1660 / +0x1661 / +0x1662 = int 2 / 6 / 7 != -1.
* Move `0xd6026c` is base00's, plus a ground marker (`0x43b2b0`, not visual).
* Modes 0..11 take joint -1 (his point). init00's joint -1 arm now takes the owner's size as the pair's product; it took `f(array)`
  before (NaN), and no checked shell had reached it.
* Landing `0xd5f8fc`:

| contact | ef | child |
|---|---|---|
| type 1 | 2 | +0x1660 -> **sp_44** (`0xd5fb48`); else +0x1661 -> **sp_52** (`0xd5fe50`, 1); else sp_01 0 at the contact |
| type 0 | 1 | +0x1661 -> sp_52 (`0xd5fe50`, 0); else sp_01 0 |
| type 2 | 3 | -- |

  After the table: `0x3f8970` and the end.
* **`0xd5fb48` (= `0xd60b54`, the same instructions): the puddle.**
  - The angle of the normal to up: `0xd5fbcc` clamps the cosine, then acos, then x 57.2958.
  - Below 10 degrees: forward = the shell's velocity / |v|. Otherwise forward = (n.x, 0, n.z).
  - Its words come from the frame `0x232530`(forward, n) and the Euler angles `0x7c3a38`.
  - mode = rank (`0x3a8430`) > 4 ? 1 : 0.
  - Setup `0x42203c`: +0x10 the contact, +0x20 the words, +0x2c the query record, +0x30 0xffff.
* **`0xd5fe50` (= `0xd60e5c`): sp_52.**
  - The angle is taken to the unit Y `0x19176f0` (rom-map 1451).
  - Below 5 degrees: the shell's own vy = 0, and forward = (vx, 0, vz) normalised. Otherwise (n.x, 0, n.z).
  - flag 1: the frame (forward, n), at the shell's +0x40.
  - flag 0 (a wall): the frame (n, unit Y), at +0x40 + dt x (-40 sin Y, 0, -40 cos Y).
  - mode 0; +0x30 = its +0x1588.

### sp_01 (reader `0xd60410`, R whole)

* ef 0; hit 0.
* +0x15ec flags: 4 from int 3, 8 from int 4, 1 from int 0, 0x80 from int 1, 0x1000 from int 5.
* int 2: the joint. &vec 0 -> +0x1608. No timer.
* Mode 0 draws u 1. Modes 1..4 draw c 30 / 31.

### sp_13 (reader `0xd60680`, R whole)

* Reader:
  - ef i -> +0x15c8 + 4i; hit 0.
  - int 0: the joint (-1).
  - Flags: 0x10 from int 2, 8 from int 3 (the size).
  - Floats: 0 speed, 1 per unit, 2 gravity, 4 far, 3 near, 5 life, 6 -> +0x167c.
  - &vec 0 -> both points. **&vec 1 -> +0x1624**: the thrown point's offset, (0, 0, 350). base13's init points +0x1624 at the setup's
    +0x20 before the reader (`0x404554`); init13t now takes a reader's point.
  - ints 4 / 5 -> +0x1680 / +0x1684 (the landing's choice).
* Init `0xd608a4`: base13's, then vy = min(vy, +0x167c = 35).
* Landing `0xd608fc`:

| contact | ef | child, chosen by |
|---|---|---|
| type 1 | 2 | +0x1680: -1 sp_01 0; 0 sp_44; 1 sp_52 (1) |
| type 0 | 1 | +0x1684, the same choices; sp_52 (0) |
| type 2 | 3 | -- |

  After the table: `0x4042bc` and the end.

## 3. The three new bases (R whole)

**What the three bases share.**
* ctor: `0x42207c` / `0x4294d4` / `0x42a0c4`.
* init: `0x4221f0` / `0x429648` / `0x42a248`.
  - `0x43a850`; the record setup +0x2c is copied to +0x1060.. (hit side); +0x1588 = setup +0x30.
  - The owner's resource bit; the handle array; the class's reader.
  - +0x40 = setup +0x10 + the reader's offset vec; the words are setup +0x20...
  - The hit side, then ef 0 at +0x40.
  - state 1.
* update: `0x422518` / `0x429a88` / `0x42a5c0`. It drops the handles whose unit has left states 1 / 2. State 1 runs the move.
  State 0xfe counts the wait down by dt; at 0 the shell is deleted, and it is deleted earlier once every handle is gone.
* end: `0x422834` / `0x429ce8` / `0x42a888`. If not already ending: stop ef 0 (`0x43b058`), the hit side, state 0xfe, and the wait =
  [`0x162493c`] x 60.

**base44 (sp_44, the puddle).**
* Reader `0xd613a4`:
  - ef 0; hit 0 -> +0x15cc.
  - floats 0 the slide +0x15d0, 1 its time +0x15d4, 2 the life +0x15d8.
  - &vec 0: the offset.
* Init: +0x44 += 20 (the anchor at that height); +0x15f0 = the slide; the life +0x15e0.
* Move `0x422640`:
  - The life counts down; at 0 the end.
  - When hit slot 0's delay +0x1404 <= 0: r = (time - its duration +0x1408) / time; when r > 0, +0x15ec = r x slide.
  - +0x40 = anchor + (0, 0, +0x15ec), turned X, Y, Z by the words. The literal 0.0 terms are kept.
  - Slot 0 off (+0x13ad) -> the end.

**base52 (sp_52).**
* Reader `0xd61560`: ef 0; hit 0; floats 0 the life, 1 the delay; &vec 0.
* Init: +0x44 += 20; a ground probe `0x183664` for the marker (not visual).
* Move `0x429b88`:
  - The life counts down.
  - While byte +0x15e4 is 0, the delay counts down. At 0 the byte is set and vt+0x154 runs: sp_52's `0xd615e4`, which for mode 0
    makes **sp_53** (setup `0x42a084(0x50)`):
    - +0x10 its +0x40;
    - +0x20 its words;
    - +0x30 its +0x1588;
    - +0x40.. a GOT zero vector.

**base53 (sp_53).**
* Reader `0xd617ec`:
  - ef 0; hit 0.
  - floats: 0 the life, 1 the vy (+0x1014), 2 the max drop, 3 its time (rate = max / time).
  - &vec 0.
* Move `0x42a6e4`:
  - The life counts down.
  - When the delay <= 0: +0x40 += dt x the velocity (`0x5391d4`), and the anchor = (x, y - min(clock x rate, max), z).
  - The clock +0x1378 += dt x dt (`0x539d48`) every update.
  - Slot 0 off -> the end.

**The hit slot these bases read.**
* The slot sits at +0x13a8: on +0x13ad, delay +0x1404, duration +0x1408 (`0x168a54` / `0x168d30` R).
* The viewer counts it with its own slot model (`slotsOf011` / `slotStep`; the order after every move is INFERRED).
* The check feeds the same model into the ROM run (emu_fb `slot0Timer` {id:mode: [delay, duration, pre]}). So the check confirms the
  bases' arithmetic on those slot values, not the hit manager's own order.

## 4. Not exercised by the check

* The wall (type 0) arms: sp_52 from a wall, and sp_13's +0x1684 = 1. They are transcribed from the read; the check's stage has no wall.
* base52's ground probe and every ground marker (`0x43b2b0`): not visual.
