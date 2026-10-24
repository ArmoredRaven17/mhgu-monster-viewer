# Chameleos's invisibility: rom-map section + spec section 8 (the research read of 2026-10-18, scratch scratchpad\cham\).
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
ROWS = r"""### Chameleos -- the invisibility (research read for the effects lane, 2026-10-18; dev/em025_00-effects-spec.md 8; scratch `<scratchpad>\cham\`)

| address | what | class | st | detail |
|---|---|---|---|---|
| ctl = `[e+0xcac0]` | +0xc cloak requested; +0x13 2 full / 1 shimmer (horn broken: `vt+0x370(e, 2)` ? 1 : 2) / 0 on reappearing; +0x14 the clip family (1 stealth_start_S, 2 escape01); +0x15 the phase (`vt+0x210`, and `vt+0x208` 3 -> 4); +0x16 the latch kept across action changes; +0x17 also fade the model alpha; P+0x5cfc bit 0 cloaked / uncloaking | uEm025_00 | R | spec 8.1 |
| `0x17b5474` / `0x169d44c` | the clip NAMES (stealth, stealth_start_S, escape01, stealth_start, stealth_end, stealth_end_S x2, fade_out, fade_in, escape02) and their FRAMES (120, 30, 25, 15, 30, 30, 30, 0, 0, 47), by +0x14 / +0x14 + 4 / 3 / 9; looked up with findMatClipByName `0xb08b44` | uEm025_00 | R | |
| setters (all need +0xc 0 and P+0x5cfc bit 0 clear; each sends `0x4ef0ac(.., 0xd0)`) | (1, 0x11) / (1, 0x03) `0xe03b70` at L0 M16 f70 (+0x14 1, +0x17 1; (1, 0x11) latches +0x16); (1, 0x16) `0xe045b8` L3 M32 start (+0x13 1, shimmer); (2, 0x14) `0xe06a0c` L2 M30 f0 (+0x13 by the horn); demo (13, 0) `0xe0d308`; vt+0x3cc `0xe0def4` (instant, no caller found). (1, 0x11) / (2, 0x14) also need the area gate `0x5bfb8` / `0x5c1a8` on e+0x1054 (meaning NOT READ) | uEm025_00 | R / I (the gate) | |
| clears | vt+0x204 `0xdff4f0`: every action start without the latch (192 / 192 of status 0); with it status 10 / 11 / 13 (alpha 1 at once) and status 7 but n 0xe / 0xf / 0x11 / 0x12 / 0x15 / 0x17 / 0x1d / 0x26 / 0x27; ~20 action bodies after `0x4ef0ac(.., 0xcf)`; vt+0x228 `0xe02690` (from shared `0xb5eb4`). No timer (but the demo's P+0x1bc = 90) | uEm025_00 | R (emulated) | |
| `0xe00eb4` (vt+0x210) | the phase machine on materials cached by MRL id (+0x3c body id 2, +0x44 wing id 50, +0x40 light id 51): cloaking ph0 body / wing the +0x14 clip, light fade_out; ph1 (30 / 25 f) FULL -> hit zones 0..6 to the second meat block (`0xbaafc`), alpha 0 (`0xe01a38`), else stealth01 / stealth02 into material slots 1 / 3 (`0xe01500`) + stealth_start (15) / escape02; ph2 the stealth loop, alpha -> 0 over 30 if +0x17. Uncloaking: stealth materials + stealth_end (30), alpha -> 1 over 60 (`0xe01764`); restore (`0xe017b8`) + stealth_end_S; light fade_in; hit zones back (`0xbaacc`) | uEm025_00 | R | spec 8.2 |
| `0xbee74` / `0xbeed8` -> P+0x5dfc -> vt+0x354 `0x6c0f0` -> e+0x158 (`0xa5fc0`) | the model alpha: target x 255 over N frames; the model draw `0x892098` returns at e+0x158 == 0 (not drawn), and below 1.0 takes the vt+0x68 draw (INFERRED translucent) | shared enemy / model | R | |
| e+0x110 / e+0x11c | PartsDisp (one bit per mesh group, uBaseModel slot 27 `0x8925b8`): vt+0x208's copy of ctl+0xd..+0x12 is overwritten the same frame by vt+0x210's setVisibleGroup and `0x6f4e8` -- NO net effect (INFERRED from the order; no other reader in `0xa409c` / `0xa41b8` / `0xa4518`) | uEm025_00 | R (order) / I | |
| `0xe0df70` (vt+0x1c8) | 1 while +0xc, or P+0x5cfc bit 0 with +0x15 < 4 -> the eye set 9 (groups 1 and 6 off) | uEm025_00 | R | STATE_OVERLAY.em025_00 |
| `0xdff12c` (vt+0x12c, the PSL start gate) | refuses every PSL start while +0xc and +0x13 == 2 | uEm025_00 | R | schedule.js pslRefuse |
| viewer | the Invisible control (CLASS_CONTROLS.em025_00, working label): the stage machines (ROM_STAGE_CLIPS em025_00, `on: 'cloak'`, `hold`), the eyes (set 9), the model not drawn 30 frames after On (index.html stepCloak025), PSL starts refused; NOT SHOWN: the shimmer path's material-slot swap, the 60-frame alpha ramp back, the hit-zone meat switch, the area gate | viewer | built | elders check: 5 Invisible assertions |

"""
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a[:80])
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)
patch(V + r'\dev\rom-map.md', [("## 1b.", ROWS + "## 1b.")])
p = V + r'\dev\em025_00-effects-spec.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
SPEC = """

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
"""
open(p, 'w', encoding='utf8', newline='').write(s.rstrip() + SPEC.replace('\n', NL))
print('ok')
