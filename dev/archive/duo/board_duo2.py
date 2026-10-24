# board_duo2.py: the follow-up under the DUO REVIEW item (binary-safe; never committed)
P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
assert 'FOLLOW-UP 2026-10-17 (Raven: "Seltas still is not moving")' not in s
i = s.index('DUO REVIEW 2026-10-17')
j = s.index('- [ ] (question, Raven) Seltas\' list 4 is nearly all duo clips', i)
item = '''- **FOLLOW-UP 2026-10-17 (Raven: "Seltas still is not moving", "if Seltas is supposed to be present for animation,
        he needs to be enabled", "akin to Nakarkos ... multiple models at the same time").** Re-read `both` against her
        table's own split (g0 s2: linked -> g0 s4 / s13, unlinked -> g0 s5 / s3, events apart; control: her known
        linked-only attacks land on the linked side): 22 clips her LINKED streams never issue are now solo (L4 M44..M50,
        M55..M62, M69, M70, M90, M91; L0 M10, M11, M36 -- incl. her M46 / M47 hunter grab). Counts now: combined 25,
        solo 25, release 5, both 90, unresolved 13. Under every asking clip he plays his answer and MOVES (check: 0.65..2.19
        rad). Under a both clip that asks for nothing the ROM really leaves him in his ride 1:0 -- L4 M35, near-still
        (0.072 rad), and at its frame 180 (0xfc7dec) his own table picks again (ride or a riding attack M31..M34, not tied
        to her clip). The M78 / M79 freeze is the ROM's (speed 0, carried rigidly on joint 200 in her pincers).
        **Nakarkos model built**: her Animation list now has **"Seltas (combined)" (S_4)** -- 23 of his clips, each on him
        with her side of it on her (his M6 -> her M6 + M17 ... his riding attacks -> her L0 M1; M31 grows his claws to the
        massive claw from frame 42). He is mounted and the row reads Combined wherever the ROM has him (reload, list change,
        S. Motion[76]-[79] -- on the Special list, not list 4). Check 42 / 42 (+ the file's old 13-event FAIL, at HEAD too).
        Still NOT READ: her event groups' triggers (g3 / g4 / g5 / g12 / g18 -- whether her solo-stream moves ever run with
        him on through them), the enemy update order, her 7:0x4d..0x4f + his 7:0x3f in full.
'''
s = s[:j] + item + '      ' + s[j:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
