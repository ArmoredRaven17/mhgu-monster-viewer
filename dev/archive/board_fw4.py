import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      missed), u 271 / 290 / 301 / 390 exported; CUT_TAIL confirmed (joint 143); the 0x9b76e4 refusal confirmed closed.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      BARIOTH + SEREGIOS IMPLEMENTED 2026-10-16 (specs resolved): Barioth's word (u 200 on L2 M8 (7, 0x0f / 0x14), u 240 on
      every intact L2 M9 / M10 play -- the remap 0xe64f48 --, c 90 on the rage roar; L2 M32 / M33's six never enabled),
      CLIP_ACTIONS, SHELL_TAIL em042_00 { severed: 14 } (was missing). Seregios's word (the cut tail swaps b6 for b18 forms;
      u 233 / u 234 on the 0x3a / 0x3b dives and their landings), CLIP_ACTIONS, SHELL_TAIL em077_00 { severed: [16, 18] }
      (shellTailInput takes a list now), CUT_TAIL joint 144 -> 145 (the sever's r3 = 0x91), 6 records exported.
      OPEN: Seregios's c 30 / c 32 shell (base01 + reader 0xfeeb98, spec 7 -- to the shells agent after Silverwind; its
      100-frame pulse has no viewer clock: a named stand-in), his shells 0x13d / 0x13e (bladescales) unread.
      Diablos soak: 72 played, 0 refused. Gravios u 241's plain set fails on the budget loop as before -- the _hold80 set
      covers it.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
