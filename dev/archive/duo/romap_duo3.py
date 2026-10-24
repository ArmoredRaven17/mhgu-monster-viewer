# romap_duo3.py: the follow-up re-read rows (re-reads rom-map first; appends rows to the duo section, updates its viewer row)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
assert 'his ride 1:0 (`0xfc7d74`)' not in s
old_viewer = "| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` / `pairs` / `claws`, composeClip `blend`, index.html syncPartner / partnerClipOf / stepAttached claw set; check dev/checks/em069_00.mjs duo block 32 / 32 | viewer | R (transcribed) | spec §9 |"
assert s.count(old_viewer) == 1
rows = '''| his ride 1:0 (`0xfc7d74`) | L4 M35 blend 10 (`0xfc7dd4`), wings 0; at his frame 180 (`0xfc7dec`, `0xb0968` mode 1, 180.0 at `0xfc7e28`) `0x75230(e, 1, 0)` + `0x82454`: his command table picks again (ride, or by weight 7:0x32 / 0x33 ... his riding attacks, g0 s4 by her class `0xfc5540`). No test of her in it -- M35 is the ROM's near-still pose under her `both` clips | uEm076_00 | R | spec §0 / §2.5 |
| her linked vs unlinked streams (em069_00_cmdtbl g0 s2 -> s4 / s13 vs s5 / s3; events g2..g20 apart) | issued ONLY by her unlinked streams (+ events), no linked arm: 1:0x2, 0x5, 0x6, 0x9, 0xa, 0x27, 0x28, 2:0x9..0x10, 2:0x18, 7:0xb, 0xc, 0x17, 0x18 -> their 22 clips solo (I for the event paths); 7:0x1a / 0x1e / 0x23 / 0x27 kept both (linked arm: request 0xe `0xf8964c`); g2 s0 / s1 shake him off (1:0x1a) before burrowing when linked | uEm069_00 | R (walk) / I (event triggers NR) | spec §2.5 (`emclink2.py`; control: the known linked-only attacks fall on the linked side) |
| his answers vs her flinch: `0xfc7e5c`, `0xfc9070`, `0xfcaa04`, `0xfcb160`, `0xfcba14`, `0xfcf4a8`, `0xfcf9e8`, `0xfcfce4`, `0xfcfdfc`, `0xfd03f4`, `0xfd0554`, `0xfd58dc`, `0xfd5e84`, `0xfd6c60` | every answer of his (3:0x34..0x42, 7:0x3f / 0x40 / 0x42, 1:0x1/0x3, 1:0x1a, flights) leaves when she is in status 10 (number != 0x69); his ride 1:0 has no such test | uEm076_00 | E (sites hit per action) | spec §2.5 |
| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` (re-read solos) / `pairs` / `claws` / `partnerList` (S_4, his 23 combined clips on her Animation list, her side composed -- the Nakarkos model), composeClip `blend`, index.html syncPartner / partnerClipOf / partnerListBodyClip / stepAttached claw set; check dev/checks/em069_00.mjs duo block 42 / 42 (movement asserted: >= 0.2 rad under every asking clip, the ride 0.072) | viewer | R (transcribed) | spec §9 |'''
s = s.replace(old_viewer, rows)
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
