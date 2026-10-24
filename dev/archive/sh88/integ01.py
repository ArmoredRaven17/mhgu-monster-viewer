import json, re, os
sp = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    assert s.count(old) == cnt, (old[:80], s.count(old))
    s = s.replace(old, new)
modes = []
cur = None
for line in open(os.path.join(sp, '..', 'ahtal', 'shl088.txt')):
    if line.startswith('=== '):
        cur = line.split()[1]; continue
    m = re.match(r'\s+\[\s*(\d+)\] scale (\S+) ef (\[.*?\]\]) sh (\{.*\}) hit (\[.*?\])', line)
    if m and cur == 'shell01':
        sh = json.loads(m.group(4))
        modes.append("        %s: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (
            m.group(1), float(m.group(2)), m.group(3), m.group(5), json.dumps(sh['ints']), json.dumps(sh['floats']), json.dumps(sh['vecs'])))
BS = '\\\\'
data = ("    // shell01: uShellEm088_sp_01 (vtable 0x18099b4), base01 + its own init / reader 0x10c3b08 (params088s01) / +0x150 / +0x154.\n"
        "    // Modes 0 / 1: the arena silk lines (u 90 / u 91), at world (0, 0, 0), angle 0; modes 3..5 hit only (no spawner of 3).\n"
        "    // hitdata (90, 1800) x 2, (0, 8) x 3.\n"
        "    shell01: { id: 0x17c, cls: 'uShellEm088_sp_01', base: 'base01', reader: 0x10c3b08, folder: 'shell" + BS + "em" + BS + "em088_00_shell01',\n"
        "      cmn: null,\n      modes: {\n" + '\n'.join(modes) + "\n      },\n      hitdata: [[90, 1800], [90, 1800], [0, 8], [0, 8], [0, 8]] },\n")
rep("    // shell57: uShellEm088_sp_57 (vtable 0x1809c94), base57;", data + "    // shell57: uShellEm088_sp_57 (vtable 0x1809c94), base57;")
rows = """    // THE ARENA SILK LINES (shell01 modes 0 / 1): vt+0x204 at (1, 0xc) / (1, 0x17) / (1, 0x19) -> 0x10b6320 by e+0xd3fc (1 line 0,
    // 2 line 1, 3 both; each old line ended first), the start of L2 M33 they play after L2 M32 (0x10c0140 -> 0x10c02d4). d3fc is the
    // AI's (EMC op 0xa3 (2, n)): g1 s91 writes 3 before (1, 8) -> (1, 0xc); g1 s38 1 or 2 (its own pick) or 3 before (1, 0x28) ->
    // (1, 0x19) (the pairing by adjacency: INFERRED); each play the next. (7, 0x23) plays L2 M33 with shell58 alone (nothing drawn).
    act088(1, 0x0c, '2', 'Motion[33]', [{ atStart: true, lines: [3] }]),
    act088(1, 0x19, '2', 'Motion[33]', [{ atStart: true, lines: [1, 2, 3] }]),
    act088(7, 0x23, '2', 'Motion[33]', []),
"""
rep("    act088(1, 0x05, '2', 'Motion[19]',", rows + "    act088(1, 0x05, '2', 'Motion[19]',")
# the reader
rep("const READERS01 = { ", "const READERS01 = { 0x10c3b08: params088s01, ")
reader = """// AHTAL-KA's sp_01 reader 0x10c3b08 (uShellEm088_sp_01; READ, rom-map "Ahtal-Ka -- his shells read and built"): ef 0 -> +0x15c8;
// hit 0 -> +0x15d8 (slot 0), hit 1 -> +0x15e0 (0x4a15d4, not a slot); +0x15e8 = (int 0 != -1); float 1 -> +0x15f0 (the timer: 0 on
// modes 0 / 1 -- they live while slot 0 is on, (90, 1800)); vec 0 -> +0x1608; float 0 -> +0x1658 (the 3 -> 4 -> 5 chain's delay).
// The flags +0x15ec are not touched: base01's ctor 0 -- so init011's setup-point arm: the request's +0x10 (the zero vector,
// 0x10b6320) plus the size x vec 0 (the zero vector) turned by the words (0x1620e60: 0, 0, 0) = the WORLD ORIGIN.
function params088s01(sh){
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const why = !sh ? 'uShellEm088_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags: 0, joint: -1, timer: f(sh && sh.floats.length > 1 ? sh.floats[1] : 0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
"""
rep("// MALFESTIO's sp_01 reader 0xffd644", reader + "// MALFESTIO's sp_01 reader 0xffd644")
# spawn088: the lines
rep("""    if (sp.events) continue;
    if (sp.web){ if (wrapNow) web088(state, D, a, ctx, input, out, sp); continue; }""",
    """    if (sp.events) continue;
    if (sp.web){ if (wrapNow) web088(state, D, a, ctx, input, out, sp); continue; }
    if (sp.lines){ if (fresh) lines088(state, D, a, ctx, input, out, sp); continue; }""")
fn = """// 0x10b6320: e+0xd400 = the re-lay cooldown (tune float 9 x 60: an AI condition, not shown); then by d3fc -- 1: line 0 (P+0x1bb |= 1,
// the old handle e+0xd3f4 ended (vt+0x148(0)), shell01 mode 0 at the zero vector, words 0x1620e60), 2: line 1 (d3f8), 3: both
function lines088(state, D, a, ctx, input, out, sp){
  const L = state.lines088 || (state.lines088 = { h: [null, null], plays: 0 });
  const d3fc = sp.lines[(L.plays++) % sp.lines.length];
  for (const k of [0, 1]){
    if (!(d3fc & (1 << k))) continue;
    const old = L.h[k];
    if (old && old.state === 1){ end011(old, old.events, ctx); out.ended.push(old); }
    const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: k, position: [0, 0, 0], angles: [0, 0, 0], action: a.action, frame: 0 },
                      ctx.own001, state.prevJoints || ctx.J, ctx, null);
    L.h[k] = S || null;
    if (S){ S.d3fc = d3fc; state.shells.push(S); out.spawned.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell01', mode: k, why: 'base01 init deleted it' });
  }
}
"""
rep("// the slot byte -> mode (0x10b5548)", fn + "// the slot byte -> mode (0x10b5548)")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
