# romap_duo4.py: couplings, his decision loop, grabs geometry, the M79 pose (re-reads rom-map; appends to the duo section)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
assert '`0x7c9234` (the game RNG)' not in s
key = '| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` (re-read solos)'
i = s.index(key)
rows = '''| her 7:0x4d / 0x4e / 0x4f + his 7:0x3f (request 0x10) | 7:0x4d L0 M1 one frame (`0xf977d0`) -> 7:0x4e L0 M65 b8 (`0xf9720c`), looped until his flag `[+0xcac0]+0x6b` (`0xfd92e0`, read at `0xf96e94`) or her timer -> 7:0x4f L4 M42 from 90 b8 (`0xf93c5c`); his 7:0x3f: record `0x16a16d4` (M33 x3; 2nd triple M35 / M36 / M37 b8) via `0x7a258` (`0xfd5a38`); flag set at his frame 105 (`0xfd5a40..0xfd5a88`), the 2nd triple to frame 40 (`0xfd5aa0`), M33 from 100 b4 (`0xfd5d48`); repeats via `+0x6c` (<= 3) NR | uEm069_00 / uEm076_00 | E + R | spec §11 row 10 |
| `0x7c9234` (the game RNG) / `0x49634` / `0x3f76e4` / `0x857dc` | xorshift128 (t = s0; shift the words; t ^= t<<15; t ^= t>>4; t ^= s3 ^ s3>>21; s3 = t), low 16 bits; EMC op 0x02 draws it against cumulative weights out of 100 | shared | R | spec §12 |
| his linked table g0 s4 (variant 0), op 0x77 case 0 | after his ride's frame 180: 20 -> 7:0x32 (M31), 30 -> 7:0x33 (M32), 40 -> 7:0x33 then the ride, 10 -> the ride -- the same in every class of hers (selector 2); op 0x77 case 0 INFERRED (value slot 0 at `0x84f8c`, `0x8e088` not read through) | uEm076_00 | R (file) / I (op 0x77) | spec §12; render/monster.js `free` |
| her pincers (joints 160 / 161) to his root, all 158 clips | holds: L4 M27 loop 1.80..2.00, M28 0.43..1.96 to ~f220, M77 1.03..1.67, M78 0.60..1.20, M79 0.63..1.10 to ~f128; M76 loop 2.2 (over him); M96 a reach (2.58 at best); L3 M12 / M18 never within 4.9 of joint 200 | data (viewer geometry) | E | spec §13 (`duo/grab-scan.mjs`, `grab-detail.mjs`) |
| his M79 freeze pose | his LMT 4 entry 79 = 61 frames, loop 0 = the viewer's list-4 Motion[79]_loop; held frame 187 mod 61 = 4 (+-1: her motion-ended bit `0x94dc04` NR to the frame); the viewer's held pose = the solo clip at frame 4 (0.006 rad); M79 is a struggle loop (0.3..0.7 rad a frame), so the frozen frame is a mid-struggle instant (joint 5 81 degrees off his ride pose) -- the ROM's | uEm076_00 / data | R + E | spec §13 |
'''
s = s[:i] + rows + s[i:]
s = s.replace("check dev/checks/em069_00.mjs duo block 42 / 42 (movement asserted: >= 0.2 rad under every asking clip, the ride 0.072)",
              "his own decision loop under her plain clips (`free`, seeded xorshift128), the 7:0x4e coupling on S_4; check dev/checks/em069_00.mjs duo block 51 / 51 (movement >= 0.2 rad under every asking clip; his root in her pincers through every grab; his sequence = the table's, reproducible on a scrub)")
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
