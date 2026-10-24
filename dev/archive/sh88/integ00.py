import json, re, os
sp = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    assert s.count(old) == cnt, (old[:80], s.count(old))
    s = s.replace(old, new)
run = open(os.path.join(sp, 'run00.js'), encoding='utf-8').read()
a1 = "// ---- NAKARKOS'S ARMS AS SHELL OWNERS (uEmOstgaloaArm): the tentacle-form shells, phase 1 ------------------------------------\n"
rep(a1, run + '\n' + a1)
# the shell00 data
modes = []
cur = None
for line in open(os.path.join(sp, '..', 'ahtal', 'shl088.txt')):
    if line.startswith('=== '):
        cur = line.split()[1]; continue
    m = re.match(r'\s+\[\s*(\d+)\] scale (\S+) ef (\[.*?\]\]) sh (\{.*\}) hit (\[.*?\])', line)
    if m and cur == 'shell00':
        sh = json.loads(m.group(4))
        modes.append("        %s: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (
            m.group(1), float(m.group(2)), m.group(3), m.group(5), json.dumps(sh['ints']), json.dumps(sh['floats']), json.dumps(sh['vecs'])))
BS = '\\\\'
data = ("    // shell00: uShellEm088_sp_00 (vtable 0x1809838), base00 + its own init / reader / +0x158 / +0x168 (params088s00, make088s00).\n"
        "    // Mode 0 the silk ball (u 30 flight, u 32 landing, u 34 on a hit), mode 1 the split child (u 31). hitdata (0, 99) x 2.\n"
        "    shell00: { id: 0x17b, cls: 'uShellEm088_sp_00', base: 'base00', reader: 0x10c34c0, folder: 'shell" + BS + "em" + BS + "em088_00_shell00',\n"
        "      cmn: null,\n      modes: {\n" + '\n'.join(modes) + "\n      },\n      hitdata: [[0, 99], [0, 99]] },\n")
rep("    // shell57: uShellEm088_sp_57 (vtable 0x1809c94), base57;", data + "    // shell57: uShellEm088_sp_57 (vtable 0x1809c94), base57;")
rows = """    // THE SILK BALLS (L2 M26, the motion event table's type 8): (7, 0xf) runs the table selector 17 (one ball crossing f8, +5 deg),
    // (7, 0x15) selector 21 (cad0 12 / 44 / 78 at -25 / +3 / +30 deg) or 36 (cad0 44, +3 deg) -- the selectors the AI streams write
    // before each (EMC op 0xa3 (0, n); the pairing by adjacency: INFERRED); each play the next. Both play L2 M25 -> L2 M26 (x 1 /
    // x 3) -> L2 M27 (0x10c10ac); here the L2 M26 play.
    act088(7, 0x0f, '2', 'Motion[26]', [{ events: true, sets: [{ sel: 17, rows: [{ kind: 1, f: 8, yaw: 5.0 }] }] }]),
    act088(7, 0x15, '2', 'Motion[26]', [{ events: true, sets: [{ sel: 21, rows: [{ kind: 5, f: 12, yaw: -25.0 }, { kind: 5, f: 44, yaw: 3.0 }, { kind: 5, f: 78, yaw: 30.0 }] },
                                                            { sel: 36, rows: [{ kind: 5, f: 44, yaw: 3.0 }] }] }]),
"""
rep("    act088(1, 0x05, '2', 'Motion[19]',", rows + "    act088(1, 0x05, '2', 'Motion[19]',")
# spawn088: the event rows
rep("""  for (const sp of a.spawns){
    if (sp.web){ if (wrapNow) web088(state, D, a, ctx, input, out, sp); continue; }""",
    """  if (a.spawns.some(sp => sp.events)) events088(state, D, a, ctx, input, out, fresh);
  for (const sp of a.spawns){
    if (sp.events) continue;
    if (sp.web){ if (wrapNow) web088(state, D, a, ctx, input, out, sp); continue; }""")
# move00: the class's own collide
rep("""  const hit = collide(S, null, ctx.stage);             // vtable +0x168 = 0x3f99e0""",
    """  const hit = COLLIDE00[S.cls] ? COLLIDE00[S.cls](S) : collide(S, null, ctx.stage);   // vtable +0x168 = 0x3f99e0, or the class's""")
# stepRock: the class's own after-move
rep("""    if (r === 'end'){                                   // vtable +0x148 with 0 (0x3f9ef4 / 0x42c0c0)
      end(S);
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    }""", """    if (r === 'end'){                                   // vtable +0x148 with 0 (0x3f9ef4 / 0x42c0c0)
      end(S);
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    } else if (AFTER00[S.cls]) AFTER00[S.cls](S, ctx, D, out);   // a class's own +0x158 tail (Ahtal-Ka's split)""")
# ctx.state088
rep("  ctx.spots088 = state.spots088 || (state.spots088 = {});   // Ahtal-Ka's objects' spots, G+0x50+16k, as shell57's ends write them\n",
    "  ctx.spots088 = state.spots088 || (state.spots088 = {});   // Ahtal-Ka's objects' spots, G+0x50+16k, as shell57's ends write them\n"
    "  ctx.state088 = state;                                    // (his shell00's split makes its child from inside the move)\n")
# xAdjust37: the aim offset on the flag-4 arm
rep("  if (k.flags & 4) return clampCircular(deg + (aim37(p, got.target).X - got.ownerX), lo, hi);",
    "  // 0x3f94c0..0x3f94e0: the aim offset [+0x1618] on this arm too (the zero vector for every reader but Ahtal-Ka's sp_00)\n"
    "  if (k.flags & 4) return clampCircular(deg + (aim37(p, got.target, k.aimOff || ZERO3).X - got.ownerX), lo, hi);")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
