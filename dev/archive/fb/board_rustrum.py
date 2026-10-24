p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape', newline='').read()
nl = '\r\n' if '\r\n' in s[:5000] else '\n'
i = s.index('      - [ ] (next) Rustrum (em061_04): ids 0x108..0x10c')
j = s.index('        Then em065, em083.', i)
j = s.index(nl, j) + len(nl)
new = """      - [x] 2026-10-18 -- Rustrum Duramboros (em061_04): his rocks (Duramboros's actions on his files: (7, 0xe6..) 17 / 18 / 19, (7, 0xe7..)
        12 / 13 / 14), lumps, ball (the variant-4 reader) and THE RUST LUMP CHAIN -- NEW base24 (sp_24): L9 M2 f85 / L9 M10 f104 throw it,
        L9 M3 places one at its start when none is held; it sits out its life (u 20); L9 M3 f32 ROLLS the held one as sp_19 8 / 7 / 2 (aimed
        and clamped, modes 7 / 8 turning toward the target's side); (7, 0xe5) -- L9 M10 from 182 -- LIFTS it at 184 as sp_13 onto joint 15,
        L9 M11 f59 throws it, bursting into sp_01 1 + sp_00 23 / 24 / 25. Check 24 / 24 (dev/shells-rustrum-check.mjs, controls fail),
        page 19 / 19, soak 98 motions 0 refused; 15 records exported (u 0..60). Spec dev/em061-shells-spec.md. Also: base00's flag 0x80
        scales the joint offset by the size (init03 / init00 joint arm; was unscaled) -- dm_*_big cases.
        Next: em065, em083.
""".replace('\n', nl)
s = s[:i] + new + s[j:]
open(p, 'w', encoding='utf8', errors='surrogateescape', newline='').write(s)
print('ok')
