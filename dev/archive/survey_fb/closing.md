## What closing each needs (easiest first)

1. **Config-only rows** (motion-states.js; no read, or the read is already in a note):
   - **The shock trap c 1105 on a hold shared with paralysis** -- **5 monsters**: Congalala (L3 M6), Blangonga (L3 M9),
     Furious Rajang (L3 M13), Lagombi and Snowbaron (L3 M13, and L3 M73 into it). None has a trap clip of its own (each
     (10, 0x6e) goes straight to the hold, then the recovery clip), so the birds' fix -- the row on the trap's own play
     clip -- does not apply. The route is Bulldrome's: `cycle: [{ every: [[c, 1101], 60] }, { every: [[c, 1105], 42] }]`.
     Each block's comment records "shown as paralysis" as a choice (Blangonga's and Lagombi's: c 1105 is byte-identical
     to c 1101 but for the key, so only the period changes). The Viewer's call, not a read.
   - **Rajang's whole MOTION_STATES block** -- **1 monster**: c 1101-1105, c 1109, u 1000 / u 1001, the tired idle L0 M17,
     the sleep lids, the rage sets -- all from states-em023_05.md, which read both variants (section 7: not one action
     differs; 1.1 / 4.2 / 6 give his own tune, rage and tired arms; his .dtp's third row). The largest config job here.
   - **The classifier, not the viewer** -- **2 monsters**: Rajang u 1120 / u 1121 (variant 0 writes `e+0xb7d2 = 0`, no
     puff) and Furious Rajang c 1104 / c 1109 (tune+0x30 / +0x44 NULL) are never requested -- READ. Not gaps.
2. **Base-only enable word** -- **1 monster**: Kecha Wacha (uEm065_00 = 0xca170): `() => 0` in psl-mask.js + --apply; c 50
   (L3 M11 bit 0, outside the file mask) comes in, u 210 / u 211 become state-gated.
3. **Override enable words to transcribe** (each disassembled whole here, not emulated; emulate, then psl-mask.js +
   --apply / --record / --check), smallest first:
   - uEm030_00 Bulldrome, 0xe1c4b0 (20 instructions) -- **1**: nothing visible changes at the surface; state gating only.
   - uEm083_00 Gammoth / Elderfrost, 0x1054b8c (18 instructions) -- **2**: Elderfrost's L9 M16 fires u 511 or u 220 by
     action (7, 0x6a), not both; Gammoth gets the state gating of c 25.
   - uEm022_00 Blangonga, 0xdda5ac -- **1**: c 120 on L0 M32 / M33 stops once the fangs break (0x9d36c(e, 0) against the
     .dtp threshold byte, rank-picked).
   - uEm061_00 Lagombi / Snowbaron, 0xf32bac -- **2**: Lagombi loses c 10 on L0 M2 / M52 (Snowbaron-only arm).
   - uEm060_00 Arzuros / Redhelm / Volvidon, 0xf1911c -- **3**: Arzuros loses c 60 on L0 M13 / M17 (Redhelm-only arm);
     Redhelm's u 320 on L9 M1 waits on the byte `e+0xcaee` (UNREAD).
   - uEm023_00 Rajang / Furious, 0xded0f4 -- **2**: u 291 on L2 M8 by action number only, not tired; the out-of-mask
     bindings are base bits and come in with any reading (c 153, u 294 unexported).
   - uEm021_00 Congalala, 0xdd7cf4 -- **1**: already READ (states-em021_00.md 3.4, misnamed there the "attack hit-group
     mask"); its cost is the viewer state it needs -- the gas type `ctl[1]` and the item `ctl[0]` -- to pick one of the four
     gas records (u 200-203 / u 260-263 / c 150-153) where the viewer now fires all four or none.
4. **Records needing a recorder pass**:
   - **The 0x3294c4 refusal** -- **2 monsters**, Gammoth and Elderfrost, L0 M30 and L2 M21 each (u 265 / u 256 / u 244
     alive): the request routine's arm after `blx [vt+0x68]` answers 0 was never recorded. The only refusals in the
     category, and a refusal stops every effect of the monster until reload -- so this is the first recording to make.
     Why +0x68 answers 0 for these records is NOT READ.
   - **Ground-ray records** (payload +0x52 / +0x5c bit 4, recordable since 2026-10-07: --apply / --record) -- **5
     monsters**: Congalala c 40 / 190 / 191; Blangonga c 40 / 41 / 42; Kecha Wacha c 42 / 43 / 44 / 110; Gammoth u 242 /
     261 / 302 / 303 / 340 / 400; Elderfrost u 261 / 302 / 303 / 340 / 400 / 472 / 473 / 520. The out-of-mask unexported
     records (Congalala c 150-153, u 241, u 261-263, u 281; Rajang and Furious c 153, u 294) come in with their class's
     --apply in item 3.
5. **Undecoded**:
   - **A states decode for uEm060_00 and uEm065_00** -- **4 monsters**: Arzuros, Redhelm Arzuros, Volvidon, Kecha Wacha
     have no states-*.md, no MOTION_STATES block, no RAGE_PUFF and are not in _autoOnRage; their whole status band
     (c 1101-1105, c 1109, the break records u 1000 / u 1001) and the puff wait on it. The puff and drool bytes are not
     cleared by either class (INFERRED, immediate scan with controls).
   - **Bulldrome's u 1400** -- **1**: the site 0xe1e8d0 is read; which status-7 action / clip reaches it is not.
   - **Blangonga's u 1400** -- **1**: no request in his class band (bounded branch scan, control Bulldrome's site found);
     the transitive check is what turns "probably never requested" into a read.

### Unread, named

- Which action / clip reaches Bulldrome's u 1400 site 0xe1e8d0.
- Whether anything in Blangonga's class reaches 0xa499c transitively (his own band has no call).
- `e+0xcaee` (gates Redhelm's L9 M1 bits 18-20); posture 4 for Arzuros / Volvidon / Lagombi / Blangonga / Bulldrome
  (0x81d6c's "sunk" test) -- the viewer plays every motion from the surface (0x81d6c = 0), as for Basarios's L0 M7.
- The states of Arzuros, Redhelm, Volvidon and Kecha Wacha (no decode note).
- None of the "first look" overrides was emulated; uEm021_00's was read by the Congalala decode.
