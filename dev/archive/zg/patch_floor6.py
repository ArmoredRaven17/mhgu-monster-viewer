# patch_floor6.py: the viewer side of 0x41c88 -- the floor block's two floats, and the Ground types G / H (2026-10-20)
import io, os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs')
def patch(P, reps):
    t = io.open(P, encoding='utf8', newline='').read()
    nl = '\r\n' if t.count('\r\n') > t.count('\n') / 2 else '\n'
    for a, b in reps:
        a = a.replace('\n', nl); b = b.replace('\n', nl)
        assert t.count(a) == 1, (P, a[:60]); t = t.replace(a, b)
    io.open(P, 'w', encoding='utf8', newline='').write(t)
patch('render/rom/effect/host.js', [
("""  setFloor(flags = 0, attr = 0){
    this.floor = { flags: flags >>> 0, attr: attr & 0xff };
    for (const P of this.parents){ this.m.w32(P + 0x1068, this.floor.flags); this.m.w8(P + 0x1066, this.floor.attr); }
  }""",
"""  // and the two floats +0x1074 / +0x1078 that 0x41c74's flag-6 arm compares (0x41c88: [+0x1074] - [+0x1078] > 5.0 -> MASK2 5, else 0x11;
  // READ 2026-10-20, recorded and lifted -- what the game writes there is NOT read: the Ground control's types give the two sides)
  setFloor(flags = 0, attr = 0, f74 = 0, f78 = 0){
    this.floor = { flags: flags >>> 0, attr: attr & 0xff, f74: +f74 || 0, f78: +f78 || 0 };
    for (const P of this.parents) this.writeFloor(P);
  }
  writeFloor(P){
    const m = this.m, f = this.floor;
    m.w32(P + 0x1068, f.flags >>> 0); m.w8(P + 0x1066, f.attr & 0xff); m.wf32(P + 0x1074, f.f74 || 0); m.wf32(P + 0x1078, f.f78 || 0);
  }"""),
("""    m.w32(P + 0x1068, this.floor.flags >>> 0); m.w8(P + 0x1066, this.floor.attr & 0xff);   // the ground type (setFloor)""",
 """    this.writeFloor(P);   // the ground type (setFloor)"""),
("""    this.floor = { flags: 0, attr: 0 };""", """    this.floor = { flags: 0, attr: 0, f74: 0, f78: 0 };"""),
])
patch('render/rom/effect/live.js', [
("""let floorDefault = { flags: 0, attr: 0 };""", """let floorDefault = { flags: 0, attr: 0, f74: 0, f78: 0 };"""),
("""export function setEffectFloor(flags = 0, attr = 0){
  floorDefault = { flags: flags >>> 0, attr: attr & 0xff };
  for (const rt of LIVE_RUNTIMES) if (rt.host) rt.host.setFloor(floorDefault.flags, floorDefault.attr);""",
"""export function setEffectFloor(flags = 0, attr = 0, f74 = 0, f78 = 0){
  floorDefault = { flags: flags >>> 0, attr: attr & 0xff, f74: +f74 || 0, f78: +f78 || 0 };
  for (const rt of LIVE_RUNTIMES) if (rt.host) rt.host.setFloor(floorDefault.flags, floorDefault.attr, floorDefault.f74, floorDefault.f78);"""),
("""    host.setFloor(floorDefault.flags, floorDefault.attr);""", """    host.setFloor(floorDefault.flags, floorDefault.attr, floorDefault.f74, floorDefault.f78);"""),
])
patch('index.html', [
("""  { key: 'g40',   label: 'Ground F (0x40)',         flags: 0x40,     attr: 0 },
];""",
"""  { key: 'g40',   label: 'Ground F (0x40)',         flags: 0x40,     attr: 0 },
  // flag 6 (0x41c88, READ and lifted 2026-10-20): [+0x1074] - [+0x1078] > 5.0 -> MASK2 5, else 0x11 -- the two sides as two types.
  // Bit 1 (0x2) stands for the pair: 0x41c74 and Tigrex's ctl+0x29 test & 6; what tells 2 from 4 elsewhere is NOT read
  { key: 'g2deep',    label: 'Ground G (0x2, gap > 5)',  flags: 0x2, attr: 0, f74: 100, f78: 0 },
  { key: 'g2shallow', label: 'Ground H (0x2, gap <= 5)', flags: 0x2, attr: 0, f74: 0,   f78: 0 },
];"""),
("""  setEffectFloor(g.flags, g.attr);""", """  setEffectFloor(g.flags, g.attr, g.f74 || 0, g.f78 || 0);"""),
])
print('ok')
