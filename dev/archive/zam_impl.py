import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(D, 'render', 'motion-states.js')
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:90])
    s = s.replace(a, b)

# setsFrom entries may carry break tables: [frame, sets, tables]
rep("""      for (const [f, ss] of this.cur.spec.setsFrom || []) if (frame >= f) extra.push(...ss);""",
    """      // an entry may carry break TABLES too ([frame, sets, tables]): read at the user's level as a row's `tables` are
      // (Zamtrios's L4 M2 f130: the ice drops onto the break-level sets)
      const shownT = this.cur.rage ? 'enraged' : 'calm';
      for (const [f, ss, tb] of this.cur.spec.setsFrom || []) if (frame >= f){
        extra.push(...ss);
        for (const t of tb || []) extra.push(...t[shownT][userLevel(t.calm, this.table, this.userDrawn)]);
      }""")

# the rows, applied after MOTION_STATES (as CLIP_VARIANTS' copies are)
rep("""// the copies' own rows: B is the shock trap's hold""", """// ZAMTRIOS'S FORMS (dev/em067-forms-spec.md; Raven, 2026-10-17: "when it enters Blob Form, it turns off the leg parts ...
// ensure we use the correct form Normal/Armor or Blob for Zamtrios animations" -- and "follow the ROM, don't take my word for
// everything"). The part pass 0xf768c0 draws, by the form byte: normal (set 0 + mouth 10), ice armour (+ 11 / 12 / 13 and the
// ice break sets), blob (set 16: groups 0, 8, 10, 100, 101 -- the HIND LEGS AND LOWER BODY, group 9 / 109, OFF -- mouth off
// 17, no ice). The FRONT LEGS stay drawn in every form. The FORM IS NOT THE CLIP'S: the command table and the reaction
// scripts set it, and every status 0-9 handler plays the same motions in all three forms (emulated), so a row forces a
// form only where the ROM does -- blob-only and armour-only clips, the inflate / deflate, the set-31 frame windows of the
// motion switch 0xf76088 -- and keeps the balloon off the clips that never show it (Z_NOT_BLOB). One-rung tables always
// give their sets; two-rung tables pick the user's break level.
const Z_LV = (a, b) => ({ calm: b ? [a, b] : [a], enraged: b ? [a, b] : [a] });
const Z_NOT_BLOB = [Z_LV([0, 10])];                                        // the normal body + mouth; the ice is the user's
const Z_NOICE_BRK = [Z_LV([2], [22]), Z_LV([3], [18]), Z_LV([6], [21])];   // tail / head / fin, ice off
const Z_ICE_BRK = [Z_LV([14], [28]), Z_LV([15], [23]), Z_LV([32], [21])];  // tail / head / fin, ice on
const Z_BLOB = { sets: [16, 17, 7, 8, 9], tables: Z_NOICE_BRK };          // form 2
const Z_ARMOUR = { sets: [0, 10, 11, 12, 13], tables: Z_ICE_BRK };        // form 1
{
  const t = MOTION_STATES.em067_00, nb = k => Object.assign({}, t[k], { tables: Z_NOT_BLOB });
  // the existing rows: the normal body under their breaks / states (and the blob ailments in the blob body)
  t['0|Motion[4]'] = nb('0|Motion[4]'); t['0|Motion[14]'] = nb('0|Motion[14]'); t['0|Motion[19]'] = nb('0|Motion[19]');
  t['3|Motion[4]'] = nb('3|Motion[4]'); t['3|Motion[13]'] = nb('3|Motion[13]'); t['3|Motion[20]'] = nb('3|Motion[20]');
  t['3|Motion[2]'] = { cycle: t['3|Motion[2]'].cycle.map(c => Object.assign({}, c, { tables: Z_NOT_BLOB })) };
  t['3|Motion[1]'] = { cycle: t['3|Motion[1]'].cycle.map(c => Object.assign({}, c, { tables: Z_NOT_BLOB })) };
  t['3|Motion[100]'] = { cycle: t['3|Motion[100]'].cycle.map(c => Object.assign({}, Z_BLOB, c)) };
  t['4|Motion[1]'] = Object.assign({}, Z_BLOB, t['4|Motion[1]']);
  t['3|Motion[101]'] = Object.assign({}, Z_BLOB, t['3|Motion[101]']);
  Object.assign(t, {
    // BLOB ONLY (form 2)
    '4|Motion[5]': Z_BLOB, '4|Motion[6]': Z_BLOB, '4|Motion[7]': Z_BLOB, '4|Motion[8]': Z_BLOB, '4|Motion[9]': Z_BLOB,
    '4|Motion[10]': Z_BLOB, '4|Motion[12]': Z_BLOB, '4|Motion[37]': Z_BLOB, '4|Motion[38]': Z_BLOB, '4|Motion[66]': Z_BLOB,
    '3|Motion[102]': Z_BLOB, '3|Motion[106]': Z_BLOB, '3|Motion[107]': Z_BLOB, '3|Motion[108]': Z_BLOB,
    // the bloated death / capture / sleep fall and the bloated pit -- the eye flips to 30 as on L3 M17 / M20
    '3|Motion[103]': { dead: true, sets: [30, 16, 17, 7, 8, 9], tables: Z_NOICE_BRK },
    '3|Motion[109]': { dead: true, sets: [30, 16, 17, 7, 8, 9], tables: Z_NOICE_BRK },
    // THE INFLATE (10, 0xaf) from the armour: normal body + ice to f119, the balloon from f120, the ice gone from f130 (onto
    // the user's break levels)
    '4|Motion[2]': Object.assign({}, Z_ARMOUR, { setsFrom: [[120, [16, 17]], [130, [7, 8, 9], Z_NOICE_BRK]] }),
    // THE DEFLATE: the balloon WITH the hind legs (set 31) to f373, then the normal body; no ice
    '4|Motion[3]': { sets: [31, 17, 7, 8, 9], tables: Z_NOICE_BRK, setsFrom: [[374, [0, 10]]] },
    '4|Motion[4]': { sets: [0, 10, 7, 8, 9], tables: Z_NOICE_BRK },
    // ARMOUR ONLY (form 1); L4 M30's spike plates (groups 21 / 22) on f146..220
    '2|Motion[9]': Z_ARMOUR, '2|Motion[10]': Z_ARMOUR, '2|Motion[21]': Z_ARMOUR, '4|Motion[67]': Z_ARMOUR, '4|Motion[68]': Z_ARMOUR,
    '4|Motion[30]': Object.assign({}, Z_ARMOUR, { setsFrom: [[146, [29]], [221, [11]]] }),
    // THE SECOND BLOAT SHAPE (set 31) on the frames the motion switch names, over the user's form. (L2 M18 plays in all three
    // forms and in blob the ROM shows set 16 throughout -- this row is exact at Normal / Ice Armor only.)
    '2|Motion[14]': { sets: [31, 17] }, '2|Motion[15]': { sets: [31, 17] }, '2|Motion[16]': { sets: [31, 17] },
    '2|Motion[17]': { sets: [31, 17] }, '2|Motion[19]': { sets: [31, 17] }, '2|Motion[22]': { sets: [31, 17] },
    '2|Motion[13]': { tables: Z_NOT_BLOB, setsFrom: [[78, [31, 17]], [148, [0, 10]]] },
    '2|Motion[18]': { sets: [31, 17], setsFrom: [[80, [0, 10]]] },
    '2|Motion[23]': { sets: [31, 17], setsFrom: [[38, [0, 10]]] },
    '0|Motion[16]': { tables: Z_NOT_BLOB, setsFrom: [[10, [31, 17]]] },
    '0|Motion[17]': { sets: [31, 17], setsFrom: [[10, [0, 10]]] },
  });
  // NORMAL OR ARMOUR (the user's ice), never the balloon
  for (const k of ['0|Motion[1]', '0|Motion[2]', '0|Motion[5]', '0|Motion[6]', '0|Motion[7]', '0|Motion[8]', '0|Motion[11]',
                   '0|Motion[12]', '0|Motion[13]', '0|Motion[15]', '0|Motion[18]', '0|Motion[20]', '0|Motion[31]', '0|Motion[32]',
                   '0|Motion[33]', '0|Motion[34]', '2|Motion[7]', '2|Motion[8]', '2|Motion[12]', '2|Motion[20]', '3|Motion[6]',
                   '3|Motion[14]', '3|Motion[18]', '3|Motion[19]', '3|Motion[22]', '3|Motion[25]', '3|Motion[27]', '3|Motion[36]',
                   '4|Motion[49]', '4|Motion[50]', '4|Motion[51]', '4|Motion[52]', '4|Motion[55]', '4|Motion[56]', '4|Motion[57]',
                   '4|Motion[58]', '4|Motion[59]', '4|Motion[60]', '4|Motion[61]', '4|Motion[62]', '4|Motion[64]', '4|Motion[65]',
                   '4|Motion[69]', '4|Motion[70]', '4|Motion[72]', '4|Motion[73]', '4|Motion[76]', '4|Motion[89]', '4|Motion[90]',
                   '4|Motion[91]', '4|Motion[92]'])
    t[k] = Object.assign({}, t[k], { tables: Z_NOT_BLOB });
}
// the copies' own rows: B is the shock trap's hold""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

# part-review: the Blob rung of "Blob Mode" draws the ROM's blob set (group 9 / 109 off)
q = os.path.join(D, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
i = t.index('"em067_00": {')
OLD = '0,7,8,9,100,105,107,109|0,7,8,9,100,105,107,109|0,8,9,10,100,101,109'
NEW = '0,7,8,9,100,105,107,109|0,7,8,9,100,105,107,109|0,8,10,100,101'
seg_end = t.index('\n }', i)
seg = t[i:seg_end]
n_old = seg.count('"' + OLD + '"')
assert n_old >= 2, n_old
seg = seg.replace('"' + OLD + '"', '"' + NEW + '"')
seg = seg.replace('"0,8,10,100,101": "Blob (No Legs)"', '"0,8,9,10,100,101,109": "Blob (Legs)"')
t = t[:i] + seg + t[seg_end:]
d = json.loads(t)
row = d['em067_00']['rows']['0,7,8,9,10,100,101,105,107,109']
print(row['default'], row['options'])
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)

# the floor: his ground is the clip origin in every form
r = os.path.join(D, 'index.html')
h = open(r, encoding='utf-8', newline='').read()
a = "const FLOOR_AT_ORIGIN = new Set(['em084_00']);"
assert h.count(a) == 1
h = h.replace(a, """// Zamtrios (em067_00) too: every action sets posture 0 or 4, both pinned to the ground (0xbf284), every clip's reference
// track has Y 0 and P+0x5c is 0 outside the dig -- while the lowest-bone rule followed the fat body's / hind legs' bones the
// visible mesh does not use, 150-480 units low (dev/em067-forms-spec.md 4; Raven, 2026-10-17 "ensure Zamtrios is on the
// grid floor")
const FLOOR_AT_ORIGIN = new Set(['em084_00', 'em067_00']);""")
open(r + '.tmp', 'w', encoding='utf-8', newline='').write(h); os.replace(r + '.tmp', r)
print('ok')
