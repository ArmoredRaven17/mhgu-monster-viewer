p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Seregios bladescale makers (action main")
L[i:i] = [
"| Khezu `0xd13e98` (the ground patch, phase 1 at 96 `0xd13fb8`) create -> `0xd1419c`; status-3 drops `0xd129d8..0xd12b18` ((3, 0x18 / 0x23 / 0x5b): L5 M2 ended -> L5 M8, `b 0x48b884`) and `0xd12ea8..0xd12f9c` ((3, 0x1a): landed -> L5 M3) | shell01 0x66 (`[e+0xcac8]`): (7, 0x3c / 0x40 / 0x4c) L2 M64 mode 3, **(3, 0x41 / 0x4e / 0x57) L0 M46 mode 4**, the drops mode 4; every setup **+0x10 = the block's +0x40.., +0x30 = his words e+0xfe8..**, +0x20 GOT zero, +0x3c 0xffff ((3, 0x1a): P+0xb0a); the drops gated status != 0xb and block +0x44 <= +0x5b4 + 99999.0 | uEm003_00 | R | dev/em003-shells-spec.md; shells.js spawnShell01 / spawn003st; dev/shells-khezu-st-check.mjs |",
]
i = find("| claim | why wrong | correction |")
L[i+2:i+2] = [
"| shells.js Khezu ground patch (an older agent's reading): \"0xd13e98's create at 0xd14038 writes no point and no angle words\"; spawnShell01 gave it a zero point and zero words | trgen (k03cap3.py, the block / words poked) shows the create the actions reach (returning to `0xd1419c`) fills +0x10.. with the block's +0x40.. and +0x30.. with e+0xfe8..; emu_fb: the ROM's shell takes his Y word (dev/shells-khezu-st-check.mjs p40t) | spawnShell01 passes his point and words (shells agent, 2026-10-19); the patch's facing is his now |",
]
i = find("| tooling: `<scratchpad>\\fb\\vtdti.py <DTI thunk>`")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk003st.py` -> dev/shells-khezu-st-check.mjs (2026-10-19, shells agent) | Khezu's shell01 makers: action main `0xd1f658`, steps with winFrames / `ended` / `landed`, owner +0xcac8 = 0x66, slot0Until 25 | controls his Y word / position fail | -- |",
"| tooling: fbbcmp.mjs `also` on beam rows, `sev` / `broken` row modes (2026-10-19, shells agent) | a beam row's `also` actions and a row's severed / part-broken modes count as built (Boltreaver (7, 0xe4 / 0xe5) share (7, 0xd0 / 0xd1)'s sites `0x1029390` / `0x10294a8`; Seregios's 9 / 8 / 7) | em081_04 / em077_00: 0 not in a row | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')
