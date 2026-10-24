import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      Recording + one lift + soaks queued.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      KHEZU + GRAVIOS IMPLEMENTED 2026-10-16 (dev/em003_00- / em005_00-effects-spec.md): Khezu's enraged group follows the
      action (charged forms set it, plain twins / walks clear it; 82 in-mask bindings re-gated, e.g. u 260 / 261 on L0 M6
      only on the enraged charge), CLIP_ACTIONS with `rage` forms and a new `phase` field (clipPhaseFor; L2 M37's second
      (7, 0x52) play). Gravios: gas / beam forms by action and the BACK / BELLY breaks (SHELL_PARTS backBroken 17 /
      bellyBroken 11), CLIP_ACTIONS with `tired` forms, ACTION_EFFECTS em005_00 (u 0 / u 30 at f216 -- a gap the survey
      missed), u 271 / 290 / 301 / 390 exported; CUT_TAIL confirmed (joint 143); the 0x9b76e4 refusal confirmed closed.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
