# ins071b.py (2026-10-19): Chaotic Gore Magala (em071_05) and Shagaru Magala (em072_00) -- SHELL_DATA, the (7, 0x64) probe at the
# point, the counter input
import subprocess, sys
BS = chr(92)
def blocks(mon):
    out = subprocess.check_output([sys.executable, 'gen071.py', mon], text=True)
    return {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def body(B, nn):
    lines = B[nn].split('\n')
    return '\n'.join(lines[:-1]), lines[-1].split('hitdata: ')[1].rstrip(' },')
def folder(mon, nn): return "'shell" + BS + BS + "em" + BS + BS + mon + "_shell%s'" % nn
def data(mon, name, ids, clist, rows):
    B = blocks(mon)
    U = "{ 0: { list: 'u', pel: '%su' } }" % mon
    UC = "{ 0: { list: 'u', pel: '%su' }, 1: { list: 'c', pel: '%s' } }" % (mon, clist)
    m00, hd00 = body(B, '00'); m01, hd01 = body(B, '01'); m03, hd03 = body(B, '03'); m11, hd11 = body(B, '11')
    return ("SHELL_DATA.%s = {\n  name: '%s',\n  lists: %s,\n  shells: {\n" % (mon, name, UC) +
      "    shell00: { id: 0x%x, cls: 'uShellEm071_sp_00', base: 'base00', reader: 0xfc1a44, folder: %s, lists: %s,\n      modes: {\n%s\n      },\n      hitdata: %s },\n" % (ids[0], folder(mon, '00'), U, m00, hd00) +
      "    shell01: { id: 0x%x, cls: 'uShellEm071_sp_01', base: 'base01', reader: 0xfc2500, folder: %s, lists: %s,\n      modes: {\n%s\n      },\n      hitdata: %s },\n" % (ids[1], folder(mon, '01'), UC, m01, hd01) +
      "    shell03: { id: 0x%x, cls: 'uShellEm071_sp_03', base: 'base03', reader: 0xfc2ad8, folder: %s, lists: %s,\n      modes: {\n%s\n      },\n      hitdata: %s },\n" % (ids[2], folder(mon, '03'), U, m03, hd03) +
      "    shell11: { id: 0x%x, cls: 'uShellEm071_sp_11', base: 'base11', reader: 0xfc333c, folder: %s, lists: %s,\n      modes: {\n%s\n      },\n      hitdata: %s },\n" % (ids[3], folder(mon, '11'), U, m11, hd11) +
      "  },\n  actions: [\n" + rows + "  ],\n};\n")
COMMON = (
"    act071(7, 0x2c, '2', 'Motion[52]', [{ frame: 84, shell: 'shell00', mode: 0 }]),\n"
"    act071(2, 0x12, '1', 'Motion[8]', [{ frame: 90, shell: 'shell01', mode: 13, near: 900 }]),\n"
"    act071(2, 0x23, '1', 'Motion[13]', [{ frame: 90, shell: 'shell01', mode: 13, near: 900 }]),\n"
"    ...[0x00, 0x03, 0x0b, 0x0d].map(n => act071(3, n, '1', 'Motion[1]', [{ frame: 64, shell: 'shell01', mode: 12, near: 900 }])),\n"
"    // (7, 0x50) 0xfbb438: L4 M1 at 104 / 138 / 192 sp_03 8 / 9 / 10 at the target (modes outside mask 0x3870)\n"
"    act071(7, 0x50, '4', 'Motion[1]', [104, 138, 192].map((frame, i) => ({ frame, shell: 'shell03', mode: 8 + i, target: 'target' }))),\n"
"    act071(7, 0x08, '2', 'Motion[48]', [{ frame: 108, shell: 'shell11', mode: 4 }]),\n"
"    ...[0x52, 0x58, 0x59].map(n => act071(7, n, '2', 'Motion[7]', [{ frame: 114, shell: 'shell11', mode: 1, probe: true }])),\n"
"    act071(7, 0x5b, '2', 'Motion[7]', [{ frame: 114, shell: 'shell11', mode: 2, probe: true }]),\n"
"    act071(7, 0x60, '2', 'Motion[37]', [{ frame: 114, shell: 'shell11', mode: 2, probe: true }]),\n"
"    // (7, 0x55) 0xfbb6e0 / (7, 0x56) 0xfbc084: L4 M15 at 30 / L4 M7 at 64 sp_00 1 / 2 from the zero setup; they land on the ground\n"
"    // and make their children there (0xfc2114: sp_11 0 -> three sp_03 7; sp_01 0)\n"
"    act071(7, 0x55, '4', 'Motion[15]', [{ frame: 30, shell: 'shell00', mode: 1 }]),\n"
"    act071(7, 0x56, '4', 'Motion[7]', [{ frame: 64, shell: 'shell00', mode: 2 }]),\n")
F = lambda st, n, l, c, fr, at, g: "    act071(%d, 0x%02x, '%s', 'Motion[%d]', [%s]),\n" % (st, n, l, c, ', '.join("{ frame: %d, foot: { at: [%d, %.1f, %.1f]%s } }" % (f_, a[0], a[1], a[2], ', gauge: true' if g else '') for f_, a in zip(fr, at)))
def foot(rows, g):
    return ''.join(F(7, n, l, c, fr, at, g) for (n, l, c, fr, at) in rows)
CHA_FOOT = [(0x07, '2', 33, [60], [(0, -290, 1420)]), (0x34, '2', 33, [60], [(0, -290, 1420)]), (0x37, '2', 33, [60], [(0, -290, 1420)]),
            (0x69, '4', 20, [94], [(0, -290, 1420)]), (0x1a, '2', 28, [1], [(0, 300, 1400)]), (0x1c, '2', 31, [65], [(0, -800, 2400)]),
            (0x1e, '2', 29, [1], [(0, 300, 1400)]), (0x36, '2', 29, [1], [(0, 300, 1400)]),
            (0x2f, '2', 25, [1], [(73, -300, 2400)]), (0x30, '2', 57, [1], [(73, -300, 2400)])]
SHA_FOOT = [(n, '2', 33, [60, 60], [(0, 290, 1350), (0, -290, 1420)]) for n in (0x07, 0x34, 0x37)] + [
            (0x69, '4', 20, [60, 60], [(0, 290, 1350), (0, -290, 1420)]),
            (0x19, '2', 27, [1], [(0, 0, 1200)]), (0x35, '2', 27, [1], [(0, 0, 1200)]),
            (0x1a, '2', 28, [1, 1], [(0, 500, 1300), (0, -600, 1150)]),
            (0x1b, '2', 30, [1, 1], [(63, 0, -1800), (63, -700, -1900)]),
            (0x1c, '2', 31, [25, 65], [(0, 900, 1200), (0, -800, 2400)]),
            (0x1e, '2', 29, [1, 1], [(0, 500, 1300), (0, -600, 1150)]), (0x36, '2', 29, [1, 1], [(0, 500, 1300), (0, -600, 1150)]),
            (0x2f, '2', 25, [16, 1], [(63, 800, 2200), (73, -300, 2400)]), (0x30, '2', 57, [16, 1], [(63, 800, 2200), (73, -300, 2400)]),
            (0x5a, '4', 13, [1, 1], [(63, -200, 700), (63, -800, 600)])]
FOOTNOTE = ("    // THE FOOTFALL DUST (foot071, 0xfb700c): sp_01 1 on the ground under a point by a joint (0: his block point); (7, 0x1e / 0x36)'s\n"
            "    // phase 2 replays L2 M29 with other points (%s) -- the viewer's clip is phase 1's: NOT BUILT, named\n")
CHA = (COMMON +
"    // (7, 9) 0xfb75f8 / (7, 0x32) 0xfbb438: sp_03 0 at the target; Chaotic's three ahead are modes 4 / 5 / 6 (mask 0x3870)\n"
"    act071(7, 0x09, '2', 'Motion[4]', [{ frame: 76, shell: 'shell03', mode: 0, target: 'target' }]),\n"
"    act071(7, 0x32, '2', 'Motion[6]', [116, 148, 202].map((frame, i) => ({ frame, shell: 'shell03', mode: 4 + i, target: 'ahead' }))),\n"
"    // (7, 0x2a) / (7, 0x6b) 0xfba890: sp_11 3 (mode 5 when P+0x1a2 == 1 -- that byte's writer before the action NOT READ: mode 3 built)\n"
"    act071(7, 0x2a, '2', 'Motion[50]', [{ frame: 138, shell: 'shell11', mode: 3 }]),\n"
"    act071(7, 0x6b, '4', 'Motion[24]', [{ frame: 138, shell: 'shell11', mode: 3 }]),\n"
"    act071(7, 0x67, '4', 'Motion[22]', [{ frame: 160, shell: 'shell11', mode: 2, probe: true }]),\n"
"    // (7, 0x64) 0xfbc4ec: L4 M30 at 124 the ray from 950 ahead (y + 0, mask 0x40); a hit within 500 below him -> sp_11 6 AT THE GROUND\n"
"    // POINT with his words (and the counter C+0x84 = 0 after: the viewer's input does not change)\n"
"    act071(7, 0x64, '4', 'Motion[30]', [{ frame: 124, shell: 'shell11', mode: 6, probe: { up: 0, at: true } }]),\n" +
FOOTNOTE % "(0, -600, 1800)" + foot(CHA_FOOT, True))
SHA = (COMMON +
"    // (NOT BUILT, named: (7, 9) sp_03 0, (7, 0x32) sp_03 11..13 and (7, 0x64) sp_11 6 -- modes his files do not carry; (7, 0x2a) /\n"
"    // (7, 0x6b): 0xfba890 makes nothing for em 0x48)\n" +
FOOTNOTE % "(0, -600, 1650), (0, 500, 1800)" + foot(SHA_FOOT, False))
d = data('em071_05', 'Chaotic Gore Magala', (0x131, 0x132, 0x133, 0x134), 'em071_00c', CHA) + '\n' + \
    data('em072_00', 'Shagaru Magala', (0x135, 0x136, 0x137, 0x138), 'em072_00c', SHA) + '\n'
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
s = s.replace(anchor, d + anchor)
reps = [
  ("""    if (sp.probe){
      const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
      const px = f(O[0] + mla(f(cs * f(0.0)), sn, f(950.0))), pz = f(mls(f(cs * f(950.0)), sn, f(0.0)) + O[2]);
      const h = ground022([px, f(f(O[1] + f(0.0)) + f(500.0)), pz], ctx.stage);
      if (h == null || !(f(O[1] - h) < f(500.0))) continue;
    }""", """    let at = null;
    if (sp.probe){
      // ({ up: 0, at: true }: (7, 0x64)'s 0xfbc5dc..0xfbc6fc -- the same point at y + 0, the shell made at the ground point)
      const up = sp.probe.up != null ? sp.probe.up : 500.0;
      const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos;
      const px = f(O[0] + mla(f(cs * f(0.0)), sn, f(950.0))), pz = f(mls(f(cs * f(950.0)), sn, f(0.0)) + O[2]);
      const h = ground022([px, f(f(O[1] + f(0.0)) + f(up)), pz], ctx.stage);
      if (h == null || !(f(O[1] - h) < f(500.0))) continue;
      if (sp.probe.at) at = [px, h, pz];
    }"""),
  ("      const S = make001(state, D, sp.shell, { id: D.shells[sp.shell].id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),",
   "      const S = make001(state, D, sp.shell, { id: D.shells[sp.shell].id, mode: sp.mode, position: at || own.ownerPos.slice(), angles: ownerWords001(own),"),
  ("    ctx.soulFlame082 = !!input.soulFlame082;",
   "    ctx.gauge071 = Number.isFinite(input.gauge071) ? f(input.gauge071) : 0;   // Chaotic Gore Magala's counter C+0x84 (foot071)\n    ctx.soulFlame082 = !!input.soulFlame082;"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
