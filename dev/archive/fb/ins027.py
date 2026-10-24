import subprocess, re
js = open('teostra.js', encoding='utf8').read()
js = js.replace("const s19 = mla(f(y0 * sinZ === 0 ? y0 * cosZ : y0 * cosZ), x0, sinZ);", "const s19 = mla(f(y0 * cosZ), x0, sinZ);")
out = subprocess.check_output(['python', 'gen027.py'], text=True)
blocks = out.split('MODES ')[1:]
for b in blocks:
    nn = b[:2]; body = b[3:].rstrip('\n')
    js = js.replace('@@MODES%s@@' % nn, body)
assert '@@' not in js
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
a = "    timer025('1', 'Motion[10]', [40], 1),\n  ],\n};\n"
assert s.count(a) == 1
s = s.replace(a, a + js)
# dispatch, step, joint, make001 hook, ownerAction
a = "  } else if (a && a.code === 'em025'){\n"
assert s.count(a) == 1
s = s.replace(a, "  } else if (a && a.code === 'em027'){\n    spawn027(state, D, a, ctx, input, out, fresh);           // Teostra's breath, nova ring, blast powder, flame line and blasts\n" + a)
a = "    else if (S.base === 'base39') step39(S, ctx, input, D, out);   // Chameleos's poison cloud\n"
assert s.count(a) == 1
s = s.replace(a, a + "    else if (S.base === 'base20') step20(S, ctx, input, D, out);   // Teostra's nova ring\n    else if (S.base === 'base21') step21(S, ctx, input, D, out);   // his blast powder and flame line\n")
a = "                                : def.base === 'base34' || def.base === 'base38' || def.base === 'base39' ? null    // (Kushala's tornadoes, Chameleos's cloud: no joint)\n"
assert s.count(a) == 1
s = s.replace(a, a + "                                : def.base === 'base20' ? null                            // (Teostra's ring: the owner's point)\n                                : def.base === 'base21' ? (mode.sh.ints[0] === -1 ? null : mode.sh.ints[0])   // (his powder: int 0, joint 13 / 9 / 4)\n")
a = "    if (def.base === 'base51' && !init51(S)) return null;\n"
assert s.count(a) == 1
s = s.replace(a, a + "    // Teostra's sp_01 init 0xe1ac9c runs base01's 0x3fa498 (its effects started at that point), THEN moves +0x40 by the setup's +0x3e\n    if (def.cls === 'uShellEm027_sp_01') post027s01(S, setup.h3e | 0);\n")
a = "  const a = state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant));\n"
assert s.count(a) == 1
s = s.replace(a, a + "  // the owner's action as a shell's own move reads it (0x6fe88: Teostra's leading powder waits for (7, 0x2d) / (7, 0x2e)) -- the row\n  // the viewer's play stands for on this clip\n  ctx.ownerAction = a && a.action ? a.action : null;\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
