import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      covers it.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      ALL SOAKED CLEAN 2026-10-16 (0 refused): Diablos 72, Rathian 104, Gold 112, Dreadqueen 118, Rathalos 112, Silver 116,
      Dreadking 132, Khezu 65, Gravios 78, Barioth 80, Seregios 106 (shells c 30 / c 32 built + recorded), Silverwind 66
      (shells built: blades, rising / falling spikes, severed forms -- SHELL_TAIL em037_04 { severed: 17 }). Page-check
      suite 3323 / 41 (the 41 baseline). FLYING WYVERNS: every enable word now read and implemented.
      Left, named: Seregios's bladescale shells 0x13d / 0x13e + c 31 (unread); Silverwind's u 3 (hunter hits), shell46
      mode 1 / shell00 mode 14 (no stream issues them), base46's hunter aim; Silver's L4 M38 (7, 0xf5) play (who issues it
      unread); Seregios's c 30 pulse is a stand-in clock (the ROM's runs from reset).
- [ ] (bug) Shell captures ran TIRED until 2026-10-16 (dev/shell-capture.mjs never ran driveMotionStates, so the boot
      clip's tired row stuck; rom-map trap 64, fixed). Caches logged tired = true for em081_00 / em081_04 / em084_00 /
      em088_00: any of their spawns gated on tired recorded the tired branch. Their soaks are clean today, but re-capture
      (delete efx/plans/<mon>/cap_*.json, re-run record_shells.py) to be sure of the untired paths.
- [ ] (look) Base01 deletes a shell 900+ above the ground (P+0x44 - P+0x5b4); the viewer's ground is the clip's lowest
      bound (monsterFloorY), so on flight clips some of Seregios's c 30 / c 32 vanish at once (L1 M1 step 100: 933.6 up;
      L1 M5 f46: 920.6) -- rom-map trap 65. Whether the game's arena floor gives the same answer is not read.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
