# fix_ended.py: the effects (and so the shells) keep stepping after a ONE-SHOT clip reaches its end, until the user pauses or seeks
# (shells lane, 2026-10-26; lane B3's Nakarkos L0 M63 rock frozen at y 5991). three.js marks a finished LoopOnce action `paused` (r169
# _updateTime: clampWhenFinished -> this.paused = true), the same flag the Play button and the scrubber set -- so the viewer marks its
# OWN holds (`act.userHeld`) and animAdvance tells the two apart.
import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
d = open(p, 'rb').read().decode('utf-8')
assert '\r\n' not in d
def rep(a, b):
    global d
    assert d.count(a) == 1, a[:80]; d = d.replace(a, b)
rep("  act.paused = true; act.enabled = true;\n",
    "  act.paused = true; act.enabled = true; act.userHeld = true;    // the user's hold (animAdvance: not a finished one-shot)\n")
rep("    if (act.time >= clipDur(act)) act.time = 0;\n    act.paused = false; act.enabled = true; act.play();\n  } else act.paused = true;\n};",
    "    if (act.time >= clipDur(act)) act.time = 0;\n    act.paused = false; act.enabled = true; act.userHeld = false; act.play();\n  } else { act.paused = true; act.userHeld = true; }\n};")
rep("      if (act.time >= clipDur(act)) act.time = 0;\n      act.paused = false; act.enabled = true; act.play();\n    }\n  }\n  saveState();",
    "      if (act.time >= clipDur(act)) act.time = 0;\n      act.paused = false; act.enabled = true; act.userHeld = false; act.play();\n    }\n  }\n  saveState();")
rep("  if (!(act.getClip().duration > 0)){ effectClipTime = t; return act.paused ? 0 : null; }\n",
    "  if (!(act.getClip().duration > 0)){ effectClipTime = t; return act.paused ? 0 : null; }\n"
    "  // A ONE-SHOT CLIP THAT HAS ENDED (shells lane, 2026-10-26; lane B3: Nakarkos's L0 M63 rock froze mid-air at y 5991 with the clip held at\n"
    "  // f651): the game's units do not stop with the monster's motion -- the move line steps every unit each frame (0xc044c4 walks it head ->\n"
    "  // next, rom-map 'the unit update order'), so a shell in flight lands and its effects run on. three.js marks a finished LoopOnce action\n"
    "  // paused (clampWhenFinished), the same flag the Play button and the scrubber set; the viewer's own holds carry act.userHeld. Ended and\n"
    "  // not held by the user: the wall clock (null), as a held pose above; the clip's frame stays at its end, so nothing of the clip's own\n"
    "  // fires again. Paused or scrubbed by the user: still 0 -- everything freezes.\n"
    "  if (act.loop === THREE.LoopOnce && act.paused && !act.userHeld && t >= clipDur(act) - 1e-3){ effectClipTime = t; return null; }\n")
open(p + '.tmp', 'wb').write(d.encode('utf-8')); os.replace(p + '.tmp', p); print('ok')
