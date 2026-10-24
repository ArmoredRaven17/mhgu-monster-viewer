# patch_copy.py -- copy docs/render/shells.js into gapA/shells.js and apply the RESULT.md edits to the COPY only (never the repo file):
# the helpers (blockA_helpers.js) after s51b013, the 'pitch49' fire word in do013, the storm hook in spawn013, the two rows. The copy's
# imports point at the repo's modules; test-only exports are appended (not part of the paste).
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(SRC, encoding='utf-8').read()
def once(old, new):
    global s
    n = s.count(old)
    assert n == 1, ('anchor count %d' % n, old[:120])
    s = s.replace(old, new)
helpers = open(os.path.join(HERE, 'blockA_helpers.js'), encoding='utf-8').read()
# 1. the helpers after s51b013 (its last two lines, then the em013_02 block's opening brace)
once("    position: [f(P[0] + xr), f(x + P[1]), f(zr + P[2])], angles: [0, u16(own.ownerY), 0], action: a.action, frame: sp.frame }, own, J, ctx, null);\n  if (S) push(S);\n}\n{\n  const D = SHELL_DATA.em013_02 ||",
     "    position: [f(P[0] + xr), f(x + P[1]), f(zr + P[2])], angles: [0, u16(own.ownerY), 0], action: a.action, frame: sp.frame }, own, J, ctx, null);\n  if (S) push(S);\n}\n" + helpers + "{\n  const D = SHELL_DATA.em013_02 ||")
# 2. do013's fire word
once("    const dx = dx0 === 'aim' ? state.aim013 : dx0 === 'aimNow' ? aim013(sp.aim, own) : dx0;",
     "    const dx = dx0 === 'aim' ? state.aim013 : dx0 === 'aimNow' ? aim013(sp.aim, own) : dx0 === 'pitch49' ? pitch013_49(J, own) : dx0;")
# 3. spawn013's storm hook
once("function spawn013(state, D, a, ctx, input, out, fresh){\n",
     "function spawn013(state, D, a, ctx, input, out, fresh){\n  if (a.storm013) return storm013(state, D, a, ctx, out, fresh);   // Old's (7, 0x50) phase 4: timers, not frames\n")
# 4. the rows (after (7, 0x46), around (7, 0x50)'s Motion[1] row)
once("    act013(7, 0x50, '4', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),\n",
     "    // (7, 0x49) 0xd8716c phase 1 f146 (READ): the pitch from joint 3's world point to 1600 short of the target (pitch013_49) -> sp_00 1\n"
     "    act013(7, 0x49, '2', 'Motion[25]', [{ frame: 146, fire: [2, 'pitch49', 0] }]),\n"
     "    act013(7, 0x50, '4', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),\n"
     "    // (7, 0x50) phase 4 on L4 M4 (storm013): sp_01 9 at 0xd87630's stage points, at once and then every 90.0 (P+0x1bc) / 27.47 (ctl+0x3c)\n"
     "    act013(7, 0x50, '4', 'Motion[4]', [], { storm013: true }),\n")
# the copy's imports -> the repo's modules
s = re.sub(r"from '\./([\w-]+\.js)'", lambda m: "from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/%s'" % m.group(1), s)
s += "\n// ---- gapA test-only exports (NOT part of the paste) ----\nexport const __gapA = { pitch013_49, strike013, storm013, rng32_013 };\n"
open(os.path.join(HERE, 'shells.js'), 'w', encoding='utf-8', newline='\n').write(s)
print('patched copy written', len(s))
