# Khezu (em003_00) -- the shell01 makers the census added (shells agent, 2026-10-19)

Class `uEm003_00` (action main `0xd1f658`). His shells were built before (shells.js SHELL_DATA.em003_00, dev/shells-khezu-check.mjs
76 / 76: the lightning, the orb, the drips, the ring, the ground patch, the per-frame c 31). The Flying-Wyvern census (fb/runfbb.py ->
fbbcmp.mjs) found seven actions of his status 3 making shell01 (0x66, `[e+0xcac8]`) mode 4 (c 31, em003_00c) that no row had.
Emulator check `dev/shells-khezu-st-check.mjs` (tool `<scratchpad>/fb/mk003st.py`), 12 / 12; page 4 / 4.

## 1. What creates

| actions | clip (phase) | when | setup |
|---|---|---|---|
| (3, 0x41 / 0x4e / 0x57) | L0 M46 (1) | 96.0 (`0xd13fb8`) | the ground patch `0xd13e98`, the create returning to `0xd1419c`: mode 4 |
| (7, 0x3c / 0x40 / 0x4c) | L2 M64 (1) | 96.0 | the same create: mode 3 (built before; the other create, `0xd14038`, is the `cmp r0, #0xb` branch's -- not reached in these runs) |
| (3, 0x18 / 0x23 / 0x5b) | L5 M2 (0) -> ended -> L5 M8 (1) | the update that sets L5 M8 (`0xd129d8..0xd12b18`, `b 0x48b884`) | mode 4 |
| (3, 0x1a) | L2 M7 (0) -> L2 M40 (1) -> landed -> L5 M3 (2) | the update that sets L5 M3 (`0xd12ea8..`) | mode 4; +0x3c P+0xb0a |

Every one of these setups: `0x3fa2bc(0x40)`, +4 `[e+0xcac8]`, +8 the mode, +0xc him, **+0x10.. the block's +0x40.., +0x30.. his words
e+0xfe8..**, +0x20.. a GOT zero vector, +0x3c 0xffff (R; trgen k03cap3.py with the block / words poked). The drops are gated (R):
status (e+0x73e0) != 0xb and the block's +0x44 <= +0x5b4 + 99999.0 (`0xd12a1c..0xd12a50`, `0xd12ed4..0xd12f08`).

**WITHDRAWN** (shells.js comments, the old reading): "0xd13e98's create at 0xd14038 writes no point and no angle words" -- the create
the actions reach writes both; the viewer gave the ground patch zero words, so its facing was 0 whatever his was. The rom-map Withdrawn table carries it.

## 2. In the viewer and checked

shells.js: the L0 M46 rows (spawner 0xd13e98, spawnShell01 -- now with his point and words), code 'em003st' rows (spawn003st; L5
M8_start atStart with partners ['Motion[8]'], L5 M3 atStart). `dev/shells-khezu-st-check.mjs` 12 / 12: the patch (his Y 0 / 0x5000 /
0xa000), the drops (turned, 40 above his ground); controls his Y word / his position each fail. dev/shells-khezu-check.mjs still 76 /
76. Records: c 30 / c 31 are exported (`when: shell`), so these draw.
