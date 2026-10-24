# doc_fixes.py: rom-map rows + trap 127 for the draw-meter finds of 2026-10-20 (Crystalbeard's shard slots, Tigrex's hitdata)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
b = open(P, 'rb').read(); NL = b'\r\n'
def after_row(prefix, row):
    global b
    i = b.find(prefix); assert i >= 0, prefix
    j = b.find(NL, i)
    b = b[:j] + NL + row + b[j:]
after_row(b"| Crystalbeard sp_32 class (vtable `0x17c3904`)",
    b"| Crystalbeard sp_00 (0xe2) L9 M1 / M2 shards, modes 0 / 2 / 8 / 10 -- the slots (shells agent 2026-10-20) | no flight float, so base00's "
    b"flight <= 0 arm (0x3f97bc) keeps them only while hit slot 0 / 1 is on; their hitdata is (0, 9999). **spawn045 never gave them S.slots**, "
    b"so the page ended each on its first move and u 60 / u 62 never drew. The ROM check passed anyway: its harness held only id 227's slots "
    b"(slot0Until), so the ROM run ended them on move 1 too. Fixed both ways: spawn045 sets the slots (slotsOf011, slot 0) and the check holds "
    b"226:0 / 2 / 8 / 10 for 10000 (delay + duration + 1). ce7 needs 700 frames to reach its landing (it is aimed high). Now 15 / 15, and u 62 "
    b"starts at the landing as the ROM does. The +0x150 `0xe9dd34` (READ) is base00's shape: state 1 only, type 0 / 1 / 2 -> +0x15cc / +0x15d0 "
    b"/ +0x15d4 | uShellEm045_sp_00 | R + E | shells.js spawn045; trap 127 |")
after_row(b"| `0xe35ac4` / `0xe35af8` (sp_01 reader, Tigrex body)",
    b"| em032_00_00_hitdata / em032_00_01_hitdata (HDS; READ from the arc, shells agent 2026-10-20) | shell00 4 x (0, 9999); shell01 (14, 10). "
    b"SHELL_DATA.em032_00 had no hitdata, so slotsOf011 refused by name and his timer-0 shell01 (c 32: L0 M28, L1 M1, the frame handler) "
    b"ended on its first move in the page and never drew. The ROM check passed because its harness hands slot holds | uShellEm032_sp_01 | R | "
    b"shells.js SHELL_DATA.em032_00; trap 127 |")
i = b.find(b"126. **The triage's frame list is not the maker's (2026-10-20).**"); assert i >= 0
j = b.find(NL, i)
b = b[:j] + NL + (b"127. **A ROM check that hands the hit slots does not show the page's shell has them (2026-10-20).** The harness's slot0Until "
    b"holds slot 0 per id:mode, so the ROM run and the JS run in the check both live on the harness's slots. The page's shell lives on "
    b"S.slots, which only the maker sets (slotsOf011 from the shell's hitdata). Crystalbeard's spawn045 never set them. And SHELL_DATA.em032_00 "
    b"had no hitdata, so the slots were refused by name. Both checks passed, while the page ended those shells on their first move: Crystalbeard "
    b"u 60 / 62 and Tigrex c 32 drew nothing. The draw meter found them. Worse, the Crystalbeard harness held the wrong id (227, not 226), so even "
    b"the ROM run ended its shards at once and the check compared two wrong lives. Audit: `<scratchpad>" + bytes([92]) + b"fb" + bytes([92]) +
    b"hdquick.mjs` / `b00quick.mjs` over every monster (shells that end on move 1 with no slots and no start, and hitdata refusals). After the "
    b"two fixes only Hellblade's sp_03 9..11 / 18..20 remain, and the ROM ends those early too (em080 spec).") + b[j:]
open(P + '.tmp', 'wb').write(b)
import os; os.replace(P + '.tmp', P); print('ok')
