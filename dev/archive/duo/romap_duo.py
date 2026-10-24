# romap_duo.py: add the Seltas duo rows to dev/rom-map.md (re-read the file first; patch in place, append-only).
import io, re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
assert 'the duo: every clip' not in s, 'already patched'

SECTION = r'''### Seltas Queen + Seltas -- the duo: every clip's class, her requests and his answers, his claws (Seltas duo agent, 2026-10-17; dev/em069-duo-spec.md)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xf8aae8` / `0xf8ab00` / `0xf8aaf4` / `0xf8aa90` (her vt+0x1dc `0xf8a978`) | her `P+0x1bb` bit 0 is a COPY of his every frame (tst his, set / clear hers); a dead partner (`vt+0x3f4` = 1) clears it | uEm069_00 | R + E | spec §2.1 |
| `0xfc4b94` / `0xfc516c` / `0xfd7dc8` / `0xfc48e0` | HE LINKS AT HIS ACTION START (his vt+0x204 `0xfc4728`): 1:0x1a (the grab combine; also 1:0x20, 3:0x33, 6:0x4) `0xfc4b94` + bit `0xfc4bbc`; 1:0x2 (the landing) `0xfc516c` + `0xfc5194`; 13:1 `0xfd7dc8`; bit set and no link -> relink, offset (0, 0, 80) `0xfc48e0` | uEm076_00 | E (hook run for every action) | spec §2.1 |
| `0xfc5054` / `0xfc521c` / `0xfd5950` / `0xfc5b40` | he UNLINKS at the start of 1:0x13 / 1:0x22 (`0xfc5054`, bit `0xfc5088`), 1:0x12 (`0xfc521c`); in 7:0x3f when she is in status 10, number != 0x69 (`0xfd58e4`); every frame when `[partner+0xc] & 7` is not 1..2 (`0xfc59c8` -> `0xfc5b40`) | uEm076_00 | R + E | spec §2.1 |
| `0xf89228` (her vt+0x204) -> `[+0xcac0]+0x18` | HER REQUEST to him, written at her action start: 2 (4,0) `0xf894b0`; 3 7:0x32/34/39/41 `0xf89924`; 4 7:0x0 unlinked `0xf89b08`; 5 (4,4) `0xf89824`; 6 7:0x37 `0xf89b48`; 7 1:0x1a `0xf8972c`, (10,8)/(10,0x25), all status 11 `0xf8975c` (linked); 8 7:0x3b `0xf89b68`; 9 7:0x3c `0xf89b88`; 0xa 7:0x14 unlinked `0xf89b28`; 0xb 7:0x3d/3e/40/42/43/44 `0xf898d0`; 0xc 1:0x21 `0xf89a98`; 0xd 1:0x26 `0xf89ab8`; 0xe 7:0x1a..0x2a `0xf8964c`; 0xf 7:0x47 `0xf89b98`; 0x10 7:0x4e `0xf89bec`; 0x11 7:0x50; 0x12 7:0x49; 0x64 (none) 1:0x20 | uEm069_00 | E | spec §2.2 (`hook204.py`) |
| `0xf8ae90` (table `0xf8aed8`, k - 2) | her wait: request k cleared when his action is the one k names (2 3:0x38, 3 3:0x3c, 4 3:3/3:5/3:0x20, 5 3:0x39, 6 3:0x3a, 7 1:0x13, 8 3:0x3b, 9 3:0x3e, 0xa 1:1/1:3/3:4/3:0x23, 0xb 3:0x3f/3:0x40, 0xc 3:0x41/1:0x1f, 0xd 3:0x36, 0xe 7:0x3b, 0xf 3:0/3:7/3:0x15/0x16/0x19/0x27/status 6, 0x10 7:0x3f, 0x11 7:0x40, 0x12 7:0x42) | uEm069_00 | R | spec §2.2 |
| em076_00_cmdtbl.emc g7 sk | HIS ANSWER = his event-group-7 stream with her request's number (g7 s2 = 3:0x38, s3 = 3:0x42 / 3:0x3c by selector 2, s5 = 3:0x39, s6 = 3:0x3a, s7 = 1:0x13, s8 = 3:0x3b, s9 = 3:0x3e, s11 = 3:0x3f, s12 = 3:0x41 + 1:0x1f, s13 = 3:0x36, s14 = 7:0x3b, s16 = 7:0x3f, s17 = 7:0x40, s18 = 7:0x42) -- the stream number and the wait table agree for every k | uEm076_00 | R (file) / I (op-level: event group 7 indexed by her request) | spec §2.2 |
| his answers (motion, blend, end) | 3:0x38 M6 b0 `0xfcfb88`; 3:0x39 M7 b0; 3:0x3a M16 `0xfcfd88`; 3:0x3b M14 `0xfcf6dc` -> M3 b20 `0xfcf63c` -> 3:0x35 M4 `0xfcf760`; 3:0x3c M9 b4 `0xfcfeac` -> M5 `0xfd0000`; 3:0x42 M5 b4 `0xfd05fc`; 3:0x3e M3 b40 `0xfcf6b8`; 3:0x3f M71 `0xfd017c` -> 3:0x40 M73 `0xfd0340`; 3:0x36 M48 `0xfcf8e0`; 7:0x3b M45 b10 `0xfd5850`; 1:0x13 M46 b4 -> M47 `0xfc8e84`; 1:0 (the ride) M35 b10 `0xfc7dd4`; each returns to 1:0 when she leaves the asking action | uEm076_00 | E | spec §2.2 / `s_answers.txt` |
| `0xfc4808` / `0xfc4810` (his vt+0x204) | THE CLAW STAGE `[+0xcac0]+0x38` AND STATE `+0x35` ARE ZEROED AT EVERY ACTION START | uEm076_00 | E (every action) + R | spec §5 |
| `0xfc5ec0..0xfc5f88` | claw machine: state 1 +1.0 a frame (`0x7264c`) to 12 then state 2; 2 holds 12.0; 3 -1.0 a frame (`0x7206c`) to 0 then state 0; 0 -> stage 0 | uEm076_00 | R | spec §5 |
| `0xfd4698` / `0xfd46bc`, `0xfd47ac` / `0xfd47d0` / `0xfd47f4` | claw grow / shrink frames of his riding attacks: 7:0x32 (L4 M31) 30.0 / 134.0 (literals `0xfd4708`), 7:0x33 (L4 M32) 22.0 / 190.0 and at its end; other writers only his solo L2 attacks (`0xfd180c..0xfd1a90`, `0xfd43dc..0xfd4478`) | uEm076_00 | R | spec §5; render/monster.js ROM_CLAW_SCHEDULE |
| `0xfc63d8..0xfc651c` | claw set by stage: < 4 set 4 (part 10), <= 8 set 9 (11), < 12 set 10 (12), else set 11 (103); wings `+0x49`: 0 set 1, 1 set 5, 2 set 6 (`0xfc6520`); glow group 8 iff bit 0 (`0xfc6468`) | uEm076_00 | R | spec §5 |
| `0xfc99fc` -> `0xb07b4(0.0)` | his 1:0x21 sets `P+0x398` = 0, multiplied into both motion layers' speed (`0xb0844` -> `0x5393d0`): the freeze under her M78 / M79 is the ROM's | uEm076_00 / shared | R | spec §4.3 |
| `0xfc9be4` / `0xfc9c88` / `0xfc9ce4` | his separation 1:0x22: M77 (`0xafef0`), on landing (`0xbf0bc`) L3 M11, at its end L3 M29, then vt+0x3dc | uEm076_00 | R | spec §2.2 (the board read L3 M11 alone) |
| `0xb03f8` / `0xb04d0` | two-layer setMotion: layer 0 r1, a second layer r2 (or r2 / r3 by the sign of s2) -- her 7:0x1a..0x2a: M83 + M82 / M84, M86 + M85 / M87 (`0xf94494`), M93 + M92, M95 + M94 (`0xf94850`) | shared | R | spec §6 |
| records `0x16a0cd4` / `0x16a0ee4` (table `0x17e1330` with `0x16a0d14` / `0x16a0f24`) / `0x16a0d94` / `0x16a0dd4` / his `0x16a16d4` | motion triples (centre / two turns, 0x10 each after a 0x10 header) set through `0x7a258` / `0x7a27c` / `0x7a284` / `0x7a2a8`: (2,0x18) L0 M36 / M10 / M11; (2,0)/(2,0x15) L0 M1 / M12 / M13; (4,1)/(4,2) L4 M23 / M18 / M19; 7:0x3e L4 M73 / M74 / M75; his 7:0x3f L4 M33 x3 (+ M35) | uEm069_00 / uEm076_00 | E (calls) / R (records) | spec §6 |
| `0xf8f3a8` | her 1:0x1e timer arm: L4 M29 when he never reached 1:0x1a -- solo | uEm069_00 | E | spec §2.3 |
| em069_00_cmdtbl.emc g0 s2 / g1 s52 / g1 s46 / g1 s81 | linked -> g0 s4 / s13, else s5 / s3; g1 s52 = 1:0x21 (the tail grab) then g1 s46 = if partner DEAD (selector 4) walk 2:0x15/0x16 and eat 1:0x1c (L0 M16); g1 s81 = 7:0x4d when selector 12 | uEm069_00 | R (file, walk) | spec §2.3 / §8 |
| her pose glbs, joint 200 | animated in exactly L4 M27, M28, M76, M77, M78, M79, M96 and L3 M12 / M18 (rotation); no other of her 158 clips | data | R (file) | spec §7 (`j200.py`; control: the board's list, L4 M47 constant) |
| her actions on the partner object | every call made with r0 = Seltas, all actions x phases x link x scenarios + her vt+0x204 / +0x1dc / +0x24 / +0x208 / +0x210 / +0x2a0 / +0x214: `0x6fe88` tests, `vt+0x3f4`, `0xfd931c`, `0xfd92e0` -- NO kill, damage or action change | uEm069_00 | E (control: `0xfd92e0` from 7:0x4e found) | spec §8 |
| `0xfd5e38` / `0xfd6c1c` (the tail-tip relink) | in his 7:0x40 / 7:0x42, answering her 7:0x50..0x52 / 7:0x49 (requests 0x11 / 0x12): 7:0x50 only from g1 s82 (called only from g0 s13's variant-1 block), 7:0x49 only from g1 s87 / s88 (unreached at variant 0) -- the board's correction holds | uEm076_00 | R (walk with op 0x92) | spec §7.1 (control: 7:0x4d from g0 s13's variant-0 part is reached) |
| enemy update order (her vs his frame) | slot order of `0x5cdf8` = spawn order: NOT READ for any quest; the hold frame (187 mod 61 = 4) does not depend on it | -- | NR | spec §4 |
| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` / `pairs` / `claws`, composeClip `blend`, index.html syncPartner / partnerClipOf / stepAttached claw set; check dev/checks/em069_00.mjs duo block 32 / 32 | viewer | R (transcribed) | spec §9 |

'''
anchor = '## 1b. The decode notes'
i = s.index(anchor)
s = s[:i] + SECTION + s[i:]

TOOLS = r'''| `<scratchpad>\duo\tracer.py` (+ `census.py`, `agg.py`, `ctx.py`, `hook204.py`, `table.py`) (Seltas duo agent, 2026-10-17) | one action phase of uEm069_00 / uEm076_00 under unicorn, recording EVERY setMotion (incl. two-layer `0xb03f8` / `0xb04d0`), script, change, partner test (answered by scenario), reads / writes of `P+0x1bb` / `e+0x7420` / `[+0xcac0]+0x18/+0x35/+0x38/+0x49` with the pc, and every call made on the partner; census = all actions x phase 0..7 x link x 4 scenarios; `ctx.py` propagates the EMC link tags along the recorded changes | reproduces the board's 1:0x21..0x24 / 1:0x1f..0x22 read (M76..M79, M35, M79, the speed-0 call) | stubs return 0: a branch behind an unmodelled helper (`0x78b78`) is not taken -- check static follows (`mov r1 / r2` before `0x768c8`) by hand |
| `<scratchpad>\duo\emclink.py` | a command table walked with the link bit (op 0x6f selector 0) as context, op 0x92 evaluated for variant 0, op 0x14 / 0x20 followed | without op 0x92 her 7:0x50 reads reachable; with it 7:0x4d stays, 7:0x50 goes | every other selector walked both ways (upper bound) |
| `<scratchpad>\duo\j200.py` | every clip of a pose glb whose given joint has animated tracks (quantised accessors decoded) | the board's joint-200 carriers come out; L4 M47 constant | span threshold 1e-4 |
'''
t_anchor = '| script | resolves | validated control | caveats |\n|---|---|---|---|\n'
j = s.index(t_anchor, s.index('## 2. Tooling')) + len(t_anchor)
s = s[:j] + TOOLS + s[j:]

# traps: append after the last numbered trap
last = max(int(m.group(1)) for m in re.finditer(r'^(\d+)\. \*\*', s, re.M))
TRAPS = '''%d. **An EMC walk that does not evaluate op 0x92 reaches variant-1 streams (2026-10-17).** Her g0 s13 calls g1 s82 (7:0x50) only inside `92 02` (variant != 0); a walk that takes every branch reads 7:0x50 -- and with it his tail-tip relink -- as live. Evaluate the variant switch before trusting a reach (`duo/emclink.py`).
%d. **A Seltas claw stage never survives an action change (2026-10-17).** His vt+0x204 zeroes `[+0xcac0]+0x38` / `+0x35` at every action start (`0xfc4808`); a claw read that ignores the hook will carry a grown claw into the ride. Under every clip of the Queen's he is at stage 0 (part 10).
%d. **Same motion number on both list 4s is a coincidence of naming, not a pairing (2026-10-17).** His clip under hers is her request (`[+0xcac0]+0x18`) answered by his event stream; the numbers agree for M4, M6, M7, M8, M9, M14, M16, M28, M73 and disagree for M10, M15, M17, M24, M25, M26, M46, M47, M72, M77..M79, M83..M95.
''' % (last + 1, last + 2, last + 3)
# insert after the line of the last trap
m = list(re.finditer(r'^%d\. \*\*.*$' % last, s, re.M))[-1]
s = s[:m.end()] + '\n' + TRAPS.rstrip('\n') + s[m.end():]

WD = r'''| ROM_PARTNER_BODY / index.html (2026-09-14, `a5d8b63` / `6ff7738`): his clip = her list-4 clip of the same name, else the same number; and monster.js "The paired combined motions share motion numbers on the two list 4s" | a viewer rule (Raven's test), never a read; it gave her M46 / M47 his own 31- / 25-frame clips, frozen | his clip is her request answered by his event stream (rows above, spec §2.2); same-number pairs are a naming coincidence (trap) |
| board duo section, THE METHOD step 3: "Queen 7:0x48..0x52 ... never run in MHGU" | 7:0x48 IS issued at variant 0 (g0 s2, g8 s0) | it requests L4 M101 / M119, past her LMT, and plays nothing; 7:0x49..0x52 are not issued at variant 0 (spec §7.1) |
| ROM_PARTNER_BODY.em069_00 `groups: [3, 8, 11]` (2026-09-14): the mounted Seltas shows part 103, the massive claw | Raven's choice for the combined look, not a ROM read | his claw stage is 0 under every clip of hers: set 4, part 10 (spec §5); part 103 only at stage 12 in his own riding attacks M31 / M32 |
'''
w_anchor = '| claim | why wrong | correction |\n|---|---|---|\n'
k = s.index(w_anchor, s.index('### Withdrawn')) + len(w_anchor)
s = s[:k] + WD + s[k:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched; traps', last + 1, '..', last + 3)
