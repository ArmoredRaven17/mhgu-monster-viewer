# Tetsucabra (em066_00) / Drilltusk (em066_04) -- effects spec (Amphibians walk, 2026-10-18)

One class `uEm066_00` (vtable `0x17dc1ec`). States: `states-em066_00.md` (transcribed before). Scratch: `<archive>/zg/
jscheck066.py`, `allmot2.py`, `tracec.py`.

## 1. The PSL enable word -- vt+0x13c = `0xf63fc0` -- R, read whole and emulated

`0xf63fc0..0xf641f4` (142 instructions), transcribed in psl-mask.js `em066` (arms in its comment). Inputs: the boulder kind
`[[e+0xcac0]+0x30]` (`boulder`), part 0's break level (`0x9d36c(e, 0)`) against .dtp row 0's level (1) and row 1's (2) -- the
viewer's `tusksBroken` (set 5's group 6 drawn: the tusks at level 2), the variant, the rank (0x3a8430), 0x81d6c (sunk), the action.
Check (`jscheck066.py`: both variants x 14 motions x 6 actions x level 0..3 x kind 0..4 x rank x posture / depth x rage x tired,
the real .dtp rows): **80640 runs, 0 mismatches**; control (em065_00's base) 44544.

## 2. The plays -- R (tracer, both variants the same)

L4 M7 (7, 0x52 / 0xf0 / 0xf1 / 0xf4 / 0xf5 / 0xff), L4 M17 (7, 0x74 / 0x75 / 0xf2 / 0xf3 / 0xfe), L9 M13 (Drilltusk; (7, 0xec..0xef)):
by the rock carried -- ctl+0x30 is set at the dig's action start (states-em066_00.md: (1, 0x52) 1 / Drilltusk 2, (1, 0xff) 3) --
so copy A is the dig's own rock (kind 1 / 2), copy B kind 3. L4 M14 (7, 0xf7), L4 M15 (7, 0xf8). L0 M7: the surface turns (2, 1 /
0xf..0x1c / 0x50 / 0x52 / 0x58), (13, 1), and copy B the dive (6, 0x51) -- posture 4, 0xbf62c -> 0xbf700 (sunk) -- which alone
runs `0xf5d92c`'s u 1400 (tracer U1400 r1=2 on (6, 0x51) only). **The u 1400 hold was on every L0 M7 play: moved to copy B.**

## 3. u 50 / u 60 -- R

vt+0x208 `0xf59024`: every frame, with the carried rock's handle `e+0xcad4` live, a motion of a set (tables `0xf59090` /
`0xf59140`: L4 M7 below frame 35, L4 M8..M10, L4 M18 below 216, L4 M19..M32, L9 M1 below 115, L9 M2..M8) stops it and requests
id 1003 (u 50), or 1004 (u 60) when the stopped core's +0x1b4 -- its key -- is 12 (kind 3's rock on Drilltusk; [was: "Drilltusk's kind-2 rock" -- WITHDRAWN, section 5]); L4 M7 from f148, L4 M17
from f108, L9 M13 from f216 stop it with no request. **So Drilltusk's u 60 does have a requester** (the survey's "none" read the
note). Shown on the throw L4 M7 (A: u 50 / Drilltusk u 60; B: u 50) -- the rock is in hand there (I); the other set motions
need the carry state across clips (the viewer holds u 10 only on the pick-up clip L4 M11): named.

## 4. Implemented

psl-mask.js `em066` + EM066_ACTIONS; SHELL_PARTS tusksBroken; index.html `boulder` / `tusksBroken` inputs; CLIP_VARIANTS; the
throw's start rows; u 50 / u 60 (UNIQUE) exported, recorded, lifted. Check dev/checks/em066_00.mjs (both).
Check dev/checks/em066_00.mjs (both variants): **117 / 0**. Soaks: Tetsucabra **56 motions, 0 refused**; Drilltusk **70, 0 refused**.

## 5. The Boulder control -- R (2026-10-18)

Built: the coordinator asked for a Boulder control (none / kind 1 / 2 / 3) if it could drive u 10 and the u 50 / u 60
replacement on every motion of the set as the ROM does. It can; everything it needs was read:

- **The key.** vt+0x204 `0xf57f8c` requests the rock at an action start while `e+0xcad4` is 0 (sites `0xf580ac..0xf5810c`: (2,
  0x53..0x56), (2, 0xfd); `0xf585b8..0xf58618`: (1, 0x53), (1, 0xfb), (10, 0xfb)) as id **1002 when ctl+0x30 == 3, else 1001**
  (`0xf580f0`, `0xf59288`). vt+0x1d0 `0xf6420c`: id - 1000 through `[0x16a06dc]` = {-1, 10, 12, 50, 60}. So kinds 1 / 2 -> u 10,
  kind 3 -> u 12. Tetsucabra's `em066_00u` has no key 12: `0x326010`'s loop over the list's records (`+0x50` key) returns 0, so
  0x408bc returns no core and he holds nothing for kind 3 (READ).
- **The drop key.** `0xf59190` `ldr r7, [h, #0x1b4]`; 0x408bc stores the request's key there (`0x409a4`; proof.js transcribes it),
  so `+0x1b4 == 0xc` is "the rock is u 12": u 60 is **kind 3's** drop (Drilltusk), u 50 every other.
- **The motion set** (`0xf59024..0xf59204`, tables `0xf59090` / `0xf59140`, frame e+0x4fc against literals 216 / 115 / 35 / 108 /
  148 at `0xf593f4..0xf59404`): keep on L4 M11..M16, M33..M35, L9 M9..M12, M14, L4 M7 at 35..147, L4 M17 below 108, L4 M18 from
  35, L9 M1 from 115, L9 M13 below 216; stop with no request on L4 M7 from 148, L4 M17 from 108, L9 M13 from 216; stop and request
  on every other motion of every list (the `bhi` past both tables) and L4 M7 / M18 below 35, L9 M1 below 115.
- **The dig's rock.** `0xf59204..0xf5929c`: on L4 M18 at `0xb0974(e, 35.0)` and L9 M1 at `0xb0974(e, 115.0)` the old handle is
  stopped (`0x329c40(h, 1)`) and a new rock requested by ctl+0x30 -- set by the dig's action start: (1, 0x52) 1 (variant 4: 2), (1,
  0xff) 3 (states-em066_00.md 8.1), default 1 (vt+0x1d8).
- **The plays** (tracer): (1, 0x50) L4 M9, (1, 0x51) L4 M8, (1, 0x52) / (1, 0xff) L4 M18, (1, 0x53) L4 M11, (1, 0xfb) L9 M9, (2,
  0x53) L4 M12, (2, 0x54) turns via table `0x16a061c` {L4 M14 / M15}, (2, 0x55 / 0x56) L4 M16, (2, 0xfd) L9 M10. (10, 0xfb)
  reaches no setMotion in the tracer (a status-10 script): its clip is not named, so its own request is not shown.
- The variant-4 tail of vt+0x208 (`0xf592a0..0xf593ec`: L9 M2 / M8, L9 M1 under (7, 0xfc), L4 M7 under (7, 0xf0 / 0xf1 / 0xff), L4
  M18 under (7, 0xfe) / (1, 0xff) -> `0xc241c(e, 0, 1 / 5, 0)` at frames 166 / 134 / 96 / ...) ~~is a shell spawn: the shells agent's~~ [**WITHDRAWN 2026-10-18, shells agent: a camera request -- `0xc241c` -> `0x49da0` / `0x49df0` -> `0x19148` -> uFestaCamera `0x1ce9c`; rom-map Withdrawn table**].

Implemented: motion-states.js `BOULDER` (boulder066) and `MotionStates.stepRock` (the rock in hand as each play starts = the
control; the play's action may set ctl+0x30 and request; per-frame keep / stop / drop; the dig's new rock at its frame) --
holds go through `holds()`, the drop through `fire`. index.html: the Boulder row (Tetsucabra None / 1 / 3 -- ctl+0x30 = 2 is
written on variant 4 alone; Drilltusk None / 1 / 2 / 3), `boulder` / `action` into `step()`, and the word's `boulder` from the
control when set. CLIP_ACTIONS / CLIP_VARIANTS for L4 M18 (A (1, 0x52), B (1, 0xff)) and L4 M14 / M15 (B the carry turn (2, 0x54)),
and the carry plays. Removed the static rows it replaces: u 10 held on L4 M11, Drilltusk's u 12 held on L4 M18 (wrong kind and
wrong span), u 50 / u 60 at L4 M7's start (Drilltusk's A / B inverted).

**WITHDRAWN** (kept, rom-map WITHDRAWN table): "Drilltusk's ctl+0x30 = 2 on (1, 0x52) takes key 12" (motion-states.js comment,
dev/checks/em066_00.mjs header and this spec section 3): the request takes key 12 only for ctl+0x30 == 3.
Check dev/checks/em066_00.mjs (both, with the Boulder tests): **128 / 0**. Soaks: Tetsucabra **56, 0 refused**; Drilltusk **70, 0**.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **ctl+0x30 -- READ**: the action start of the pick-up / dig family writes it -- 1 (Tetsucabra) or 2 (Drilltusk) for (1, 0x52),
  (7, 0x52 / 0x75 / 0xf4 / 0xf5 / 0xfd), 3 for (1, 0xff), (7, 0xf0 / 0xf1 / 0xfc / 0xfe / 0xff) -- and sets P+0x1bb bit 0 with it.
  The I is R. P+0x1bb bit 0 is the carry flag a "Carrying" control would stand for (category c, listed).
* **(10, 0xfb) -- READ**: no status-10 case; it falls straight to vt+0x3dc. No clip, nothing to show.
* **Carrying -- already built** as the Boulder control (BOULDER, 2026-10-18: the rock in hand as each play starts, ctl+0x30 with it).
  The open-items row 62 was stale; nothing added.
