# patch_rank2.py: motion-states.js -- the rank in the state driver (low-rank break rows, Thunderlord's puff, the class timers) and
# Chaotic Gore's Gauge control with the six gauge-gated ring fills (effects lane, 2026-10-20)
import io, os
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
t = io.open(P, encoding='utf8', newline='').read()
def rep(a, b):
    global t
    assert t.count(a) == 1, (a[:80], t.count(a))
    t = t.replace(a, b)

# 1. the low-rank override of a row / a cycle arm
rep("""      if (spec && spec.level != null && (spec.level | 0) !== (user.level | 0)) spec = {};""",
    """      if (spec && spec.level != null && (spec.level | 0) !== (user.level | 0)) spec = {};
      // `lowRank: {...}` -- the row (or cycle arm) at quest rank <= 4 (0x3a8430 <= 4: the part pass reads the .dtp row's byte +1 there,
      // byte +2 above; the Quest Rank control, index.html shellQuestRank): its fields replace the G ones (Gravios's back / head,
      // Agnaktor's chest / tail, Great Maccao's tail)
      if (spec && spec.lowRank && ((user.rank == null ? 5 : user.rank) | 0) <= 4) spec = Object.assign({}, spec, spec.lowRank);""")

# 2. the rows
rep("""const G_BACK   = { levels: [[17], [17], [18]],
                   fire: [null, ['em005_00u', 1000], ['em005_00u', 1001]] };""",
    """const G_BACK   = { levels: [[17], [17], [18]],
                   fire: [null, ['em005_00u', 1000], ['em005_00u', 1001]],
                   // below G the row's threshold is 1 (2.2): set 18 at level 1, u 1000 (the Quest Rank control, 2026-10-20)
                   lowRank: { levels: [[17], [18]], fire: [null, ['em005_00u', 1000]] } };""")
rep("""    '3|Motion[102]': { levels: [[3], [3], [4]],
                       fire: [null, ['em005_00u', 1025], ['em005_00u', 1026]] },""",
    """    '3|Motion[102]': { levels: [[3], [3], [4]],
                       fire: [null, ['em005_00u', 1025], ['em005_00u', 1026]],
                       lowRank: { levels: [[3], [4]], fire: [null, ['em005_00u', 1025]] } },""")
rep("""    '3|Motion[1]':  { cycle: [{ levels: [[7], [7], [7], [8]], at: 3, fire: [null, null, ['em049_00u', 1006], null] },
                              { levels: [[17], [17], [18]], at: 2, fire: [null, ['em049_00u', 1035], null] }] },""",
    """    '3|Motion[1]':  { cycle: [{ levels: [[7], [7], [7], [8]], at: 3, fire: [null, null, ['em049_00u', 1006], null],
                                lowRank: { levels: [[7], [7], [8]], at: 2, fire: [null, null, ['em049_00u', 1006]] } },
                              { levels: [[17], [17], [18]], at: 2, fire: [null, ['em049_00u', 1035], null],
                                lowRank: { levels: [[17], [18]], at: 1, fire: [null, ['em049_00u', 1035]] } }] },""")
rep("""                              { levels: [[5], [5], [5], [6]], at: 3, fire: [null, null, null, null] }] },""",
    """                              { levels: [[5], [5], [5], [6]], at: 3, fire: [null, null, null, null],
                                // below G: level 2, u 1011 (the record only low / high rank asks for)
                                lowRank: { levels: [[5], [5], [6]], at: 2, fire: [null, null, ['em085_00u', 1011]] } }] },""")

# 3. Thunderlord's puff: his own u 250 at G, the shared u 1121 below (states-em057_00.md 7.3 / 5.6)
rep("""  em057_04: { period: 30, joint: 2, records: [['em057_04u', 250, 'UNIQUE'], ['em057_04u', 250, 'UNIQUE']], pick: () => 0 },""",
    """  em057_04: { period: 30, joint: 2, records: [['em057_04u', 250, 'UNIQUE'], ['em057_04u', 1121]],
              // the Quest Rank control (2026-10-20): at G (0x3a8430 > 4) his class's own id 1008 = u 250, below it the shared u 1121
              pick: (q, user) => ((user && user.rank != null ? user.rank : 5) | 0) > 4 ? 1 : 0 },""")

# 4. the class timers' input: the rank and the quest level
rep("""                level: user.level | 0, fresh: k.fresh };""",
    """                level: user.level | 0, fresh: k.fresh, rank: user.rank == null ? 5 : user.rank | 0, ctl2Raw: user.classCtl2 | 0 };""")

# 5. Chaotic Gore's Gauge control
rep("""export const CLASS_CONTROLS2 = {
""", """export const CLASS_CONTROLS2 = {
  // CHAOTIC GORE MAGALA's control-block counter C+0x84 (approved 2026-10-20; READ: it accumulates per frame from the hunters around him,
  // 0xfae824's loop over four (0xfaead8 / 0xfaecbc / 0xfaed60), capped by a rank value (0xfaee10..0xfaee44); his readers test it
  // against the tier table 0x16a1294 = 5000 / 10000 / 20000 at every rank class). At 20000 (and G rank) his footfall dust (shells.js
  // foot071, input.gauge071) and six extra slot-ring fills (GORE_FILLS `gauge`) run. The values are the steps the ROM tests.
  em071_05: { key: 'gauge071', label: 'Gauge (C+0x84)', options: [[0, '0'], [1, '5000'], [2, '10000'], [3, '20000']],
              title: 'Chaotic Gore Magala\\'s counter C+0x84 (the hunters around him): at 20000 and G rank his footfall dust and six extra slot-ring fills run. Working names.' },
""")

# 6. the six gauge-gated fills (Chaotic, G rank, C+0x84 >= every tier: 0xfb6780..0xfb681c and the same shape at each site)
rep("""function goreFills(t, c, pel, variant){
  const out = [], row = GORE_FILLS[c.list + '|' + c.slot];""",
    """// CHAOTIC's six gauge fills (variant 5, quest rank 5, C+0x84 >= 5000 and 10000 and 20000; traced with the gauge preset, a positive
// control at 20000 and none at 19999 or at rank 3): [frame, offset, s0, s1, flag, actions]
const GORE_GAUGE_FILLS = {
  '2|33': { acts: goreActs(7, 7, 0x34, 0x37), nullOk: true, fills: [[150, [290, 0, 920], 500, 480, 0]] },      // 0xfb6988
  '4|20': { acts: goreActs(7, 0x69), nullOk: true, fills: [[184, [290, 0, 920], 500, 480, 0]] },
  '2|27': { acts: goreActs(7, 0x19, 0x35), nullOk: true, fills: [[85, [600, 0, 900], 500, 480, 1]] },          // 0xfb855c
  '2|30': { acts: goreActs(7, 0x1b), nullOk: true, fills: [[90, [500, 0, -1600], 500, 480, 0]] },              // 0xfb8924
  '2|31': { acts: goreActs(7, 0x1c), nullOk: true, fills: [[115, [900, 0, 1600], 500, 480, 0]] },              // 0xfb8e4c
  '2|25': { acts: goreActs(7, 0x2f), nullOk: true, fills: [[63, [1000, 0, 1400], 500, 480, 0]] },              // 0xfbb0b0
  '2|57': { acts: goreActs(7, 0x30), nullOk: true, fills: [[63, [1000, 0, 1400], 500, 480, 0]] },              // copy A (7, 0x30); B (2, 0x3f) none
  '4|13': { acts: goreActs(7, 0x5a), nullOk: true, fills: [[70, [-900, 0, 550], 500, 480, 1]] },               // 0xfbc3e8
};
const GAUGE071_STEP = [0, 5000, 10000, 20000];
function goreFills(t, c, pel, variant){
  const out = [], row = GORE_FILLS[c.list + '|' + c.slot];
  // Chaotic at G with the gauge at its top tier: his own extra fills (each a separate site of the same action)
  const gRow = variant === 5 && c.rank >= 5 && GAUGE071_STEP[c.ctl2Raw] >= 20000 ? GORE_GAUGE_FILLS[c.list + '|' + c.slot] : null;
  if (gRow && !c.dead){
    const prevG = c.fresh ? -1 : (t.gg == null ? -1 : t.gg);
    const act = c.action ? c.action[0] + ',' + c.action[1] : null;
    if (act ? gRow.acts.includes(act) : gRow.nullOk)
      for (const [F, offset, s0, s1, flag] of gRow.fills)
        if (F > prevG && F <= c.frame) out.push([pel, 30, 'UNIQUE', { ring: { offset, s0, s1, flag } }]);
  }
  t.gg = c.frame;""")
rep("""  if (!row || c.dead || (row.notV5 && variant === 5)) return out;""",
    """  if (!row || c.dead || (row.notV5 && variant === 5)){ t.gf = c.frame; return out; }""")
rep("""                                        '0|Motion[5]', '0|Motion[31]', '2|Motion[52]'].map(k => [k, ['A', 'B']]));""",
    """                                        '0|Motion[5]', '0|Motion[31]', '2|Motion[52]', '2|Motion[57]'].map(k => [k, ['A', 'B']]));""")
io.open(P, 'w', encoding='utf8', newline='').write(t)
Q = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js'
u = io.open(Q, encoding='utf8', newline='').read()
a = """    '2|Motion[52]': [{ action: [7, 0x33] }, { action: [7, 0x2c], variant: 'B' }] }])),"""
assert u.count(a) == 1
u = u.replace(a, """    '2|Motion[52]': [{ action: [7, 0x33] }, { action: [7, 0x2c], variant: 'B' }],
    // L2 M57 (2026-10-20): A (7, 0x30) -- Chaotic's gauge fill at f63 (0xfbb0b0) -- B (2, 0x3f), which makes none (goretrace.py)
    '2|Motion[57]': [{ action: [7, 0x30] }, { action: [2, 0x3f], variant: 'B' }] }])),""")
io.open(Q, 'w', encoding='utf8', newline='').write(u)
print('ok')
