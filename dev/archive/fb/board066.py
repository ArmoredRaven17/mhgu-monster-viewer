P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "      - [x] 2026-10-18 -- Rajang L2 M8's pick rotation carries"
assert s.count(anchor) == 1
add = [
"      - [x] 2026-10-18 -- AMPHIBIANS' SHELLS, part 1: TETSUCABRA / DRILLTUSK (spec dev/amphibian-shells-spec.md). 0xc241c (vt+0x208's",
"        variant-4 tail) is a CAMERA request (-> uFestaCamera 0x1ce9c), not a shell spawn: the em066 rows withdrawn. Built: L4 M1 / L4 M2's",
"        rocks off his tusks (sp_00: two, one or none by the tusks' break level), L2 M12's thrown rock (sp_13, its origin the owner's",
"        point -- base13 flag 0x40 -- and its landing's hit volume) and L4 M30's slab (sp_16 on a NEW base16: placed 730 ahead on the",
"        floor, lifted by its body's radius, four waits -- rise, hold 415 / 600 frames, the second phase 400 on, the end). Checks 27 / 27",
"        each (dev/shells-tetsucabra-check.mjs / shells-drilltusk-check.mjs), pages 14 / 15 each, dev/checks/em066_00 128 / 0, the full",
"        shells suite 30 / 30. Named: the snow maps' modes (the viewer has no quest map) and the jumps' sp_01 hit volumes (no effect).",
"        The census missed landing-made and test-free creates: cengen11 fixes both (rom-map trap 87); the earlier groups re-run with it.",
"      - [ ] (bug) Tetsucabra / Drilltusk u 0 (the thrown rock's own record, em066_00_001, a model unit) started ALONE stops the effect",
"        runtime at '0xaf7ba8 in L_af7930' (an unrecorded path; the Switch Axe met the same site on 2026-09-28). In play, from its shell,",
"        the rock draws. For the effects lane.",
]
s = s.replace(anchor, nl.join(add) + nl + anchor)
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
