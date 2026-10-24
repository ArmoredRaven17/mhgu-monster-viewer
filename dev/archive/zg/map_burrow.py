# map_burrow.py: rom-map rows for the burrowers' floor and Bloodbath's dust export (2026-10-20), patched in place
import io
P = r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n'
anchor = "| -- the Special-list entries per ground variant (Raven: \"create each variation in the Special list\") |"
i = t.index(anchor); j = t.index(nl, i)
rows = [
"| THE BURROWERS' FLOOR IS THE UNIT (viewer rule, from the ROM) | 0xbf284 pins `P+0x44 = P+0x5b4` in postures 0 / 3 / 4 / 6 and the setter 0xbc7f4 does on entering 0 / 4 (0xbc8e4) (both R, rows above in \"Air height\"); the move pass 0xae370 keeps a step's vertical only in 1 / 2 / 5 / 6 (mask 0x66, R); the burrow depth P+0x5c is a draw offset (e+0x1384, air-height.md 5.1). So a burrow clip's sinking is the body under a unit on the floor, and base01's 900 arm (0x3fa8b0) reads 0. index.html `FLOOR_AT_UNIT` (Diablos, Bloodbath + the 12 Begins Burrowed ids): on a clip whose posture includes 0 / 3 / 4 / 6 (Bloodbath through em007_00's CLIP_POSTURE), the floor is the clip origin; posture-1/2/5-only clips keep the lowest-reach rule, air clips airNow | viewer | built (sites R) | index.html monsterFloorY; E17 |",
"| -- measured (`<scratchpad>/burrowfloor.mjs`, every clip, 9 samples) | the viewer's unit is the clip origin on every clip of the 14 (unit y - world y = 0 throughout); the old rule put the floor below it on 448 clips (35 Diablos, 42 Bloodbath, ... Akantor 48, Ukanlos 53), 158 of them more than 500 below (Diablos L0 M24 -1345, L0 M33 -2043, L2 M24 -1472; Deviljho / Savage to -3045) | viewer | measured | `<scratchpad>/bf_<id>.out` |",
"| -- Diablos's burrow dust, metered (draw meter; control = the old rule served by `<scratchpad>/serve_ctl.py`) | **L0 M24**: c 2 (shell01 mode 11, f58) -- old none, new 1 start, DRAWS (lit 9 / 10); **L0 M33**: c 1 (mode 12) -- old none, new 7 starts, DRAWS (53 / 62); **L0 M43**: c 1 -- 3 starts and draws under both (its floor was 0 already). Every clip the old rule put more than 500 below the unit (158 clips on the 14 monsters, 150 frames each, `<scratchpad>/bfmeter.sh` / `bfcmp.py`): the only starts that change are Diablos's and Bloodbath's dust -- c 1 0 -> 6 starts, c 2 3 -> 4, c 0 6 both, all drawing; the other 12 monsters' records start and draw the same under both rules (their shells on those clips test no floor height, or there are none) | uEm007_00 | measured | this row |",
"| Bloodbath's frame-handler dust (shell01 0x71 modes 10 / 11 / 12, ef list 1 = em007_00c c 0 / 2 / 1) -- FIXED (export) | docs/effects/em007_04.json carried no 'shell' entries for em007_00c 0 / 1 / 2, so the schedule found no record (`sh.request = null`): shells spawned, 0 refused, nothing drawn, under either floor. The three entries were appended in place (copied from em007_00.json; same pel, resources already present: cm200_040 loads cm120_016 / cm101_000). Metered: L0 M24 c 2 1 start, L0 M33 c 1 7, L0 M43 c 1 3 -- all draw | export | fixed / measured | docs/effects/em007_04.json |",
]
t = t[:j] + nl + nl.join(rows) + t[j:]
# the shells tooling row that named the floor
a = "the page's L0 burrow clips: the viewer's floor (index.html monsterFloorY) 1345 below him -- base01's 900 rule deletes the dust there |"
assert t.count(a) == 1
t = t.replace(a, "the page's L0 burrow clips: the viewer's floor (index.html monsterFloorY) 1345 below him -- base01's 900 rule deletes the dust there [**FIXED 2026-10-20**: FLOOR_AT_UNIT, section \"The ground under the unit\"] |")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
