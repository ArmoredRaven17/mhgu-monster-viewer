# docs_kz.py: the Khezu / -1 aura ID rows into rom-map.md (append-only, in place), dev/hyper-states.md and dev/archive/README.md.
import re, sys
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
A = '<archive>' + chr(92) + 'gapZ' + chr(92)

def load(p):
    b = open(p, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in b else '\n'
    return b, nl

# ---------------------------------------------------------------- rom-map
P = D + r'\rom-map.md'
s, nl = load(P)
if 'Hyper ShellElements -- the -1 aura ID' in s and '--force' not in sys.argv:
    print('rom-map: already applied'); sys.exit(0)
L = s.split(nl)
def find(prefix):
    hits = [i for i, l in enumerate(L) if l.startswith(prefix)]
    assert len(hits) == 1, (prefix, hits); return hits[0]

# 1. the ShellElements row: the "equals a held ID" wording
i = find('| ShellElements (ShellClassNumber, AttackRate, ScaleRate) -> `0x43a8b0`')
L[i] = L[i].rstrip()
assert L[i].endswith('|')
L[i] = L[i][:-1].rstrip() + (' [**CORRECTED 2026-10-27 (shells lane, Raven: "It also impacts shell effects, check Khezu")**: "a shell whose +0x15bc equals a held'
    ' ID" is half of it -- +0x15bc == -1 (every shell that carries no aura ID) PASSES 0xcad9c and takes the first matching entry of either held'
    ' element; row "Hyper ShellElements -- the -1 aura ID"] |')

# 2. the "who carries the aura ID" row: the 21-monster claim
i = find('| Hyper ShellElements -- who carries the aura ID +0x15bc (READ 2026-10-27, shells lane)')
L[i] = L[i].rstrip()
L[i] = L[i][:-1].rstrip() + (' [**WITHDRAWN IN PART 2026-10-27 (shells lane; the Withdrawn table)**: "the listed ShellElements of the other 21 monsters never meet'
    ' a shell carrying an ID" -- they meet shells carrying NO ID, which 0xcad9c passes (-1 -> the hyper test, `0xcadb4`). The who-writes-'
    'the-field part stands (the operand scan + the init emulation agree); its reading of -1 as "no aura" does not. Per mode, every class re-run'
    ' with its own ints: ' + A + 'hyperall.json] |')

# 3. the APPLIED row
i = find('| Hyper ShellElements -- APPLIED (render/shells.js hyperShellElement, 2026-10-27)')
L[i] = L[i].rstrip()
L[i] = L[i][:-1].rstrip() + (' [**SUPERSEDED 2026-10-27**: HYPER_SHELLS now carries every class of the 25 monsters (cls = +0x15a8, aura -1 / per-mode ID, off ='
    ' the cleared hit sides) and the -1 rule -- row below; dev/shells-hyper-check.mjs 13 / 13] |')

# 4. the new row after the APPLIED row
new = ('| Hyper ShellElements -- the -1 aura ID (READ 2026-10-27, shells lane; Raven: "It also impacts shell effects, check Khezu") | '
 '**`0xcad9c(owner, id)` returns 1 for id == -1 whenever the owner\'s +0xb720 is set** (`0xcada8..0xcadb8`: r0 = hyper; `cmnne r1, #1; beq` '
 'returns it), 0 for id 0 (`0xcadbc`), else id == +0xca88 or +0xca9c. **`0xcaa30(owner, cls, id, ..)` with id -1 (`0xcaa6c` -> `0xcabac`)** walks '
 'element 1\'s table (+0xca98: count +0xc, list +0x18) then element 2\'s (+0xcaac) and takes the FIRST entry whose byte +4 == cls (fp latch); '
 'an ID walks only the table of the element holding it; id 0 / cls > 0xfe / no hyper -> 0. +0x15bc is written ONLY by the shell base ctor '
 '(`0x43a78c`: -1) and the seven base-init copies (whole-text `#0x15bc` store scan, ' + A + 'wr15bc.out: no other shell writer); Khezu\'s '
 'sp_03 ctor + init run (' + A + 'initwr.py, owner / resource stand-ins): +0x1620 written once, -1 by base00\'s ctor `0x3f8aa8`; the reader '
 '`0xd21b10` never writes it; `0x3f931c` copies -1 into +0x15bc; +0x15a8 = 3 (base03 ctor `0x3fd9b0`). So **Khezu\'s ground lightning '
 '(sp_03, base03) takes his ID 1 entry (3, AttackRate 1.2, ScaleRate 1.3) whenever ID 1 is held**; it is registered from the init '
 '(base00 vt+0x164 `0x3f9aec` -> vt+0x140 `0x43a8b0` at `0x3f9b4c`). Every class of the 25 monsters (' + A + 'hyperall.py: own ctor '
 'found by its vtable store, else the base\'s; each mode\'s reader on its own ints; the base flag that clears +0x15ac: base00 +0x15e8 '
 '0x800, base01 +0x15ec 0x1000, base12 +0x15e0 1 (`0x403d18`), base13 +0x15e0 0x400 (`0x404d04`, sb = +0x15e0 from `0x404610` / '
 '`0x4046cc`), base54 +0x1614 0x80 (`0x42b630`)): **every +0x15a8 is the base number; every shell is -1 except** Lagiacrus sp_01 '
 '(5; 1 on 20 / 21), Nerscylla sp_00 (2; 17: 0), sp_00_02 (4), sp_01 (2 / 4; 8: 0), Astalos sp_01 (4 / 3), Zinogre sp_18 (-1 on modes '
 '0..5, 0 on the rest). Entries per file and the shells they reach: ' + A + 'hypertable.out (e.g. Rathalos ID 1: sp_00 x1.3, sp_01 x1.5 '
 'but modes 13 / 14 / 15 / 20 (0x1000); Basarios / Gravios ID 1 classes 0 / 1 / 2; Tigrex ID 3 class 0 x1.5). **No viewer shell of the '
 'class**: Rajang (em023_00) G ID 3 class 2, Agnaktor (em049_00) ID 1 class 2, Zamtrios (em067_00) ID 3 class 2 (no base02 shell in their SHELL_DATA); em043_00\'s '
 'shells carry no reader address in SHELL_DATA, but base04 / base55 have no copy in their bands (-1). Controls: ' + A + 'cadcheck.py '
 '(both functions run on a fake owner: -1 -> 1 and element 1\'s entry, else element 2\'s; 0 -> 0; an unheld ID -> 0; hyper off -> 0) | '
 'enemy-shell base / classes | R (consumers run, writers scanned and emulated) | render/shells.js HYPER_SHELLS / hyperShellElement; '
 'dev/hyper-states.md 6.5 |')
new2 = ('| Hyper ShellElements -- the -1 rule APPLIED (render/shells.js, 2026-10-27) | HYPER_SHELLS (' + A + 'hypershells2.json) per monster / '
 'shell: cls, aura (-1 or per mode), off; hyperShellElement walks the held pair in state.hyper\'s order (element 1, element 2) for the first '
 'entry with that cls (an ID shell: only its own ID). dev/shells-hyper-check.mjs 13 / 13 (Khezu L2 M3 (7, 0x0e) holding 2 / 1: three sp_03 '
 'at x1.3; holding 2 / 3: unchanged; Rathalos holding 1: sp_00 x1.3, sp_01 x1.5; Nerscylla sp_13 x1.6). **Page** (' + A + 'kzshot.mjs, '
 'kz.out; slot 1): Khezu L2 M3 Hyper off vs holding 1 / 2, the same camera and frame 186: three sp_03 at unit 1.3, ID 1, u 0 pixMax '
 '157030 -> 319400, lit 83 / 153 -> 95 / 150; screenshots ' + A + 'khezu_off0.png / khezu_on0.png. The page\'s pick rotation (index.html '
 'rockInput) gives each play the next action, so a meter pass resets it on another pick clip first (L2 M61) | viewer | built | -- |')
i = find('| Hyper ShellElements -- APPLIED (render/shells.js hyperShellElement, 2026-10-27)')
L[i + 1:i + 1] = [new, new2]

# 5. the 0x43a8b0 second-half row's parenthetical
i = find('| `0x43a8b0` second half (`0x43a900..0x43aa64`) + `0xcad9c` + `0xcaa30`')
old = '(+0x15bc != -1 and == owner byte +0xca88 or +0xca9c)'
assert old in L[i]
L[i] = L[i].replace(old, old + ' [**WITHDRAWN 2026-10-27**: -1 PASSES -- `0xcadb4` `cmnne r1, #1; beq` returns the hyper test; 0 fails; an ID must be held. Row "Hyper ShellElements -- the -1 aura ID"]', 1)

# 6. the Withdrawn table
i = find('### Withdrawn')
h = i
while not L[h].startswith('|---'): h += 1
wd = ('| shells lane 2026-10-27, rows "Hyper ShellElements -- who carries the aura ID" / "0x43a8b0 second half" / shells.js HYPER_SHELLS (first '
 'version): "0xcad9c passes only +0x15bc == a held ID (+0x15bc != -1)"; "the listed ShellElements of the other 21 monsters never meet a shell '
 'carrying an ID -- in the game too" | `0xcad9c` was read as a refusal for -1; its arms say the opposite: `cmp r3, #0` (hyper) / `movne r0, #1` / '
 '`cmnne r1, #1` / `beq 0xcadec` -> **returns 1 for -1 when hyper**. The census then looked only for shells that CARRY an ID, so the shells '
 'that carry none -- nearly all -- were never matched (Raven: "It also impacts shell effects, check Khezu") | -1 = any held element: '
 '`0xcaa30` takes the first entry with ShellClassNumber == +0x15a8 in element 1\'s table, else element 2\'s. Khezu\'s sp_03 x1.3 on ID 1; '
 'every class of the 25 monsters re-audited (' + A + 'hyperall.json, hypertable.out); row "Hyper ShellElements -- the -1 aura ID"; trap 177 |')
L[h + 1:h + 1] = [wd]

# 7. the tooling table: after the hypereye row
i = find('| `<archive>/hypereye/blsites.py <target> [K] [lo hi]`')
tool = ('| `' + A + 'fieldwr.py <off>..`, `initwr.py <ctor> <init> [gid]`, `cadcheck.py`, `hyperall.py`, `hypertable.py`, `modesall.mjs`, '
 '`kzshot.mjs` (+ `run_kz.sh`) | every store to shell+<off> in main.text (movw / add-imm then a store through that register, writeback '
 'forms included); a class\'s ctor + init under unicorn with every write to +0x1580..+0x1700 logged (PLT imports stubbed; 0x4a0f00 -> a '
 'stand-in owner, 0x4a10c8 / 0x4a11e4 / 0xbe518 / 0x43ab74 stubbed); 0xcad9c / 0xcaa30 on a fake owner; the per-class / per-mode '
 '+0x15a8 / aura / hit-side audit and its per-file listing; the page meter (Hyper off / on, one camera, a grab at a frame) | '
 'fieldwr: finds all seven base copies and the ctor default (the rom-map row\'s); initwr: Khezu sp_03 +0x15a8 = 3 as the base03 ctor '
 'writes it; cadcheck: an ID path gives the entry of the element holding it | initwr runs an init only as far as its stand-ins carry it '
 '(the base00 part of Khezu\'s base03 init to its return; the base03 remainder ran off into a stand-in pointer -- it writes no +0x15bc: the '
 'scan); hyperall uses the base ctor where the PIC vtable-store pattern finds no class ctor (32 of 76 classes); em043_00\'s four shells have no '
 'reader in SHELL_DATA |')
L[i + 1:i + 1] = [tool]

# 8. trap 177 after 176's paragraph
i = find('176. **A census that knows only SOME')
j = i + 1
while j < len(L) and L[j].startswith('     '): j += 1
trap = ['177. **A sentinel is not a refusal until the compare\'s arms say so (2026-10-27, shells lane).** `0xcad9c` tests the aura ID',
 '     against -1 with a conditional `cmnne r1, #1; beq` whose taken arm returns the HYPER flag, i.e. 1: an unset ID (-1) means "any held',
 '     element", not "none". Reading it as a refusal turned a rule that touches nearly every shell into one that touched 7 classes, and the',
 '     census built on it looked only for shells that carry an ID. Read both arms of every sentinel test, and run the function on the',
 '     sentinel (`' + A + 'cadcheck.py` is the control that would have caught it).']
L[j:j] = trap
open(P, 'wb').write(nl.join(L).encode('utf8'))
print('rom-map: done')

# ---------------------------------------------------------------- hyper-states.md 6.5
P2 = D + r'\hyper-states.md'
s2, nl2 = load(P2)
m = re.search(r'^#+ *6\.5[^\n]*$', s2, re.M)
assert m, 'no 6.5 heading'
nxt = re.search(r'^#+ ', s2[m.end():], re.M)
end = m.end() + (nxt.start() if nxt else len(s2) - m.end())
add = nl2.join(['', '**Correction, 2026-10-27 (shells lane; Raven: "It also impacts shell effects, check Khezu").** The aura ID -1 is not "no aura":',
 '`0xcad9c` returns 1 for -1 whenever the monster is in Hyper (`0xcadb4`), and `0xcaa30` then takes the first entry whose ShellClassNumber',
 'equals the shell\'s base number in the first held element\'s ShellElements, else the second\'s. Nearly every shell carries -1 (only',
 'Lagiacrus sp_01, Nerscylla sp_00 / sp_00_02 / sp_01, Astalos sp_01 and Zinogre sp_18\'s modes 6+ carry an ID or 0), so **every listed',
 'ShellElement reaches its class\'s shells**: Khezu\'s ID 1 (class 3, x1.2 power, x1.3 scale) scales his ground lightning (sp_03);',
 'Rathalos\'s ID 1 his fireballs (sp_00 x1.3) and sp_01 (x1.5, not the 0x1000 modes); and so on for all 25 monsters',
 '(`dev/archive/gapZ/hypertable.out`). The earlier statement here that the other 21 monsters\' entries never apply is withdrawn',
 '(rom-map Withdrawn table, trap 177). Built: render/shells.js HYPER_SHELLS (cls, aura, off per class) / hyperShellElement; the page',
 'shows Khezu\'s three bolts at unit 1.3 holding 1 / 2 (pixMax 157030 -> 319400; `dev/archive/gapZ/khezu_off0.png` / `khezu_on0.png`).', ''])
s2 = s2[:end].rstrip(nl2) + nl2 + add + nl2 + s2[end:].lstrip(nl2) if nxt else s2.rstrip(nl2) + nl2 + add
open(P2, 'wb').write(s2.encode('utf8'))
print('hyper-states: done')

# ---------------------------------------------------------------- archive README
P3 = D + r'\archive\README.md'
s3, nl3 = load(P3)
anchor = '- `gapA' + chr(92) + '`..`gapQ' + chr(92) + '`'
k = s3.index(anchor); e = s3.index(nl3, k)
line = ('- `gapR' + chr(92) + '`..`gapZ' + chr(92) + '`: the shells lane\'s reads, tools and outputs (no RESULT.md; the rom-map rows cite them). `gapZ' + chr(92) +
        '`: GU Hyper\'s ShellElements -- the aura ID census, the -1 rule (cadcheck.py), every class\'s audit (hyperall.py), the Khezu page meter (2026-10-27).')
if 'gapZ' not in s3: s3 = s3[:e] + nl3 + line + s3[e:]
open(P3, 'wb').write(s3.encode('utf8'))
print('README: done')
