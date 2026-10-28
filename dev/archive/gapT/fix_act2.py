# fix_act2.py: the action clock counts the action's UPDATES (its own dt timers and phase steps), tested on this update's count -- not
# on the previous advance as a motion frame is read (the clip rows' read-before-advance). Neset's (1, 8) lift is made on the first
# phase-1 update (action update 1), lives 110 moves in states 1 / 2, and the hold ends on update 111 (combined spec 4: the 111 wait).
import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
d = open(p, 'rb').read().decode('utf-8'); N = '\r\n'
assert d.count(N) == d.count('\n')
def rep(a, b):
    global d
    a = a.replace('\n', N); b = b.replace('\n', N)
    assert d.count(a) == 1, a[:70]; d = d.replace(a, b)
rep("// the action clock's advance (stepShells: state.actHist = [A(k-2), A(k-1)]) passed N\n"
    "const passAct = (state, N) => !!state.actHist && state.actHist[0] < N && !(state.actHist[1] < N);\n",
    "// the action clock (stepShells: state.actPrev / state.actNow, this update's count and the last one's) reached N on this update\n"
    "const passAct = (state, N) => state.actNow != null && state.actPrev < N && !(state.actNow < N);\n")
rep("  // { act: N } are due when this clock passes N, tested on the previous advance as the clip rows are (passAct).\n",
    "  // { act: N } are due on the update the count reaches N (passAct): the action's own timers count its updates -- the update that starts\n"
    "  // it is 0, its first phase-1 update 1 (\"on the first move\") -- so they are tested on this update's count, not on the previous\n"
    "  // advance a motion frame is read from (the clip rows' pass001). (2026-10-26: Neset's (1, 8) lift made on update 1, 110 moves in\n"
    "  // states 1 / 2, the hold's end on update 111 -- the combined lane's read wait, dev/em088-em087-combined-spec.md 4.)\n")
rep("    state.actRow = a; state.actHist = [0, 0];\n"
    "    state.actNow = fresh && state.hist ? Math.max(0, frame - state.hist[0]) : 0;\n"
    "  } else state.actNow = f(state.actNow + ctx.dt);\n",
    "    state.actRow = a; state.actPrev = -Infinity;\n"
    "    state.actNow = fresh && state.hist ? Math.max(0, frame - state.hist[0]) : 0;\n"
    "  } else { state.actPrev = state.actNow; state.actNow = f(state.actNow + ctx.dt); }\n")
rep("  if (state.actHist) state.actHist = [state.actHist[1], state.actNow];   // the action clock's advance, for the next step's rows\n", "")
open(p + '.tmp', 'wb').write(d.encode('utf-8')); os.replace(p + '.tmp', p); print('ok')
