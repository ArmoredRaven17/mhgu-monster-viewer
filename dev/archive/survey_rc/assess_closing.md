## The enable words read for this pass

| class (monsters) | vt | +0x13c | extent | what it ORs over the base | inputs the viewer lacks |
|---|---|---|---|---|---|
| uEm057_00 (Zinogre, Thunderlord) | `0x17ca8ec` | `0xf0279c` | `0xf0279c..0xf02e94` (pool to `0xf02ea0`) | NOT READ arm by arm: variant split at `0xf027b8`, jump tables over `0x201..0x23f`, death motions, L0 M20 / M24; sets and clears bits | variant, charged (have), rank (have: 5), action, `e+0xb5f8`, `e+0xcb14`, `e+0xb720` |
| uEm068_00 (Najarala) | `0x17df180` | `0xf88044` | `0xf88044..0xf880e0` | L2 M61: part 2 broken (vs .dtp byte +5 / +6 by rank) ? 18-20 : 15-17; L0 M44: sunk ? 18 : 15-17 | part 2 broken (from parts shown); sunk (stand-in false) |
| uEm070_00 (Nerscylla) | `0x17e222c` | `0xfab634` | `0xfab634..0xfab6b8` | every motion: rank 5 -> 21-23, 3 -> 18-20, 1 / 0 -> 15-17; L0 M6 / M8 with `e+0x1068` bit 3 -> 30-31 | rank (have: 5); the floor flag bit 3 |
| uEm071_00 (Gore, Chaotic) | `0x17e418c` | `0xfc08a8` | `0xfc08a8..0xfc0910` | L2 M7 with (7, 0x60) -> 18-20, (7, 0x58) -> 15-17, both clearing bits 6 and 9 | the action of an L2 M7 play |
| uEm087_00 (Ahtal-Neset) | `0x17f9aec` | `0x10ad838` | `0x10ad838..0x10ad9f4` (last insn `b 0x7ded8` at `0x10ad9f0`) | via `0x6d1b4` (base + a motion-keyed table walk), then bits 15-23 always; the L3 M3..M16 switch writes no word | none, if `0x6d1b4`'s callees add nothing (INFERRED) |

## What closing each needs (easiest first)

1. **Config-only rows**
   *1a -- the data is READ:*
   - **Najarala's u 1400** -- `'0|Motion[44]': { hold: ['em068_00u', 1400] }`, the first row of a new em068_00 MOTION_STATES block (rom-map "u 1400 -- the per-class sweep"). *1 monster.*
   - **Zinogre / Thunderlord's tail drop joint** -- CUT_TAIL says 144, the sever passes 143 (`0xeed248`); a one-number correction, for the owner of tail-option.js to confirm against the Diablos precedent. *2 monsters.*
   - **Rage puff** (RAGE_PUFF + `_autoOnRage`): Najarala and Nerscylla `{ period: 30, joint: the record's, pick: () => 0 }` (vt+0x2a4 the base stub, no P+0x5d04 / `e+0xb7d2` write in the band); Gore and Chaotic `{ period: 30, joint: 4, pick: rathianPuffPick }` on their u 1120 / 1121 (vt+0x2a4 `0xfbec80` = Rathian's `0xd08afc` instruction for instruction; P+0x5d04 = 4 at `0xfadbac`; no `e+0xb7d2` write). *4 monsters.*
   - **Najarala's tired drool c 1104** -- TIRED_DROOL `['em068_00c', 1104]` (tired-capable: his Exhausted state on 0x81614; no `e+0xb7d3` write in the band). *1 monster.*
   - **Thunderlord's c 1104** -- nothing to do: no tired state (read). *Reclassified, not a gap.*
   *1b -- config rows after one small read each (no states note exists for these three classes, so each needs its read first):*
   - **Ailment rows c 1101 / 1102 / 1103 / 1105 / 1109**: the action -> clip map with the generic prober (efx/agents/notice-scratch/probe.py), then rows as every other monster's. *4 monsters: Najarala, Nerscylla, Gore, Chaotic.*
   - **Tired drool c 1104** for Nerscylla, Gore, Chaotic: no `e+0xb7d3` write in their bands; left: whether they tire (`[tune+0x30]`, the stamina block). *3 monsters.*
   - **Break records**: Najarala u 1001, Gore / Chaotic u 1000 -- part, level, clip. *3 monsters.*
   - **Gore / Chaotic's tail**: sever site READ (`0xfae5cc`, joint 143) and both tail glbs staged; left: the sever clip (the u 900 row) and the option descriptor (CUT_TAIL u 905). *2 monsters.*
2. **Base-only enable words**: **none** -- all five classes override vt+0x13c. *0 monsters.*
3. **Override enable words** (then add_effects.py --apply / --record / --check, which also brings in the unexported outside-mask records: Zinogre 14, Thunderlord 23, Nerscylla 14, Gore 5, Chaotic 4, Ahtal-Neset 2)
   - **Read whole here, transcription only**: Gore and Chaotic (`0xfc08a8`; needs CLIP_ACTIONS for L2 M7, whose actions are unread), Najarala (`0xf88044`; needs his part-2 broken set from the parts shown), Nerscylla (`0xfab634`; rank from SHELL_QUEST_RANK, a stand-in for the floor bit). Najarala and Nerscylla are VISIBLE fixes, not just additions: the viewer fires both of Najarala's L2 M61 forms and all three of Nerscylla's rank forms at once today. *4 monsters.*
   - **Read in part**: Ahtal-Neset (`0x10ad838`, body read here; left: a transitive scan of `0x6d1b4`'s callees `0x7db70` and `0xb07b4` for a +0x13f4 write -- the same read Ahtal-Ka's `0x10bc340` is blocked on, so one scan unblocks both). His 96 outside-mask bindings, the most in this set, all come in once it holds. *1 monster (+ Ahtal-Ka).*
   - **To read whole and emulate**: Zinogre and Thunderlord (`0xf0279c`, ~0x6f8 bytes, two variant arms; 42 bindings each at bits 15-31 and 21 file-mask bindings that fire unconditionally today). The largest read in this set. *2 monsters.*
4. **Records needing a recorder pass**
   - **Ahtal-Neset's 37 refusals of 77 motions** -- never recorded (no em087_00 set); two generator methods never lifted (`0xaaeb90`, `0xa996b0`, both reached through the draw pass's `blx [vt+0x4c]` at `0x9b65b0`) plus the `0x44158 -> 0x441cc` request arm. Record, then lift two whole methods. The biggest recorder job here and his first step. *1 monster.*
   - **Najarala's `0xcad554 -> 0xcad560` refusal** (6: L2 M61, L2 M70-74): he has never been recorded (no em068_00 set in efx/vectors); record his sets, then lift the `+0x41` bit-1 arm of `0xcad528`. Each refusal stops all his effects until reload, and L2 M61 is also the motion his enable word fixes. *1 monster.*
   - **The `0xa92798` refusal on L3 M9** (u 530 / 531): a recording that reaches the non-empty list walk in `0xa9272c`, then a lift -- the same cure Nibelsnarf's board item waits on. It stops all of the monster's effects until reload. *2 monsters: Zinogre, Thunderlord.*
   - **Stage-ray records, recordable since 2026-10-07**: Zinogre / Thunderlord c 230; Gore c 101 / c 110; Chaotic c 101 / c 110 / u 700. **Gore's c 101 is the record that faulted the recorder on 2026-09-25** -- record it first. *4 monsters.*
5. **Shells, class code, undecoded**
   - **Shells** -- none of the seven has a SHELL_DATA entry: Zinogre 5, Thunderlord 16, Najarala 6, Nerscylla 7, **Gore 11 (the frenzy breath)**, Chaotic 21 (ten of them Shagaru's files), Ahtal-Neset 11 -- 77 records; shells.js carriers first. *7 monsters.*
   - **Class-code records** (request sites unread): Zinogre u 90 / 120, Thunderlord u 42 / 90 / 151 / 280, Najarala u 1010 / 1015 / 1030 / 1035, Nerscylla u 30-34 / 1006 / 1007 / 1011 / 1021, Gore u 30 / 31 / 1010 / 1015 / 1035 / c 1146 / 1147, Chaotic the same + u 124, Ahtal-Neset 15. (Zinogre's and Thunderlord's u 30 / 31 stay unwired on purpose.) *7 monsters.*
   - **Thunderlord's list 9 actions**: unread (motion-states.js em057_04 header). *1 monster.*

## Unread, named

- The PSL enable word of uEm057_00 (arm by arm); the transitive callees of `0x6d1b4` (`0x7db70`, `0xb07b4`; Ahtal-Neset and Ahtal-Ka); what floor sets `e+0x1068` bit 3 (Nerscylla's bits 30-31).
- The action -> clip maps of uEm068_00, uEm070_00, uEm071_00 (ailments, breaks, sever); whether Nerscylla and Gore tire (`[tune+0x30]`); Najarala's part-2 broken set.
- Whether anything requests Gore's c 1120 / 1121 (the puff takes the u pair). The gate scans (`0xb7d2 / 0xb7d3 / 0x5d04`) are by class band -- an address range, not proven membership.
- Gore's uEnemyOption descriptor and sever clip; which actions play Gore's L2 M7; Thunderlord's list-9 actions; the meaning of Ahtal-Neset's L3 M3..M16 part arms and `0x7ded8(e, 0, 0x5f / 0x60)`.
- The meaning of the `0xa92798` list (`[r5+0xb0]`) -- not needed for the cure, which is a recording that reaches it.