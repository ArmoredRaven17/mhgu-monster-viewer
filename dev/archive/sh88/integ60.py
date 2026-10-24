import json, re, os
sp = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf-8').read()
def rep(old, new, cnt=1):
    global s
    assert s.count(old) == cnt, (old[:70], s.count(old))
    s = s.replace(old, new)
run = open(os.path.join(sp, 'run60.js'), encoding='utf-8').read()
a1 = "// ---- NAKARKOS'S ARMS AS SHELL OWNERS (uEmOstgaloaArm): the tentacle-form shells, phase 1 ------------------------------------\n"
rep(a1, run + '\n' + a1)
modes = {}
cur = None
for line in open(os.path.join(sp, '..', 'ahtal', 'shl088.txt')):
    if line.startswith('=== '):
        cur = line.split()[1]; modes[cur] = []; continue
    m = re.match(r'\s+\[\s*(\d+)\] scale (\S+) ef (\[.*?\]\]) sh (\{.*\}) hit (\[.*?\])', line)
    if m and cur:
        modes[cur].append((int(m.group(1)), float(m.group(2)), json.loads(m.group(3)), json.loads(m.group(4)), json.loads(m.group(5))))
def mlines(name):
    out = []
    for (i, sc, ef, sh, hit) in modes[name]:
        out.append("        %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (
            i, sc, json.dumps(ef), json.dumps(hit), json.dumps(sh['ints']), json.dumps(sh['floats']), json.dumps(sh['vecs'])))
    return '\n'.join(out)
BS = '\\\\'
data = ("    // shell60: uShellEm088_sp_60 (vtable 0x1809f58), base60; reader 0x10c4cf0, +0x150 0x10c5010 (modes 6..14 aimed). cmn float 0 =\n"
        "    // R (2500). ef: u 332 / 300 / 330 / 331 / 231 / 310 / 311 / 301. hitdata (0, 999) x 4.\n"
        "    shell60: { id: 0x180, cls: 'uShellEm088_sp_60', base: 'base60', reader: 0x10c4cf0, folder: 'shell" + BS + "em" + BS + "em088_00_shell60',\n"
        "      cmn: { ints: [], floats: [2500.0], vecs: [] },\n"
        "      modes: {\n" + mlines('shell60') + "\n      },\n"
        "      hitdata: [[0, 999], [0, 999], [0, 999], [0, 999]] },\n"
        "    // shell61: uShellEm088_sp_61 (vtable 0x180a0b4), base61; reader 0x10c5144. ef: u 332 / 300 / 330 / 331 / 360 / none / 310 / 311.\n"
        "    // hitdata (0, 999) x 3.\n"
        "    shell61: { id: 0x181, cls: 'uShellEm088_sp_61', base: 'base61', reader: 0x10c5144, folder: 'shell" + BS + "em" + BS + "em088_00_shell61',\n"
        "      cmn: null,\n"
        "      modes: {\n" + mlines('shell61') + "\n      },\n"
        "      hitdata: [[0, 999], [0, 999], [0, 999]] },\n")
anchor = "      hitdata: [[0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 0], [0, 0], [0, 0]] },\n  },\n"
rep(anchor, "      hitdata: [[0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 0], [0, 0], [0, 0]] },\n" + data + "  },\n")
rows = """    // THE WEBS (L2 M30: the wind-ups (1, 0x1c) / (1, 0x1e) / (1, 0x22) / (1, 0x24) chain at its end into the holds (1, 0x1d) /
    // (1, 0x1f) / (1, 0x23) / (1, 0x25), whose start spawns the anchors: web088). shell60's slot bytes are the AI's (EMC op 0xa3 b1 5..8,
    // 10 -> e+0xd434..+0xd438, 0x10bae18): the streams that issue the wind-ups write them -- em088_00_cmdtbl.emc g1 s105 (slot 0 =
    // 5 or 6) and s110 (slot 0 = 12, slot 1 = 13) before (1, 0x1c); s111 (10, 11, 7, 8, 0) and s112 / s113 (5, 6, 7, 8) before
    // (1, 0x22); a slot a stream leaves alone keeps what the last web left there, 0xff (skipped) -- before his first web the
    // ctor's 0 (mode 0): not shown. Each play the next stream.
    act088(1, 0x1c, '2', 'Motion[30]', [{ atEnd: true, web: 'shell60', slots: [{ stream: 'g1 s105 (5)', bytes: [5] }, { stream: 'g1 s105 (6)', bytes: [6] },
                                                                              { stream: 'g1 s110', bytes: [12, 13] }] }]),
    act088(1, 0x1e, '2', 'Motion[30]', [{ atEnd: true, web: 'shell61', modes: [0, 1, 2] }]),
    act088(1, 0x22, '2', 'Motion[30]', [{ atEnd: true, web: 'shell60', slots: [{ stream: 'g1 s111', bytes: [10, 11, 7, 8, 0] },
                                                                              { stream: 'g1 s112 / s113', bytes: [5, 6, 7, 8] }] }]),
    act088(1, 0x24, '2', 'Motion[30]', [{ atEnd: true, web: 'shell61', modes: [0, 1, 2, 3] }]),
"""
rep("    act088(1, 0x05, '2', 'Motion[19]',", rows + "    act088(1, 0x05, '2', 'Motion[19]',")
rep("""  for (const sp of a.spawns){
    const due = sp.atStart ? fresh : (!fresh && !!state.hist && !!state.prevJoints && pass001(state, f(sp.frame)));
    if (!due) continue;
    const at = sp.atStart ? 0 : sp.frame;
    if (carry === 4){""", """  // an action start that releases the webs (status 10 / 11, (1, 6) / (1, 0x20))
  if (fresh && (a.action[0] === 10 || a.action[0] === 11 || a.spawns.some(sp => sp.drop === 4))) releaseWebs088(state);
  for (const sp of a.spawns){
    if (sp.web){ if (ctx.wrapped) web088(state, D, a, ctx, input, out, sp); continue; }
    const due = sp.atStart ? fresh : (!fresh && !!state.hist && !!state.prevJoints && pass001(state, f(sp.frame)));
    if (!due) continue;
    const at = sp.atStart ? 0 : sp.frame;
    if (carry === 4){""")
rep("""  const back = !!(state.hist && frame < state.hist[1]);
  const newMotion = ctx.motion !== state.motion;
""", """  const back = !!(state.hist && frame < state.hist[1]);
  const newMotion = ctx.motion !== state.motion;
  ctx.wrapped = back && !newMotion;                        // the clip's own wrap (a loop, or the viewer's replay): its play's end
""")
rep("""  } else if (a && a.code === 'em088'){
    // Ahtal-Ka's actions (spawn088): the throw at L2 M17 160, the pull at L2 M19 / M37 92, the drops at their action's start
    spawn088(state, D, a, ctx, input, out, fresh);
""", """  } else if (a && a.code === 'em088'){
    // Ahtal-Ka's actions (spawn088): the throw at L2 M17 160, the pull at L2 M19 / M37 92, the drops at their action's start, the
    // webs at L2 M30's end
    spawn088(state, D, a, ctx, input, out, fresh);
  } else if (!a && fresh && state.monId === 'em088_00' && String(input.list) === '3' && input.clip !== 'Motion[18]'){
    // his L3 clips are status-10 / 11 actions' (states-em088_00.md 3.3; L3 M18 also (1, 0xb)): their start releases the webs
    releaseWebs088(state);
""")
rep("    else if (S.base === 'base57') step57(S, ctx, input, D, out);\n",
    "    else if (S.base === 'base57') step57(S, ctx, input, D, out);\n    else if (S.base === 'base60' || S.base === 'base61') step60(S, ctx, input, D, out);\n")
rep("                                : def.base === 'base57' ? mode.sh.ints[0]                 // (Ahtal-Ka's shell57: int 0, joint 130 or 255)\n",
    "                                : def.base === 'base57' ? mode.sh.ints[0]                 // (Ahtal-Ka's shell57: int 0, joint 130 or 255)\n"
    "                                : def.base === 'base60' || def.base === 'base61' ? null    // (his anchors read no joint)\n")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
