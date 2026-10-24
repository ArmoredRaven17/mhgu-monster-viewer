p = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/rom-map.md'
s = open(p, encoding='utf8').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "### Withdrawn \u2014 kept so they are not rediscovered"
assert s.count(anchor) == 1
sec = (
"### Chameleos's invisibility levels, the horn and the tail (effects lane, 2026-10-22; Raven: \"a semi invisible state ... based on part breaks, horn and tail\")" + nl + nl +
"| address / thing | what | owner | status | detail |" + nl +
"|---|---|---|---|---|" + nl +
"| the three cloak setters (uEm025_00) -- READ | each writes ctl+0xc = 1, +0x14 = 1, +0x15 = 0, then: **0xe03c78** (behind the area gate 0x5c1a8: the (1, 0x11) path) +0x17 = 1, +0x13 = vt+0x370(e, 2) ? 1 : 2; **0xe06b04** +0x17 = 0, +0x13 = horn ? 1 : 2; **0xe0496c** ((1, 0x16), L3 M32's start, per spec 8.1) +0x17 = 0, **+0x13 = 1 always**. vt+0x370(e, 2) = P+0x3b4 bit 1 = the HORN (the part pass's set 4 for 3, 0xe0120c). No setter tests the tail | uEm025_00 | R | dev/em025_00-effects-spec.md 8 |" + nl +
"| vt+0x210 0xe00eb4's levels -- READ | +0x13 2, +0x17 0: alpha CUT to 0 at f30 (0xe01a38; the model not drawn); +0x13 2, +0x17 1: alpha RAMPED 1 -> 0 over 30 from f0 (0xe01a14 -> 0xbee74(e, 0.0, 30)) and the stealth materials at f30 (0xe01500); +0x13 1: the stealth materials (stealth01 / 02 in slots 1 / 3, stealth_start then the loop) at f30, alpha 1 -- **the semi-invisible look**. Phase 0 also switches the hit zones (0xbaafc, slots 0-6) | uEm025_00 | R | -- |" + nl +
"| `0xdffd1c` (vt+0x204, the tail sever (10, 0x72) arm) -- READ | after 0xc2274 (the sever): tail severed (vt+0x370(e, 1)) AND horn broken AND a cloak up (ctl+0xc) -> sound 0xcf (0x4ef0ac), ctl+0xc = 0, +0x15 = 0, +0x16 = 0: **the cloak ends**. The tail's only other cloak reader is the EMC condition vt+0x214 -> 0xe01e48 (0 not cloaked / area / dying; 2 tail intact; 1 tail severed with the horn intact (+ motion tests); 0 both broken): AI choice only | uEm025_00 | R | -- |" + nl +
"| THE INVISIBLE LEVELS -- built | CLASS_CONTROLS em025_00: Off / **On** (the horn's pick: intact full, broken semi) / **Semi-invisible** (the (1, 0x16) cloak) / **On (fading)** (the (1, 0x11) cloak); index.html stepCloak025 (+0x13 / +0x17 as above; the sever with the horn broken while cloaked ends it until the control is set again); hit zones on every cloak (ROM_MEAT_SWITCH ctl 1..3), the eyes overlay on any. Measured (<scratchpad>/chmeter.mjs, 15 / 45 / 90 frames): horn intact -- On: drawn, body / wing stealth_start_S + light fade_out, then at f30 the model not drawn (0/23 meshes); Semi: stealth materials from f30, drawn at its own opacity; fading: opacity ~0.06 at f15, not drawn after; horn broken -- On / Semi / fading all semi (stealth materials, drawn); tail severed alone changes nothing; horn broken and cloaked, then the tail severed: back to normal (no clips, no swap). Working labels | viewer | built | elders 403 |" + nl + nl)
s = s.replace(anchor, sec + anchor)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
