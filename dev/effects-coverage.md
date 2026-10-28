# Effects coverage -- every monster, every record, measured (effects lane, 2026-10-24; Flying Wyverns re-metered 2026-10-25; Brute, Bird and Fanged Wyverns re-metered by census3 + probes, lane A, 2026-10-25)

Raven: "Before I start reviewing animations, I would like to ensure we have effects covered for each monster group." This is the one
current, draw-level answer. It supersedes the coverage side of dev/effects-open-items.md (2026-10-19) and the walk-order status column
(brought up to date from this file).

## How it was measured

- **The records**: every record of `docs/effects/<id>.json` (the arms' `_left` / `_right` exports included) that is not a shell
  record -- clip-bound (UNIQUE / SEQUENCE through a PSL bit), event (class-requested, state, break, shared-state rows), rage puff,
  rage / calm / always, thread. **Shells are not re-metered**: their columns are dev/shells-draw-table.md's verdicts (949 records).
- **The meter**: `__view.effectMeter` (render/rom/effect/live.js; dev/effect-runtime-engine.md E16), one page per monster through the
  slot-2 lock, `<archive>/cen/census.mjs` (raw output `<archive>/cen/out/<id>.out`, report `<archive>/cen/cenreport.py`; `<archive>` = dev/archive/):
  - **A**: every clip a record names -- CLIP_EFFECTS, MOTION_STATES rows, the shells' action clips, every copy on the Clip menu,
    every list the page builds (Snow Variants, the combined duo list, the Special list);
  - **B**: each visible input set to each value, replaying the clips whose records had not started yet: State, Rage, Stance,
    Level, Variant, Carry, Boulder, the class controls (CLASS_CONTROLS), the switches (Enraged / Tired / Charge / Heated ...), the
    class toggles, the shared-state rows (c 1100 / c 1108), Severed Parts;
  - **C**: every Parts row stepped through its options (a break fires on the change), then all parts broken and the clips replayed;
  - **D**: every Ground type, Quest Rank and Quest Level value, the not-started clips replayed under each.
- **The retries** (each later measurement replaces a "never", and a draw replaces a "starts, no draw"): `<archive>/cen/census2.mjs`
  (2026-10-24: each clip replayed once per CLIP_ACTIONS entry and shell pick); `<archive>/cen/census3.mjs` (2026-10-25, the Flying
  Wyverns first: **census / census2 never played a copy of a split clip** (`Motion[7]_start#B` -- the `_start` strip ran before the
  copy suffix), played only the `_start` piece of a split motion, stopped plays at 360 frames, ignored ACTION_EFFECTS and the Special
  entries' `tired` arms, and replayed a cycling MOTION_STATES row too few times; census3 fixes all five -- rom-map trap list); the
  targeted probes `<archive>/cen/probe.mjs` + `<archive>/cen/pq/*.json` (one input combination each: the slime hit, c 1500 lying on
  Ground H, a Parts sweep under a levels row, the Hyper pairs) and `<archive>/cen/hypermeter.mjs` (every Hyper option, 90 frames).
- **The buckets** (each record in exactly one):
  - **draws**: the meter's verdict `draws` -- lit pixels against its target in the redraw of the record's own units;
  - **starts, no draw**: it started, any other verdict (named with it);
  - **not requested**: the ROM requests it (a class request site's key, efx/class-effects.json) and the viewer exports no such
    record -- these are counted beside the exported records, not inside "records";
  - **named refusal**: **Raven's decisions only** (2026-10-25, his words: "The only effects I recall not wanting was Paint since we
    would need a projectile to simulate a Paintball being throw and Slime since that would require building up to the proc and
    unlike Poison it is simply a small explosion that happens once it procs"): **Paint c 1106** (the paint timer P+0x5db8, 0xc0c48,
    set on damage type 16) and **the blastblight proc c 1130-1137** (the 0xaab98 band, one record per proc by the part P+0x5db0).
    Every earlier "by decision" refusal an agent recorded is reopened (hyper u 1301-1320, c 1500, u 1400 on the latch monsters,
    Raging Brachydios's slime u 200-204); notice c 1200 / 1201 are HELD (open) until Raven answers, and so are the hyper BURSTS
    u 1311-1320 (the motion side: Raven, 2026-10-25, "hold off on the animations"); the ROM's "never requests it" reasons accepted by
    the coordinator (2026-10-25: Gold Rathian u 522 / 523, Rathalos / Dreadking u 290 / 291, u 1120 on the stub-pick classes) are
    named refusals with that reason, and so are the Flying Wyvern pass's (accepted 2026-10-25: Gravios u 10 / u 40, Diablos u 200,
    Akantor c 1104 / c 1105 / c 1109 / u 1400);
  - **open**: exported, never started under any of the inputs above -- the list below, closed group by group (each with its
    reason where one is read; a ROM reason goes to the coordinator, never to "named refusal" on an agent's say).
- Starts and draws are separate: a start is never counted as a draw.

## Totals and per group

| all | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|
| **94 monsters** | 6409 | 5404 | 1 | 1 | 828 | 183 | 874 / 99 |

### Flying Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 1 | Rathian (em001_00) | 67 | 54 | 0 | 0 | 9 | 4 | 14 / 0 |
| 2 | Gold Rathian (em001_02) | 75 | 60 | 0 | 0 | 11 | 4 | 15 / 0 |
| 3 | Dreadqueen Rathian (em001_04) | 85 | 76 | 0 | 0 | 9 | 0 | 18 / 0 |
| 4 | Rathalos (em002_00) | 67 | 53 | 0 | 0 | 10 | 4 | 7 / 0 |
| 5 | Silver Rathalos (em002_02) | 71 | 58 | 0 | 0 | 9 | 4 | 14 / 0 |
| 6 | Dreadking Rathalos (em002_04) | 71 | 60 | 0 | 0 | 11 | 0 | 31 / 0 |
| 7 | Khezu (em003_00) | 54 | 41 | 0 | 0 | 10 | 3 | 11 / 1 |
| 8 | Basarios (em004_00) | 76 | 62 | 0 | 0 | 10 | 4 | 4 / 1 |
| 9 | Gravios (em005_00) | 79 | 65 | 0 | 0 | 12 | 4 | 4 / 0 |
| 10 | Diablos (em007_00) | 71 | 59 | 0 | 0 | 9 | 4 | 3 / 0 |
| 11 | Bloodbath Diablos (em007_04) | 92 | 84 | 0 | 0 | 8 | 0 | 10 / 0 |
| 12 | Tigrex (em032_00) | 63 | 49 | 0 | 0 | 10 | 4 | 7 / 0 |
| 13 | Grimclaw Tigrex (em032_04) | 67 | 57 | 0 | 0 | 10 | 0 | 30 / 2 |
| 14 | Akantor (em033_00) | 77 | 65 | 0 | 0 | 12 | 0 | 4 / 0 |
| 15 | Nargacuga (em037_00) | 69 | 54 | 0 | 0 | 10 | 5 | 3 / 2 |
| 16 | Silverwind Nargacuga (em037_04) | 60 | 51 | 0 | 0 | 9 | 0 | 13 / 1 |
| 17 | Ukanlos (em038_00) | 63 | 55 | 0 | 0 | 8 | 0 | 7 / 0 |
| 18 | Barioth (em042_00) | 73 | 60 | 0 | 0 | 9 | 4 | 3 / 1 |
| 19 | Seregios (em077_00) | 66 | 54 | 0 | 0 | 9 | 3 | 6 / 2 |
| 20 | Astalos (em081_00) | 98 | 84 | 0 | 0 | 10 | 4 | 9 / 2 |
| 21 | Boltreaver Astalos (em081_04) | 99 | 90 | 0 | 0 | 9 | 0 | 18 / 1 |

### Brute Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 22 | Deviljho (em043_00) | 63 | 51 | 0 | 0 | 10 | 3 | 4 / 3 |
| 23 | Savage Deviljho (em043_05) | 57 | 49 | 0 | 1 | 8 | 0 | 5 / 3 |
| 24 | Barroth (em044_00) | 70 | 58 | 0 | 0 | 8 | 4 | 4 / 1 |
| 25 | Uragaan (em045_00) | 74 | 59 | 0 | 0 | 12 | 3 | 3 / 0 |
| 26 | Crystalbeard Uragaan (em045_04) | 72 | 60 | 0 | 0 | 12 | 0 | 11 / 1 |
| 27 | Duramboros (em055_00) | 90 | 77 | 0 | 0 | 9 | 4 | -- |
| 28 | Brachydios (em063_00) | 64 | 51 | 0 | 0 | 9 | 4 | 9 / 1 |
| 29 | Raging Brachydios (em063_05) | 59 | 48 | 0 | 0 | 10 | 1 | 13 / 1 |
| 30 | Glavenus (em080_00) | 88 | 75 | 0 | 0 | 10 | 3 | 4 / 0 |
| 31 | Hellblade Glavenus (em080_04) | 96 | 83 | 0 | 0 | 13 | 0 | 12 / 0 |

### Bird Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 32 | Yian Kut-Ku (em008_00) | 58 | 45 | 0 | 0 | 10 | 3 | 4 / 1 |
| 33 | Gypceros (em009_00) | 57 | 43 | 0 | 0 | 10 | 4 | 8 / 1 |
| 34 | Velocidrome (em014_00) | 28 | 25 | 0 | 0 | 3 | 0 | -- |
| 35 | Gendrome (em015_00) | 28 | 25 | 0 | 0 | 3 | 0 | -- |
| 36 | Iodrome (em016_00) | 30 | 27 | 0 | 0 | 3 | 0 | 7 / 0 |
| 37 | Yian Garuga (em018_00) | 76 | 61 | 0 | 0 | 11 | 4 | 4 / 0 |
| 38 | Deadeye Yian Garuga (em018_04) | 76 | 66 | 0 | 0 | 10 | 0 | 7 / 0 |
| 39 | Giadrome (em034_00) | 29 | 27 | 0 | 0 | 2 | 0 | 4 / 0 |
| 40 | Malfestio (em079_00) | 52 | 42 | 0 | 0 | 7 | 3 | 7 / 0 |
| 41 | Nightcloak Malfestio (em079_04) | 56 | 49 | 0 | 0 | 7 | 0 | 11 / 0 |
| 42 | Great Maccao (em085_00) | 40 | 36 | 0 | 0 | 4 | 0 | -- |

### Fanged Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 43 | Zinogre (em057_00) | 89 | 75 | 0 | 0 | 10 | 4 | 5 / 0 |
| 44 | Thunderlord Zinogre (em057_04) | 101 | 90 | 0 | 0 | 13 | 0 | 17 / 0 |

### Fanged Beast

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 45 | Congalala (em021_00) | 71 | 60 | 0 | 0 | 8 | 3 | 13 / 0 |
| 46 | Blangonga (em022_00) | 58 | 47 | 0 | 0 | 8 | 3 | 10 / 0 |
| 47 | Rajang (em023_00) | 60 | 47 | 0 | 0 | 10 | 3 | 12 / 0 |
| 48 | Furious Rajang (em023_05) | 54 | 42 | 0 | 0 | 10 | 2 | 13 / 0 |
| 49 | Bulldrome (em030_00) | 27 | 25 | 0 | 0 | 2 | 0 | -- |
| 50 | Arzuros (em060_00) | 50 | 43 | 0 | 0 | 6 | 1 | -- |
| 51 | Redhelm Arzuros (em060_04) | 60 | 54 | 0 | 0 | 6 | 0 | 3 / 3 |
| 52 | Lagombi (em061_00) | 58 | 50 | 0 | 0 | 8 | 0 | 6 / 1 |
| 53 | Snowbaron Lagombi (em061_04) | 66 | 59 | 0 | 0 | 7 | 0 | 14 / 1 |
| 54 | Volvidon (em062_00) | 57 | 51 | 0 | 0 | 6 | 0 | 3 / 0 |
| 55 | Kecha Wacha (em065_00) | 68 | 60 | 0 | 0 | 6 | 2 | 6 / 1 |
| 56 | Gammoth (em083_00) | 94 | 80 | 0 | 0 | 8 | 6 | 12 / 0 |
| 57 | Elderfrost Gammoth (em083_04) | 99 | 84 | 0 | 0 | 9 | 6 | 20 / 1 |

### Piscine Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 58 | Plesioth (em010_00) | 73 | 60 | 0 | 0 | 10 | 3 | 6 / 0 |
| 59 | Cephadrome (em017_00) | 40 | 30 | 0 | 0 | 10 | 0 | 2 / 0 |
| 60 | Lavasioth (em036_00) | 61 | 46 | 0 | 0 | 11 | 4 | 13 / 1 |

### Leviathan

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 61 | Lagiacrus (em046_00) | 79 | 62 | 0 | 0 | 12 | 5 | 17 / 1 |
| 62 | Royal Ludroth (em047_00) | 63 | 51 | 0 | 0 | 8 | 4 | 6 / 1 |
| 63 | Agnaktor (em049_00) | 74 | 60 | 0 | 0 | 10 | 4 | 4 / 0 |
| 64 | Nibelsnarf (em056_00) | 60 | 47 | 0 | 0 | 10 | 3 | 2 / 0 |
| 65 | Mizutsune (em082_00) | 75 | 61 | 0 | 0 | 10 | 4 | 12 / 15 |
| 66 | Soulseer Mizutsune (em082_04) | 84 | 75 | 0 | 0 | 9 | 0 | 16 / 15 |

### Amphibian

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 67 | Tetsucabra (em066_00) | 73 | 61 | 0 | 0 | 9 | 3 | 14 / 7 |
| 68 | Drilltusk Tetsucabra (em066_04) | 85 | 76 | 0 | 0 | 9 | 0 | 15 / 6 |
| 69 | Zamtrios (em067_00) | 89 | 76 | 0 | 0 | 10 | 3 | 6 / 0 |

### Snake Wyvern

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 70 | Najarala (em068_00) | 67 | 54 | 0 | 0 | 10 | 3 | 6 / 0 |

### Temnoceran

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 71 | Nerscylla (em070_00) | 72 | 59 | 0 | 0 | 9 | 4 | 6 / 1 |
| 72 | Ahtal-Ka (em088_00) | 99 | 76 | 0 | 0 | 12 | 12 | 24 / 5 |
| 73 | Ahtal-Neset (em087_00) | 57 | 57 | 0 | 0 | 0 | 0 | 14 / 0 |

### Carapaceon

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 74 | Daimyo Hermitaur (em019_00) | 69 | 57 | 0 | 0 | 9 | 3 | 2 / 1 |
| 75 | Stonefist Hermitaur (em019_04) | 78 | 68 | 0 | 0 | 10 | 0 | 2 / 0 |
| 76 | Shogun Ceanataur (em020_00) | 60 | 48 | 0 | 0 | 9 | 3 | 2 / 0 |
| 77 | Rustrazor Ceanataur (em020_04) | 68 | 59 | 0 | 0 | 9 | 0 | 5 / 0 |

### Neopteron

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 78 | Seltas Queen (em069_00) | 94 | 80 | 0 | 0 | 10 | 4 | 6 / 0 |
| 79 | Seltas (em076_00) | 51 | 46 | 0 | 0 | 5 | 0 | 6 / 0 |

### Elder Dragon

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 80 | Kirin (em011_00) | 33 | 29 | 0 | 0 | 4 | 0 | 3 / 0 |
| 81 | Lao-Shan Lung (em012_00) | 51 | 41 | 0 | 0 | 10 | 0 | 2 / 0 |
| 82 | Fatalis (em013_00) | 47 | 37 | 0 | 0 | 10 | 0 | 7 / 1 |
| 83 | Crimson Fatalis (em013_01) | 49 | 39 | 0 | 0 | 10 | 0 | 12 / 0 |
| 84 | Old Fatalis (em013_02) | 54 | 45 | 0 | 0 | 9 | 0 | 16 / 1 |
| 85 | Kushala Daora (em024_00) | 57 | 48 | 0 | 0 | 9 | 0 | 22 / 3 |
| 86 | Chameleos (em025_00) | 54 | 44 | 0 | 0 | 10 | 0 | 5 / 3 |
| 87 | Teostra (em027_00) | 70 | 63 | 0 | 0 | 7 | 0 | 12 / 3 |
| 88 | Alatreon (em050_00) | 75 | 65 | 0 | 0 | 10 | 0 | 18 / 1 |
| 89 | Amatsu (em058_00) | 65 | 57 | 0 | 0 | 8 | 0 | 9 / 0 |
| 90 | Shagaru Magala (em072_00) | 68 | 60 | 0 | 0 | 8 | 0 | 23 / 0 |
| 91 | Nakarkos (em084_00) | 113 | 103 | 1 | 0 | 9 | 0 | 30 / 1 |
| 92 | Valstrax (em086_00) | 117 | 108 | 0 | 0 | 9 | 0 | 8 / 1 |

### ???

| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |
|---|---|---|---|---|---|---|---|---|
| 93 | Gore Magala (em071_00) | 83 | 68 | 0 | 0 | 11 | 4 | 14 / 0 |
| 94 | Chaotic Gore Magala (em071_05) | 84 | 73 | 0 | 0 | 11 | 0 | 25 / 0 |


## Every record that is not drawing and not a named refusal

| # | monster | record | bucket | detail (meter verdict / when / clips) |
|---|---|---|---|---|
| 1 | em001_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 1 | em001_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 1 | em001_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 1 | em001_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 2 | em001_02 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 2 | em001_02 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 2 | em001_02 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 2 | em001_02 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 4 | em002_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 4 | em002_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 4 | em002_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 4 | em002_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 5 | em002_02 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 5 | em002_02 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 5 | em002_02 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 5 | em002_02 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 7 | em003_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 7 | em003_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 7 | em003_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 8 | em004_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 8 | em004_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 8 | em004_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 8 | em004_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 9 | em005_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 9 | em005_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 9 | em005_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 9 | em005_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 10 | em007_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 10 | em007_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 10 | em007_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 10 | em007_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 12 | em032_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 12 | em032_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 12 | em032_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 12 | em032_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 15 | em037_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 15 | em037_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 15 | em037_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 15 | em037_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 15 | em037_00 | u 1315 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 18 | em042_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 18 | em042_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 18 | em042_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 18 | em042_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 19 | em077_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 19 | em077_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 19 | em077_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 20 | em081_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 20 | em081_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 20 | em081_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 20 | em081_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 22 | em043_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 22 | em043_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 22 | em043_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 23 | em043_05 | u 51 | not requested | class request site key (efx/class-effects.json), not exported |
| 24 | em044_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 24 | em044_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 24 | em044_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 24 | em044_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 25 | em045_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 25 | em045_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 25 | em045_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 27 | em055_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 27 | em055_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 27 | em055_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 27 | em055_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 28 | em063_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 28 | em063_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 28 | em063_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 28 | em063_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 29 | em063_05 | u 204 (event) | open | exported, never started under the census inputs |
| 30 | em080_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 30 | em080_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 30 | em080_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 32 | em008_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 32 | em008_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 32 | em008_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 33 | em009_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 33 | em009_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 33 | em009_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 33 | em009_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 37 | em018_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 37 | em018_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 37 | em018_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 37 | em018_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 40 | em079_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 40 | em079_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 40 | em079_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 43 | em057_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 43 | em057_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 43 | em057_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 43 | em057_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 45 | em021_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 45 | em021_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 45 | em021_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 46 | em022_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 46 | em022_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 46 | em022_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 47 | em023_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 47 | em023_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 47 | em023_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 48 | em023_05 | u 310 (clip) | open | ROM REASON TO BRING (lane A, 2026-10-25): (lane A4) the PSL binds u 310 to L2 M8 / M20 / M21 bit 12 only; bit 12 is the tired-and-calm group of 0xca170 (0x7000 when 0x81614 and not 0x81670, 0xca19c..0xca1bc), and 0x81614 never returns 1 on Furious Rajang (P+0x1a8 bit 19: every P+0x505 writer writes 0 -- the accepted c 1104 reason); his word 0xded0f4 adds bits 15-17 on L2 M8 only; control: Rajang u 310 draws tired (census: st 3, lit 85, L2 M8 / M20 / M21) |
| 48 | em023_05 | c 1109 (event) | open | ROM REASON TO BRING (lane A, 2026-10-25): (lane A4) (10, 0x1b) is issued only by the reaction builder 0x9a76c code 8 (0x9a9ac..0x9a9b8, posture 0; (10, 0x1c) at 0x9b040 in posture 2); code 8 is written to P+0x3ae only at 0x9993c (every store to P+0x3ae scanned, 28 register-offset forms, laneA4/issue101b.py; control: the same scan finds code 0x1c at 0x98df0 / 0x99960, the source of the Mizutsune (10, 0xaf)), behind the 0x9a290 code 5, which comes only from 0xa3028; 0xa3028 loads [0x70fbc(e) + 0x44] = tune+0x44 and returns 0 when it is NULL (0xa3038..0xa3044), and the Furious Rajang tune+0x44 is NULL (states-em023_05.md 1.1); control: the Rajang block {200, 600, 5, 0, 100, 600} procs and Rajang c 1109 draws (census: st 3, lit 16, L3 M2) |
| 50 | em060_00 | c 60 (clip) | open | ROM REASON TO BRING (lane A, 2026-10-25): (lane A4) the PSL binds c 60 to L0 M13 / L0 M17 bit 15 only (CLIP_EFFECTS em060_00); the word 0xf1911c (READ whole, emulated 3120 runs; dev/em060-effects-spec.md 1) sets bit 15 there only for e+0xb5f5 == 4 with em 0x3c (Redhelm), and the base word 0xca170 sets bits 0-14; control: Redhelm c 60 draws through the same bit (census: st 2, lit 51, L0 M13 / M17) |
| 55 | em065_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 55 | em065_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 56 | em083_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 56 | em083_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 56 | em083_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 56 | em083_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 56 | em083_00 | u 242 (clip) | open | exported, never started under the census inputs |
| 56 | em083_00 | u 400 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 242 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 400 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 472 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 473 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 520 (clip) | open | exported, never started under the census inputs |
| 57 | em083_04 | u 1050 (event) | open | exported, never started under the census inputs |
| 58 | em010_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 58 | em010_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 58 | em010_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 60 | em036_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 60 | em036_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 60 | em036_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 60 | em036_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 61 | em046_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 61 | em046_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 61 | em046_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 61 | em046_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 61 | em046_00 | u 1315 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 62 | em047_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 62 | em047_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 62 | em047_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 62 | em047_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 63 | em049_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 63 | em049_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 63 | em049_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 63 | em049_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 64 | em056_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 64 | em056_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 64 | em056_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 65 | em082_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 65 | em082_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 65 | em082_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 65 | em082_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 67 | em066_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 67 | em066_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 67 | em066_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 69 | em067_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 69 | em067_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 69 | em067_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 70 | em068_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 70 | em068_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 70 | em068_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 71 | em070_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 71 | em070_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 71 | em070_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 71 | em070_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 72 | em088_00 | u 400 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 401 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 402 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 403 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 404 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 405 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 406 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 407 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 408 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 409 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 410 (thread) | open | exported, never started under the census inputs |
| 72 | em088_00 | u 420 (event) | open | exported, never started under the census inputs |
| 74 | em019_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 74 | em019_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 74 | em019_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 76 | em020_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 76 | em020_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 76 | em020_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 78 | em069_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 78 | em069_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 78 | em069_00 | u 1313 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 78 | em069_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 91 | em084_00 | u 220 (clip) | starts, no draw | draws off camera (lit when looked at); em084_00|3|Motion[63] |
| 93 | em071_00 | u 1311 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 93 | em071_00 | u 1312 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 93 | em071_00 | u 1314 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
| 93 | em071_00 | u 1315 (event) | open | hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations" |
