# Writes gapG/shells.patched.js: a COPY of docs/render/shells.js with the leg-snow transcription (RESULT.md section b) applied and its
# three relative imports pointed at the repo. The repo file is only read. Each edit is anchored on a line that occurs exactly once.
import re, sys, os
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shells.patched.js')
s = open(SRC, encoding='utf-8').read()

def once(old, new):
    global s
    n = s.count(old)
    if n != 1: sys.exit('anchor found %d times: %r' % (n, old[:90]))
    s = s.replace(old, new)

# (1) owner001: the leg rows shown
once("""           trunkSnow083: fin(input.trunkSnow083) ? input.trunkSnow083 | 0 : null };""",
"""           trunkSnow083: fin(input.trunkSnow083) ? input.trunkSnow083 | 0 : null,
           // Gammoth's / Elderfrost's leg snow (render/shells.js make083row legSnow083: 0x1053d8c's gate on snow slots 0..3), the levels
           // the leg rows SHOW (motion-states.js legSnow083)
           legSnow083: Array.isArray(input.legSnow083) && input.legSnow083.length === 4 && input.legSnow083.every(fin) ? input.legSnow083.map(v => v | 0) : null };""")

# (2) spawn083's fresh step: a new play starts with no leg shed
once("""    if (a.turn083) turn083(state, D, own, ctx.J, ...a.turn083);""",
"""    state.leg083 = null;                                                 // the legs shed in this play (make083row legSnow083)
    if (a.turn083) turn083(state, D, own, ctx.J, ...a.turn083);""")

# (3) make083row: the legSnow083 kind
once("""    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || sp.kind === 'turnShot' || sp.shell === 'shell00_03', target: sp.shell === 'shell13' || sp.shell === 'shell00' });""",
"""    if (sp.kind === 'legSnow083'){
      // THE LEG SNOW (READ whole, 2026-10-20; dev/em083-shells-spec.md): 0x105fd94(e), each update of (7, 0 / 1 / 0x32) phase 1
      // (0x1057224), (7, 5 / 6) phase 1 (0x105781c), (7, 0x5a / 0x5b) phase 1 (0x1059e3c), (7, 0x5c / 0x5d) phase 2 (0x1059f70) and
      // (7, 0x70 / 0x71) phase 1 (0x105b4bc), its only callers. It asks 0x1053710(e, &leg0, &leg1, &leg2, &leg3): by the action number
      // e+0x73e1 alone, at each of its frames (0xb0968(e, 0, 0, F, 0.0), tune floats 0x45..0x52 / 0x89) one leg's hit, 0x1053d8c(e, part
      // 2..5, dmg = a tune int, variant 4 its own) -> that leg's flag. Each flag set: part break level 0 (0x9d36c) -> sp_01 3 + leg
      // (e+0xcae4) at the block's point and words (+0x10 = block +0x40, +0x20 the zero vector, +0x30 = block +0x50..+0x58, +0x3c 0xffff:
      // 0x1060e28's setup); then, made or not, 0x1054624(e, leg, 0): next = 0 (base 0 too when e+0x7420), 0x105413c packs the bases.
      // 0x1053d8c (READ whole): a slot at 0 / 4 -> 0. Variant 0: dmg >= 1 zeroes the part's durability (s16 P+0x3c0 + 12 part) and
      // breaks; dmg 0 breaks only a durability already <= 0 -- not an input, taken > 0 (INFERRED). Variant 4: a slot at 1 breaks at
      // any dmg; at 2 / 3 dmg x the rate [0xba9f0(e, 2)+0xc] comes off the durability -- not an input, dmg > 0 taken to break (INFERRED,
      // armour083's rule). The slot is the leg's row SHOWN (input.legSnow083); a leg at 1..3 has break level 0 (0x105006c forces its
      // slot to 4 while it is broken, states-em083_00.md 4.6). Once shed the leg is at 0 for the rest of the play (state.leg083).
      const L = own.legSnow083, mode = 3 + sp.leg, v4 = state.monId === 'em083_04';
      if (!L){ out.refused.push({ action: a.action, shell: 'shell01', mode, why: 'no leg snow levels (input.legSnow083)' }); return; }
      const shed = state.leg083 || (state.leg083 = [false, false, false, false]);
      const lv = shed[sp.leg] ? 0 : L[sp.leg], dmg = sp.dmg[v4 ? 1 : 0];
      if (!(lv === 1 || lv === 2 || lv === 3) || !(v4 ? (lv === 1 || dmg > 0) : dmg >= 1)) return;
      shed[sp.leg] = true;                                                 // 0x1054624(e, leg, 0)
      const miss = missing001(own, { facing: true, pos: true });
      if (miss){ out.refused.push({ action: a.action, shell: 'shell01', mode, why: miss }); return; }
      const def = D.shells.shell01;
      const S = make001(state, D, 'shell01', { id: def.id, mode, position: own.ownerPos.slice(), angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0],
                                               action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
      return;
    }
    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || sp.kind === 'turnShot' || sp.shell === 'shell00_03', target: sp.shell === 'shell13' || sp.shell === 'shell00' });""")

# (4) the rows: Gammoth's (Elderfrost inherits every list-2 row but L2 M23's)
once("""const SNOWBALL083 = m => [{ frame: 220, shell: 'shell13', mode: m }, { frame: 266, kind: 'release' }];""",
"""const SNOWBALL083 = m => [{ frame: 220, shell: 'shell13', mode: m }, { frame: 266, kind: 'release' }];
// THE LEG SNOW (0x105fd94 / 0x1053710; make083row legSnow083): { frame (a tune float), leg (0..3 = part 2..5 = snow slot = sp_01 mode
// 3..6 on joint 7 / 11 / 14 / 17), dmg [variant 0's tune int, variant 4's] }. Census with the slots at 2: scratchpad gapG/cen_legsnow.py
const LEG083 = (frame, leg, d0, d4) => ({ frame, kind: 'legSnow083', leg, dmg: [d0, d4] });""")
once("""  act083(0x5a, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 37 }], { also: [[7, 0x5b]] }),""",
"""  // L2 M37 (0x1059c1c phase 1): mode 37 (0x105f4ac) before the legs at 172; floats 0x47 / 0x48 = 170 / 172, ints 0xa / 0xb (v4 0xc / 0xd)
  act083(0x5a, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 37 }, LEG083(170, 0, 500, 500), LEG083(172, 1, 500, 500)], { also: [[7, 0x5b]] }),""")
once("""  act083(0x5c, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 38 }], { also: [[7, 0x5d]] }),""",
"""  // (0x1059e98 phase 2 = L2 M37): floats 0x49 / 0x4a = 170 / 172, ints 0xe / 0xf (v4 0x10 / 0x11)
  act083(0x5c, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 38 }, LEG083(170, 0, 500, 500), LEG083(172, 1, 500, 500)], { also: [[7, 0x5d]] }),
  // L2 M1 (7, 0 / 0x32; 0x1056a0c phase 1): float 0x45 = 116, int 6 (v4 7); L2 M2 (7, 1): float 0x46 = 100, int 8 (v4 9)
  act083(0x00, 'Motion[1]', [LEG083(116, 0, 500, 500)], { also: [[7, 0x32]] }),
  act083(0x01, 'Motion[2]', [LEG083(100, 1, 500, 500)]),
  // L2 M6 (7, 5 / 6; 0x10576c0 phase 1): floats 0x4b..0x52 = 208 / 216 / 230 / 260 / 268 / 310 / 388 / 390 on parts 3 / 2 / 4 / 3 / 5 /
  // 2 / 2 / 3, ints 0x12..0x19 = 500 / 0 / 500 / 0 / 500 / 500 / 0 / 0 (v4 0x1a..0x21 = 500 / 0 / 0 / 0 / 0 / 500 / 0 / 0)
  act083(0x05, 'Motion[6]', [LEG083(208, 1, 500, 500), LEG083(216, 0, 0, 0), LEG083(230, 2, 500, 0), LEG083(260, 1, 0, 0), LEG083(268, 3, 500, 0),
                             LEG083(310, 0, 500, 500), LEG083(388, 0, 0, 0), LEG083(390, 1, 0, 0)], { also: [[7, 0x06]] }),
  // NOT HERE, by name: sp_01 20 on Gammoth's file (u 60 on joint 157) -- its one maker 0x1060e28 returns unless e+0xb5f5 == 4 and
  // makes the immediate 0x168 (Elderfrost's): 0x163 mode 20 is never made. (7, 0x70 / 0x71) run the leg snow on variant 0 too but
  // set L9 M11 / M14, which em083_00 does not ship (no list 9) and his EMC never asks (scratchpad fb/reach_em083_00.json)""")
# Elderfrost's L9 M11 / M14 (0x105b420 phase 1): the legs (0x105b4bc) before sp_01 30 / 31; float 0x89 = 30, int 0x31 = 80 both variants
once("""  act083v(0x70, '9', 'Motion[11]', [{ frame: 30, shell: 'shell01', mode: 30 }]),""",
"""  // (0x105b420 phase 1: the leg snow 0x105b4bc before sp_01 30 / 31; float 0x89 = 30, int 0x31 = 80 -- 0x70 part 2, 0x71 part 3)
  act083v(0x70, '9', 'Motion[11]', [LEG083(30, 0, 80, 80), { frame: 30, shell: 'shell01', mode: 30 }]),""")
once("""  act083v(0x71, '9', 'Motion[14]', [{ frame: 30, shell: 'shell01', mode: 31 }]),""",
"""  act083v(0x71, '9', 'Motion[14]', [LEG083(30, 1, 80, 80), { frame: 30, shell: 'shell01', mode: 31 }]),""")

# the copy's imports -> the repo's modules
base = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/'
for m in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'): once("from './%s';" % m, "from '%s%s';" % (base, m))
open(OUT, 'w', encoding='utf-8').write(s)
print('wrote', OUT)
