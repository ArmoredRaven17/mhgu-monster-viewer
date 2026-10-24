import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      Seregios (finishing the paused specs); Silverwind's 13 shells (shells agent). The Viewer agent implements each spec.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      IMPLEMENTED 2026-10-16: Diablos (Bloodbath's word without L2 M22's bit 21; CLIP_ACTIONS posture rows; SHELL_TAIL
      em007_00 { severed: 4 } -- was missing, his cut-tail effects never showed; u 202 / u 360 exported); THE RATH LINE is
      ONE class (no uEm002_00): rath(em, id, v4) for all six (tail form / Dreadqueen-Dreadking broken form / L2 M1 by id /
      L4 M32 em 2 / L4 M38), new pslMask input questLevel (SHELL_QUEST_LEVEL 10), SHELL_TAIL em002_00 / em002_02 added;
      records exported (Rathian 6, Gold 12, Dreadqueen 17, Rathalos 4, Silver 5, Dreadking 7). New row gates in
      motion-states.js: `notTired` and `posture` (u 1400 on Diablos / Bloodbath L0 M7 only on the posture-4 burrow play).
      Recording + one lift + soaks queued.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
