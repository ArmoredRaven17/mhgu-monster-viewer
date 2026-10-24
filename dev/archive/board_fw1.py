import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "FLAG: Uragaan's MOTION_STATES u 100 /"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, "[FIXED 2026-10-16: row gate `notTired` (motion-states.js holds()), Uragaan + Crystalbeard L2 M2 / M21, checks pass] FLAG: Uragaan's MOTION_STATES u 100 /")
b = "- [ ] **Flying Wyverns: effects not all implemented -- surveyed 2026-10-14**\n"
assert t.count(b) == 1
t = t.replace(b, b + """      2026-10-16 (Raven: "Back to the groups" / "Flying, Brute and Bird Wyverns"): Bird and Brute have every enable word
      implemented; Flying has 11 left -- reads assigned in parallel: Rathian line (em001 -> dev/em001-effects-spec.md),
      Rathalos line (em002), Khezu + Gravios (em003_00 / em005_00, + Gravios tail), Diablos v0 (em007_00), Barioth +
      Seregios (finishing the paused specs); Silverwind's 13 shells (shells agent). The Viewer agent implements each spec.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
