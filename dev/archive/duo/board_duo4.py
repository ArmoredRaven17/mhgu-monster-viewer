# board_duo4.py: the audit outcome under the DUO REVIEW item (binary-safe; never committed)
P = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(P, 'rb').read().decode('utf-8', 'surrogateescape')
assert 'FULL AUDIT 2026-10-17' not in s
i = s.index('DUO REVIEW 2026-10-17')
j = s.index('- [ ] (question, Raven) Seltas\' list 4 is nearly all duo clips', i)
item = '''- **FULL AUDIT 2026-10-17** (Raven: "I also see animations I know Seltas is required, but he is not being enabled",
        "consult the ROM and follow how it handled each animation"). Spec §6 (all 158 clips, regenerated) and §14. Now:
        combined (required, mounted with the row Off) 44, both 95, solo 3, release 5, unresolved 11. Changed: M7, M24, M10,
        M25, M82..M87, M92..M95, L3 M23, L0 M65 (his M33), M74 / M75 (his M71), M96 -> required (her action writes a
        request when linked); the 22 first-re-read solos -> both (her awareness event groups 3 / 4 / 5 issue them, no link
        test); the M78 / M79 hold frame 4 -> **6** (layer length = numFrames - 1, 0x951810; 186 mod 60; order-proof) and his
        M79 under M77 at period 60. Op 0x77 read: his distance to the hunter (bands; the viewer shows band 0). His 7:0x3f
        phases read (repeat helpers 0xfd4924 / 0xfd4b00 NR). Check 66 / 66.
'''
s = s[:j] + item + '      ' + s[j:]
open(P, 'wb').write(s.encode('utf-8', 'surrogateescape'))
print('ok')
