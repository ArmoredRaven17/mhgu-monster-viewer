p = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js'
s = open(p, encoding='utf8').read()
old1 = "const GAUGE071_STEP = [0, 5000, 10000, 20000];\n"
new1 = """// THE GAUGE (C+0x84) AS THE GAME HOLDS IT: the step the control picks, clamped each frame to table 0x16a1530[quest rank]
// (0xfaee10..0xfaee44: 32000 / 32000 / 24000 / 24000 / 20000 / 20000 / 20000 for ranks 0..6, 0 above) -- so at G rank it
// never passes 20000 and the 28000 step (the BodyLight's LVMAX, below) is reached only at rank 0 / 1.
export const GAUGE071_STEP = [0, 5000, 10000, 20000, 28000];
const GAUGE071_CAP = [32000, 32000, 24000, 24000, 20000, 20000, 20000];
export function gauge071(step, rank){
  const v = GAUGE071_STEP[step | 0] || 0, r = rank | 0;
  return Math.min(v, r >= 0 && r <= 6 ? GAUGE071_CAP[r] : 0);
}
// ITS BODYLIGHT TIER -- the part pass vt+0x210 0xfbf97c (0xfc0230..0xfc0350, Chaotic: em 0x47 variant 5): the count of table
// 0x16a1294's four thresholds +0 / +0xc / +0x18 / +0x24 the gauge has reached (5000 / 10000 / 20000 / 28000 at every rank class),
// 0..4 -> C+0xc0 -> setMatClip(C+0x94, slot 0, C+0xa4[tier]) = BodyLight_Normal / _Start_LV1 / _LV2 / _LV3 / _LVMAX on the
// material cached at spawn (MRL id 0x3d, 0xfad8cc..0xfad94c), only when the tier changes (the slot's time zeroed). Above it in the
// same function: C+0xca (set at the death motions L3 M21 f238 / L3 M34 f504, 0xfbf8f8..0xfbf96c) forces tier 0, and C+0x82 picks 4
// (5 = _Start_Finish with C+0xc2) -- neither is driven here. index.html sets the ladder rung from this (LADDER_BY_GAUGE).
export function gauge071Tier(g){
  let n = 0;
  for (const t of [5000, 10000, 20000, 28000]) if (g >= t) n++;
  return n;
}
"""
assert s.count(old1) == 1
s = s.replace(old1, new1)
old2 = "c.rank >= 5 && GAUGE071_STEP[c.ctl2Raw] >= 20000 ?"
new2 = "c.rank >= 5 && gauge071(c.ctl2Raw, c.rank) >= 20000 ?"
assert s.count(old2) == 1
s = s.replace(old2, new2)
old3 = "options: [[0, '0'], [1, '5000'], [2, '10000'], [3, '20000']],\n              title: 'Chaotic Gore Magala\\'s counter C+0x84 (the hunters around him): at 20000 and G rank his footfall dust and six extra slot-ring fills run. Working names.' },"
new3 = "options: [[0, '0'], [1, '5000'], [2, '10000'], [3, '20000'], [4, '28000']],\n              title: 'Chaotic Gore Magala\\'s counter C+0x84 (the hunters around him), held under the rank cap (20000 at G, 24000 High, 32000 Low): his body light steps Normal / LV1 / LV2 / LV3 / LVMAX at 5000 / 10000 / 20000 / 28000; at 20000 and G rank his footfall dust and six extra slot-ring fills run. Working names.' },"
assert s.count(old3) == 1, s.count(old3)
s = s.replace(old3, new3)
old4 = "  // foot071, input.gauge071) and six extra slot-ring fills (GORE_FILLS `gauge`) run. The values are the steps the ROM tests.\n"
new4 = "  // foot071, input.gauge071) and six extra slot-ring fills (GORE_FILLS `gauge`) run; his BodyLight clip is the tier (gauge071Tier, 0xfbf97c),\n  // 28000 its LVMAX (above the G cap). The values are the steps the ROM tests.\n"
assert s.count(old4) == 1
s = s.replace(old4, new4)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
