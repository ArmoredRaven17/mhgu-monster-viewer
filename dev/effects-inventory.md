# MHGU Monster Effects — Inventory & Known Issues

_Generated 2026-09-17 from `scratch-effects-em/effect` (efl / pel / psl). A decode reference, not a render pass._

## How to read this

- **genType** = the efl generator/emitter type. The ROM-translated effect runtime lifts **0, 1, 5** only. **2, 9, 15, 20, 25 are NOT lifted** — any effect built on them throws `Unverified` and does not render today. (Supported genType is necessary, not sufficient: a 0/1/5 effect can still hit an unlifted function on some branch and throw — so “renderable” below means *eligible*, not guaranteed.)
- **Effects (render / unsupp)** = generator entries across the variant’s `.efl` files, split into renderable (0/1/5) vs unsupported.
- **Anim-bound** = PSL scheduled motion slots — how many attack animations actually fire effects.
- **Named models** = monster-named effect models (`em###_##_NNN`) referenced by the efls — usually the variant’s own effect geometry, but sometimes borrowed from another monster’s set (e.g. Gravios pulls in `em010_00_000`). Most are particle geometry; a *solid* one driven by a shell is a held/thrown object (e.g. Tetsucabra’s boulder `em066_00_001`).

## Scope

- **88 variants** across 64 base monsters.
- **71/88 variants** carry at least one unsupported-genType effect. Unsupported types seen: 2, 9, 15, 20, 25.
- Across everything: **8521 renderable** generator entries vs **348 unsupported** (≈ 4% of effects are not renderable by the current runtime).

## Coverage table

| Monster | Variant | Effects (render / unsupp) | genTypes | Anim-bound | #Named models |
|---|---|---|---|---|---|
| Rathian | `em001_00` | 58 / 1 ⚠ | {0:14, 2:1, 5:44} | 104 | 0 |
| Gold Rathian | `em001_02` | 53 / 0 | {0:13, 5:40} | 33 | 0 |
| Dreadqueen Rathian | `em001_04` | 77 / 1 ⚠ | {0:19, 5:58, 25:1} | 40 | 1 |
| Rathalos | `em002_00` | 10 / 0 | {0:4, 5:6} | 29 | 0 |
| Dreadking Rathalos | `em002_04` | 103 / 2 ⚠ | {0:21, 1:1, 5:81, 25:2} | 49 | 2 |
| Khezu | `em003_00` | 86 / 0 | {0:5, 1:11, 5:70} | 66 | 1 |
| Basarios | `em004_00` | 52 / 2 ⚠ | {0:13, 1:1, 2:2, 5:38} | 13 | 0 |
| Gravios | `em005_00` | 51 / 2 ⚠ | {0:12, 2:2, 5:39} | 80 | 3 |
| Diablos | `em007_00` | 122 / 9 ⚠ | {0:33, 1:5, 2:3, 5:84, 25:6} | 72 | 1 |
| Bloodbath Diablos | `em007_04` | 159 / 15 ⚠ | {0:39, 1:7, 2:12, 5:113, 25:3} | 25 | 0 |
| Yian Kut-Ku | `em008_00` | 39 / 0 | {0:9, 5:30} | 77 | 1 |
| Gypceros | `em009_00` | 65 / 2 ⚠ | {0:16, 1:3, 5:46, 25:2} | 85 | 2 |
| Plesioth | `em010_00` | 43 / 6 ⚠ | {0:11, 2:2, 5:32, 25:4} | 75 | 2 |
| Kirin | `em011_00` | 99 / 4 ⚠ | {0:8, 1:15, 5:76, 20:1, 25:3} | 32 | 1 |
| Lao-Shan Lung | `em012_00` | 103 / 8 ⚠ | {0:25, 1:8, 2:6, 5:70, 20:2} | 40 | 1 |
| Fatalis | `em013_00` | 178 / 3 ⚠ | {0:43, 1:3, 5:132, 9:1, 25:2} | 97 | 3 |
| Crimson Fatalis | `em013_01` | 43 / 2 ⚠ | {0:7, 1:3, 2:2, 5:33} | 0 | 2 |
| Old Fatalis | `em013_02` | 207 / 18 ⚠ | {0:7, 1:50, 2:13, 5:150, 9:1, 25:4} | 10 | 2 |
| Iodrome | `em016_00` | 18 / 0 | {0:5, 5:13} | 4 | 2 |
| Cephadrome | `em017_00` | 13 / 0 | {0:8, 1:1, 5:4} | 74 | 1 |
| Yian Garuga | `em018_00` | 9 / 0 | {0:2, 5:7} | 92 | 0 |
| Deadeye Yian Garuga | `em018_04` | 40 / 2 ⚠ | {0:6, 1:1, 2:2, 5:33} | 14 | 0 |
| Daimyo Hermitaur | `em019_00` | 46 / 3 ⚠ | {0:19, 5:27, 25:3} | 74 | 2 |
| Stonefist Hermitaur | `em019_04` | 97 / 15 ⚠ | {0:14, 1:2, 2:8, 5:81, 15:2, 25:5} | 32 | 4 |
| Shogun Ceanataur | `em020_00` | 12 / 1 ⚠ | {0:4, 5:8, 25:1} | 67 | 2 |
| Rustrazor Ceanataur | `em020_04` | 38 / 4 ⚠ | {0:4, 5:34, 25:4} | 21 | 1 |
| Congalala | `em021_00` | 68 / 1 ⚠ | {0:23, 1:1, 5:44, 25:1} | 58 | 0 |
| Blangonga | `em022_00` | 27 / 5 ⚠ | {0:8, 5:19, 25:5} | 67 | 1 |
| Rajang | `em023_00` | 170 / 6 ⚠ | {0:34, 1:11, 2:5, 5:125, 25:1} | 65 | 3 |
| Kushala Daora | `em024_00` | 139 / 2 ⚠ | {0:13, 5:126, 25:2} | 56 | 1 |
| Chameleos | `em025_00` | 65 / 3 ⚠ | {0:30, 5:35, 20:1, 25:2} | 58 | 1 |
| Teostra | `em027_00` | 143 / 2 ⚠ | {0:32, 5:111, 9:1, 25:1} | 11 | 4 |
| Tigrex | `em032_00` | 31 / 4 ⚠ | {0:2, 2:4, 5:29} | 83 | 0 |
| Grimclaw Tigrex | `em032_04` | 137 / 8 ⚠ | {0:34, 1:2, 2:6, 5:101, 25:2} | 16 | 1 |
| Akantor | `em033_00` | 166 / 4 ⚠ | {0:39, 1:5, 2:1, 5:122, 9:3} | 48 | 5 |
| Giadrome | `em034_00` | 13 / 1 ⚠ | {0:3, 2:1, 5:10} | 0 | 1 |
| Lavasioth | `em036_00` | 84 / 1 ⚠ | {0:16, 2:1, 5:68} | 60 | 3 |
| Nargacuga | `em037_00` | 15 / 2 ⚠ | {0:3, 1:3, 2:2, 5:9} | 52 | 1 |
| Silverwind Nargacuga | `em037_04` | 26 / 0 | {0:1, 1:1, 5:24} | 5 | 1 |
| Ukanlos | `em038_00` | 97 / 1 ⚠ | {0:28, 1:3, 5:66, 9:1} | 50 | 3 |
| Barioth | `em042_00` | 68 / 12 ⚠ | {0:13, 2:5, 5:55, 25:7} | 87 | 1 |
| Deviljho | `em043_00` | 42 / 0 | {0:10, 5:32} | 81 | 2 |
| Savage Deviljho | `em043_05` | 12 / 0 | {0:2, 1:3, 5:7} | 0 | 2 |
| Barroth | `em044_00` | 84 / 5 ⚠ | {0:24, 1:7, 2:3, 5:53, 25:2} | 60 | 5 |
| Uragaan | `em045_00` | 99 / 4 ⚠ | {0:26, 1:5, 2:3, 5:68, 20:1} | 59 | 1 |
| Crystalbeard Uragaan | `em045_04` | 72 / 3 ⚠ | {0:8, 5:64, 25:3} | 3 | 1 |
| Lagiacrus | `em046_00` | 178 / 2 ⚠ | {0:15, 1:27, 5:136, 25:2} | 58 | 1 |
| Royal Ludroth | `em047_00` | 64 / 5 ⚠ | {0:21, 2:1, 5:43, 25:4} | 67 | 4 |
| Agnaktor | `em049_00` | 110 / 4 ⚠ | {0:16, 1:3, 2:2, 5:91, 25:2} | 60 | 2 |
| Alatreon | `em050_00` | 224 / 3 ⚠ | {0:47, 1:8, 2:2, 5:169, 25:1} | 73 | 6 |
| Duramboros | `em055_00` | 91 / 6 ⚠ | {0:21, 1:4, 2:4, 5:66, 25:2} | 65 | 0 |
| Nibelsnarf | `em056_00` | 94 / 2 ⚠ | {0:41, 1:4, 2:1, 5:49, 25:1} | 73 | 1 |
| Zinogre | `em057_00` | 130 / 1 ⚠ | {0:11, 1:21, 5:98, 25:1} | 87 | 2 |
| Thunderlord Zinogre | `em057_04` | 227 / 1 ⚠ | {0:11, 1:35, 5:181, 25:1} | 5 | 2 |
| Amatsu | `em058_00` | 143 / 8 ⚠ | {0:15, 1:2, 2:2, 5:126, 25:6} | 38 | 4 |
| Arzuros | `em060_00` | 7 / 2 ⚠ | {0:1, 2:2, 5:6} | 58 | 0 |
| Redhelm Arzuros | `em060_04` | 36 / 0 | {0:6, 1:2, 5:28} | 9 | 0 |
| Lagombi | `em061_00` | 21 / 0 | {0:9, 5:12} | 90 | 0 |
| Snowbaron Lagombi | `em061_04` | 39 / 1 ⚠ | {0:7, 2:1, 5:32} | 11 | 0 |
| Volvidon | `em062_00` | 51 / 0 | {0:17, 1:1, 5:33} | 66 | 1 |
| Brachydios | `em063_00` | 77 / 2 ⚠ | {0:19, 1:3, 2:1, 5:55, 25:1} | 85 | 1 |
| Raging Brachydios | `em063_05` | 13 / 1 ⚠ | {0:1, 2:1, 5:12} | 0 | 1 |
| Kecha Wacha | `em065_00` | 41 / 0 | {0:9, 5:32} | 75 | 2 |
| Tetsucabra | `em066_00` | 247 / 10 ⚠ | {0:72, 1:6, 2:10, 5:169} | 59 | 1 |
| Drilltusk Tetsucabra | `em066_04` | 208 / 6 ⚠ | {0:37, 1:4, 5:167, 9:2, 25:4} | 12 | 0 |
| Zamtrios | `em067_00` | 135 / 1 ⚠ | {0:32, 1:4, 2:1, 5:99} | 81 | 2 |
| Najarala | `em068_00` | 95 / 3 ⚠ | {0:14, 1:2, 5:79, 9:3} | 133 | 1 |
| Seltas Queen | `em069_00` | 130 / 6 ⚠ | {0:49, 1:3, 2:2, 5:78, 25:4} | 96 | 0 |
| Nerscylla | `em070_00` | 93 / 0 | {0:26, 1:7, 5:60} | 71 | 3 |
| Gore Magala | `em071_00` | 129 / 3 ⚠ | {0:32, 1:1, 2:1, 5:96, 9:1, 25:1} | 107 | 1 |
| Chaotic Gore Magala | `em071_05` | 5 / 0 | {0:2, 5:3} | 121 | 0 |
| Shagaru Magala | `em072_00` | 87 / 4 ⚠ | {0:18, 1:1, 2:2, 5:68, 9:1, 25:1} | 8 | 2 |
| Seltas | `em076_00` | 62 / 0 | {0:19, 5:43} | 49 | 0 |
| Seregios | `em077_00` | 151 / 2 ⚠ | {0:29, 1:8, 2:2, 5:114} | 106 | 1 |
| Malfestio | `em079_00` | 23 / 1 ⚠ | {0:4, 5:19, 25:1} | 95 | 1 |
| Nightcloak Malfestio | `em079_04` | 31 / 10 ⚠ | {0:5, 2:5, 5:26, 25:5} | 6 | 2 |
| Glavenus | `em080_00` | 156 / 10 ⚠ | {0:23, 1:2, 5:131, 25:10} | 78 | 1 |
| Hellblade Glavenus | `em080_04` | 63 / 6 ⚠ | {0:9, 1:2, 2:1, 5:52, 25:5} | 10 | 0 |
| Astalos | `em081_00` | 113 / 2 ⚠ | {0:8, 1:19, 2:1, 5:86, 15:1} | 123 | 1 |
| Boltreaver Astalos | `em081_04` | 140 / 4 ⚠ | {0:13, 1:22, 5:105, 15:2, 25:2} | 108 | 2 |
| Mizutsune | `em082_00` | 110 / 1 ⚠ | {0:36, 2:1, 5:74} | 96 | 3 |
| Soulseer Mizutsune | `em082_04` | 61 / 4 ⚠ | {0:23, 2:1, 5:38, 25:3} | 4 | 3 |
| Gammoth | `em083_00` | 83 / 15 ⚠ | {0:16, 1:1, 2:14, 5:66, 25:1} | 80 | 2 |
| Elderfrost Gammoth | `em083_04` | 60 / 9 ⚠ | {0:8, 1:1, 2:5, 5:51, 25:4} | 14 | 2 |
| Nakarkos | `em084_00` | 430 / 5 ⚠ | {0:59, 1:29, 2:1, 5:342, 25:4} | 195 | 7 |
| Valstrax | `em086_00` | 571 / 16 ⚠ | {0:26, 1:9, 2:1, 5:536, 9:2, 25:13} | 100 | 4 |
| ? | `em087_00` | 136 / 8 ⚠ | {0:33, 1:12, 2:5, 5:91, 25:3} | 86 | 10 |
| Ahtal-Ka | `em088_00` | 277 / 20 ⚠ | {0:30, 1:24, 2:15, 5:223, 25:5} | 62 | 15 |

## Potential issues

### 1. genType coverage — a small but visually important slice is unrenderable

The runtime already covers the large majority of entries: **8521 of 8869 (≈96%) are genType 0/1/5**. The remainder (genType 2/9/15/20/25, ≈4%) is small in count but tends to be the *signature* emitters — auras, breath plumes, charge glows — so its visual weight is far bigger than its 4% share, and it is spread across **71 of 88 variants** (usually a handful each). One unsupported entry can be a whole visible aura, so entry-count understates the impact. Variants with the most unsupported entries:

- **Ahtal-Ka** `em088_00` — 20 unsupported (of 297), types [2, 25]
- **Old Fatalis** `em013_02` — 18 unsupported (of 225), types [2, 9, 25]
- **Valstrax** `em086_00` — 16 unsupported (of 587), types [2, 9, 25]
- **Bloodbath Diablos** `em007_04` — 15 unsupported (of 174), types [2, 25]
- **Stonefist Hermitaur** `em019_04` — 15 unsupported (of 112), types [2, 15, 25]
- **Gammoth** `em083_00` — 15 unsupported (of 98), types [2, 25]
- **Barioth** `em042_00` — 12 unsupported (of 80), types [2, 25]
- **Tetsucabra** `em066_00` — 10 unsupported (of 257), types [2]
- **Nightcloak Malfestio** `em079_04` — 10 unsupported (of 41), types [2, 25]
- **Glavenus** `em080_00` — 10 unsupported (of 166), types [25]
- **Diablos** `em007_00` — 9 unsupported (of 131), types [2, 25]
- **Elderfrost Gammoth** `em083_04` — 9 unsupported (of 69), types [2, 25]
- **Lao-Shan Lung** `em012_00` — 8 unsupported (of 111), types [2, 20]
- **Grimclaw Tigrex** `em032_04` — 8 unsupported (of 145), types [2, 25]
- **Amatsu** `em058_00` — 8 unsupported (of 151), types [2, 25]

Lifting a new genType is shared-runtime work that must be re-soaked against every monster (see the effects-runtime notes). genType 2 specifically is what Raging Brachydios’ raging aura needs.

### 2. Shell / held objects (drawn by effects, placed by the action layer)

A solid monster-named model spawned as a *shell* is a held/thrown prop. Its geometry and draw are effects, but its **attach joint is not in any effect/shell/psl resource** — it is set in the enemy action-command (EMC) layer or hardcoded. Confirmed case: **Tetsucabra `em066_00_001`** (boulder, via `em066_00_009/008.efl`, shell 16, grab motion L4 M10). Any other monster with a large solid named model is a candidate to check the same way.

### 3. Per-monster decode notes (from prior sessions)

- **em043_05 Savage Deviljho** — effects wired; do NOT fold the glb node 0.01 (breaks scale). Effects baseline; re-soak after shared-runtime changes.
- **em063_00 / em063_05 Brachydios / Raging** — red slime is a *material* effect (nenkin U-offset), not a particle. Raging breath = `cm200_007.efl` (shell records 1120/1121). Raging aura needs genType 2 (unsupported).
- **em070_00 Nerscylla** — full effect set decoded + wired to the Special list (mouth / poison / pounce / landing / body).
- **em082_04 Soulseer Rathian** — soul flame `em082_04_000.efl` placed at the head via record root joint 2 (both eyes).
- **em066_00 Tetsucabra** — boulder shell (see §2); dust/rock-chip particles (cm202_/cm120_) are the real effects.
- **em024_00** — `em024_00_006` is a tornado **attack**, not an aura.
- **em027_00** — `em027_00_019` was a mis-grabbed attack (verify before wiring).
- **Auras vs attacks** must come from the frame handler, not PEL keys (e.g. Teostra’s driver fires only aura ids 1002/1003/1005). Do not assume an effect is an aura from its key alone.

## Per-variant detail


### em001 Rathian
- **`em001_00`** Rathian — 7 efl, 59 gen-entries (render 58 / unsupp 1 types [2]); anim-bound 104 [L0, L1, L2, L3, L4]
  - models: —
- **`em001_02`** Gold Rathian — 8 efl, 53 gen-entries (render 53 / unsupp 0 all ok); anim-bound 33 [L4]
  - models: —
- **`em001_04`** Dreadqueen Rathian — 7 efl, 78 gen-entries (render 77 / unsupp 1 types [25]); anim-bound 40 [L4, L9]
  - models: `em084_00_010`

### em002 Rathalos
- **`em002_00`** Rathalos — 2 efl, 10 gen-entries (render 10 / unsupp 0 all ok); anim-bound 29 [L4]
  - models: —
- **`em002_04`** Dreadking Rathalos — 10 efl, 105 gen-entries (render 103 / unsupp 2 types [25]); anim-bound 49 [L4, L9]
  - models: `em024_00_001`, `em045_00_001`

### em003 Khezu
- **`em003_00`** Khezu — 16 efl, 86 gen-entries (render 86 / unsupp 0 all ok); anim-bound 66 [L0, L1, L2, L3, L5]
  - models: `em003_00_000`

### em004 Basarios
- **`em004_00`** Basarios — 5 efl, 54 gen-entries (render 52 / unsupp 2 types [2]); anim-bound 13 [L4]
  - models: —

### em005 Gravios
- **`em005_00`** Gravios — 5 efl, 53 gen-entries (render 51 / unsupp 2 types [2]); anim-bound 80 [L0, L1, L2, L3, L4]
  - models: `em005_00_003`, `em010_00_000`, `em024_00_001`

### em007 Diablos
- **`em007_00`** Diablos — 6 efl, 131 gen-entries (render 122 / unsupp 9 types [2, 25]); anim-bound 72 [L0, L1, L2, L3]
  - models: `em013_00_002`
- **`em007_04`** Bloodbath Diablos — 12 efl, 174 gen-entries (render 159 / unsupp 15 types [2, 25]); anim-bound 25 [L9]
  - models: —

### em008 Yian Kut-Ku
- **`em008_00`** Yian Kut-Ku — 7 efl, 39 gen-entries (render 39 / unsupp 0 all ok); anim-bound 77 [L0, L1, L2, L3]
  - models: `em008_00_000`

### em009 Gypceros
- **`em009_00`** Gypceros — 10 efl, 67 gen-entries (render 65 / unsupp 2 types [25]); anim-bound 85 [L0, L1, L2, L3, L4]
  - models: `em009_00_000`, `em009_00_001`

### em010 Plesioth
- **`em010_00`** Plesioth — 10 efl, 49 gen-entries (render 43 / unsupp 6 types [2, 25]); anim-bound 75 [L0, L2, L3]
  - models: `em010_00_000`, `em020_04_000`

### em011 Kirin
- **`em011_00`** Kirin — 13 efl, 103 gen-entries (render 99 / unsupp 4 types [20, 25]); anim-bound 32 [L0, L2, L3, L4]
  - models: `em072_00_000`

### em012 Lao-Shan Lung
- **`em012_00`** Lao-Shan Lung — 13 efl, 111 gen-entries (render 103 / unsupp 8 types [2, 20]); anim-bound 40 [L0, L2, L3]
  - models: `em012_00_110`

### em013 Fatalis
- **`em013_00`** Fatalis — 14 efl, 181 gen-entries (render 178 / unsupp 3 types [9, 25]); anim-bound 97 [L0, L1, L2, L3]
  - models: `em013_00_000`, `em013_00_900`, `em038_00_000`
- **`em013_01`** Crimson Fatalis — 4 efl, 45 gen-entries (render 43 / unsupp 2 types [2]); anim-bound 0 [none]
  - models: `em013_00_000`, `em013_00_002`
- **`em013_02`** Old Fatalis — 21 efl, 225 gen-entries (render 207 / unsupp 18 types [2, 9, 25]); anim-bound 10 [L4]
  - models: `em013_00_002`, `em013_02_000`

### em016 Iodrome
- **`em016_00`** Iodrome — 4 efl, 18 gen-entries (render 18 / unsupp 0 all ok); anim-bound 4 [L4]
  - models: `em009_00_000`, `em009_00_001`

### em017 Cephadrome
- **`em017_00`** Cephadrome — 3 efl, 13 gen-entries (render 13 / unsupp 0 all ok); anim-bound 74 [L0, L2, L3, L4]
  - models: `em017_00_000`

### em018 Yian Garuga
- **`em018_00`** Yian Garuga — 1 efl, 9 gen-entries (render 9 / unsupp 0 all ok); anim-bound 92 [L0, L1, L2, L3, L4]
  - models: —
- **`em018_04`** Deadeye Yian Garuga — 4 efl, 42 gen-entries (render 40 / unsupp 2 types [2]); anim-bound 14 [L9]
  - models: —

### em019 Daimyo Hermitaur
- **`em019_00`** Daimyo Hermitaur — 9 efl, 49 gen-entries (render 46 / unsupp 3 types [25]); anim-bound 74 [L0, L2, L3]
  - models: `em019_00_001`, `em019_00_004`
- **`em019_04`** Stonefist Hermitaur — 9 efl, 112 gen-entries (render 97 / unsupp 15 types [2, 15, 25]); anim-bound 32 [L3, L9]
  - models: `em019_00_001`, `em019_00_004`, `em019_04_000`, `em019_04_900`

### em020 Shogun Ceanataur
- **`em020_00`** Shogun Ceanataur — 3 efl, 13 gen-entries (render 12 / unsupp 1 types [25]); anim-bound 67 [L0, L2, L3, L4, L5]
  - models: `em010_00_000`, `em020_00_900`
- **`em020_04`** Rustrazor Ceanataur — 5 efl, 42 gen-entries (render 38 / unsupp 4 types [25]); anim-bound 21 [L9]
  - models: `em020_04_000`

### em021 Congalala
- **`em021_00`** Congalala — 10 efl, 69 gen-entries (render 68 / unsupp 1 types [25]); anim-bound 58 [L0, L2, L3, L5]
  - models: —

### em022 Blangonga
- **`em022_00`** Blangonga — 5 efl, 32 gen-entries (render 27 / unsupp 5 types [25]); anim-bound 67 [L0, L2, L3, L4]
  - models: `em022_00_900`

### em023 Rajang
- **`em023_00`** Rajang — 19 efl, 176 gen-entries (render 170 / unsupp 6 types [2, 25]); anim-bound 65 [L0, L2, L3]
  - models: `em013_00_002`, `em023_00_000`, `em023_00_900`

### em024 Kushala Daora
- **`em024_00`** Kushala Daora — 11 efl, 141 gen-entries (render 139 / unsupp 2 types [25]); anim-bound 56 [L0, L1, L2, L3]
  - models: `em024_00_001`

### em025 Chameleos
- **`em025_00`** Chameleos — 11 efl, 68 gen-entries (render 65 / unsupp 3 types [20, 25]); anim-bound 58 [L0, L1, L2, L3, L4]
  - models: `em024_00_001`

### em027 Teostra
- **`em027_00`** Teostra — 25 efl, 145 gen-entries (render 143 / unsupp 2 types [9, 25]); anim-bound 11 [L4]
  - models: `em027_00_000`, `em027_00_900`, `em027_00_901`, `em072_00_000`

### em032 Tigrex
- **`em032_00`** Tigrex — 3 efl, 35 gen-entries (render 31 / unsupp 4 types [2]); anim-bound 83 [L0, L1, L2, L3]
  - models: —
- **`em032_04`** Grimclaw Tigrex — 8 efl, 145 gen-entries (render 137 / unsupp 8 types [2, 25]); anim-bound 16 [L9]
  - models: `em032_04_900`

### em033 Akantor
- **`em033_00`** Akantor — 17 efl, 170 gen-entries (render 166 / unsupp 4 types [2, 9]); anim-bound 48 [L0, L2, L3]
  - models: `em024_00_001`, `em033_00_000`, `em033_00_900`, `em082_00_000`, `em082_00_001`

### em034 Giadrome
- **`em034_00`** Giadrome — 4 efl, 14 gen-entries (render 13 / unsupp 1 types [2]); anim-bound 0 [none]
  - models: `em009_00_001`

### em036 Lavasioth
- **`em036_00`** Lavasioth — 14 efl, 85 gen-entries (render 84 / unsupp 1 types [2]); anim-bound 60 [L0, L2, L3, L4]
  - models: `em033_00_000`, `em036_00_900`, `em045_00_001`

### em037 Nargacuga
- **`em037_00`** Nargacuga — 4 efl, 17 gen-entries (render 15 / unsupp 2 types [2]); anim-bound 52 [L0, L2, L3, L4]
  - models: `em037_00_000`
- **`em037_04`** Silverwind Nargacuga — 5 efl, 26 gen-entries (render 26 / unsupp 0 all ok); anim-bound 5 [L9]
  - models: `em037_00_000`

### em038 Ukanlos
- **`em038_00`** Ukanlos — 16 efl, 98 gen-entries (render 97 / unsupp 1 types [9]); anim-bound 50 [L0, L2, L3, L4]
  - models: `em024_00_001`, `em038_00_000`, `em038_00_900`

### em042 Barioth
- **`em042_00`** Barioth — 8 efl, 80 gen-entries (render 68 / unsupp 12 types [2, 25]); anim-bound 87 [L0, L1, L2, L3, L4]
  - models: `em042_00_000`

### em043 Deviljho
- **`em043_00`** Deviljho — 9 efl, 42 gen-entries (render 42 / unsupp 0 all ok); anim-bound 81 [L0, L2, L3]
  - models: `em024_00_001`, `em043_00_900`
- **`em043_05`** Savage Deviljho — 2 efl, 12 gen-entries (render 12 / unsupp 0 all ok); anim-bound 0 [none]
  - models: `em024_00_001`, `em043_00_900`

### em044 Barroth
- **`em044_00`** Barroth — 11 efl, 89 gen-entries (render 84 / unsupp 5 types [2, 25]); anim-bound 60 [L0, L2, L3, L4]
  - models: `em009_00_000`, `em009_00_001`, `em044_00_001`, `em044_00_002`, `em065_00_000`

### em045 Uragaan
- **`em045_00`** Uragaan — 11 efl, 103 gen-entries (render 99 / unsupp 4 types [2, 20]); anim-bound 59 [L0, L2, L3]
  - models: `em045_00_001`
- **`em045_04`** Crystalbeard Uragaan — 7 efl, 75 gen-entries (render 72 / unsupp 3 types [25]); anim-bound 3 [L9]
  - models: `em045_04_000`

### em046 Lagiacrus
- **`em046_00`** Lagiacrus — 24 efl, 180 gen-entries (render 178 / unsupp 2 types [25]); anim-bound 58 [L0, L2, L3, L4]
  - models: `em047_00_000`

### em047 Royal Ludroth
- **`em047_00`** Royal Ludroth — 13 efl, 69 gen-entries (render 64 / unsupp 5 types [2, 25]); anim-bound 67 [L0, L2, L3]
  - models: `em019_00_004`, `em047_00_000`, `em047_00_001`, `em047_00_002`

### em049 Agnaktor
- **`em049_00`** Agnaktor — 14 efl, 114 gen-entries (render 110 / unsupp 4 types [2, 25]); anim-bound 60 [L0, L2, L3]
  - models: `em033_00_000`, `em049_00_900`

### em050 Alatreon
- **`em050_00`** Alatreon — 41 efl, 227 gen-entries (render 224 / unsupp 3 types [2, 25]); anim-bound 73 [L0, L1, L2, L3]
  - models: `em024_00_001`, `em050_00_002`, `em050_00_004`, `em050_00_006`, `em050_00_015`, `em050_00_900`

### em055 Duramboros
- **`em055_00`** Duramboros — 11 efl, 97 gen-entries (render 91 / unsupp 6 types [2, 25]); anim-bound 65 [L0, L2, L3]
  - models: —

### em056 Nibelsnarf
- **`em056_00`** Nibelsnarf — 16 efl, 96 gen-entries (render 94 / unsupp 2 types [2, 25]); anim-bound 73 [L0, L2, L3]
  - models: `em056_00_000`

### em057 Zinogre
- **`em057_00`** Zinogre — 21 efl, 131 gen-entries (render 130 / unsupp 1 types [25]); anim-bound 87 [L0, L2, L3]
  - models: `em013_00_002`, `em057_00_102`
- **`em057_04`** Thunderlord Zinogre — 27 efl, 228 gen-entries (render 227 / unsupp 1 types [25]); anim-bound 5 [L9]
  - models: `em013_00_002`, `em057_00_102`

### em058 Amatsu
- **`em058_00`** Amatsu — 20 efl, 151 gen-entries (render 143 / unsupp 8 types [2, 25]); anim-bound 38 [L1, L2, L3]
  - models: `em010_00_000`, `em024_00_001`, `em058_00_900`, `em058_00_901`

### em060 Arzuros
- **`em060_00`** Arzuros — 4 efl, 9 gen-entries (render 7 / unsupp 2 types [2]); anim-bound 58 [L0, L2, L3]
  - models: —
- **`em060_04`** Redhelm Arzuros — 4 efl, 36 gen-entries (render 36 / unsupp 0 all ok); anim-bound 9 [L9]
  - models: —

### em061 Lagombi
- **`em061_00`** Lagombi — 3 efl, 21 gen-entries (render 21 / unsupp 0 all ok); anim-bound 90 [L0, L2, L3]
  - models: —
- **`em061_04`** Snowbaron Lagombi — 6 efl, 40 gen-entries (render 39 / unsupp 1 types [2]); anim-bound 11 [L9]
  - models: —

### em062 Volvidon
- **`em062_00`** Volvidon — 8 efl, 51 gen-entries (render 51 / unsupp 0 all ok); anim-bound 66 [L0, L2, L3]
  - models: `em062_00_000`

### em063 Brachydios
- **`em063_00`** Brachydios — 12 efl, 79 gen-entries (render 77 / unsupp 2 types [2, 25]); anim-bound 85 [L0, L2, L3]
  - models: `em063_00_000`
- **`em063_05`** Raging Brachydios — 3 efl, 14 gen-entries (render 13 / unsupp 1 types [2]); anim-bound 0 [none]
  - models: `em063_00_000`

### em065 Kecha Wacha
- **`em065_00`** Kecha Wacha — 8 efl, 41 gen-entries (render 41 / unsupp 0 all ok); anim-bound 75 [L0, L2, L3, L5]
  - models: `em047_00_000`, `em065_00_000`

### em066 Tetsucabra
- **`em066_00`** Tetsucabra — 16 efl, 257 gen-entries (render 247 / unsupp 10 types [2]); anim-bound 59 [L0, L2, L3, L4]
  - models: `em066_00_001`
- **`em066_04`** Drilltusk Tetsucabra — 10 efl, 214 gen-entries (render 208 / unsupp 6 types [9, 25]); anim-bound 12 [L9]
  - models: —

### em067 Zamtrios
- **`em067_00`** Zamtrios — 21 efl, 136 gen-entries (render 135 / unsupp 1 types [2]); anim-bound 81 [L0, L2, L3, L4]
  - models: `em024_00_001`, `em067_00_000`

### em068 Najarala
- **`em068_00`** Najarala — 13 efl, 98 gen-entries (render 95 / unsupp 3 types [9]); anim-bound 133 [L0, L2, L3]
  - models: `em068_00_001`

### em069 Seltas Queen
- **`em069_00`** Seltas Queen — 17 efl, 136 gen-entries (render 130 / unsupp 6 types [2, 25]); anim-bound 96 [L0, L3, L4]
  - models: —

### em070 Nerscylla
- **`em070_00`** Nerscylla — 19 efl, 93 gen-entries (render 93 / unsupp 0 all ok); anim-bound 71 [L0, L2, L3, L4]
  - models: `em070_00_000`, `em070_00_900`, `em084_00_010`

### em071 Gore Magala
- **`em071_00`** Gore Magala — 21 efl, 132 gen-entries (render 129 / unsupp 3 types [2, 9, 25]); anim-bound 107 [L0, L1, L2, L3]
  - models: `em072_00_000`
- **`em071_05`** Chaotic Gore Magala — 1 efl, 5 gen-entries (render 5 / unsupp 0 all ok); anim-bound 121 [L0, L1, L2, L3, L4]
  - models: —

### em072 Shagaru Magala
- **`em072_00`** Shagaru Magala — 15 efl, 91 gen-entries (render 87 / unsupp 4 types [2, 9, 25]); anim-bound 8 [L4]
  - models: `em072_00_000`, `em072_00_900`

### em076 Seltas
- **`em076_00`** Seltas — 10 efl, 62 gen-entries (render 62 / unsupp 0 all ok); anim-bound 49 [L0, L1, L2, L3, L4]
  - models: —

### em077 Seregios
- **`em077_00`** Seregios — 9 efl, 153 gen-entries (render 151 / unsupp 2 types [2]); anim-bound 106 [L0, L1, L2, L3]
  - models: `em077_00_000`

### em079 Malfestio
- **`em079_00`** Malfestio — 3 efl, 24 gen-entries (render 23 / unsupp 1 types [25]); anim-bound 95 [L0, L1, L2, L3]
  - models: `em079_00_000`
- **`em079_04`** Nightcloak Malfestio — 7 efl, 41 gen-entries (render 31 / unsupp 10 types [2, 25]); anim-bound 6 [L9]
  - models: `em079_04_000`, `em079_04_001`

### em080 Glavenus
- **`em080_00`** Glavenus — 25 efl, 166 gen-entries (render 156 / unsupp 10 types [25]); anim-bound 78 [L0, L2, L3, L4]
  - models: `em080_00_900`
- **`em080_04`** Hellblade Glavenus — 7 efl, 69 gen-entries (render 63 / unsupp 6 types [2, 25]); anim-bound 10 [L9]
  - models: —

### em081 Astalos
- **`em081_00`** Astalos — 20 efl, 115 gen-entries (render 113 / unsupp 2 types [2, 15]); anim-bound 123 [L0, L1, L2, L3, L4]
  - models: `em081_00_900`
- **`em081_04`** Boltreaver Astalos — 14 efl, 144 gen-entries (render 140 / unsupp 4 types [15, 25]); anim-bound 108 [L1, L2, L4, L9]
  - models: `em013_00_002`, `em081_04_000`

### em082 Mizutsune
- **`em082_00`** Mizutsune — 11 efl, 111 gen-entries (render 110 / unsupp 1 types [2]); anim-bound 96 [L0, L2, L3]
  - models: `em010_00_000`, `em082_00_000`, `em082_00_001`
- **`em082_04`** Soulseer Mizutsune — 12 efl, 65 gen-entries (render 61 / unsupp 4 types [2, 25]); anim-bound 4 [L9]
  - models: `em010_00_000`, `em082_00_000`, `em082_00_001`

### em083 Gammoth
- **`em083_00`** Gammoth — 10 efl, 98 gen-entries (render 83 / unsupp 15 types [2, 25]); anim-bound 80 [L0, L2, L3]
  - models: `em083_00_000`, `em083_00_002`
- **`em083_04`** Elderfrost Gammoth — 10 efl, 69 gen-entries (render 60 / unsupp 9 types [2, 25]); anim-bound 14 [L9]
  - models: `em083_00_001`, `em083_00_002`

### em084 Nakarkos
- **`em084_00`** Nakarkos — 52 efl, 435 gen-entries (render 430 / unsupp 5 types [2, 25]); anim-bound 195 [L0, L2, L3, Ll_0, Ll_2, Ll_3, Lr_0, Lr_2, Lr_3]
  - models: `em084_00_001`, `em084_00_005`, `em084_00_010`, `em084_00_900`, `em084_00_901`, `em084_00_902`, `em084_00_903`

### em086 Valstrax
- **`em086_00`** Valstrax — 33 efl, 587 gen-entries (render 571 / unsupp 16 types [2, 9, 25]); anim-bound 100 [L0, L1, L2, L3]
  - models: `em086_00_000`, `em086_00_001`, `em086_00_002`, `em086_00_003`

### em087 
- **`em087_00`** ? — 18 efl, 144 gen-entries (render 136 / unsupp 8 types [2, 25]); anim-bound 86 [L0, L2, L3]
  - models: `em013_00_002`, `em017_00_000`, `em087_00_000`, `em087_00_900`, `em087_00_901`, `em088_00_000`, `em088_00_004`, `em088_00_101`, `em088_00_102`, `em088_00_103`

### em088 Ahtal-Ka
- **`em088_00`** Ahtal-Ka — 28 efl, 297 gen-entries (render 277 / unsupp 20 types [2, 25]); anim-bound 62 [L0, L2, L3]
  - models: `em087_00_000`, `em087_00_001`, `em088_00_000`, `em088_00_004`, `em088_00_007`, `em088_00_100`, `em088_00_101`, `em088_00_102`, `em088_00_103`, `em088_00_104`, `em088_00_900`, `em088_00_901`, `em088_00_902`, `em088_00_903`, `em088_00_904`