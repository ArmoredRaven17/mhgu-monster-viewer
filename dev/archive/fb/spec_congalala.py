p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\fanged-beasts-shells-spec.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = """count (2+ unless input.gas021Last). Records u 0, 100, 130..160, 200..220, 300..330. OPEN: u 200 (and u 0 when started directly)
refuses live at "call to 0xa60744, which is not translated (from 0xa5fee0)" -- a particle branch (0xa5f088 / 0xa5fdf0, the particle's
[+4] bit 0x4000 clear) no recorded set reaches: the shell plans (7:0x0a / 0x0b / 0x49, L0 M20, L2 M5, L5 M14) and rec_lod.py's far-camera
sets all miss it. 0xa76eb8 (the first refusal) is lifted; 0xa60744 / 0xaea528 / 0xaf42b0 / 0xaf9aac are on the lifted-added line.""".replace('\n', nl)
b = """count (2+ unless input.gas021Last). Records u 0, 100, 130..160, 200..220, 300..330.
CLOSED 2026-10-18 (was OPEN: u 200, and u 0 started directly, refused live at "call to 0xa60744, which is not translated (from
0xa5fee0)"). The test, READ: the particle update 0xa5fdf0 runs only with gen+0x10 bit 2 set and a live particle (gen+0xb0 != 0), and
switches on the generator's TYPE, gen+0x40 bits 20..23 -- the efl row's column word [row+0xc] & 0xf, written by generatorInit
0xa55fe0. Type 6 -> 0xa60744, which calls 0xa63efc once per live particle (0xa607e8). em021_00_004 row 10 (u 200's UNIQUE record)
carries type-6 generators, so any play of the record takes it: it was never a distance or camera branch. No set reached it because
vecdrawsched.py records only the routines on lift-effects.sh's lift lines, and the sets so far recorded the CLIP (SEQUENCE u 200),
not the shell's UNIQUE record. Fixed by putting 0xa60744 and 0xa63efc's static callee closure on the lifted-added line, recording
the UNIQUE records standalone (scratchpad fb/rec_shellrec.py: add_em021_00_shellrec_u200 / _u0, plain and _near) and lifting from a
copy: soak em021_00 56 motions, 0 refused; page check 18 / 18 (the L2 M16 gas breath, which had failed behind the L2 M12 refusal,
passes). The closure's 0xa7719c / 0xa74884 / 0xa75290 / 0xa75434 / 0xa74d18 / 0xa70678 / 0xaf8b40 / 0xaf873c / 0xaf85b8 / 0xa66224
have no recorded blocks (these records do not reach them).""".replace('\n', nl)
assert s.count(a) == 1, s.count(a)
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
