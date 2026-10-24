import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)

# the collision row: corrected in place, the old claim to Withdrawn
old_row_start = "| area ground height | NOT a ROM value: the game ships **no collision for these areas**"
i = s.index(old_row_start); j = s.index('\n', i)
s = s[:i] + ("| area ground height | **corrected 2026-10-05 (Withdrawn: \"no collision for these areas\")**: every hunting area's "
             "collision ships in `romfs\\nativeNX\\loc\\arc\\stage\\map_com\\mNN.arc` -- 27 arcs, 962 rCollision (`SBC\\xff`) files, "
             "192 areas; Forlorn Arena's `m17a01d-a-g00` floor under the origin is -312.6, agreeing with the measured -3.142 m to "
             "1.6 cm. `build-map-areas.ground_under()` still MEASURES the visual model | R (files) / measured (viewer) | "
             "posture-mount.md section 10 |") + s[j:]

# the new section, before "## 1b."
anchor = "## 1b. The decode notes"
section = """### Walls and ceilings -- where the game finds them (research agent for the Viewer agent, 2026-10-05; posture-mount.md section 10)

Raven, 2026-10-05: "Based on in game behaviors, they know where the walls or ceilings are. We need to find that, then
define walls and ceilings using the grids." All static reads; collision layouts INFERRED where marked.

| addr | what | st | detail |
|---|---|---|---|
| `0xbde60` -> `0x49aec` -> `0x1814c0` -> `0x18154c` | the per-frame ground probe, which ALSO finds the ceiling (not an area setting) | R | posture-mount.md 10.1 |
| `0x181928` | one vertical ray from pos.y + 10000 down (constants `0x181a70..80`); reach above the unit 100, 50 with flag 8 (posture 5), 0 with flag 2 (posture 1) | R | same |
| `0x181ad4` | collects up to 16 hits, ascending height; hits flagged `& 0x1004` (water) are not recorded but their height is kept in `e+0x1074` | R | same |
| `0x181cac` | the pick: floor mode walks down from the top, skipping `0x10` hits and hits above the reach; ceiling mode (flag 1, posture 6) takes the topmost `0x10` hit, else the first within the reach; a `0x2000` hit takes the one below | R | same |
| `0x181138` | the hit record layout; the polygon flags word is attribute word 1 | R | same |
| `P+0x940..0x983` | the "next surface above" block (`0x1816c8`, `0x181838..0x181898`): `+0x944` = 1 when a hit lies above the chosen one, **`+0x980` its height (default +100000.0)**, `+0x950` its record, `+0x970` its normal. Written through `sb = P+0x940` (`strb [sb,#4]` at `0x181854`) | R | same; trap 45 |
| `e+0x1078` (= `P+0x5b8`) | the height of the next surface BELOW the chosen one (`0x181818..0x181830`) -- corrected, see Withdrawn | R | same |
| `0x4fed00..0x4ff014` | the hunting-area loader registers each collision file with `0xc44dec(.., LAYER, area, ..)` (layer at node `+0x10`, `0xc167c4` / `0xc16b80`): `-a-g00` 1, `-a-w00` 2, `-a-g00-shell` 0x10, `-a-w00-shell` 0x20, `-a-cam` 0x100 | R | same |
| `0xc14924(filter, 1, ..)` | the probe asks for layer 1 (the shells' `0x183490` pass 0x10 / 0x20): the filter test itself NOT READ, so "the probe sees only `-a-g00`" is INFERRED | I | same |
| ceiling polygons | upward-facing ground-layer polygons with flags `0x10`; the posture-6 cling test is `e+0x1068 & 0x18` | R (test) / I (attribute word = file record word2, checked on water bits) | same |
| `0xa6c6c` | the WALL finder: walks the body contacts at `P+0x7b4 + 0x20i` (count `P+0x8f0`), keeps those flagged `0x8000000` or `0x400`, returns the averaged yaw of their normals. What fills the contact list: NOT READ | R | same |
| `0xd141f0` / `0xd11cf0` | Khezu accepts a wall only if the ground 1.3 x PushHitRadius (350) into it -- or `P+0x980` for a `0x8000000` wall -- is >= 900 above the floor; then `[e+0xcac0]+0x10` = dir + 0x8000 | R | same |
| `0xbf284` (`0xbf330..0xbf364`, re-read) | on the wall: `P+0x44 <= P+0x980 - TenjoOfs x size` -- **TenjoOfs is the gap kept below the ceiling while on the wall** | R | same |
| `0xd13884` | attach to the ceiling once `P+0x44 >= P+0x980 - (TenjoOfs + 30) x size` and `P+0x944 == 1`; at posture-6 entry `P+0x44 = P+0x980` and the `+0x950` / `+0x970` record is installed: the origin sits ON the ceiling pick | R | same |
| `0xb6b090` (vtable `0x178d6c0`) | the rCollision loader: header and array order READ; triangle / vertex / attribute layouts INFERRED (196,461 of 211,142 ground triangles' stored normals match their winding) | R / I | same |
| Forlorn Arena (m17a01) | **no `0x10` polygon and no surface above the floor (`P+0x944` = 0): the game gives Khezu NO ceiling there**; its only `0x400` polygons are a low ring (y -513..-10) that fails the 900 test: **no climbable wall either**. 48 areas do have `0x10` ceilings (m07a09d 1500, m12a08d 5000, m08a03d 1340..2003, m22a08d 550, m01a09d 2522, ...) | R (files) | posture-mount.md 10.3 table |
| OPEN: the ceiling roll | 3,181 of 3,446 ground-layer `0x10` triangles face UP (3 face down); `0x182dd4` returns the stored normal unflipped and tilt mode 0 copies it, so on a `0x10` ceiling `0xbdf54` would aim for roll 0, not 180 -- against posture-mount 3.5's roll 180 (which assumed (0,-1,0)) and index.html's Khezu MOUNT. `0xbdf54` also uses the surface normal only while `e+0x7452` / `+0x7453` is set (cleared by Khezu's action entries; set by `0xa50dc` and the motion-script reader `0x9ee80` for motions NOT READ) | OPEN | posture-mount.md 10.6 |

"""
rep(anchor, section + anchor)

# withdrawn entries
wanchor = "| `uShellEm004_sp_00` is **base13** (from `dti.json` `parentDti`) |"
w = """| the game ships **no collision** for the hunting areas -- 92 collision entries in 10,595 arcs, none for m17 (**this file, row "area ground height"**; the task board) | the census missed `romfs\\nativeNX\\loc\\` | 27 `loc\\arc\\stage\\map_com\\mNN.arc` hold 962 rCollision files over 192 areas, Forlorn Arena's included (section "Walls and ceilings"). Research agent for the Viewer agent, 2026-10-05 |
| `P+0x944` (and `P+0x92c` / `+0x938` / `+0x947`) is quest config filled by `0x757a64` | that function's object is `uUIOtomoBoard` (vtable `0x1776f74`, getDTI `0x75ada8` -> DTI `0x18460b0`) | `P+0x944` is written at `0x181854` (`strb [sb,#4]`, sb = `P+0x940`): 1 when a surface lies above the probe's pick. The other three fields' writers: NOT READ. Same agent, 2026-10-05 |
| `P+0x5b8` = `e+0x1078` is "the surface attribute word" | read at its writer `0x181818..0x181830` | the height of the next surface below the chosen one. Same agent, 2026-10-05 |
"""
rep(wanchor, w + wanchor)

s = s.rstrip('\n') + """
45. **A P-block field written through a POINTER REGISTER never shows its offset (2026-10-05).** `P+0x944` is written by
   `strb [sb, #4]` with `sb = P+0x940` (`0x181854`): a scan for `#0x944` finds nothing, and a UI object's unrelated
   `#0x944` store (`0x757a64`, uUIOtomoBoard) was taken for it. Track the base register, as trap 16 says for loads.
"""
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p); print('ok')
