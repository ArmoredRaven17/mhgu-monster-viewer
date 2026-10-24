# patch dev/rom-map.md with the Zamtrios forms rows (re-reads the file first; other agents edit it)
import io, os, re, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
nl = '\r\n' if '\r\n' in s else '\n'
L = s.split(nl)
if any('em067-forms-spec.md' in x for x in L):
    sys.exit('already patched')
SP = 'dev/em067-forms-spec.md'

section = [
'### Zamtrios (em067_00) -- the forms: the part pass per form, every clip\'s form, the floor (research agent for the Viewer agent, 2026-10-17; dev/em067-forms-spec.md)',
'',
'| addr | what | class | st | detail |',
'|---|---|---|---|---|',
'| `0xf76d6c..0xf77168` (vt+0x210 part half) | re-read whole: `P+0x5cfc` bit 0 -> sets 16 + 17, else bit 7 -> 31 + 17, else 0 + 10; no-ice branch (bit 1 clear) tail 2/22, head 3/18, arms 4/19 + 5/20, fin 6/21 by break level, then 7 / 8 / 9; ice branch tail 14/28 + head 15/23 by the SHATTER bits ctl+4 (not the break level), arms 4/25 + 5/27, fin 32/21, body 11/29, arm ice 12/24 + 13/26. **Form 2 draws 0, 8, 10, 100, 101 (set 16): group 9 (hind legs, joints 15..21) and 109 OFF; the front legs 13/14, 15/16 ON** | uEm067_00 | R | ' + SP + ' §1 |',
'| `0xf76088` motion switch (tables `0xf761a0` motions 0x20d..0x217, `0xf7622c` 0x450..0x464) | bit 7 (set 31) on L2 M14..M17 / M19 / M22 whole clip, L2 M13 mode 9 (78, 146), L2 M18 mode 2 (80), L2 M23 mode 2 (38), L0 M16 mode 1 (10), L0 M17 mode 2 (10), L4 M3 mode 2 (374); L4 M2 mode 1 (120) bit 0 else bit 0 CLEARED, mode 2 (130) `applyIceArmour`; L4 M30 mode 3 (146, 220) bit 4 in form 1 only; L3 M103 in (11, 0) mode 2 (346) bit 0 | uEm067_00 | R / E | ' + SP + ' §2.3 |',
'| `0xf76490` / `0xf764f0..0xf7654c` | the tail: `0xc8280(e, 2)` in form 2, else by `P+0x1ba` (0 -> 0, 4 -> 1 / 3 by `P+0x1bb` bits 2 / 3) = the hunter hit-data row (`e+0x75c2`), not a height | uEm067_00 | R | states-em017_00.md 7.2 (0xc8280) |',
'| action main `0xf75e20`, statuses 0..9 | form-independent: the same motions in forms 0 / 1 / 2 at every phase (stubs 0 and 1); form 2 only changes the idle chooser (-> (1, 5)) and the remap | uEm067_00 | E | ' + SP + ' §2.1 (`zphase.py`) |',
'| `em067_00_cmdtbl.emc` | form-2 streams g0 s20 / s21 / s28 / s29 (from g0 s2 `6f 00 00 \\| 6f 01 05`), calling g1 0x05, 0x78..0x89; form-2-only actions (1, 4), (2, 4 / 5 / 7), (7, 0xa / 0xb / 0x18 / 0x41 / 0x42 / 0x43 / 0x45); form-1-only (7, 8 / 9 / 0x1f / 0x20 / 0x23) | uEm067_00 | R (walk) / I (op 0x6f case semantics) | ' + SP + ' §2.4 (`emcform.py`) |',
'| turn tables `0x16a09bc` / `0x16a0a7c` / `0x16a0b7c` (pair `0x17ddbcc`, `0x7a284`) / `0x16a0a3c` / `0x16a08bc` / `0x16a08fc` / `0x16a093c` / `0x16a097c` / `0x16a087c` / `0x16a0abc` / `0x16a0afc` | (2, 5) blob turn {L4 M9; L4 M7 / M8}; L0 M13 / M11 / M12; L0 M32 / M33; L0 M34; L4 M64 / M65 / M72 / M73 / M76; L4 M31..M33 (posture 4) | uEm067_00 | R | ' + SP + ' §2.1 |',
'| posture writes `0xf668bc` / `0xf66d18` / `0xf66e20` / `0xf66ee4` | whole-byte stores of `P+0x1bb` (0 / 2 / 0 / 1): a form change clears the submerged / swim bits 2..6 (set by status 6, (1, 0xa / 0x33 / 0x1d..0x27), (0, 7), (7, 0x47), (8, 0) -- `zpost.py`) | uEm067_00 | R / E | ' + SP + ' §2.1 |',
'| shared posture per action | `0xbc7f4(e, 0)` in every blob / ground action, `(e, 4)` in the dig, `(e, 1)` only (6, 0x11); no `P+0x92c` store in the class (control: Seregios `0xfe31b0` found); `0xbf700` only per-reset (0.0, `0xf65e54`) and the dig (0.0 at `0xf6c240` / `0xf6c8c4` / `0xf6e128`, computed at `0xf6d0a0` / `0xf6d364` / `0xf6d628` / `0xf6de08`: NR) | uEm067_00 | E / R | ' + SP + ' §4.1 |',
'| em067_00 pose glbs | `reference` translation y = 0 on all 125 clips; the fat body\'s joints 154..159 park ~200 x 1.3 below the hips in the normal clips, the hind legs\' bones below the balloon in the blob clips | data | R (file) | ' + SP + ' §4 |',
'| VIEWER (not changed) | part-review Blob rung must be `0,8,10,100,101` (set 16), not set 31; MOTION_STATES rows per clip form (B / A / NA windows); Grid Floor 300..480 too low (bone bounds) -> `FLOOR_AT_ORIGIN.add(\'em067_00\')` | viewer | R (ROM) / measured | ' + SP + ' §1, §3, §4 |',
]

tool_rows = [
'| `<scratchpad>\\z67\\fq.py` (research agent, 2026-10-17) | the frame query `0xb0968` -> `0x72714` natively (ARM_MAX, fake unit `+0x500` / `+0x13b8` / `+0x13bc`), every mode x frame | mode 1 (120) = f >= 120, mode 9 (78, 146) as the rom-map rows read them; **mode 2 = f < s0, mode 3 = s0 <= f <= s1** | `+0x4f4` = 0 (the gate not exercised); no wrap (loop point 0) |',
'| `<scratchpad>\\z67\\zphase.py` / `zturn.py` / `zheight.py` `<statuses>` | Zamtrios\'s action main at phase 0..9 x form 0..2 x stub-return 0 / 1: every setMotion / script / changeAction / turn call / posture & height call an action reaches | first motions equal zactprobe.py\'s; (2, 5) -> table `0x16a09bc` agrees with turntabs.py | an over-approximation (both stub answers); class code only (0xf65ba4..0xf78400); (7, 0x18) faults at `0xf6f2a8` |',
'| `<scratchpad>\\z67\\emcform.py` / `emcpathH.py` | the .emc walked with the form set as context (sel 0 / 4 / 6..9; op 0x20 / 0x14 followed); `emcpathH` also takes form 2 never submerged | (1, 0x42) form 0 only and (1, 0x10) forms 0 / 1 = the note\'s g6 read | op 0x6f case / default exclusive (I); event groups have no form switch, so their actions read "all forms" |',
'| `<scratchpad>\\z67\\meshfloor067.mjs` / `permesh067.mjs` (run with run-check.mjs) | per clip the drawn mesh\'s lowest vertex vs the clip origin at Form rung 0 / 2, per mesh group; the Grid Floor as monsterFloorY | rockInput floorY (`floorri067.mjs`) = the replicated rule (-367.3 on L0 M1) | set the rung BEFORE the clip (the Blob rung\'s `views` jumps the clip) |',
]

withdrawn_rows = [
'| states-em067_00.md 0 / 5.3 (**Zamtrios decode agent, 2026-09-25**): L4 M2 "from frame 130 `applyIceArmour` re-runs, so the ice is held over the balloon for the rest of that clip"; "from frame 120 the fat set swaps in" (the frames before unstated) | `0xb0968(e, 2, 130)` is mode 2 = frame < s0 (`0x72984`, ROM-run `fq.py`); the 120 arm clears bit 0 below 120 | ice f0..129, gone from f130; the normal body f0..119, the balloon from f120 (' + SP + ' §2.2) |',
'| states-em067_00.md 5.3: "every window in this class is (N, 0) ... s1 = 0 reads as no end"; the r1 called "slot" | r1 is the QUERY MODE (`0x728d0`): the class uses modes 1 / 2 / 3 / 9 | L2 M13 mode 9 (78, 146), L4 M30 mode 3 (146, 220), L2 M18 / M23 / L0 M17 / L4 M3 mode 2 (before N), L0 M16 / L4 M2 mode 1 (' + SP + ' §2.3) |',
'| states-em067_00.md 5.3 row "L4 M3 (0x403), L4 M30 (0x41e) \\| slot 3, a window \\| bit 4" and "L4 M3 / L4 M100 \\| slot 2, from frame 374" | `0xf763cc`: 0x403 -> `0xf76430` (bit 7 + capsule, mode 2 = BEFORE 374); bit 4 only on 0x41e in form 1 | L4 M3: set 31 f < 374; L4 M30 form 1: set 29 f146..220 |',
'| docs/part-review.json em067_00 Blob rung = `0,8,9,10,100,101,109` ("Blob uses the Legs option", 2026-09-12, Raven\'s call on how L4 M2 looked) | that is set 31, which the part pass draws only when bit 0 is clear (forms 0 / 1 on the 2.3 clips); form 2 draws set 16 every frame; L4 M2 f < 120 is the NORMAL body | Blob rung `0,8,10,100,101` + an L4 M2 MOTION_STATES row (' + SP + ' §1, §3) |',
]

trap = '71. **A frame query\'s r1 is its MODE, and mode 2 means BEFORE (2026-10-17).** `0xb0968(e, m, r2, s0, s1)`: mode 1 = from s0, **2 = below s0**, 3 = s0..s1, 9 = the step overlaps [s0, s1], 0 = crossed s0 this tick. Zamtrios\'s note read every `(N, 0)` as "from N" and put the ice on L4 M2 the wrong side of f130. Read the mode before the frame. And: **a body\'s lowest BONE is not its floor** -- Zamtrios\'s parked fat-body bones (joints 154..159) sit ~2.5 m under his feet on every normal clip; the viewer\'s lowest-reach floor followed them (' + SP + ' §4).'

def find(pred, start=0):
    for i in range(start, len(L)):
        if pred(L[i]): return i
    return -1
# (a) the section before "## 1b."
i1b = find(lambda x: x.startswith('## 1b.'))
assert i1b > 0
L[i1b:i1b] = section + ['']
# (b) the note index: after the dev/air-height.md row
ia = find(lambda x: x.startswith('| `dev/air-height.md` |'))
assert ia > 0
size = '%d KB' % round(os.path.getsize(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em067-forms-spec.md') / 1024)
L.insert(ia + 1, '| `' + SP + '` | Zamtrios (em067_00) -- the forms: the part pass per form (blob = set 16: hind legs group 9 off, front legs on), every clip\'s form (blob / armour / normal-or-armour / any) with MOTION_STATES rows, the floor at the clip origin (FLOOR_AT_ORIGIN); four corrections to states-em067_00.md | 2026-10-17 | ' + size + ' |')
# (c) tooling: after the emu_takeoff.py row
it = find(lambda x: x.startswith('| `<scratchpad>\\air\\emu_takeoff.py'))
assert it > 0
L[it + 1:it + 1] = tool_rows
# (d) withdrawn: the last table row before "### Render lane"
ir = find(lambda x: x.startswith('### Render lane'))
j = ir - 1
while j > 0 and not L[j].startswith('|'): j -= 1
L[j + 1:j + 1] = withdrawn_rows
# (e) the trap after the last numbered trap
last = max(i for i, x in enumerate(L) if re.match(r'^\d+\. \*\*', x))
assert L[last].startswith('70.'), L[last][:10]
L.insert(last + 1, trap)
# (f) upgrade the Ostgaloa arm row's "mode 2 I"
k = find(lambda x: x.startswith('| `0x107d704` (arm vt `+0x2a8`)'))
if k > 0 and 'R (mode 2 I)' in L[k]:
    L[k] = L[k].replace('R (mode 2 I)', 'R (mode 2 READ 2026-10-17: `0x72984` = frame < s0, so bit 15 is set BEFORE f120, not after -- trap 71)')
# (g) the mode table: a mode 2 / 3 row after the mode 9 row
m9 = find(lambda x: x.startswith('| `0x729fc` (mode 9)'))
assert m9 > 0
L.insert(m9 + 1, '| `0x72984` (mode 2) / `0x7293c` (mode 3) | **mode 2 = "cur < s0"** (`mov r0,#1; vcmpe s6,s0; bpl -> 0`); **mode 3 = "s0 <= cur <= s1"** (`0x7299c`); both ROM-run (`<scratchpad>\\z67\\fq.py`: mode 2 (130) f129 1 / f130 0; mode 3 (146, 220) f146..220) | R / E | research agent 2026-10-17; ' + SP + ' §2.3 |')
io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(L))
print('patched', P, 'lines', len(L))
