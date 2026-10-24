### The PSL enable word per class -- vtable +0x13c (Viewer agent, 2026-10-15)

Read off each class's vtable (efx/class-effects.json `vtable`, the words at vt+0x13c in main.data). Control: the seven
classes whose word is already read all match at the given vtable (uEm004_00 0xd2e0ec, uEm007_00 0xd4532c, uEm033_00
0xe3e368, uEm038_00 0xe62c8c, uEm081_00 0x1019eb4; uEm032_00 / uEm037_00 the base 0xca170) and none at vtable + 4. A slot
holding 0xca170 is NO OVERRIDE: bits 0-5 + the state group only (`() => 0` in psl-mask.js).

| class (monsters) | vt | +0x13c | st | detail |
|---|---|---|---|---|
| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` | R (slot) / override UNREAD | dev/flying-wyverns-effects-survey.md |
| uEm003_00 (Khezu) | `0x17958f0` | `0xd0f728` | R / UNREAD | " |
| uEm004_00 (Basarios, Gravios) | `0x1797c8c` | `0xd2e0ec` | R (em 4 arm transcribed; em 5 tail 0xd2e35c UNREAD) | psl-mask.js |
| uEm007_00 (Diablos, Bloodbath) | `0x17994cc` | `0xd4532c` | R, transcribed (em007_04) | psl-mask.js |
| uEm008_00 (Yian Kut-Ku) | `0x179ac54` | `0xd514b8` | R / UNREAD | dev/bird-wyverns-effects-survey.md |
| uEm009_00 (Gypceros) | `0x179c5d8` | `0xd5e768` | R / UNREAD | " |
| uEm014_00 (Velocidrome; the dromes' class -- check em015/016/034 share it) | `0x17a813c` | **`0xca170` (no override)** | R | " |
| uEm018_00 (Yian Garuga, Deadeye) | `0x17abb38` | `0xdb0d10` | R / UNREAD | " |
| uEm032_00 (Tigrex, Grimclaw) | `0x17b8748` | `0xca170` (no override) | R, transcribed | psl-mask.js |
| uEm033_00 (Akantor) | `0x17ba1c4` | `0xe3e368` | R, transcribed | psl-mask.js |
| uEm037_00 (Nargacuga, Silverwind) | `0x17bc47c` | `0xca170` (no override) | R | dev/em037_00-effects-spec.md |
| uEm038_00 (Ukanlos) | `0x17bd9ac` | `0xe62c8c` | R | dev/em038_00-effects-spec.md |
| uEm042_00 (Barioth) | `0x17be9a0` | `0xe70b78` | R (spec paused) | dev/em042_00-effects-spec.md |
| uEm043_00 (Deviljho, Savage) | `0x17bfd1c` | `0xe80fd0` | R / UNREAD | dev/brute-wyverns-effects-survey.md |
| uEm044_00 (Barroth) | `0x17c1434` | `0xe8d714` | R / UNREAD | " |
| uEm045_00 (Uragaan, Crystalbeard) | `0x17c257c` | `0xe9cb64` | R / UNREAD | " |
| uEm055_00 (Duramboros) | `0x17c8768` | `0xede150` | R / UNREAD | " |
| uEm063_00 (Brachydios, Raging) | `0x17d92c4` | `0xf469a8` | R / UNREAD | " |
| uEm077_00 (Seregios) | `0x17e7c08` | `0xfee088` | R (spec paused) | dev/em077_00-effects-spec.md |
| uEm079_00 (Malfestio, Nightcloak) | `0x17e9444` | `0xfef4b8` | R / UNREAD | dev/bird-wyverns-effects-survey.md |
| uEm080_00 (Glavenus, Hellblade) | `0x17eac74` | `0x1000910` | R / UNREAD | dev/brute-wyverns-effects-survey.md |
| uEm081_00 (Astalos, Boltreaver) | `0x17ec1b0` | `0x1019eb4` | R, transcribed | psl-mask.js |
| uEm085_00 (Great Maccao) | `0x17f74a8` | `0x10937e8` | R / UNREAD | dev/bird-wyverns-effects-survey.md |
