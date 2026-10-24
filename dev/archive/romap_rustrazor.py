import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:90], s.count(old))
    s = s.replace(old, new)

# ---- 1. the dispatch section: the two misnamed fields corrected in place (the old readings go to Withdrawn), the
#         query's prologue, the modes and the layer update added ----
rep("""| `[unit+0x4f4]` | current motion frame (float, 60ths) | R | em007-shells-spec §2a |
| `[unit+0x508]` | motion frame at the **start of this tick** | R | em007-shells-spec §2a |
""",
"""| `[unit+0x4f4]` | **corrected 2026-10-01 (Withdrawn: "the current frame")**: the frame queries' GATE — `0x72714` loads it first and, while it is > 0, modes 1 / 3 / 4 / 5 / 9 / 11 / 12 return 0 (`0x72824`), modes 2 / 6 / 7 / 8 / 10 take prev = cur = `+0x500` (`0x727b4`), and mode 0 takes a path of its own through `+0x1c` / `+0x4fc` / `+0x50c` (`0x727e4`, r2 = 0; r2 = 1 returns 0) — not read further; the frame the queries test is rebuilt from `+0x500` (below). Layer `+0x44` (`0x94dac4` copies `+0x40` into it): a blend-in timer is INFERRED | R (gate) / I (meaning) | `0x72738..0x72830` |
| `[unit+0x508]` | **corrected 2026-10-01 (Withdrawn: "the frame at the start of this tick")**: layer 0's **LOOP POINT**. The layer update wraps a frame that reached the length `+0x504` to it when length − `+0x508` > 0, else holds at the length (`0x94f374..0x94f424`); `0x72714` wraps its rebuilt frame onto it the same way, only when it is > 0 (`0x72898`) | R | Viewer agent; `0x94f38c`, `0x72898` |
| `0x72714` prologue (`0x72714..0x728cc`) | **READ in full (Viewer agent, 2026-10-01)**: r2 picks the channel — r2 = 0 (`0xb0968` / `0xb0974`): prev = `+0x500`, step `+0x13b8`; r2 = 1 (`0xb09a4` / `0xb09b0`): prev = `+0x13ac`, step `+0x13b4`. cur = prev + step (snapped to the integer within 0.0005); cur ≥ `+0x13bc` (the length): wrapped onto `+0x508` + the overshoot (lr = 1) when `+0x508` > 0, else cur = the length. r3 ≠ 0: `[r3]` = 1.0. Then the arm by r1 (13, table `0x728d0`: 0 `0x7294c`, 1 / 6 `0x72904`, 2 `0x72984`, 3 / 7 `0x7293c`, 4 `0x72990`, 5 `0x729b0`, 8 `0x729c8`, **9 `0x729fc`**, 10 `0x72a24`, 11 `0x72a48`, 12 `0x72a7c`) | R | `0x72714..0x728d0` |
| `0x72904` (mode 1) | **"the frame has reached s0"**: not wrapped → cur ≥ s0 (`0x72b04`); wrapped → prev + step ≥ s0, or cur ≥ s0 | R | Viewer agent 2026-10-01 |
| `0x729fc` (mode 9) | **"this step overlaps [s0, s1]"**, and with r3 the share of the step inside it: `[r3]` = (min(cur, s1) − max(prev, s0)) / (cur − prev), 0 when either is ≤ 0 (`0x72aac..0x72afc`) | R | Viewer agent 2026-10-01; the consumer is `0x76dd0` |
| `0x76dd0(e, angle, f0, f1)` | **the timed turn, READ**: `0xb0968(e, 9, &share, f0, f1)`; when it holds, the yaw word `P+0x54` += s32(step `+0x13b8` × share × angle / (f1 − f0)) — the angle LINEARLY over the motion frames f0..f1, each update's part truncated toward zero. 654 call sites (monster classes); the script turn op uses it too (next row) | R | `0x76dd0..0x76e4c`; render/motion-states.js CLIP_TURN |
| op **0x0a** — the script switch `0x9ef3c` arm 10 → `0x9f58c` | **the script turn, READ**: copies the op block's first frame / last frame / angle to `P+0x56c` / `+0x570` / `+0x574` (first < 0: the angle added to `P+0x54` at once, `0x9f5d0`); `0x9ffac` / `0xa07d4` then call `0x76dd0(e, +0x574, +0x56c, +0x570)` every update while `+0x570` > 0. So CLIP_TURN's linear spread is the ROM's. (Arm 0x26 `0x9f8dc`: the same block with the angle computed by its byte +8 — mode 2 = toward `[P+0x486]` − the yaw; not followed further) | R | Viewer agent 2026-10-01 |
| the motion LAYER update (loop `0x94ecf0..0x94fca0`; layers at `e+0x4b0` + n × 0x140, count `[e+0x4a4]`) | per layer: frame `+0x4fc` → `+0x500` (the previous), `+0x4fc` += the step (`+0x4bc` bit 0x10: frozen); the flags halfword `+0x4b6` loses bits 0 / 2..7 (`& 0xff02`, `0x94ef24`); bit 0 when the NEXT frame reaches the length `+0x504` (`0x94efa0`); **bit 2 — the ended flag `0xb09c8` / `0x94dc04` read — on the update whose frame reaches the length (`0x94f374`), then the wrap onto the loop point `+0x508` (length − loop > 0) or the hold at the length (`0x94f424`)**; hold mode (`+0x4bc` bit 4): clamped with bit 2 (`0x94f354`); playing backwards: bit 2 below frame 0 (`0x94f02c` / `0x94f338`). So **a looping motion "ends" once per pass** | R | Viewer agent 2026-10-01 |
""")
rep("""| `0x7294c` | **the `r1=0` arm**: returns 1 iff `[+0x508] <= s0 <= [+0x4f4]` — "the motion crossed frame `s0` during this tick", loop-aware. **`s1` is unused in this arm** | R | em007-shells-spec §2a |
""",
"""| `0x7294c` | **the `r1=0` arm** (names corrected 2026-10-01, see Withdrawn): not wrapped → prev < s0 ≤ cur (`0x72b1c`); wrapped → (loop point `+0x508` ≤ s0 ≤ cur) or prev < s0 — "the motion crossed frame `s0` during this tick", loop-aware. **`s1` is unused in this arm** | R | em007-shells-spec §2a; prologue above |
""")
# row 563's "+0x13ac (loop point)"
rep("""which rebuilds the current frame from `+0x500` (time), `+0x13ac` (loop point), `+0x13bc` (length) and `+0x1c` (delta)""",
    """which rebuilds the current frame from `+0x500` (time), `+0x13ac` (**not the loop point** — the r2 = 1 channel's base frame; the loop point is `+0x508`: corrected 2026-10-01, see Withdrawn), `+0x13bc` (length) and `+0x1c` (delta)""")

# ---- 2. the beams-on-their-monsters section: where Rustrazor's and Shogun's beams end, and the sweep ----
anchor = "| `0xde8908` / `0xde86c0` / `0xde9fc4` / `0xdeada8` / `0xde1f84` |"
rows = """| `0xdca604` — (7,0xc9) / (7,0xca) phase 5 | **Rustrazor's beam SWEEP and END, READ (Viewer agent, 2026-10-01)**: every update after the spawn, `0x76dd0(e, ∓27307, 2.0, 70.0)` — s32(0.5 + tune float 0x1c (150.0) × 182.044 `0xdca708`), uxth, negated (`rsbeq`) for r5 = 0 = (7,0xc9) / L9 M31; frames tune 0x1a / 0x1b — then `0xb0968(e, 1, 0, 70.0)` (mode 1) → **L2 M75 (0x24b)**, blend 0: his class keeps base02's +0x170 (no override), so the 2000-frame mode-0 beam ends there, the unit turned ∓150°. Phase 6: M75's end → vt+0x3dc. Nothing else plays L9 M31 / M33 (no other movw 0x91f / 0x921 in .text; no aligned word in .data / .rodata — control 0x914 found at `0x1794638` / `0x17eb234`) | R | dev/beams/em020_00.md §5; render/beam-spawns.js `leave`, render/motion-states.js CLIP_TURN |
| `0xdcb480` — (7,0xd4) phase 2 | at **L2 M74's end** (`0xb09c8`, the ended flag: its first pass, 26 + 80 = 106 frames) → L2 M75 → the mode-2 beam (2000 frames) ends. No turn in `0xdcb404` | R | dev/beams/em020_00.md §5 |
| `0xdcbe78` — (7,0xdf) / (7,0xe2) | ph0 `0x782e4(e, 2, 0x8000, 0, 0)`: `P+0x5e64` = 2, `+0x5e66` = the side (bit 15) of (the target's bearing from `P+0x1d0` / `+0x1d8` − `P+0x40` / `+0x48`) + 0x8000 − the yaw (`0x782e4..0x783f4`, READ); ph1 `0x7840c(e, 910, 0x8000 / 0x8000 + 910, 0, 50.0, 56.0, 150.0)` — 910 = s32(0.5 + tune 0x27 (30) / (tune 0x26 (56) − tune 0x25 (50)) × 182.044), +910 = tune 0x29 (5°) for (7,0xe2): the steer to his back on the hunter, **`0x7840c` → `0x77d28` NOT READ** (follows `P+0x1d0`, the hunter, which the viewer does not have). Mode 1 / 3 live 108 frames: they end by life at f158, the action at M20's end (`0xdcc00c`) | R / `0x77d28` unread | dev/beams/em020_00.md §5 |
| `0x75388` (uEm020 vt+0x3ec) → `0xdc61b0` | **Shogun's (7,0x32) end**: at M27's end → `0x75388`: posture 6 (keeping `P+0x992`), `0x76098(e, 0, 8, 2)` = action (0, 8); status 0's table (`0xdc6134`, `[e+0x73e1]` ≤ 8) entry 8 = `0xdc61b0`: phase 0 posture 6 + **setMotion L5 M1 (0x501)**, phase 1 at its end `0xdc5c40` → so his 2000-frame mode-4 beam ends at M27's end (+0x170) | R | dev/beams/em020_00.md §5; render/beam-spawns.js `leave` |
| `em020_00_actiontune` floats 0x18..0x2b | 0, 8, 2, 70, 150, 0, 10, 30, 60, 1, 48, 54, 0.125, 50, 56, 30, 50, 5, 0, 12 (same file in both arcs; control: em007_04's 27 / 16 / 116 / 137 / 124 = 116 / 160 / 154 / 24 / 10, row 228) | R | `beamsB/harness.py tune_of` (`shellef.fup`) |
"""
assert s.count(anchor) == 1
s = s.replace(anchor, rows + anchor)

# ---- 3. Withdrawn ----
wanchor = "| `uShellEm004_sp_00` is **base13** (from `dti.json` `parentDti`) |"
wrows = """| `[unit+0x4f4]` is the current motion frame and `[unit+0x508]` the frame at the tick's start; `0x7294c`'s `beq` means "the motion did not advance" (**em007-shells-spec §2a**, rows in the dispatch section) | the arm was read without `0x72714`'s prologue, which REBUILDS the registers: the frame is prev `+0x500` (or `+0x13ac`) + the step, `+0x4f4` is only its gate, `+0x508` only the wrap's target, and `beq` takes the not-wrapped test (`0x72b1c`), not a return 0 | `+0x4f4` = the queries' gate (> 0: modes 1 / 3 / 4 / 5 / 9 / 11 / 12 answer 0); `+0x508` = the loop point (`0x94f38c`, `0x72898`); the arm's result ("crossed s0 this tick, loop-aware") stands. Viewer agent 2026-10-01 |
| `+0x13ac` is the motion's loop point (**row `0xb0974` / `0xb0968`, uEm045 section**) | `0x72830` loads `+0x13ac` as the BASE FRAME when r2 = 1 (else `+0x500`) | the r2 = 1 channel's base frame (step `+0x13b4`); the loop point is `+0x508`. Viewer agent 2026-10-01 |
"""
assert s.count(wanchor) == 1
s = s.replace(wanchor, wrows + wanchor)

# ---- 4. a trap ----
s = s.rstrip('\n') + '\n' + """
43. **A query's arm names no field: read the PROLOGUE that feeds it (Viewer agent, 2026-10-01).** `0x72714`'s arms
   test s4 / s6 / s10, and read alone they look like `[+0x4f4]` / `[+0x508]` -- the prologue's first loads. They are
   not: the prologue rebuilds s4 / s6 as prev / cur from `+0x500` (or `+0x13ac`) and the step, keeps `+0x4f4` only as a
   gate and `+0x508` only as the wrap's target. em007-shells-spec §2a named the fields from the arm, and the map
   carried "the current frame" and "the frame at the tick's start" as READ; the result of the arm was right, the
   names were not. Before naming a field from a comparison, follow the register back to its LAST write.
"""
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
