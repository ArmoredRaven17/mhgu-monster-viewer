### Akantor -- the rage material machine and its six materials (Viewer agent, 2026-10-08; docs/render/monster.js ROM_STAGE_CLIPS em033_00)

Raven: "Akantor's eyes remain orange, they should be green in calm and then orange in enraged." The eye stuck orange after the first rage: the viewer's machine entry named the wrong three materials and never put Normal back.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xe362a4..0xe36324` | spawn cache of the six rage materials **by MRL id**: per model material `0x88db14`, id = `[mat+0x18] >> 22`, `uxtab` id − 1, switch 0..5 → `ctl+0x30 + 4(id−1)` (ctl = `[e+0xcac0]`). Akantor: +0x30 m01_body, +0x34 m02_eye, +0x38 m03_sukima, +0x3c m04__kekkan, +0x40 m05_body_add01, +0x44 m06_body_add02; m00_face (id 0) not cached | uEm033_00 | R (the cache) / I (mNN = MRL id, the convention of em086 / em063_05's rows) | monster.js ROM_STAGE_CLIPS em033_00 comment |
| `0xe37560` (vt+0x210) | the rage material machine, ctl[6] 0..3, jump table `0xe37594`: 0 + enraged → `Angry_Start` slot 1 (time 0) on +0x3c/+0x40/+0x44 → 2; 2 → when +0x3c's Angry_Start time ≥ its frames (`0xe377ac..0xe37800`, `blt` exit if the clip is absent) all six `clearAllSlots` + `Angry` slot 0 → 1; 1 + calm → `Angry_End` slot 1 on the three → 3; 3 → when +0x3c's Angry_End has run, all six clear + `Normal` slot 0 → 0 (`0xe378c8..0xe37930`) | uEm033_00 | R | monster.js ROM_STAGE_CLIPS em033_00 (`layered`) |
| `0xe37934..0xe379c0` | after the switch: vt+0x3f4 (`0x7fed4`) = 1 and ctl[6] = 0 → `End` in slot 1 of +0x38 (sukima) unless already there (`0xb0cff0`) | uEm033_00 | R | **not transcribed** (no action category in the viewer) |
| m02_eye clips | `Normal` tex key 1 = the green-eyed atlas (`bb455a75`), `Angry` key 2 = the orange (`7513448e`); kind-3 keys are 1-based into the entry's texture list | — | R (data) | materials.json em/033_00 |
