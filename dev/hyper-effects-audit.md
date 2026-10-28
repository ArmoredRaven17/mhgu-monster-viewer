# GU Hyper effects -- the audit, every monster (hyper audit, 2026-10-28)

Raven, 2026-10-28: "Review Hyper Effects since some monsters do not seem to have them". Tools: `dev/archive/hyperaudit/`
(rom-map "2. Tooling"). Shots: `dev/shots/hyperaudit/` (G, default camera, Off + every pair), `dev/shots/hyperaudit_angles/`
(four sides), contact sheets `dev/shots/hyperaudit_sheets/sheet_0..7.png`, `angles.png`.

## Counts

- **Which monsters the game can make hyper (from the ROM and the data, three sources that agree):**
  - the .mdd loader `0x4bd64`'s own table (`rescols.py`, READ): 44 of 137 monster rows have a resource path in columns 0x26 / 0x27;
    the other 93 hold -1 (nothing attached, so the aura code `0xca1f8` has no table);
  - the romfs: 88 `enemy\dou_mou_ka\*.mdd` files in 13,933 arcs = those 44 x (plain, `_G`), each in its own monster's arc;
  - the quests (`questroster.py`, INFERRED field): byte +3 of the large-monster entry is 1 on 245 entries of 172 quests, on
    exactly the same 44 monsters (83 G quests, 88 HR, 1 rank 0).
- **44 should have Hyper; the viewer offers the row on all 44** (Congalala and Nerscylla at G only -- their plain file is empty
  and every hyper quest of theirs is G). **50 of the 94 list entries cannot be hyper in GU** (every deviant, every elder, the
  variants other than Gold Rathian / Silver Rathalos, Seltas, Kirin, the dromes ...): row hidden, correctly.
- **On the page (86 monster x rank cases: 42 x 2 + Congalala / Nerscylla at G), all pass** after one tool fix:
  - options = the file's pairs on every case; every aura u 1300+ID of every pair **starts and draws** (meter: lit samples on
    every row; 149 aura records also headless, `auracensus.out`, none refused);
  - bursts: one hooked play-once clip per monster and rank, every u 1310+ID expected **started and drew**;
  - eyes: the head aura carries the eye pair on **36 monsters** (sorted / DSZTest under "Effects drawn before" = A GPU-particle
    effect, unsorted / DSZTestWrite under None -- section 5 of dev/hyper-states.md); **8 monsters have no eye rows in the ROM
    data** (Khezu, Daimyo Hermitaur, Shogun Ceanataur, Blangonga, Nargacuga, Najarala, Gore Magala, Malfestio: every aura
    record is cm202_100 with MASK1 0x21 / 0x41, the smoke rows only); Rajang / Uragaan / Nibelsnarf / Brachydios / Nerscylla
    draw cores and no halo (data).
- **No missing data, no wrong file, no unexported record, no joint error, no runtime refusal, no hidden row, no variant sharing
  a base's data** was found. No record needed exporting: the efx slot was not taken.

## Causes of "do not seem to have them"

1. **The 50 entries the game never makes hyper** (ROM: loader column -1, no .mdd in any arc, no quest flag). Nothing to build.
2. **Viewed from the default front camera, several monsters' auras sit behind the body** (`angles.png`): Congalala (head aura
   behind the face, tail aura behind), Daimyo / Shogun (legs, shell), Nerscylla (back, legs), Tetsucabra / Najarala (camera
   close on the head), Lagiacrus (low pose). From the sides and back the smoke is there. A viewing matter, not a defect.
3. **The eyes**: lit only under "Effects drawn before" = A GPU-particle effect (default None draws the black slash, as section 5
   reads); and 8 monsters have no eye rows at all in the data (above).
4. **Congalala / Nerscylla below G**: no aura, the ROM's (plain file empty).
5. **Nibelsnarf's "no aura start"** (the 2026-10-25 note, and this audit's first pass): the probe's own state -- a shot left the
   clip ended with timeScale 0, the effects' clock (`animAdvance`) gave 0 and a request made then never stepped. Withdrawn
   (rom-map); u 1301 / 1302 / 1303 draw at both ranks.
6. **u 1300+N records with no DouMouKaID N** (Gypceros 1304, Blangonga 1303, Lavasioth 1303, Nargacuga 1304, Barroth 1303,
   Lagiacrus 1302 / 1303, Nerscylla 1303, Astalos 1302, Mizutsune 1302): re-checked against both files of each -- in neither;
   the ROM requests u 1300 + ID only for the table's IDs (rom-map rows "u 1300 + N"). An accepted refusal, unchanged.

Corrected on the way: "Rajang / Gore Magala group differently" named the wrong monster -- em079_00 is **Malfestio** (rom-map
Withdrawn table; dev/hyper-states.md patched).

## Fixed

Nothing viewer-side was broken, so nothing in docs/ changed. Fixed: the audit tool (pageaudit.mjs: the idle clip set looping
before the next rank), the rom-map name. Monsters the game can make hyper but where nothing can be built: **none**.

## The table (below G = the plain .mdd, Quest Rank 3; G = the `_G`, Quest Rank 5)

| monster | should have Hyper (ROM) | row offered | auras start / draw (meter) | eyes | bursts (one hooked clip) | page | cause / fixed |
|---|---|---|---|---|---|---|---|
| Rathian (em001_00) | yes (.mdd path; hyper quests rank 0 1, HR 3, G 2) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1304: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[3] L2 u 1311 1/1 draws; G: Motion[3] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Gold Rathian (em001_02) | yes (.mdd path; hyper quests HR 4, G 3) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1304: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[3] L2 u 1311 1/1 draws; G: Motion[3] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Dreadqueen Rathian (em001_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Rathalos (em002_00) | yes (.mdd path; hyper quests rank 0 1, HR 6, G 4) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Silver Rathalos (em002_02) | yes (.mdd path; hyper quests HR 5, G 3) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Dreadking Rathalos (em002_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Khezu (em003_00) | yes (.mdd path; hyper quests HR 2, G 2) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | none (data: no eye bit) | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); nothing to fix viewer-side |
| Basarios (em004_00) | yes (.mdd path; hyper quests G 4) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1312 1/1 draws; G: Motion[1] L2 u 1312 1/1 draws | all pass || nothing to fix viewer-side |
| Gravios (em005_00) | yes (.mdd path; hyper quests G 2) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1312 1/1 draws; G: Motion[1] L2 u 1312 1/1 draws | all pass || nothing to fix viewer-side |
| Diablos (em007_00) | yes (.mdd path; hyper quests G 3) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Bloodbath Diablos (em007_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Yian Kut-Ku (em008_00) | yes (.mdd path; hyper quests HR 4, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[23] L2 u 1311 1/1 draws; G: Motion[23] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Gypceros (em009_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[23] L2 u 1311 1/1 draws; G: Motion[23] L2 u 1311 1/1 draws | all pass || u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Plesioth (em010_00) | yes (.mdd path; hyper quests HR 4, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Kirin (em011_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Lao-Shan Lung (em012_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Fatalis (em013_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Crimson Fatalis (em013_01) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Old Fatalis (em013_02) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Velocidrome (em014_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Gendrome (em015_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Iodrome (em016_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Cephadrome (em017_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Yian Garuga (em018_00) | yes (.mdd path; hyper quests HR 4, G 1) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[64] L4 u 1311 1/1 draws; G: Motion[64] L4 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Deadeye Yian Garuga (em018_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Daimyo Hermitaur (em019_00) | yes (.mdd path; hyper quests HR 2, G 2) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw (in scene <= noise: u 1302); G: 3/3 draw (in scene <= noise: u 1302) | none (data: no eye bit) | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); looks absent from the default front view: 1301 / 1302 / 1303 on the legs / shell, little shows from the front; seen from the sides (angles.png); nothing to fix viewer-side |
| Stonefist Hermitaur (em019_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Shogun Ceanataur (em020_00) | yes (.mdd path; hyper quests HR 4, G 3) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | none (data: no eye bit) | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); looks absent from the default front view: auras on the legs and shell, little from the front; sides (angles.png); nothing to fix viewer-side |
| Rustrazor Ceanataur (em020_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Congalala (em021_00) | yes (.mdd path; hyper quests G 3) | below G: 0 pairs; G: 2 pairs | below G: none in file; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | --; G: Motion[20] L0 u 1313 1/1 draws | all pass || G only: plain .mdd empty, every hyper quest G (data); looks absent from the default front view: head aura behind the face, tail aura 1303 behind: nothing from the front; sides / back show both (angles.png); nothing to fix viewer-side |
| Blangonga (em022_00) | yes (.mdd path; hyper quests HR 3, G 2) | below G: 1 pairs; G: 1 pairs | below G: 2/2 draw; G: 2/2 draw | none (data: no eye bit) | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Rajang (em023_00) | yes (.mdd path; hyper quests HR 2, G 1) | below G: 1 pairs; G: 2 pairs | below G: 2/2 draw; G: 3/3 draw | u 1303: 0 halo / 2 core, sorted under GPU-particle | below G: Motion[15] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1313 1/1 draws | all pass || eyes: cores only, no halo row (data); nothing to fix viewer-side |
| Furious Rajang (em023_05) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Kushala Daora (em024_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Chameleos (em025_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Teostra (em027_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Bulldrome (em030_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Tigrex (em032_00) | yes (.mdd path; hyper quests HR 4, G 3) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[2] L2 u 1311 1/1 draws; G: Motion[2] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Grimclaw Tigrex (em032_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Akantor (em033_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Giadrome (em034_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Lavasioth (em036_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Nargacuga (em037_00) | yes (.mdd path; hyper quests HR 2, G 3) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | none (data: no eye bit) | below G: Motion[19] L2 u 1315 2/2 draws; G: Motion[19] L2 u 1315 2/2 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Silverwind Nargacuga (em037_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Ukanlos (em038_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Barioth (em042_00) | yes (.mdd path; hyper quests G 2) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Deviljho (em043_00) | yes (.mdd path; hyper quests HR 3, G 2) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Savage Deviljho (em043_05) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Barroth (em044_00) | yes (.mdd path; hyper quests G 2) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw (in scene <= noise: u 1304); G: 3/3 draw (in scene <= noise: u 1304) | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Uragaan (em045_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 0 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Crystalbeard Uragaan (em045_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Lagiacrus (em046_00) | yes (.mdd path; hyper quests HR 5, G 4) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 2/1 draws; G: Motion[1] L2 u 1311 2/1 draws | all pass || looks absent from the default front view: low pose; auras faint from the front; u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Royal Ludroth (em047_00) | yes (.mdd path; hyper quests HR 4, G 1) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Agnaktor (em049_00) | yes (.mdd path; hyper quests HR 2, G 1) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Alatreon (em050_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Duramboros (em055_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Nibelsnarf (em056_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw (in scene <= noise: u 1301) | u 1301: 0 halo / 2 core, sorted under GPU-particle | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || the earlier "no aura start" was the probe's frozen clip (Withdrawn); u 1303 draws at both ranks; nothing to fix viewer-side |
| Zinogre (em057_00) | yes (.mdd path; hyper quests HR 4, G 5) | below G: 3 pairs; G: 3 pairs | below G: 4/4 draw; G: 4/4 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[15] L2 u 1314 1/1 draws; G: Motion[15] L2 u 1314 1/1 draws | all pass || nothing to fix viewer-side |
| Thunderlord Zinogre (em057_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Amatsu (em058_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Arzuros (em060_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Redhelm Arzuros (em060_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Lagombi (em061_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Snowbaron Lagombi (em061_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Volvidon (em062_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Brachydios (em063_00) | yes (.mdd path; hyper quests HR 4, G 3) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw (in scene <= noise: u 1304); G: 4/4 draw (in scene <= noise: u 1304) | u 1301: 0 halo / 0 core, sorted under GPU-particle | below G: Motion[10] L2 u 1313 1/1 draws; G: Motion[10] L2 u 1313 1/1 draws | all pass || nothing to fix viewer-side |
| Raging Brachydios (em063_05) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Kecha Wacha (em065_00) | yes (.mdd path; hyper quests HR 2, G 3) | below G: 1 pairs; G: 1 pairs | below G: 2/2 draw; G: 2/2 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[77] L2 u 1311 1/1 draws; G: Motion[77] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Tetsucabra (em066_00) | yes (.mdd path; hyper quests HR 2, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L4 u 1311 1/1 draws; G: Motion[1] L4 u 1311 1/1 draws | all pass || looks absent from the default front view: default camera close on the head; tail / back auras from the side (angles.png); nothing to fix viewer-side |
| Drilltusk Tetsucabra (em066_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Zamtrios (em067_00) | yes (.mdd path; hyper quests HR 1, G 1) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1303: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[10] L2 u 1311 1/1 draws; G: Motion[10] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Najarala (em068_00) | yes (.mdd path; hyper quests HR 3, G 2) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | none (data: no eye bit) | below G: Motion[104] L0 u 1312 1/1 draws; G: Motion[104] L0 u 1312 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); looks absent from the default front view: default camera close; the coiled body hides most auras; nothing to fix viewer-side |
| Seltas Queen (em069_00) | yes (.mdd path; hyper quests HR 3, G 1) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1303: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[33] L4 u 1311 1/1 draws; G: Motion[33] L4 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Nerscylla (em070_00) | yes (.mdd path; hyper quests G 5) | below G: 0 pairs; G: 2 pairs | below G: none in file; G: 3/3 draw | u 1301: 0 halo / 6 core, sorted under GPU-particle | --; G: Motion[1] L2 u 1311 1/1 draws | all pass || G only: plain .mdd empty, every hyper quest G (data); looks absent from the default front view: u 1302 / 1304 on the back / legs, faint from the front; sides (angles.png); u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Gore Magala (em071_00) | yes (.mdd path; hyper quests HR 2, G 2) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | none (data: no eye bit) | below G: Motion[20] L2 u 1311 1/1 draws; G: Motion[20] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); nothing to fix viewer-side |
| Chaotic Gore Magala (em071_05) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Shagaru Magala (em072_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Seltas (em076_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Seregios (em077_00) | yes (.mdd path; hyper quests HR 3, G 5) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[23] L2 u 1312 1/1 draws; G: Motion[23] L2 u 1312 1/1 draws | all pass || nothing to fix viewer-side |
| Malfestio (em079_00) | yes (.mdd path; hyper quests HR 4, G 3) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | none (data: no eye bit) | below G: Motion[12] L2 u 1313 1/1 draws; G: Motion[14] L2 u 1311 1/1 draws | all pass || no eye rows: every aura is cm202_100 MASK1 0x21 / 0x41 (data); nothing to fix viewer-side |
| Nightcloak Malfestio (em079_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Glavenus (em080_00) | yes (.mdd path; hyper quests HR 5, G 7) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1311 1/1 draws; G: Motion[1] L2 u 1311 1/1 draws | all pass || nothing to fix viewer-side |
| Hellblade Glavenus (em080_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Astalos (em081_00) | yes (.mdd path; hyper quests HR 6, G 7) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1301: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[13] L2 u 1311 1/1 draws; G: Motion[13] L2 u 1311 1/1 draws | all pass || u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Boltreaver Astalos (em081_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Mizutsune (em082_00) | yes (.mdd path; hyper quests HR 6, G 5) | below G: 2 pairs; G: 2 pairs | below G: 3/3 draw; G: 3/3 draw | u 1303: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[10] L2 u 1313 1/1 draws; G: Motion[10] L2 u 1313 1/1 draws | all pass || u 130N exported with no DouMouKaID N: never requested (ROM, re-checked both files); nothing to fix viewer-side |
| Soulseer Mizutsune (em082_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Gammoth (em083_00) | yes (.mdd path; hyper quests HR 5, G 5) | below G: 4 pairs; G: 4 pairs | below G: 4/4 draw; G: 4/4 draw | u 1302: 2 halo / 2 core, sorted under GPU-particle | below G: Motion[1] L2 u 1313 1/1 draws; G: Motion[1] L2 u 1313 1/1 draws | all pass || nothing to fix viewer-side |
| Elderfrost Gammoth (em083_04) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Nakarkos (em084_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Great Maccao (em085_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Valstrax (em086_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| em087_00 (em087_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
| Ahtal-Ka (em088_00) | no (no .mdd path, no hyper quest) | hidden | -- | -- | -- | -- | -- |
