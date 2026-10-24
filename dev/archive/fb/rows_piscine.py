p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0x48b784..0x48b7b0` (the shell maker's resource) |"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| uEm017_00 shells 0x92 / 0x93 (Cephadrome) | sp_00 base00 reader `0xda39fc` (X aim from the owner: from-offset vec 1 -> +0x1614), landing `0xda3c28` (type 1 + sp_01 0 `0xda3cb4`); sp_01 base01 reader `0xda3eb4` (no EffectParam); actions `0xda0450..` / `0xda0930..` / `0xda2b94(e, kind, r6, r8)`: L2 M6 f78 0, L2 M14 f58 1, L2 M22 f84 3..5, L2 M23 / M24 f25 + f70 (6..11 / 12..17); e+0xb5f7 set -> the Delex ems012's 0x184 | uEm017_00 | R + E | dev/piscine-shells-spec.md; SHELL_DATA.em017_00 |",
"| uEm036_00 shells 0xc6 / 0xc7 (Lavasioth) | sp_00 base00 reader `0xe45e64`, landing `0xe46118` (rising: no landing), children `0xe461c4` (table `0xe46204`); sp_01 base01 reader `0xe469d8`, end hook +0x154 `0xe46ac0` (0..2 -> 3..5), +0x160 `0xe46cf8` (hit side); maker `0xe3f610`; L4 M1 `0xe44560..0xe44698` three frames 130 / 184 / 238 unless tired; (7, 0x12) `0xe43ef8` the landing splash 5 / 6 / 7 after facing += 0x8000 | uEm036_00 | R + E | dev/piscine-shells-spec.md; SHELL_DATA.em036_00 |",
"| tooling: emu_fb `winFrames` (a step's frame tests pass only at the listed s0), `block_bytes` (the block [e+0x1428] bytes), `frames` per case | -- | -- | -- | Cephadrome's two-frame helpers; Lavasioth's falling owner (+0x14) |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
