p = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/rom-map.md'
s = open(p, encoding='utf8').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0x3293c0` / `0x3295fc` | its callers, mode 4 only: start deferred (`core+0x30 = 1`) while out of range; per frame, out of range with `+0x18d` → units ended | R | §6 |"
assert s.count(anchor) == 1
add = (nl +
"| `0x329650..0x3296ec` (in 0x3295fc) | the OUT-OF-RANGE END, statically read 2026-10-21, NOT LIFTED: for each unit [core+0x150+4i] not in state 1 / 2: its vt+0x48(u, 0, -1); then for each i, [+0x150+4i] vt+0x128 and [+0x154+4i] vt+0x88; +0x18d = 0. The runtime stops there (`Unverified 0x329650`) when a running mode-4 request leaves its range -- measured on Kushala c 34 with the hunter put at him. Needs the lift slot | engine | R (static) / not lifted | lifted-request.js L_3295fc |" + nl +
"| the base01 SECOND INIT STARTS (Kushala c 33 / 34 / 35, Teostra c 34; effects lane 2026-10-21) | NOT dropped by schedule.js: shells.js startEf2 puts them in out.started and schedule.js requests each (one request per pulse, host.requestEffect hooked). All four are **payload mode 4** (camera-attached, offset (0, 0, 100) in camera axes), MASK1 2, range +0x58 600 / 900 / 1200 / 900: the core's range test 0x328d9c measures from the hunter -- the viewer's invisible target, 2100 ahead -- so no unit is made (the meter counts a start only when a unit runs). Positive control, the hunter at him: Teostra c 34 draws (9/15 lit), Kushala c 33 draws (41/62). Verdict: ROM CONDITION (the hunter out of range) | viewer | R / measured | `<scratchpad>/ef2probe.mjs`, `ef2meter.mjs` |" + nl +
"| index.html `unitGamePos` (the shells agent's reference-node travel, 2026-10-20) -- FIXED 2026-10-21 | the pose proxy is never in the scene (render/pose.js), so the `reference` node's matrixWorld is proxy space: x / z now go through the world group (`* world.scale + world.position`) as the root's own position does. Before, the unit lost every earlier pass's travel: Kushala's pulse on a looped L0 M8 spawned at z 616 / 1574 / 310 / 875 while he stood at 2422 / 4583 / 6458 / 8533 | viewer | fixed | -- |")
s = s.replace(anchor, anchor + add)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
