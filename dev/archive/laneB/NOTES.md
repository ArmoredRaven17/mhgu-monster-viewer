# lane B working notes (to document)
- em069_00 u 0/1/2: P+0x1bb bits1-2 level; vt+0x208 0xf8b2ec holds (ids 1001-1003, table 0x16a0d8c?); writes vt+0x204 0xf89228 (hook204 emulation all actions); timer vt+0x1dc 0xf8a978 0xf8ad30..0xf8ae44 3000/2400/900. BUILT CLASS_TIMERS em069_00 queenLevel069, CLIP_ACTIONS/CLIP_VARIANTS L0 M1 B (7,0x4d). exported u 0/1/2 event. probe pq/b069lv: all 3 draw.
- probe.mjs trap: loop set after clip pick -> play-once; laneB/probe2.mjs fixes.
- em087 u 500..605: Neset vt+0x1dc 0x10a4bdc loop r5 0..6 ids 1002..1008 (table 0x16a32c8), gate bit mask table 0x16a314c[r5] & 0x10aeb68(G) ... to read
- em070 u 34: 0xf9e450(e, kind) (1,0x16..0x19) target slot P+0x230 kind 1 (0xc2df8) / 2 (0xc2ecc); with obj: C+0x10 = its point, C+0xb5 |= 8. callers 0xf9ed50/60, 0xf9ee00/10 kinds 0..3
