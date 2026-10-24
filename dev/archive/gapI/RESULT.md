# gapI: Teostra (em027_00) row (4, 0x06), L1 M7 f70, sp_01 4 (record em027_00c 30)

Verdict: **ROM NEVER DRAWS.** The game's L1 M7 is 61 frames long, the same as the viewer's clip. It holds at its last
frame, and the action leaves that motion on the update that ends it. So the f70 frame test can never pass in the game.
This is not a clip-length bug. It is the same shape as the Gore line's L1 M13 f90 / L2 M37 f114 precedent
(dev/gore-line-shells-spec.md 1.1, "Frame tests past the clip's end").

## (a) READ facts

### The action body: `0xe16edc(e, arg)` (uEm027_00), read whole `0xe16edc..0xe170a4`

The phase is `[e+0x1428]+0x1a1`.

- **Phase 0** (`0xe16f0c`):
  - The phase is set to 1.
  - `0xbc7f4(e, 3)` sets posture 3.
  - It calls `0xafe84(e, 0x107)`: **L1 M7**, with blend s0 = 4.0 and start frame s1 = 0.0 (the literal at `0xe170ac` is 0x00000000).
- **Phase 1** (`0xe16f5c`):
  - It calls `0xb0974(e, 70.0)`. The literal at `0xe170b0` is `0x428c0000`, which is **70.0**.
  - When that test passes, it creates the shell: `0x49c4a8(0x40)` setup, id **0xb9** (sp_01), mode **4**, owner e, point `e+0x40..0x48`, words `e+0xfe8..0xff0`, +0x3c 0xffff, +0x3e 0, then `0x48b884`.
  - Next, **`0xb09c8` (motion ended) at `0xe17040`**. When it reports the end, the phase becomes 2, `0xbc7f4(e, 0)` sets posture 0, and `0xafe84(e, 0x10f)` starts **L1 M15** (blend 0.0, start 0.0).
  - The f70 test is in phase 1 only. No other phase tests a frame of L1 M7.
- **Phase 2** (`0xe16f38`):
  - With arg 0, it waits for L1 M15's end (`0xb09c8`), then calls vt+0x3dc.
  - With arg != 0, it waits for `0xb0968(e, 1, 0, 84.0, 0.0)` on L1 M15 (the literal at `0xe170a8` is 84.0; mode 1 means f >= 84), then calls vt+0x3dc.
- **Who calls it:** the status-4 table at `0xe170c4` switches on `e+0x73e1`, with offsets from `0xe170f4`. Its only branch into `0xe16edc` is at `0xe17274` (xref over `0xe10000..0xe1c000`):
  - **(4, 0x06)**: entry 6, offset 0xf4, goes to `0xe171e8`, which calls `0xe16edc(e, 0)`.
  - **(4, 0x0a)**: entry 0xa, offset 0x16c, goes to `0xe17260`, which calls `0xe16edc(e, 1)`.
  - Both actions play the same L1 M7 with the same f70 test. (4, 0x0a) is "not reached" in elder-dragon-shells-spec.md 6.
- **What follows L1 M7:** L1 M15 only. There is no loop and no replay of M7.

### The motion's length in the game

- **Teostra's L1 is Kushala's file.**
  - em027_00.arc ships exactly one list-1 motion file, `enemy\em024\em024_00\mot\em024_00_1.lmt`. It is md5-identical to em024_00.arc's copy (4b4bff19...).
  - So L1 M7 = em024_00_1.lmt block 7.
  - INFERRED: the code path by which the engine resolves list 1 to that path was not traced. The arc holds no other list-1 LMT, so there is nothing else it could load.
- **The LMT entry:** `build/frag/motion-audit/lmt.py` on that file gives **anim 7 = numFrames 61, loopFrame -1** (hold). Anim 15 (L1 M15) = 135 frames, loopFrame -1.
- **How the length gets set:**
  - Inside setMotion, `0xafce8` calls `0x7256c` (`0xafde8`). That calls `0x53943c` (the layer set through vt+0xc4).
  - Then **`e+0x13bc = e+0x504`** (`0x725f8..0x725fc`), and `e+0x13ac = s1`, the start frame.
  - `e+0x504` = numFrames - 1 = **60**, and loop -1 means hold. This is the duo agent's READ of `0x951810` (rom-map "`0x951810` (layer length)"). Here I read the copy into +0x13bc.
- **The frame test:** `0xb0974` calls `0x72714` mode 0 (read again here, `0x72714..0x7298c`).
  - cur = prev `+0x500` + step `+0x13b8`. When cur >= `+0x13bc`: it wraps only if the loop point `+0x508` > 0 (`0x72898`). Otherwise **cur = +0x13bc = 60** (`0x72874` / `0x728a0`).
  - The mode-0 compare `0x72b1c` passes when prev < 70 <= cur (rom-map `0x72714` mode 0 row).
  - With cur <= 60 it cannot pass.
  - The gated path (`+0x4f4` > 0, `0x727e4`) uses the layer frame `+0x4fc` plus less than one step, which is still about 60.
  - The rate (`P+0x38c * P+0x394` into `0x7256c`) changes the step size, not the length.
- **The layer:** the layer update raises the ended bit 2 on the update whose frame reaches the length, then holds there (`0x94f374` / `0x94f424`; rom-map motion-layer row). Phase 1 tests f70 first (it fails at 60) and then sees `0xb09c8`. The next update is phase 2, on L1 M15.

### What the viewer exports

- docs/monsters.json lists em027_00 as `{id: '1', stem: 'em024_00_1', shared: true}`, with `Motion[7]` dur 1.017.
- docs/poses/monsters/em024_00_1.glb Motion[7]: its samplers run from 0.0 to 1.0166664 s, which is **61.0 frames** (`fb/cliplen.py em024_00 1 7`).
- That is numFrames frames. The game's layer length is numFrames - 1 = 60, so the viewer's clip is one frame LONGER than the game's motion, not shorter. M15 shows the same: 135.0 against numFrames 135.
- This is not the board's "Trailing holds are dropped" bug: the clip is not truncated.
- The one-frame difference is a separate observation. It does not change this record, and I did not investigate it.

### Why the check passes

- dev/shells-teostra-check.mjs case `a06` uses `len: 120` and the step `{ phase: 1, win: 1, frame: 70.0 }`. emu_fb answers the frame test with `win` (trap 108), so the module spawns at f70 on a clip lengthened to 120.
- That shows the shell module draws when made. It does not show that the game reaches f70.

## (b) Verdict and fix

**ROM NEVER DRAWS** c 30 through (4, 0x06) (and (4, 0x0a)).

The f70 test sits on a 60-frame held motion, and the action leaves for L1 M15 when that motion ends. Two readings are ruled out:

- **Not a clip-length bug:** the viewer's clip agrees with the LMT.
- **Not reachable through a following motion:** the test lives only in phase 1, on L1 M7.

Keep the row transcribed as the ROM writes it, as the Gore line's rows were kept. It does not pass on the page, and it should not.

Optional comment for docs/render/shells.js above `act027(4, 0x06, ...)` (about line 19101). Patch it in place, or leave it to the owner:

```js
    // (4, 0x06) / (4, 0x0a) 0xe16edc: phase 1 tests L1 M7 f70 (0xb0974, literal 0xe170b0) but L1 M7 is
    // em024_00_1.lmt anim 7, 61 frames, hold: length 60 (0x725fc +0x13bc = +0x504), so 0x72714 never passes 70 and
    // 0xb09c8 hands to L1 M15 at the end -- the game never makes this shell either (as the Gore line's L1 M13 f90).
```

- dev/shells-draw-table.md line 542 (c 30): change it from `UNREAD` to `ROM NEVER DRAWS`, with the reason: "0xe16edc phase 1 f70 on L1 M7, length 60 held (em024_00_1.lmt anim 7 numFrames 61, loop -1; 0x725fc, 0x72714 clamp), end -> L1 M15".
- The draw table's summary counts move: "1 unread" becomes 0, and "37 the ROM never draws" becomes 38.
- The check's `a06` case may stay as a module control. It should not be cited as evidence that the record fires.

## (c) rom-map rows (for the owner to add)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xe16edc(e, arg)` | (4, 0x06) arg 0 / (4, 0x0a) arg 1 (status-4 table `0xe170c4` on e+0x73e1, entries 6 / 0xa -> `0xe171e8` / `0xe17260`): phase 0 posture 3, L1 M7 (0x107, blend 4.0); phase 1 `0xb0974(e, 70.0)` -> sp_01 0xb9 mode 4 at e+0x40, words e+0xfe8; `0xb09c8` -> posture 0, L1 M15 (0x10f); phase 2 arg 0: M15's end, arg 1: `0xb0968` mode 1 f84 -> vt+0x3dc | uEm027_00 | R | gapI/RESULT.md; elder spec 6 |
| em027_00 L1 M7 f70 (c 30) | **NEVER FIRES in the game**: L1 = em024_00_1.lmt (the arc's only list-1 LMT, identical to Kushala's), anim 7 numFrames 61 loop -1 -> layer length 60 held; 0x72714 clamps cur to +0x13bc = 60 (no wrap without a loop point), so f70 cannot pass, and the end hands to L1 M15. The viewer's clip (61 frames) agrees: NOT the trailing-hold bug | uEm027_00 | R | dev/shells-draw-table.md c 30 (was UNREAD) |
| `0x7256c` (from setMotion `0xafce8` at `0xafde8`) | after the layer set `0x53943c` and the word vt+0x13c: e+0x13ac = s1 (the start frame), e+0x13b4 / +0x13b8 = 0, **e+0x13bc = e+0x504 (the layer length, numFrames - 1)**, e+0x13c0 = flags. So 0x72714's channel-0 clamp is the motion's own length | shared | R | `0x725d8..0x72610` |
| `0xafce8` args | s0 = blend (negative: flag 2, abs), s1 = start frame -> 0x7256c s1; rate = P+0x38c x P+0x394 (x a factor from 0x70fbc +0x2c when P+0x5cdc == 2 and the action is not in mask 0x2c00) | shared | R | `0xafcf8..0xafde8` |

Tools: `gapI/dw.py` (word-by-word disassembly), `gapI/xref.py` (B/BL into an address), `gapI/imm13bc.py` (uses of an immediate).
Control for xref: it found `0xe17274`, the known branch.
