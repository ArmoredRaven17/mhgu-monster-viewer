import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
a = "(dev/air-height.md)\n67. **The viewer's shell `ownerPos`"
assert s.count(a) == 1
s = s.replace(a, "(dev/air-height.md) **TRANSCRIBED 2026-10-17 (Viewer agent, Raven: \"Do both, follow the ROM\")**: motion-states.js AIR_HEIGHT / airLift (Rath line, Seregios + his L1 M4 posture 3 / L1 M5 ledge climb, Malfestio, Astalos -- the classes whose takeoff curve is read); index.html monsterFloorY puts the Grid Floor H below the clip origin on an air clip; every other flyer keeps the lowest-reach rule. FlyOfs read for all monsters at .dtb file offset +0x22 (float).\n67. **The viewer's shell `ownerPos`")
b = "On a ground list the pin hides it below 900; on an air list it adds the hip's swing to the height test. (dev/air-height.md)"
assert s.count(b) == 1
s = s.replace(b, b + " **FIXED 2026-10-17**: index.html shellExtra hands the shells `ownerPos` = unitGamePos() (the clip origin through the world group, less the posture-3 drop); the effect parent (unitMatrix, joint -1 effects) is unchanged -- its own open question stands.")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
