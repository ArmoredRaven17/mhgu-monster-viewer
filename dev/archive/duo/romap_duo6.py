p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0xfc9be4` / `0xfc9c88` / `0xfc9ce4` | his separation 1:0x22: M77 (`0xafef0`), on landing (`0xbf0bc`) L3 M11, at its end L3 M29, then vt+0x3dc | uEm076_00 | R | spec §2.2 (the board read L3 M11 alone) |"
i = s.index(anchor)
j = s.index(nl, i)
rows = [
"| `0xfc9a18` / `0xfc9a88` -> `0x7206c` -> `0x539d5c` / `0xfc9aa4` | **the end of the tail grab (Seltas duo agent, 2026-10-17)**: his 1:0x21 phase 0 writes `P+0x1bc` = 1200.0 (`movt #0x4496`) beside the speed-0 call; phase 1, with her object `[+0x50]` set, only counts it down by `e+0x1c` x 1.0 (the unit delta, NOT his motion speed: it runs while frozen) and at 0 sets 1:0x22. So he stays FROZEN AND LINKED through her M78 / M79 (carried back onto her back by joint 200) and ~844 frames past her M79's end; he is not dead (no kill code, spec §8). `0xc0368` (`0xfc99d0`) clears `P+0x3a2` at her M79 frame >= 80 | uEm076_00 | R | spec §15 |",
"| `0xfc9ab4` (1:0x22 start) | unlink `0xc20f4`, `P+0x1bb` bit 0 cleared, M77 b0, yaw + 0x8000, `P+0x14` = -10, `+0x24` = -1 (the drop), then the landing chain of the row above -- not inside any clip of hers | uEm076_00 | R | spec §15 |",
"| viewer: `+ Seltas leaves` (index.html `releaseMatOf`, `ROM_PARTNER_BODY.em069_00.leaves`) | request-7 clips of hers (L4 M68 loop, L3 M12, M18, M35 loop, M36 loop): he is released at HER frame 0 (1:0x13 `0xfc5054`), held in world space where joint 200 was, M46 b4 then M47 (`0xfc8e84`), glow group 8 off (`0xfc6468`); the check asserts his frame fixed while joint 200 moves, with a linked control | uEm076_00 | R (ROM) / viewer | spec §15, dev/checks/em069_00.mjs |",
]
s = s[:j] + nl + nl.join(rows) + s[j:]
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
