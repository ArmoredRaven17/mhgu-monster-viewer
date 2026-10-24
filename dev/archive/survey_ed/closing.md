## What closing each needs (easiest first)

Counts are monsters (variants counted). Addresses are the class's; "UNREAD" means nobody has read it, not that it is hard.

1. **Config-only rows (mechanism read, data in hand)**
   - **RAGE_PUFF + `_autoOnRage` where the SHARED puff runs on the base pick** (no `e+0xb7d2` write in the band,
     vt+0x2a4 = 0x6bf64, `pick: () => 0`, period 30): **Lao-Shan Lung, Kushala, Nakarkos** (3; Nakarkos is already in
     `_autoOnRage`). Teostra has the same shape, but Raven took him off `_autoOnRage` on 2026-09-15 -- ask first.
     The joint: none of the four writes `P+0x5d04` in its band; take the record's joint as the dromes do, and say so.
   - **Nakarkos's own u 1121 on L0 M50** (`0xa499c(e, 1)` at 0x10739d0, READ in rom-map's u 1400 sweep): one
     MOTION_STATES row once the site's hold / start shape is read off it (1).
2. **Base-only enable words** (`() => 0` in psl-mask.js + `--apply`): **Chameleos, Amatsu, Valstrax** (3). Zero
   bindings outside the mask on the first two; Valstrax's one (u 101 L1 M2 b15) stays off, as the game has it.
3. **Override enable words to read** -- 7 classes, 9 monsters, smallest first (skimmed sizes; none transcribed):
   - Lao-Shan Lung `0xd77ac8`: bits 15-26 OR'd unconditionally; 0 outside the mask (the two calls after it, 0x7db70 /
     0xb07b4, are the only thing left to rule out) (1).
   - Shagaru `0xfc08a8` (uEm071_00, shared with Gore): 26 instructions, L2 M7 only, (7, 0x58) / (7, 0x60) and a bit 6 / 9
     clear; 22 outside, u 260 comes in (1).
   - Kushala `0xdfd19c`: the aura-level table (`P+0x1bb`, `ctl+0x2c / 0x2d`, one literal table word to read); 1 outside,
     no record behind it (1).
   - Kirin `0xd73a18`: L4 M7 by action (a 44-entry jump table) and L2 M4 under `0x6fe88(e, 7, 2)`; 9 outside, u 200 /
     u 201 come in (1).
   - Fatalis line `0xd8aecc`: three variant arms on `e+0xb5f5`; 5 / 5 / 10 outside, every one already exported (3).
   - Teostra `0xe1a9d8`: three motion arms plus `0xa1f0c(e, 2)` / `P+0x1bb`, AND a stop of the handle at `e+0xcacc`
     inside the method; 3 outside, u 285 / 286 / 289 come in (1).
   - Alatreon `0xece27c`: the largest -- two jump tables reaching past the first return, extent open; 9 outside,
     six unexported records come in (1).
4. **Records needing a recorder pass**
   - **Stage-ray records, now recordable** (refused before 2026-10-07; `--apply` / `--record` / `--check`): Kushala c 61 /
     c 62, Chameleos u 240, Shagaru c 101 / c 110 (3).
   - **The unexported records each word brings in** (after step 3): Kirin u 200 / 201, Teostra u 285 / 286 / 289,
     Alatreon u 200 / 231 / 240 / 450 / 451 / 550, Shagaru u 260 (4).
   - **Kushala's wind barrier**: re-model (ids 1004..1007 -> u 210 / 220 / 230 / 240 by `ctl+0x2c` and the snow-map byte
     `ctl+0x2d`, held while alive -- READ, board 2026-09-14) and re-record for placement MODE 4 (the camera chain built for
     Nakarkos, 2026-10-05; the board's open "re-record the other mode-4 records") (1).
   - **Nakarkos's class records c 800 (x3, L3 M65) and c 1600 / c 1601 ((10, 0x6a))**: READ (dev/em084-class-effects.md
     3 / 4), not exported (1).
5. **Undecoded, or a new runtime**
   - **States reads -- no `states-<mon>.md` exists** for em012, em013, em024, em025, em027, em058, em071/072, em086: the
     paralysis / sleep / stun / shock-trap / exhaust clips (c 1101-1105, c 1109) and the part-break ladders (u 1000 /
     u 1001) of **Lao-Shan (breaks only), Fatalis x3, Kushala, Chameleos, Teostra, Amatsu, Shagaru, Valstrax** (10). Each
     row is then config (`every: [[c, 1105], 42]` on the (10, 0x6e) clip, as on the dromes), but the clips are unread.
     efx/agents/notice-scratch/probe.py + scr.py resolve status-10 scripts.
   - **CUT_TAIL** (u 900 / u 905): **Kushala, Chameleos, Teostra, Amatsu, Shagaru, Valstrax** (6). Every tail glb is
     staged; the sever joint (`+0x1477`, the kind byte at the class's `bl 0xc2274`) and the sever clip are UNREAD for all six.
   - **Own rage-puff picks** (vt+0x2a4 overrides, as Akantor / Ukanlos / Rathian have): Fatalis line `0xd7e800` (3),
     Chameleos `0xe025f0`, Shagaru `0xfbec80` (`P+0x5d04 = 4` on all three) (5).
   - **Own rage puffs, the shared one switched off** (`e+0xb7d2 = 0` in vt+0x1d8; 1120 / 1121 in the class table --
     Alatreon's pattern): **Amatsu, Valstrax** (2). Their class code's request sites are unread.
   - **Kirin's lightning aura** (u 0 / u 60 / u 61): READ (states-em011_00.md 5.2); needs a small periodic class driver
     (calm record, two enraged periods, the motion-suppress list, the horn gate) and the `clip` tag dropped (1).
   - **Nakarkos u 1400**: the shared one-shot latch 0xadc98; its gate bits (`+0x1404` bits 20 / 21, `+0x1408` bit 0)
     are UNREAD -- one shared read that serves every latch monster (1 here).
   - **Nakarkos's 32 tentacle PSL records**: PHASE 3 of the Tentacle Form item -- the arm as an effect parent for PSL clip
     effects (enable method 0x107f0e4 READ) (1).

## Outside this method: class-table keys not exported

efx/class-effects.json's id->key tables, against what docs/effects holds (a key match in either pel; the trap in rom-map
"class-effects.json OVER-REPORTS request sites" applies to its site lists, e.g. uEm012_00 and uEm025_00 list sites in
uEm013_00's and uEm027_00's bands): Lao-Shan 1600-1602; Fatalis 1600 / 1601; Kushala 1 (and the barrier's UNIQUE 210 /
230, above); Teostra 1, 160-165, 170-173 (1 / 2 / 3 removed on Raven's call; 160-165 are type-25 rows); Alatreon 11, 12,
37-40, 530, 531; Amatsu 0-3, 102, 1600, 1601; Nakarkos 3, 800, 1600, 1601; Valstrax 130. Kirin's {0, 60, 61} and
Shagaru's {30, 31} are all exported. These are the class-code layer the survey method does not walk; each needs its class's
request sites read.
