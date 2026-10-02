# Duramboros (em055_00): states, breaks, the sever and the roll — read from the ROM

Effects agent, 2026-09-30. **There is no `E:\offline\decode\notes\states-em055_00.md`** — no decode agent ever
took Duramboros. This file is the note, written as his unit was wired. Status letters as in `dev/rom-map.md`:
**R** read (the instruction that consumes the value has been read, or the tool that produced it has a passing
control), **I** inferred, **U** not read.

Class `uEm055_00`, vtable `0x17c8768`, own code `0xed0a38..0xedec14`, frame handler (vtable `+0x208`)
`0xed2a1c`. Transcribed into `docs/render/motion-states.js` (`em055_00`) and `docs/render/tail-option.js`.

---------------------------------------------------------------------------------------------------------------------

## 1. The actions and their clips — R

Every row probed with `efx/agents/notice-scratch/probe.py` (action main = vtable `+0x1f4`, run under unicorn with
`E+0x73e0 = (status, number)`), and every script then resolved with `efx/agents/cephadrome-scratch/scr.py`. Both
tools carry passing controls: the script reader on Cephadrome's documented `0x17ab0f0`, the prober on
`uEm032_00`'s two independently documented notice clips.

| action | script | clip(s) | what |
|---|---|---|---|
| (10, 0x1b) | `0x17c90f0` | **L3 M1** | the tune+0x44 status (**INFERRED exhaust**), c 1109 once at frame 0 |
| (10, 7) | per part, below | — | the generic break reaction |
| (10, 0x14) | `0x17c9080` | **L2 M16** | the other break reaction — **only part 0 earns it** |
| (10, 0x1d) | `0x17c90c0` | L3 M10 | falls asleep |
| (10, 0x1e) | `0x17c90d0` | L3 M11 | the sleep hold (c 1102 zzz every 90) |
| (10, 0x1f) | `0x17c90a0` | L3 M12 | the paralysis hold (c 1101 every 60) |
| (10, 0x6e) | `0x17c92f0` | L3 M8 (wait 8) then **L3 M12** held | the shock trap, `P+0x568 = 60` (c 1105 every 42) |
| (10, 0x72) | `0x17c9070` | **L3 M20** | the sever |
| (10, 0x2a) / (10, 0x2b) | `0x17c90b0` | — | the recoveries |
| (0, 0) / (0, 1) / (0, 2) | — | L0 M1 / L0 M2 / **L0 M10** | the idles; (0, 2) is the tired one (c 1104 every 48) |
| (1, 2) | — | **L0 M11** | the rage entry |
| (11, 0) | `0x17c9200` | L3 M9 | death |
| (11, 7) | `0x17c9190` | L3 M17 | death in the pit |
| (11, 0x12) | `0x17c91a0` | L3 M17 | capture, the same clip |
| (11, 0x10) | `0x17c9218` | L3 M10 then L3 M11 | capture — **and those are the two SLEEP clips** |

**(11, 0x10)'s clips are NOT marked `dead`.** A `dead` arm on a clip that is usually sleep flips the monster
between dead and not-dead on successive plays of the one clip — `dead` clears rage, sets the part sets and settles
the material clock. That is the same trap the pit ailments are refused on (`dev/rom-map.md`, the PIT section).

### 1.1 (10, 7) by part — R

`P+0x5ccb` bits 3..5 carry the part; the class picks the script from it.

| part | script | clip |
|---|---|---|
| **0** | `0x17c9040` | **L3 M1** — the same clip as the exhaust |
| **1**, **2** | `0x17c9050` | **L3 M8** — the same clip as the shock trap |
| 3 | `0x17c9060` | L3 M2 |
| 4 | `0x17c91b0` | L3 M3, with `op 0xa` turn f80..140 angle `0x4000` (**+90 degrees**) |
| 5 | `0x17c91c8` | L3 M4, with `op 0xa` turn f80..140 angle `0xffffc000` (**-90 degrees**) |
| **6**, **7** | `0x17c9070` | **L3 M20** — the same clip as the sever |

**Independently confirmed.** `CLIP_TURNS.em055_00` in `motion-states.js` already held
`'3|Motion[3]': { deg: 90, from: 80, to: 140 }` and `'3|Motion[4]': { deg: -90, from: 80, to: 140 }`, read by
another lane from the same `op 0xa` records. Two readers, two paths, the same four numbers — which is what says
the prober is reading *this* class rather than returning something plausible.

**Three clips carry two meanings each**, so each is a `cycle` in the viewer and each play shows the next.

---------------------------------------------------------------------------------------------------------------------

## 2. The break records — R (the records), U (the sets)

`0xa442c(e, part, level)` asks vtable `+0x1d0` for **id = part x 5 + level + 6**, and his `+0x1d0` routes ids
below 1000 to the base u table `0x159c7fc`, whose `[i] = 1000 + (i - 7)` from i = 7 on.

| part | level | id | key | record |
|---|---|---|---|---|
| 0 | 1 | 7 | **u 1000** | `cm202_061`, **joint 4** |
| 2 | 1 | 17 | **u 1010** | `cm202_061`, **joint 0** |
| 7 | 1 | 42 | **u 1035** | `cm202_060`, **joint 143** |

**NOT READ: the `.dtp` rows and the `.mpm` set each level shows.** So no row in the viewer carries `levels` or
`sets` — the records fire on their reaction clips and nothing claims anything about the model.

---------------------------------------------------------------------------------------------------------------------

## 3. The sever — R, with one gap stated

The class calls `0xc2274` **twice**, both `(e, slot 0, 0, kind 0x90, 0)`:

* `0xed0b70` — unconditional in its own thunk
* `0xed2878` — gated on **`0x9d384(e, 7) >= 2`**, so **part 7 must already be at break level 2** before it severs.
  (Crystalbeard Uragaan's has the same shape; Uragaan's needs only level 1.)

**Kind `0x90` is his own number** — Basarios passes `0x8f`, Savage `0x8e`, Diablos `0x91`.

| record | file | joint | role |
|---|---|---|---|
| **u 900** | `cm202_062` | **143** (the Rath line's sever joint) | the cut |
| **u 905** | `cm202_001` | **-1** | the landing, placed at the ground point the option flies to |

`CUT_TAIL.em055_00` is written: `em055_00_tail.glb` is staged, and his `monsters.json` entry carries the **shared
`em001_00_option`** list, so the piece flies on Rathian's option poses exactly as Gravios's does.
**His `uEnemyOption` descriptor word is the one thing not read directly** — the three independent pieces (the
staged model, the option list, and u 900's joint) agree, and that is said rather than dressed up as a fourth.

---------------------------------------------------------------------------------------------------------------------

## 4. The roll — R

Found by sweeping his **whole** class band for branches into `0xa3000..0xa4fff`. There are exactly **two**: this
one, and vtable `+0x1d0`'s own tail at `0xede148`. So everything else he shows for a state comes from shared code,
and that is a read rather than an assumption.

`0xed6288`, in order:

    [e+0x1428]+0x1a1 == 1  ->  straight to the request;  != 0  ->  return
    e+0x1404 |= 0x100000
    0xbc7f4(e, 4)                     ; posture 4
    0xafe84(e, 6, blend 4.0, 0.0)     ; motion 6 = (list 0 << 8) | slot 6  ->  L0 Motion[6]
    0xb07b4(e, 3.0)                   ; motion rate 3x
    b 0xa499c   at 0xed6354, r1 = 2   ; id 2 -> base u table index 2 -> key 1400

**This is Uragaan's roll, function for function** (`uEm045_00` `0xe94118`). `u 1400` is `cm202_005`, **end 1**, so
it is HELD in `e+0xb7c4` until the next `0xa499c` stops it — the rolling trail, for as long as he rolls.

**So Duramboros's u 1400 is NOT the shared one-shot latch** the other 25 monsters close on (`dev/rom-map.md`, the
u 1400 section). Wired as `'0|Motion[6]': { hold: ['em055_00u', 1400] }`.

---------------------------------------------------------------------------------------------------------------------

## 5. The stun — R, and it is a refusal

**`(10, 0x20)` reaches no motion at all.** His action main runs to completion with no `setMotion` and no script,
on **every** part 0..7, where every other monster's stun reaches one. `(10, 0x21)` and `(10, 0x1a)` fall to the
default `0x76088`.

So **c 1103 stays undriven**, and the clip a stunned Duramboros holds is **NOT READ**. A `hold` row would be
invented.

---------------------------------------------------------------------------------------------------------------------

## 6. u 100, and the eight blocked records — R (where they go), blocked (recording them)

Three class request sites, all **id `0x3e9` = 1001** through vtable `+0x1d0` into the class table `{-1, 100}`, so
all three resolve **u key 100**. Each stops the old handle first and stores the new one, so **u 100 is HELD**.

| site | gate frame |
|---|---|
| `0xed3adc` | **270** |
| `0xed3c40` | **313** |
| `0xed3dd0` | **403** |

The frame handler's own motion table at **`0xed2aec`** (10 entries, motions `0x217..0x220`, and **the entries are
offsets, resolved rather than assumed**) gives three distinct arms:

| motion | arm | literal |
|---|---|---|
| **L2 M29** (`0x21d`) | `0xed2b14` | 270.0 |
| **L2 M31** (`0x21f`) | `0xed2b3c` | 313.0 |
| **L2 M32** (`0x220`) | `0xed2b44` | 403.0 |
| L3 M22 (`0x316`) | `0xed2b28` | 112.0 |

**Confirmed from the other side:** the PSL fires **c 72** at **f270 on L2 M29, f313 on L2 M31 and f403 on
L2 M32** — the same three motion/frame pairs, from a completely different file.

`class-effects.json` lists a fourth site `0xee23a4`; it is **outside** his code range `0xed0a38..0xedec14` and is
one of the 50 known out-of-range false positives (`dev/rom-map.md`, the `class-effects.json` row).

### The blocked set — EIGHT records, 37 PSL bindings

**u 100, u 310, u 311, c 60, c 62, c 63, c 72, c 212** — his whole ground-impact move set — are every one refused
by `add_effects.py`'s `stage_ray` (payload `+0x52` with `+0x5c` bit 4, the `0x18154c` query). **Duramboros is the
tree's worst stage-ray case by a wide margin.** They are the first to record if the recorder stub is approved.
