# p10.py: Seltas' wings from the ROM (render/monster.js ROM_WINGS + wingPartsAt), generated from s_wingtable.json
import json
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo'
t = json.load(open(SP + r'\s_wingtable.json'))['tab']
rows = {}
for k, v in t.items():
    vals = sorted(int(x) for x in v)
    if k == '4|Motion[8]': vals = [1]          # 1:0x2, the landing on her (3:0x33's 2 noted)
    assert len(vals) == 1, (k, v)
    rows[k] = vals[0]
by = {0: [], 1: [], 2: []}
for k, v in rows.items(): by[v].append(k)
def fmt(keys):
    out, line = [], '    '
    for k in keys:
        s = "'" + k + "', "
        if len(line) + len(s) > 118: out.append(line.rstrip()); line = '    '
        line += s
    out.append(line.rstrip().rstrip(','))
    return '\n'.join(out)
block = """// SELTAS' WINGS, READ (Seltas duo agent, 2026-10-17; Raven: "Seltas wing parts are not being toggled during flying sections").
// His flight state [+0xcac0]+0x49 is written by his actions (EMULATED, every action x phase x link: duo/s_census.json ->
// duo/wingtable.py), and his vt+0x2a0 wing pass 0xfc66f8..0xfc75c0 (emulated, duo/wingemu.py) scales the four card joints
// 150..153 (the .mod's cards: part 1 and part 4 on joints 150 + 151, part 2 on 152, part 3 on 153) to 0 or 1; the part
// set the claw pass picks with it (0xfc6520: 0 set 1, 1 set 5, 2 set 6) draws them. So what shows:
//   0 (and dead, vt+0x3f4): every card joint at 0 -- NO card (the folded wings; Raven's Away);
//   1: joints 150 / 151 at 1, 152 / 153 at 0, set 5 = part 4 alone -- the wings OUT;
//   2: FLAPPING, two card sets in turn every 2 frames on the +0x40 count (1 a frame, 0xfc5e54 -> 0x7264c; at >= 2.0
//      the +0x58 bit 1 flips, 0xfc6860..0xfc6884), beginning with the first: part 2 (joint 152) for 2 frames, then
//      parts 1, 3, 4 (joints 150, 151, 153) for 2 -- period 4. (Bit 1 also turns joints 150 / 151 by a small swing on
//      the +0x44 count, period 18 (0xfc70d4..0xfc7434, 0x7237c) while they are at 0 -- not drawn.)
// `clips`: the value under each of his motions (the phase that sets the motion); a clip no action of his was seen to play
// is not listed, and there the viewer's Wings row decides. L4 M8 is 1 in his 1:0x2 (the landing on her) and 2 in 3:0x33.
export const ROM_WINGS = {
  em076_00: {
    flap: { half: 2, parts: [[2], [1, 3, 4]] }, out: [4], parts: [1, 2, 3, 4],
    folded: [
""" + fmt(by[0]) + """
    ],
    out1: [
""" + fmt(by[1]) + """
    ],
    flapping: [
""" + fmt(by[2]) + """
    ],
  },
};
// the wing parts drawn at a frame of one of his clips ('<list>|Motion[N]', the frame over the whole slot), or null where
// the ROM table has no value (the row decides)
export function wingPartsAt(monId, list, clip, frame){
  const w = ROM_WINGS[monId];
  if (!w) return null;
  const k = String(list) + '|' + String(clip).replace(/_(start|loop)$/, '');
  if (!w._by){ w._by = {}; for (const x of w.folded) w._by[x] = 0; for (const x of w.out1) w._by[x] = 1; for (const x of w.flapping) w._by[x] = 2; }
  const v = w._by[k];
  if (v === undefined) return null;
  if (v === 0) return [];
  if (v === 1) return w.out.slice();
  return w.flap.parts[Math.floor(Math.max(0, frame) / w.flap.half) % w.flap.parts.length].slice();
}
export function wingStateOf(monId, list, clip){
  const w = ROM_WINGS[monId];
  if (!w) return null;
  wingPartsAt(monId, list, clip, 0);
  const v = w._by[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  return v === undefined ? null : v;
}

"""
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
anchor = "// HIS OWN DECISIONS WHILE HE RIDES (Raven, 2026-10-17"
assert s.count(anchor) == 1 and 'export const ROM_WINGS' not in s
s = s.replace(anchor, block + anchor)
old = """set [+0xcac0]+0x49 to 0, 1 or 2 (0xfc6520: sets 1 / 5 / 6); the viewer keeps Raven's Wings Away (partsOff), as on
//     solo Seltas -- the per-answer values are in the spec."""
new = """set [+0xcac0]+0x49 to 0, 1 or 2 -- drawn from ROM_WINGS by his clip and frame; `partsOff` (Raven's Away) only where
//     ROM_WINGS has no value."""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print(len(rows), {k: len(v) for k, v in by.items()})
