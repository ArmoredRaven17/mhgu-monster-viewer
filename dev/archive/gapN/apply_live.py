# apply_live.py: gapN's hit-line / segment table / kinds edits + the shared type-3 shapes (effects lane's hit-type3.js) + the first-pass
# slot step, onto the live docs/render/shells.js (every anchor must match once; CRLF kept; .tmp + os.replace)
import re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
t = open(os.path.join(HERE, 'RESULT.md'), encoding='utf8').read()
B = re.findall(r'```js\n(.*?)```', t[t.index('## (b)'):t.index('## (c)')], re.S)
s = open(P, 'rb').read().decode('utf8')
NL = '\r\n'
s = s.replace(NL, '\n')
def once(old, new, after=False):
    global s
    n = s.count(old)
    if n != 1: sys.exit('anchor %d: %r' % (n, old[:120]))
    s = s.replace(old, (old + new) if after else new)
def before(anchor, text):
    once(anchor, text + anchor)
blk = lambda i: B[i].rstrip('\n')
# b1 helpers
before("// 0x169290 -> 0x16d970 -> 0x16da04 for a shell (kind 2): its hitsize group's shapes at the manager's pass", blk(0) + '\n')
# b2 the 1010 arm + scale
once("    } else if (r.j0 === 1010) return { why: 'hitsize j0 1010: the shell segment table +0x1594 (0x16dd2c) not transcribed' };", blk(1))
once("  const s = f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0);          // H+0x14 = ShellScale (0x4a1c3c..0x4a1c80)", blk(2))
# the type-3 shapes (codes 4 / 6): the shared transcription
once("      else if (r.code === 4 || r.code === 6) return { why: 'hitsize code ' + r.code + ': a type 3 shape (0x167f70 not read)' };",
     "      else if (r.code === 4 || r.code === 6){ M = M || coordRows4(S.angles);   // type 3 (0x16e368 / 0x16e470; hit-type3.js, effects lane READ)\n"
     "        out.push(type3Shape(r.code, at(r.o0), M[1], s, r.o1, r.r)); }")
once("        const c = A.type === 1 ? sphereVsHunter(A, cap) : capsuleVsHunter(A, cap);",
     "        const c = A.type === 1 ? sphereVsHunter(A, cap) : A.type === 3 ? type3VsHunter(A, cap) : capsuleVsHunter(A, cap);   // type 3: 0x16b88c -> 0x167f70")
# b3: base58's table, step58's hit line, the ray builders' prevAnchor, step02g's hit line, the beam spawners' table
i = s.index('function make087s58(')
j = s.index('unitScale: f(mode.scale) };', i) + len('unitScale: f(mode.scale) };')
s = s[:j] + '\n' + blk(3) + s[j:]
before("  S.place = S.effect ? { param: 0, position: S.anchor.slice(), rotationDeg: S.angles.map(w => f(f(w >>> 0) * U16_TO_DEG)) } : null;", blk(4) + '\n')
n = 0
for m in list(re.finditer(r"  S\.prevEnd = S\.position \? S\.position\.slice\(\) : null;[^\n]*\n", s))[::-1]:
    s = s[:m.end()] + blk(5) + '\n' + s[m.end():]; n += 1
if n != 2: sys.exit('prevEnd lines %d' % n)
before("  const a = angles02(S);                                                        // 0x3fc378\n", blk(6) + '\n')
n = 0
for m in list(re.finditer(r"effects: \[\], hit: null \};\n", s))[::-1]:
    s = s[:m.end()] + blk(7) + '\n' + s[m.end():]; n += 1
if n != 2: sys.exit('beam spawners %d' % n)
# b4 hunterPass
once("    const def = (S.D57 || D).shells[S.shell];\n    if (!def) continue;\n", blk(8) + '\n')
once("        const mh = (S.mode && S.mode.hit) || [];", blk(9))
once("  const H = state.hunter || (state.hunter = { ring: new Array(20).fill(0xffff), k: 0 });   // player +0x31e4", blk(10))
once("      if (kind === 0x41){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind 0x41 -> 0x2a6640 not read' }); continue; }\n"
     "      if (struck) continue;                                                    // 0x16add8..0x16ade4", blk(11))
once("      if (kind === 0xc || kind === 0xd || kind === 0x1e){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind ' + kind + ' needs 0x2f5bf0(player), not read' }); continue; }", blk(12))
once("        struck = true;                                                         // 0x175c1c / 0x178784", blk(13))
# the first pass steps the slots it makes too (0x168d30 runs on every registered slot each manager pass, the first included)
once("      } else for (const sl of S.hslots) slotStep(sl, f(1.0));",
     "      }\n      for (const sl of S.hslots) slotStep(sl, f(1.0));                          // every pass, the first included (gapN a5)")
# the shared type-3 module
once("import { HITSHAPES } from './shell-hitshapes.js';", "import { HITSHAPES } from './shell-hitshapes.js';\nimport { type3Shape, type3VsHunter } from './hit-type3.js';   // hit-size codes 4 / 6: the effects lane's one transcription")
open(P + '.tmp', 'w', encoding='utf8', newline=NL).write(s)
os.replace(P + '.tmp', P)
print('ok')
