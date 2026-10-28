# Monster quick reference -- Hyper, deviants, tired, states (2026-10-28)

Raven, 2026-10-28: "it can be difficult to recall all the differences between the monsters, their hyper versions and
deviants if they have one". A few plain lines per monster, not the tables. **A summary of what the repo already
establishes -- no new decoding.** The detail lives in the cited docs; this page only points.

## How to read this

- One section per monster in the in-app list order (dev/effects-walk-order.md). Variants (deviants, subspecies, Furious,
  Chaotic, the Fatalis line) are `###` sub-entries under their base. Shagaru is cross-referenced from Gore Magala.
- Names are docs/monsters.json's. Part names are Raven's (docs/part-review.json) where a bullet names a viewer part row.
- **Hyper "Part N" is the .mdd's SpecificParts index** -- the working label the viewer's Hyper row shows. No doc maps it to
  Raven's part names, so it stays "Part N" here. The Hyper row offers one group-0 part with one group-1 part; the pairs
  listed are the G-rank file's (the Quest Rank picks the file) unless a bullet says otherwise.
- "Eye glow" = the yellow-orange eye in a purple ring. It is data in the monster's head aura (its own `_500` effect file).
  It lights only with Animation panel > **Effects drawn before: A GPU-particle effect** (dev/hyper-states.md 5).
- Clip ids go in brackets at the end: `[L2 M3]` = list 2, Motion[3]. `*G` = G rank only, `*lowG` = below G only.
- Hyper sources for every monster: dev/hyper-attacks.md (that monster's section), docs/hyper-motion.json,
  docs/hyper-auras.json, dev/hyper-states.md 2 / 5 / 6, dev/archive/hypereye/eyecensus.out and
  dev/archive/laneB3/hyperjoints.out. Viewer controls: a headless census of the page's visible rows on 2026-10-28
  (every monster has Ground, Quest Rank / Level, Hunter, Attack Hitboxes and the Hit Zones rows; only the extras are named).

## Legend

- **xfactor** -- a size or speed multiplier. "x1.3" on a clip = it plays 1.3x as fast from that point. "Wind-up x0.6" = the
  start is slowed first, then the rest speeds up (the hook rates). "Projectile x1.15" = the shell's look and each hit
  sphere's radius scale by 1.15.
- **Burst** -- the extra aura flash (u 1311..1315, one per aura ID) fired at a frame of that clip.
- **ModifyData speed** -- a whole-action speed from the .mdd; the viewer applies it to every clip that action plays.
- **Absent under Hyper** -- a tired-only thing a Hyper monster never does: Hyper sets the never-tired flag (P+0x1a8 bit 19),
  so its tired twin attacks, tired-only effect records, Exhausted idle and drool c 1104 never happen. Against a not-tired
  normal monster nothing changes.
- **Power** changes (AttackRate / PowerRate) are not visual; they are left out here (the Attack Hitboxes tooltip has them).
- **Never tires** -- stamina is off for good (bit 19 in the static flag word, or no stamina block): no Exhausted state,
  no drool, no tired forms. The viewer then offers no Exhausted state.
- **"not read yet"** -- the docs do not establish it. Nothing here is guessed; the open items are listed at the end.

---

## 1. Rathian (em001_00)
- **Hyper parts:** Part 7 + Part 0 / Part 7 + Part 1 / Part 7 + Part 6 (both ranks). Eye glow on the Part 6 aura (u 1304).
- **Hyper speed:** Part 7 -- the fireball and charge clips start slowed (x0.45-0.6) then run x1.2, burst u 1311
  [L2 M3, L2 M4, L4 M6, L4 M55; L4 M65*G]. Part 6 -- up to x1.3 after a x0.75 wind-up, burst u 1314 [L2 M1, L2 M2,
  L2 M13]; at G also bursts on [L2 M5, L4 M8, L4 M16]. ModifyData: Part 0 x1.2 [L0 M7, L0 M8]; Part 1 x1.3 on 14 clips
  [L1 M2, L1 M8, L1 M14, L1 M16-M18, L4 M12-M15 ...].
- **Hyper projectiles:** fireballs x1.15 with Part 6 held, G only [L2 M5, L2 M18, L4 M8, L4 M16, L4 M65].
- **Absent under Hyper:** the four tired "no-fire" fireball attacks, the tired record (key 221) on the fireball clips
  [L2 M5, L2 M15-M18, L4 M8, L4 M53, L4 M54], the Exhausted idle [L0 M14] and the drool.
- **Tired:** she picks the no-fire fireball: same clip, no fireball, the clip's effect becomes u 221 [L2 M5, L2 M18,
  L4 M8]. Tired idle and drool c 1104 (timer 4800); eating three times restores stamina [L0 M14; L0 M16 x3 -> L0 M17]
  (shells.js op24 comment; states-em001.md 3; dev/em001-effects-spec.md 2.1).
- **States:** rage changes no part or material; the puff u 1120 / u 1121 is picked by joint 4's tilt; 1.15x speed.
  The tail severs without a break; the tail attacks switch u 502 / 503 -> u 510 / 511 [L2 M3, L2 M4, L4 M6, L4 M65]
  (states-em001.md 2; dev/em001-effects-spec.md 2.1).
- **Controls:** State (Normal / Enraged / Exhausted), Flashed, Hyper; Tired (with Rage) in the Debug panel
  (motion-states.js CLASS_TOGGLES).

### Gold Rathian (em001_02) -- variant of Rathian
- **Hyper parts:** as Rathian (Part 7 + Part 0 / 1 / 6; eye glow on Part 6, u 1304). Her Part 7 and Part 6 auras carry
  hit-zone hardness biases (x1.2 / x1.35); Rathian's are x1.
- **Hyper speed:** Part 7 drives more clips than Rathian's: up to x1.4 [L4 M7], x1.3 [L2 M3, L2 M4], x1.2 [L4 M5, L4 M6,
  L4 M50, L4 M52, L4 M55]; bursts u 1311 also on [L4 M49, L4 M51; L4 M62*G, L4 M63*G, L4 M65*G]. Part 6 as Rathian's, and
  its bursts hold at both ranks, plus [L4 M18]. ModifyData as Rathian.
- **Hyper projectiles:** fireballs x1.2 below G, x1.25 at G (Rathian: x1.15, G only) with Part 6 held [L2 M1, L2 M5, L2 M18,
  L4 M8, L4 M16, L4 M18, L4 M65].
- **Absent under Hyper:** as Rathian, plus her not-tired u 290 / u 291 always fire.
- **Variant vs base:** L2 M1 adds u 290 / u 291 when not tired (Gold, Silver and Dreadqueen only) [L2 M1]. Her own records
  u 230-232 by calm / enraged [L4 M18] and u 541 / u 542 once the tail is severed [L4 M50, L4 M52]. u 522 / u 523 exist but
  never fire (variant-4 bits only). Enraged in the air she lands with her own [L4 M7]. Rage gauge 420, 1.18x; tired timer
  3000 (dev/em001-effects-spec.md 1, 2.2; cenreport.py PSL_NEVER; states-em001.md 2-3; states-em002_04.md 2.2).
- **Tired:** as Rathian, and she loses u 290 / u 291 [L2 M1].
- **Controls:** as Rathian, plus a Damage Table row (Table 0 / 1: her hit tables switch with the head break).

### Dreadqueen Rathian (em001_04) -- variant of Rathian
- **No Hyper version** (no .mdd in her arc).
- **Variant vs base:** three tail forms (Raven's Tail row: Intact / Broken / Severed); the break fires u 1036 and she can be
  severed only after it [L3 M2, L3 M15] (motion-states.js deviantTail).
- **Variant vs base:** her tail attacks follow the three forms -- intact u 502 / 503 (L9: u 500 / 501), broken u 522 / 523
  (L9: u 520 / 521), severed u 510, u 541 / 542 -- and leave poison on the ground (shell01 modes 16 / 23 / 24), none once
  severed [L2 M3, L2 M4, L4 M6, L4 M50-M55, L9 M1, L9 M2, L9 M6]. At quest number 5 or lower the broken form shows on an
  unbroken tail (the viewer uses quest 10) (dev/em001-effects-spec.md 2.3; shells.js header).
- **Variant vs base:** u 290 / 291 as Gold, and u 631 on every play [L2 M1, L9 M9]. Flashed in the air with no wing torn
  she stays up (Rathian falls). Rage 1.05x; tired timer 3000 (states-em002_04.md 2.1, 5.2).
- **Tired:** as Rathian, and she loses u 290 / u 291.
- **Controls:** as Rathian (no Hyper), plus Damage Table (Table 0 / 1).

## 2. Rathalos (em002_00)
- **Hyper parts:** Part 6 + Part 0 / Part 6 + Part 4 / Part 6 + Part 7. Eye glow on the Part 6 aura (u 1301).
- **Hyper speed:** Part 6 -- up to x1.3 after a x0.75 wind-up [L2 M1, L2 M13], x1.15 [L4 M42*G], burst u 1311 also on
  [L2 M5, L4 M22, L4 M28, L4 M31*lowG]. Part 4 -- x0.8 then x1.2, burst u 1313 [L4 M36, L4 M41; L4 M56*G]. Part 7 -- x0.6 then
  x1.2, burst u 1314 [L2 M3, L2 M4]. ModifyData: Part 4 x1.1 [L4 M36, L4 M41, L4 M46; L1 M2*G, L4 M56*G].
- **Hyper projectiles:** with Part 6 held, fireballs x1.3 (shell00) and x1.5 (shell01) at both ranks
  [L2 M5, L2 M13, L2 M18, L4 M22, L4 M29, L4 M32, L4 M45].
- **Absent under Hyper:** eleven tired twin attacks (no-fire fireballs on L2 M5 / M15-M18, L4 M22, L4 M28-M34), the tired
  records (keys 200 / 221 / 350) on those clips, the Exhausted idle [L0 M14], the drool.
- **Tired:** the same no-fire fireballs and fireball u 221 as Rathian; L4 M32 also loses u 201 [L2 M5, L4 M32]. Tired idle,
  drool c 1104 [L0 M14] (dev/em002-effects-spec.md 1-2).
- **States:** he runs Rathian's class and lists 0-3. Rage on the ground: roar, then (7, 0x29) with a shell instead of
  taking off; in the air he roars without landing [L0 M4 -> L4 M31 -> L4 M32; L1 M3]. The tail severs only, never breaks;
  u 502 / 503 -> u 510 / 511 [L2 M3, L2 M4] (states-em002_04.md 2.2; dev/em002-effects-spec.md 1-2).
- **Controls:** State, Flashed, Hyper; Tired (with Rage) in Debug.

### Silver Rathalos (em002_02) -- variant of Rathalos
- **Hyper parts:** as Rathalos (eye glow on Part 6, u 1301); his Part 6 / Part 7 auras carry hardness biases x1.4 / x1.2.
- **Hyper speed:** as Rathalos, plus Part 6 bursts on [L4 M38; L4 M69*G], no L4 M42. ModifyData: Part 0 x1.1 [L0 M7, L0 M8];
  Part 4 x1.2 [L4 M36, L4 M41, L4 M46] and x1.3 [L4 M1, L4 M17].
- **Hyper projectiles:** with Part 6 held, fireballs x1.3 (shell00) and x1.5 (shell01), both ranks
  [L2 M1, L2 M5, L2 M13, L2 M18, L4 M22, L4 M29, L4 M32, L4 M38].
- **Absent under Hyper:** as Rathalos (plus the tired record on [L4 M38]).
- **Variant vs base:** u 290 / u 291 on L2 M1 when not tired (the only Rathalos-line monster with them) [L2 M1]. His
  (7, 0xf5) play of L4 M38 clears the calm / enraged / tired effects and has no u 600 / 602, so it plays bare [L4 M38].
  (10, 0x94) plays L3 M9 where Rathalos plays the L3 M3 chain (dev/em002-effects-spec.md 1-3; motion-states.js).
- **Tired:** as Rathalos, and he loses u 290 / u 291.
- **Controls:** as Rathalos, plus Damage Table (Table 0 / 1).

### Dreadking Rathalos (em002_04) -- variant of Rathalos
- **No Hyper version.**
- **Variant vs base:** three tail forms; the break (u 1036) must come before the sever (ground only; u 900 at 0.7x). Tail
  attacks u 502 / 503 intact, u 522 / 523 broken (or at quest number 5 or lower), u 510 severed [L3 M2, L3 M15; L2 M3, L2 M4]
  (states-em002_04.md breaks table, 4; dev/em002-effects-spec.md 2).
- **Variant vs base:** his (7, 0xf5) play of L4 M38 fires u 600 / 602 only; his other L4 M38 plays show u 230-232. u 290 / 291
  never fire. Flashed in the air he stays up. His wings carry extra groups 104 / 106 while intact. His own L4 and L9 lists
  [L4 M38; L9 M20, L9 M21] (states-em002_04.md 5.2, 6; cenreport.py PSL_NEVER; part-review.json).
- **Tired:** as Rathalos; timer 3000.
- **Controls:** State, Flashed, Damage Table (Table 0 / 1); Tired (with Rage) in Debug.

## 3. Khezu (em003_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 3. **No eye-glow record** (all his auras use the shared cm202_100 file).
- **Hyper speed:** Part 6 -- up to x1.5 [L2 M1, L4 M1], x1.4 [L2 M36], x1.2 [L2 M3] (wind-ups x0.5-0.7), burst u 1311.
  Part 4 / Part 3 -- x1.5 [L0 M13 / L0 M12, L2 M4, L2 M39], x1.2 [L2 M5], bursts u 1312 / u 1313 [L2 M4].
- **Hyper projectiles:** the discharge bolts (shell03) x1.3 with Part 6 held, both ranks [L2 M3].
- **Absent under Hyper:** the small tired discharge -- so his body AoE is always the full ring and spokes to f273
  [L2 M12, L2 M28] -- and the tired records (keys 210 / 211) on his bolt clips [L2 M3, L2 M41-M67]; the Exhausted idle
  [L0 M15]; the drool. Nothing makes the AoE larger than a not-tired normal Khezu (rom-map "Khezu's body AoE L2 M12").
- **Tired:** the body discharge shrinks to a 17-frame small spark [L2 M12]. Tired idle, drool c 1104 (timer 4500) [L0 M15]
  (rom-map "Khezu's body AoE"; states-em003_00.md 5).
- **States:** rage plays the Angry vein material, puff always u 1121, no roar, 1.3x. u 260 / 261 / 262 only on the charged
  attacks his AI uses while enraged [L0 M6, L2 M4, L2 M5, L2 M39, L2 M10, L2 M74]. No sever, no eye sets
  (states-em003_00.md 4, 10; dev/em003_00-effects-spec.md 1-3).
- **Controls:** State, Hyper, **Discharge** (the Taiden material), Damage Table (Normal / Ceiling); wall / ceiling postures per
  clip. No Flashed switch: he is immune (flashed-state.md 7).

## 4. Basarios (em004_00)
- **Hyper parts:** Part 5 + Part 4 / Part 5 + Part 3 / Part 5 + Part 7. Eye glow on Part 5 (u 1301).
- **Hyper speed:** Part 5 -- x1.3 [L2 M27], x1.2 [L2 M9, L4 M5, L4 M8; L4 M20*G], burst u 1311. Part 4 / Part 3 -- x1.2
  [L2 M1, L2 M16 / L2 M13, L2 M22], bursts u 1312 / 1313; at G also x1.3 [L0 M9, L0 M10] and bursts on [L0 M7, L4 M18,
  L4 M19, L4 M21]. Part 7 -- x1.2, burst u 1314 [L2 M12]. ModifyData x1.1 at G [L0 M7].
- **Hyper projectiles (G only, Part 5 held):** shell00 / shell01 x1.3 [L4 M5, L4 M8, L4 M20, L1 M103, L1 M104], shell02 x1.5
  [L2 M27]. Below G those shells hit harder but keep their size.
- **Absent under Hyper:** the two tired gas attacks and the tired record (key 251) [L2 M3, L2 M4, L2 M27-M29], the Exhausted
  idle [L0 M14], the drool.
- **Tired:** his gas attacks become (7, 0x0f) / (7, 0x10): the f216 request is u 70 / u 100 instead of u 60 / u 90, the same
  models without the flare billboards [L2 M3]. Tired idle, drool c 1104 [L0 M14] (em004-fireball-actions.md 4, 6;
  states-em004_00.md 5).
- **States:** rage changes nothing on the model; puff always u 1121; 1.2x. A buried state with its own idles and emerge
  clip; the burrow play holds u 1400 [L4 M1-M5, L0 M7]. Breaks: belly and back; the tail sever drops a cut tail
  (states-em004_00.md 0, 4, 8).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**.

## 5. Gravios (em005_00)
- **Hyper parts:** Part 5 + Part 4 / Part 5 + Part 3 / Part 5 + Part 7. Eye glow on Part 5 (u 1301).
- **Hyper speed:** Part 5 -- the beam up to x1.7 at G [L2 M24*G], x1.4 [L4 M59*G], x1.2 [L2 M9; L2 M27*G] (wind-ups to x0.4),
  burst u 1311 [L2 M9, L2 M24, L2 M27, L4 M59; L2 M46*G]. Part 4 / 3 -- x1.2 [L2 M1, L2 M16 / L2 M13, L2 M22]. Part 7 -- x1.2
  [L2 M2, L2 M11, L2 M12]. ModifyData x1.1 at G [L0 M5].
- **Hyper projectiles (Part 5 held):** the beam x1.2 below G, x1.5 at G (look and hit radius; reach unchanged) [L2 M24];
  shell02 x1.2 below G, x1.5 at G [L2 M27]; shell13 x1.2 at G [L2 M46].
- **Absent under Hyper:** four tired attacks (gas and beam forms), the tired records (keys 230 / 251) on 11 clips
  [L2 M24-M29, L2 M46, L2 M50, L2 M55, L4 M59, L4 M60], the Exhausted idle [L0 M14], the drool.
- **Tired:** the tired beam forms never vent and the tired gas forms light no gas [L2 M24, L2 M33, L4 M59, L2 M3]. Tired
  idle, drool c 1104 [L0 M14] (dev/em005_00-effects-spec.md 2-3).
- **States:** same class as Basarios (Gravios owns lists 0-3). Breaks change attacks: back broken switches the gas clouds
  u 260 / 290 -> u 271 / 301; beam vents only once the back or the belly's second stage is broken; at G the back and head
  need two breaks. Rage: nothing on the model, puff u 1121, 1.2x. No buried idle state (states-em005_00.md 4, 8;
  dev/em005_00-effects-spec.md 1-2).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**.

## 6. Diablos (em007_00)
- **Hyper parts:** Part 6 + Part 3 / Part 6 + Part 4 / Part 6 + Part 7. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.2 [L2 M1, L2 M23, L2 M25, L2 M27; L2 M15*G], x1.1 [L2 M24*G], burst u 1311. Part 3 / Part 4 --
  x1.2 [L2 M16], x1.1 [L0 M7, L0 M11, L0 M12] (no bursts). Part 7 -- x1.3 [L2 M3, L2 M4], x1.1 [L2 M20], burst u 1314.
  The most action rows of any Hyper monster are power only (46).
- **Hyper projectiles:** none.
- **Absent under Hyper:** the Exhausted idle [L0 M14] and the drool (no tired-only attack records).
- **Tired:** tired idle, drool c 1104 (timer 6000); no other tired difference established [L0 M14] (states-em007_00.md 5).
- **States:** rage changes nothing on the model; puff u 1120 or u 1121 by joint 4's angle; 1.25x. Horns break in two levels
  (u 1030, u 1031), back breaks, tail sever drops a cut tail; his effects switch with the tail. He burrows: L0 M1 copies
  B / C hold c 30 / c 40, L0 M7 copies B / C hold u 1400 / u 1121 [L0 M1, L0 M5, L0 M7] (states-em007_00.md 0, 4;
  motion-states.js CLIP_VARIANTS).
- **Controls:** State, Hyper, Flashed. No Begins Burrowed: the burrow is in the clip copies.

### Bloodbath Diablos (em007_04) -- variant of Diablos
- **No Hyper version.**
- **Variant vs base:** a **Bloodbath State** ladder (Calm / Building / Full) for his HP stages, apart from Enraged: it drives
  his rage-glow material clips and glow meshes (parts 30 / 32 / 33; each horn's glow follows its horn) and his Head hit
  zone (part-review.json rage; index.html LADDER_NOT_ENRAGE; states-em007_00.md 1.3, 2.3).
- **Variant vs base:** at his second HP rung (30%) he stops tiring for good (bit 19) and starts his second stage, where
  (7, 0x67) lights u 900 [L2 M22] (rom-map "P+0x1a8 bit 19 -- the class setters", `0xd32838`).
- **Variant vs base:** only he severs a horn -- the second horn drops as its own piece, lands with u 906, fires u 901; tail
  sever u 900, drop u 905; Left / Right Leg breaks [L9 M17; L3 M15]. His own list 9 (31 clips): rocks u 0 / 1 (tail on) or
  u 10 / 11 (severed) [L9 M10], extra shell modes [L9 M7, L9 M16, L9 M22, L9 M23, L9 M26]. His death effect u 200 (variant 4
  only) [L3 M10, L3 M17, L3 M21]; burrowed copy D holds u 230 [L0 M1]. Enraged speed 1.0x (Diablos 1.25x)
  (dev/em007_04-undriven-spec.md 0-2; em007-base07-spec.md 6; cenreport.py NR_REASON).
- **Tired:** tired idle and drool from Diablos's file (timer 3200) [L0 M14]; never again after the 30% rung.
- **Controls:** State, Flashed, Bloodbath State, Damage Table (Calm / Building / Full).

## 7. Tigrex (em032_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 6 / Part 4 + Part 3 / Part 4 + Part 6. Eye glow on Part 0 (u 1301; his face
  plates cover it in Motion[25]).
- **Hyper speed:** mostly bursts with the clip's own speed: Part 0 -- x1.2 [L2 M2], u 1311. Part 3 -- u 1312 [L2 M4, L2 M9].
  Part 4 / Part 6 -- wind-ups slowed to x0.65-0.8, bursts u 1313 / 1314 [L0 M9, L0 M12, L0 M13, L2 M5, L2 M26 / L2 M27].
  ModifyData: Part 0 x1.2 [L0 M27, L0 M28, L2 M7, L2 M8]; Part 4 x1.2 [L2 M7, L2 M8]; Part 4 or 6 x1.35 [L0 M9, L0 M12, L0 M13,
  L0 M33].
- **Hyper projectiles:** the rock throw x1.5 with Part 4 held [L2 M5].
- **Absent under Hyper:** the Exhausted idle [L0 M30] and the drool.
- **Tired:** a tired idle of his own and drool c 1104 (timer 4200); none of his clip effects are gated by state [L0 M30]
  (states-em032_00.md 5.5; dev/em032_00-effects-spec.md 1).
- **States:** rage adds the angry overlay (group 4) and swaps the eye mesh for the whole rage [L0 M27, L2 M6]. The Ground
  control picks his rock-throw shell modes [L2 M5] (motion-states.js RAGE_PARTS; dev/em032-shells-spec.md 8.3).
- **Controls:** State, Hyper, Flashed, Damage Table (Calm / Enraged).

### Grimclaw Tigrex (em032_04) -- variant of Tigrex
- **No Hyper version.**
- **Variant vs base:** every break needs three depletions (Tigrex: two for the head, one per foreleg); the foreleg break
  plays a knock-down chain Tigrex never takes [L3 M7-M12]. Rage swaps the whole body mesh instead of adding to it; the eye
  does not change. A "Death" material clip on his blood materials [L3 M6, L3 M18] (states-em032_00.md 0.2, 5.4, 7.3).
- **Variant vs base:** his own list 9 (20 clips) and shells -- volleys, a ground wave [L9 M15], enraged-only shell01 10
  (u 120) [L2 M10, L2 M15, L2 M16, L9 M4, L9 M12] (dev/em032-shells-spec.md 5d, 9.1).
- **Tired:** as Tigrex (timer 4200). On L9 M16 u 270 is calm-only and u 271 enraged-only, so a tired Grimclaw fires neither
  (states-em032_00.md 7.2).
- **Controls:** State, Flashed, Damage Table (Calm / Enraged).

## 8. Akantor (em033_00)
- **No Hyper version.**
- **Never tires:** bit 19 in his flag word, no stamina block, and (0, 2) is remapped to (0, 0); his drool is shipped but never
  asked for (motion-states.js em033_00 header; states-em033_00.md 6). No shock-trap or exhaust reaction (c 1105 / c 1109).
- **States:** the Tusks row breaks twice, one tusk at a time (u 1001 then u 1003) [L3 M9]. Rage adds the glowing spine
  (group 5) and an enraged tail piece; the Angry clips turn his eyes green -> orange; the overlay stays 60 frames after rage
  [L2 M4]. Tail cut swaps c 150 -> c 151 [L2 M3, L2 M21]. The body break swaps his hit-zone rows
  (motion-states.js em033_00; dev/em033_00-effects-spec.md 1).
- **Controls:** State (Normal / Enraged), Flashed, **Begins Burrowed** (L0 M2 then reads sunk and its c 71 does not fire;
  the burrow holds u 1121 [L0 M2 copy B]).

## 9. Nargacuga (em037_00)
- **Hyper parts:** Part 6 + Part 2 / Part 6 + Part 7 / Part 3 + Part 2 / Part 3 + Part 7. **No eye-glow record.**
- **Hyper speed:** Part 3 (ID 5) -- x1.4 [L2 M2, L2 M3], x1.3 [L2 M6], x1.2 [L2 M4, L2 M5], burst u 1315. Part 7 -- x1.2 [L0 M28],
  x1.1 [L0 M9, L0 M27, L0 M33-M38], no burst. Part 6 / Part 2 -- x1.1 and bursts u 1311 / 1312
  [L2 M9 / L2 M13]; ModifyData x1.15 on [L2 M9-M16]. 172 motion rows -- the most of any monster.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the Exhausted idle [L0 M30] and the drool.
- **Tired:** tired idle and drool while not enraged (timer 4800); tiredness gates no clip effect; eating restores stamina
  [L0 M24, L0 M30] (motion-states.js em037_00; dev/em037_00-effects-spec.md 2).
- **States:** the tail severs only while enraged or tired. Rage: head and tail enraged sets; held eye trails u 1120 (head
  intact) / u 1121 (broken); no shared puff (motion-states.js RAGE_BY_LEVEL; states-em037_04.md 5.5).
- **Controls:** State, Hyper, Flashed, Damage Table (Calm / Enraged).

### Silverwind Nargacuga (em037_04) -- variant of Nargacuga
- **No Hyper version.**
- **Variant vs base:** rage shows on his head only (no group 13; his enraged tail sets equal the calm ones). Wings: a knock-down
  only on odd break levels [L3 M2]. His cut tail is his own silver model; the sever drops an extra item (content not read).
  Four shell classes Nargacuga lacks (tail blades, rising and falling spikes) and his own list 9; c 61 [L9 M6]
  (states-em037_04.md 10; dev/em037_04-shells-spec.md 0).
- **Tired:** as Nargacuga, timer 3600 (Nargacuga 4800) [L0 M30].
- **Controls:** State, Flashed, Damage Table (Calm / Enraged).

## 10. Ukanlos (em038_00)
- **No Hyper version.**
- **Never tires:** bit 19 (Akantor's flag word), no stamina block, no (0, 2) case; his common file has no c 1104
  (motion-states.js em038_00 header).
- **States:** the Jaw row breaks Cracked then Broken [L3 M9]. Rage shows nothing on the model (puff only; duration 3600).
  Tail cut: L2 M3's u 362 / c 72 / u 361 fire only with the tail on; u 350 is enraged-only [L2 M34]. He has a shock-trap
  reaction (Akantor does not) (motion-states.js em038_00; dev/em038_00-effects-spec.md 2).
- **Controls:** State (Normal / Enraged), Flashed, **Begins Burrowed** (he burrows with no effect).

## 11. Barioth (em042_00)
- **Hyper parts:** Part 0 + Part 7 / Part 0 + Part 3 / Part 2 + Part 7 / Part 2 + Part 3. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M5], x1.1 [L2 M1, L2 M2, L2 M6] (wind-ups x0.5-0.8), burst u 1311; Part 2 / Part 3 --
  x1.2 [L2 M4, L2 M8], x1.1 on several clips, some clips slowed to x0.7-0.8 [L2 M3, L2 M7, L2 M16], bursts u 1312 / 1313.
  Part 7 -- bursts u 1314 at G [L2 M9, L2 M10].
- **Hyper projectiles:** shell00 x1.05 below G, x1.2 at G, with Part 0 held [L2 M5, L2 M12].
- **Absent under Hyper:** nothing tired-only is recorded for him (his tired idle is also his combat idle).
- **Tired:** tired idle = his combat idle [L0 M2]; drool (timer 4800); a head depletion while tired plays another reaction
  [L3 M2]; several attacks swap to tired versions; no clip effect is tired-gated (states-em042_00.md 3.3, 5;
  dev/em042_00-effects-spec.md 4-5).
- **States:** rage swaps the eyeballs (Eye Color row, Blue / Red) and the Brow row's groups. The "Eye Effect" row ships but the
  game never turns it on. Tail cut stops u 200 / u 240 [L2 M8, L2 M9, L2 M10] (states-em042_00.md 4.2, 10.2).
- **Controls:** State, Hyper, Flashed.

## 12. Seregios (em077_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 3. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.5 after x0.6 [L2 M65, L2 M66], burst u 1311. Part 4 -- x1.2 [L2 M23], burst u 1312; Part 3 --
  x1.2 [L2 M36], u 1313. At G the Part 3 aura speeds [L2 M26, L2 M34, L2 M70] to x1.3 (Part 4 slows them to x0.8) with
  bursts; ModifyData Part 3 x1.2 at G [L2 M25, L2 M26, L2 M33, L2 M34].
- **Hyper projectiles:** none.
- **Absent under Hyper:** the Exhausted idle [L0 M14] and the drool.
- **Tired:** a tired idle of his own; drool with a rotation (timer 4800). A tired Seregios with the tail on fires none of
  u 200 / 201 / 230 [L2 M3, L2 M4, L2 M20] (states-em077_00.md 6; dev/em077_00-effects-spec.md 5).
- **States:** rage swaps the body; seven regions go erect (rage rows Snout, Body, Tail, Left / Right Wing, Head) [L0 M4]. Every
  break needs a second depletion. Tail cut swaps to u 202 / 203 / 231. Bladescale shells change with the cut tail, a broken
  hind leg (part 4), a broken head, and some only at G (dev/em077-shells-spec.md 1).
- **Controls:** State, Hyper, Flashed, Damage Table (Table 0 / 1).

## 13. Astalos (em081_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 2. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M20], x1.1 [L2 M22, L2 M47], burst u 1311 (also L2 M13). Part 3 / Part 2 -- x1.3
  [L2 M28 / L2 M27], bursts u 1313 / 1314 also on [L2 M38]; at G [L2 M52 / L2 M51] slow to x0.5 with a burst.
- **Hyper projectiles:** shell01 x1.3 at G only (Part 3 [L2 M28], Part 2 [L2 M27]).
- **Absent under Hyper:** the tired records (keys 211 / 213) [L2 M33-M35, L2 M48, L4 M22, L4 M29, L4 M48], the Exhausted idle
  [L0 M14], the drool.
- **Tired:** tired idle and drool (timer 3000); his attacks gain no charge while tired; with the crest uncharged, tired drops
  u 242 [L2 M20] (states-em081_00.md 5; effects-em081_00-charge.md 4.1; psl-mask.js em081_00).
- **States:** charge on crest, wings and tail -- Charging holds u 200 / 201 / 202 on 41 charging attacks; Fully Charged holds
  u 210 / 211 / 212 / 221 and fires u 220 once; a depletion on a charged part fires u 300 [L3 M1-M4, L3 M10]. Recharge
  [L3 M16, L2 M46]. Rage shows nothing on the model (puff u 1121) (motion-states.js CHARGE_EFFECTS; part-review.json).
- **Controls:** State, Hyper, Flashed, **Charge** (Uncharged / Charging / Fully Charged), Damage Table follows the charge.

### Boltreaver Astalos (em081_04) -- variant of Astalos
- **No Hyper version.**
- **Variant vs base:** three charge levels (0 / 2 / 4) to Astalos's two; he spawns at level 2 (the viewer opens at Uncharged).
  Charged holds u 200 / 201 / 202 and fires u 220; Overcharged holds u 230 / 231 / 232 / 241 and fires u 240. Rage charges him
  to level 4 [L0 M32]; a hit on a level-4 region drops it to 2 with u 310 [L3 M2-M4] (motion-states.js CHARGE_EFFECTS;
  states-em081_04.md 0).
- **Variant vs base:** his clip effects ignore charge (base word) and he has tired-only records u 211 / 213 / 253 / 320. His
  own beam [L9 M1, L9 M2, L9 M21, L9 M22], eight shell slots; hit zones switch by charge only (dev/em081_04-effects-census.md
  0-1; dev/beams/em081_04.md).
- **Tired:** going tired wipes all charge (charged meshes off, eye back to plain) -- not shown in the viewer; timer 2400
  [L0 M14] (states-em081_04.md 6.1, 9.5).
- **Controls:** State, Flashed, **Charge State** (Uncharged / Charging / Charged / Overcharging / Overcharged), Damage Table.

## 14. Deviljho (em043_00)
- **Hyper parts:** Part 0 + Part 4 / Part 0 + Part 5. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.1 [L2 M2-M8], x1.2 [L2 M11; L2 M41*G, L2 M42*G] (wind-ups to x0.5),
  burst u 1311 on 12 clips (the red glow on the breath is this burst [L2 M25]). Part 4 -- x1.2 [L2 M13, L2 M22], u 1312
  [L2 M22]. Part 5 -- x1.4 [L0 M6, L0 M10-M14, L0 M30-M32], no burst (and no ModifyData: Part 5 has none).
  ModifyData Part 0 x1.1 on 13 clips [L0 M14, L2 M1-M12, L2 M22; L2 M43*G, L2 M45*G].
- **Hyper projectiles:** with Part 0 held, shell04 x1.3 [L2 M25, L2 M26; shell55 L2 M41*G, L2 M42*G].
- **Absent under Hyper:** the tired-and-calm c 90 / c 91 on 15 clips [L2 M1-M11, L2 M16, L2 M17, L2 M27, L2 M32], the Exhausted
  idle [L0 M15], the drool.
- **Tired:** tired idle [L0 M15], drool; c 90 / c 91 fire only tired and calm; his speed never changes with tiredness
  (states-em043_00.md 2.3, 6; dev/em043_00-effects-spec.md 2).
- **States:** rage turns on three red body groups (Angry_Start, 200 f) and swells two joints over 12 frames; the red stays
  through the 200-frame fade. Head break plays [L3 M9] calm, [L2 M9] enraged. Breath: one mode, a 1000-long beam with u 60.
  Tail-on attacks c 120..125 stop after the sever (states-em043_00.md 1-3; shells.js DEVILJHO).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**, Damage Table (Calm / Enraged).

### Savage Deviljho (em043_05) -- variant of Deviljho
- **No Hyper version.**
- **Variant vs base:** swollen and lit all his life (Angry_Start at spawn, swell held to death); his rage clip is
  Gekikou_Start / End (60 f) and adds the "Enraged Effect" row's group 12. Rage aura u 30 and eyes u 31 are Savage-only
  (the eyes stop asleep); no rage puff (states-em043_00.md 1.1-2.2; cenreport.py NR_REASON em043_00 31).
- **Variant vs base:** his own speeds (1.25 enraged / 1.15 calm / 1.0 tired); breath modes 1200 long (u 60) and 1700 long
  (u 70); enraged breath actions (7, 0x31 / 0x32) are his alone; head break always [L2 M9] (states-em043.md 1.5; shells.js).
- **Tired:** as Deviljho [L0 M15], c 90 / 91 tired and calm.
- **Controls:** State, Flashed, **Begins Burrowed**, Damage Table (Calm / Enraged).

## 15. Barroth (em044_00)
- **Hyper parts:** Part 0 + Part 4 / Part 0 + Part 5. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M4, L2 M12], x1.1 [L2 M1, L2 M10, L2 M11]; the charge-up clip slows to x0.7 [L2 M3];
  burst u 1311 on 7 clips. Part 4 -- x1.2 [L0 M3, L0 M4, L0 M6, L0 M20]. Part 5 -- x1.1, burst u 1314 [L2 M2].
- **Hyper projectiles:** shell00 x1.2 with Part 0 held [L2 M12, L2 M17].
- **Absent under Hyper:** the Exhausted idle [L0 M10] and the drool.
- **Tired:** tired idle [L0 M10], drool; a hind-leg knockdown while tired holds 480 frames (240 otherwise); no tired-only
  records (states-em044_00.md 6).
- **States:** mud, one bit per part, fully caked at spawn; each part depletion strips it (u 100..150); re-coat [L4 M3, L4 M7].
  Mud picks the slam effect: u 360 / 350 / 340 / none [L2 M12, L2 M13]. The head can break off as a second severed piece
  (u 901). Rage: nothing on the model (states-em044_00.md 0, 4.1, 11.3; dev/em044_00-effects-spec.md 2).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**; mud through the Parts rows (Head / Torso / Hands / Legs / Tail
  "Mud").

## 16. Uragaan (em045_00)
- **Hyper parts:** Part 0 + Part 6 / Part 2 + Part 6. Eye glow on Part 0 (u 1301). Part 2's aura has a x1.5 hardness bias.
- **Hyper speed:** Part 0 -- up to **x2** [L2 M1], x1.5 [L2 M10*G], x1.4 [L2 M5], x1.3 [L2 M13] (wind-ups x0.5-0.7), burst u 1311.
  Part 2 -- x2 [L2 M6], x1.3 [L2 M9] (wind-up x0.4), u 1312. Part 6 -- x1.3 [L2 M4], x1.2 [L2 M14], u 1313. 149 motion rows.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired forms on his boulder clips (u 280..283 in place of u 100..140) [L2 M2, L2 M3, L2 M10,
  L2 M21], the Exhausted idle [L0 M10], the drool.
- **Tired:** tired idle [L0 M10], drool (timer 4500); his boulder records u 100 / 110 / 120 [L2 M2] and u 130 / 140 [L2 M21]
  are skipped and u 280..283 stand in; tiredness swaps attack numbers at 27 sites (states-em045_00.md 6.0).
- **States:** rage shows only the puff. Chin breaks (u 1001), tail breaks then severs. The roll holds u 1400 [L0 M6]
  (states-em045_00.md 0, 5.2).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**.

### Crystalbeard Uragaan (em045_04) -- variant of Uragaan
- **No Hyper version.**
- **Variant vs base:** the Chin is a sever, not a break -- the beard drops (u 901). Beard on u 201 / u 230, beard cut u 240
  (his alone) [L2 M1, L2 M5, L2 M13, L2 M14]. Tail break needs level 2. His own list 9 [L9 M1-M3] and crystal shells.
  Rage threshold 350 (Uragaan 450), size 1.25. He never reads as sunk, so the roll's footfalls always show
  (states-em045_00.md 7.3; dev/em045_00-effects-spec.md 1-2; dev/em045-shells-spec.md 4).
- **Tired:** as Uragaan (timer 3600), same skipped boulder records.
- **Controls:** State, Flashed. No Begins Burrowed.

## 17. Duramboros (em055_00)
- **Hyper parts:** Part 0 + Part 5 / Part 0 + Part 7 / Part 4 + Part 5 / Part 4 + Part 7. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M4, L2 M10, L2 M11, L2 M16-M18, L2 M22], one slowed to x0.5 [L2 M15],
  burst u 1311. Part 5 / Part 4 -- x1.3 [L0 M3-M16], x1.2 [L2 M2, L2 M33]. Part 7 -- x1.3 [L2 M1, L2 M7, L2 M20,
  L2 M21, L2 M24], x1.2 on 7 more, burst u 1314 on 13 clips.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired-calm u 400 [L2 M25, L2 M32], the Exhausted idle [L0 M10], the drool.
- **Tired:** tired idle [L0 M10], drool; u 400 fires its tired-calm form (dev/states-em055_00.md 1; dev/em055_00-effects-spec.md 2).
- **States:** rage entry [L0 M11] with c 120; stun sided by hit direction [L3 M5 / L3 M6 chains]; roll holds u 1400 [L0 M6];
  slams hold u 100 [L2 M29, L2 M31, L2 M32]; tail sever needs break level 2 (dev/states-em055_00.md 3-6).
- **Controls:** State, Hyper, Flashed.

## 18. Brachydios (em063_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 6 / Part 2 + Part 3 / Part 2 + Part 6. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M2], x1.1 [L2 M14]; burst u 1311 only at G [L2 M14]. Part 2 / Part 3 --
  the wind-up slows (x0.5-0.8) then x1.2, bursts u 1312 / 1313 [L2 M12, L2 M13, L2 M17, L2 M18, L2 M29 / L2 M10, L2 M11,
  L2 M15, L2 M16, L2 M28].
- **Hyper projectiles:** none.
- **Absent under Hyper:** the Exhausted idle [L0 M14] and the drool.
- **Tired:** tired idle [L0 M14], drool; hind-leg knockdown 480 frames; no tired-only record (states-em063_00.md 5).
- **States:** rage is a gauge -- the slime turns red ~10 frames after the roar and stays up to 30 after (the viewer shows
  the two steady states). Spent-fist records c 130 / 140 (right) and c 131 / 141 (left) are Brachydios-only. Calm fists leave
  a 300-frame pool, enraged ones explode at once (u 50), a Depleted arm makes nothing (states-em063_00.md 2.2;
  dev/em063_00-effects-spec.md 1, 5a).
- **Controls:** State, Hyper, Flashed, **Begins Burrowed**; Left / Right Pounder rows (Depleted / Primed / Enraged / Broken).

### Raging Brachydios (em063_05) -- variant of Brachydios
- **No Hyper version.**
- **Variant vs base:** the rage toggle is **Red Slime**; the roar turns all four slime parts Red [L0 M15 f158]. Each part
  (horn, both Pounders, tail) runs its own Yellow / Red cycle (2700 f); a hit on a Red part shows warning u 200 + slot for 30
  frames, then the eruption u 210 (board "RAGING BRACHYDIOS, 2026-09-16"; dev/em063_00-effects-spec.md 5-5b).
- **Variant vs base:** no slime gauge -- an Angry glow-mesh ladder instead. No arm-slime records (c 140 / 141 never fire).
  Pools last 150 frames (300); his own records u 100 / 110 / 111 / 130 / 131 / 210 (states-em063_00.md 2.5; cenreport.py).
- **Tired:** as Brachydios [L0 M14].
- **Controls:** State (Normal / Red Slime / Exhausted), Flashed, **Begins Burrowed**, Damage Table (Yellow / Red Slime),
  **Slime click** on parts (a click hits the part under the pointer; the viewer re-arms after 60 frames, the game 2700).

## 19. Glavenus (em080_00)
- **Hyper parts:** Part 0 + Part 6 / Part 5 + Part 6. Eye glow on Part 0 (u 1301; his brow can hide it).
- **Hyper speed:** Part 0 -- x1.3 [L2 M1, L2 M15] (wind-ups to x0.5), bursts u 1311 [L2 M1, L2 M27]. Part 6 -- bursts u 1312
  [L2 M2, L2 M11]; at G x1.4 [L2 M14], x1.3 [L4 M11] and ModifyData x1.2 [L2 M14, L4 M10, L4 M12]. Part 5 has no motion entry.
- **Hyper projectiles:** shell03 x1.3 with Part 6 held, both ranks [L2 M2, L2 M11].
- **Absent under Hyper:** the tired-calm u 220 [L2 M9, L2 M10, L2 M55, L2 M57], the Exhausted idle [L0 M8], the drool.
- **Tired:** tired idle [L0 M8], drool; u 220 only tired and calm; tiredness puts a lit throat out at the next action
  (not shown) (states-em080_00.md 5; dev/em080_00-effects-spec.md 2.3).
- **States:** heat gauge from 50 -- hot at 100+ (extra tail groups, heat_Loop, held u 200), dulled at 0 or less; [L2 M16 f190]
  re-sharpens; throat lit by [L2 M8], put out by [L3 M11]. The heat picks one effect form per play on tail and throat attacks.
  Tail sever only while hot and already broken (states-em080_00.md 0, 3).
- **Controls:** State, Hyper, Flashed, **Tail State** (Sharpened / Dulled / Heated), Throat (Normal / Heated) in Parts.

### Hellblade Glavenus (em080_04) -- variant of Glavenus
- **No Hyper version.**
- **Variant vs base:** no heat gauge -- hot and throat-lit from spawn, never dull. He overheats instead, each held 5400 f:
  tail at [L2 M16 f190] ("Blasted"), throat at [L2 M8] (Throat "Blasted"). Rage moves nothing on his model. Tail sever is
  ungated. His own list 9 (14 clips) and shells. Forms that never fire for him: u 202, u 233 / 234 / 236, u 250 and every
  dull / unlit form (states-em080_04.md 0; cenreport.py ACCEPTED_A).
- **Never tires:** bit 19 in his flag word; the only TIRED_DROOL monster removed for it (motion-states.js TIRED_DROOL
  comment; rom-map "The MOTION_STATES `tired` rows against the ROM"). states-em080_04.md still shows a drool row: outdated.
- **Controls:** State (Normal / Enraged), Flashed, **Tail State** (Blasted / Heated), Throat (Normal / Heated / Blasted).

## 20. Yian Kut-Ku (em008_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 3. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.4 [L2 M9, L2 M24], x1.3 [L2 M4, L2 M5, L2 M23], burst u 1311. Part 4 / Part 3 -- bursts u 1312 /
  1313 [L2 M2], x1.15 at G.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired-calm u 220 on his fireball clips [L2 M1, L2 M2, L2 M3], the Exhausted idle [L0 M14], the drool.
- **Tired:** own tired idle [L0 M14], drool (timer 3600); the fireball clips fire u 220 in place of u 200 [L2 M1-M3]
  (states-em008_00.md 5; dev/em008_00-effects-spec.md 2).
- **States:** rage shows nothing on the model (puff u 1121, 1.2x). One break: the head at level 2 [L3 M1]. Weakened, his
  noticed-you clip changes [L0 M5 -> L0 M6] (states-em008_00.md 10).
- **Controls:** State, Hyper, Flashed. The "Ears" row is a mesh toggle; the game's ear rotation is not driven.

## 21. Gypceros (em009_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 3. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.3 [L2 M23, L2 M24, L4 M7, L4 M9], bursts u 1311 (also L2 M9). Part 4 -- x1.3 [L4 M13], u 1312.
  Part 3 -- x1.3 [L4 M4], u 1313.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired-calm u 220 [L4 M4, L4 M6, L4 M49], the Exhausted idle [L0 M14], the drool.
- **Tired:** tired idle [L0 M14], drool (timer 5400); u 220 in place of u 200 [L4 M4, L4 M6], u 220 tired-only [L4 M49]
  (states-em009_00.md 6).
- **States:** plays dead at HP 30% or less [L4 M11 -> L4 M12 -> L4 M10] (puff, drool and crest glow off meanwhile). The crest
  flash u 320 / 321 stops once the crest breaks [L4 M3, L4 M8, L4 M25]. Rage: the Enraged Eye Glow row and the Angry crest
  material; enraged attacks add u 280 [L4 M7, L4 M9] (states-em009_00.md 0, 5; dev/em009_00-effects-spec.md 1).
- **Controls:** State, Hyper, Damage Table (Table 0 / 1). No Flashed switch (flash-immune).

## 22. Velocidrome (em014_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M33], drool (timer 4500); nothing else -- no tired-gated record (states-em014_00.md 5).
- **States:** rage shows only the puff [L0 M9]. Head breaks at level 3 (u 1002) [L3 M15]. No shells.
- **Controls:** State, Flashed.

## 23. Gendrome (em015_00)
- **No Hyper version.**
- **Tired:** as Velocidrome [L0 M33], drool; no tired-gated record.
- **States:** Velocidrome's class; differs only in data (durability, his own puff and break records); no shells
  (states-em014_00.md 11).
- **Controls:** State, Flashed.

## 24. Iodrome (em016_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M33], drool; four attacks swap to tired forms; tired-calm u 220 in place of u 200 [L4 M1-M4]
  (states-em014_00.md 1.5, 11).
- **States:** the only drome whose head break (level 3) changes his attacks. Spit and lob shells [L4 M1, L4 M2, L4 M3]
  (dev/em014-shells-spec.md 1).
- **Controls:** State, Flashed.

## 25. Yian Garuga (em018_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 3 / Part 7 + Part 4 / Part 7 + Part 3. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.3 [L4 M7, L4 M9, L4 M64, L4 M79], burst u 1311. Part 7 -- x1.3 [L2 M12, L4 M65, L4 M77], one
  slowed to x0.8 [L4 M76], burst u 1314. Part 4 / Part 3: no motion entry.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired-calm u 220 on the fireball clips [L4 M51, L4 M52, L4 M67, L4 M68, L4 M70, L4 M71], the
  tired record (key 350) [L4 M29], the Exhausted idle [L0 M14], the drool.
- **Tired:** tired idle [L0 M14], drool (timer 2100); the fireball clips fire one record (u 220) instead of three
  (u 201 / 202 / 212) (states-em018_00.md 5; dev/em018_00-effects-spec.md 2).
- **States:** rage shows only the puff (u 1121). Breaks: head (two rungs), body, wings; the tail severs only. Tail cut swaps
  u 560 -> u 580 [L2 M12], u 380 / 381 -> u 400 / 401 [L4 M65, L4 M77] (states-em018_00.md 0).
- **Controls:** State, Hyper, Flashed.

### Deadeye Yian Garuga (em018_04) -- variant of Yian Garuga
- **No Hyper version.**
- **Variant vs base:** one class; he adds his own list 9 (18 clips), shells and u file. A lifelong head effect u 30 (stops
  asleep or dead). His tail breaks as well as severs -- intact / broken / cut; broken forms u 570 [L2 M12], u 390 / 391
  [L4 M65, L4 M77]; the cut needs level 4 (states-em018_00.md 7.1-7.6).
- **Variant vs base:** bits 27-29 on L0 M7 are Deadeye-only: u 290 and u 531, the clip starting at f18 [L0 M7 copy B]
  (cenreport.py ACCEPTED_A em018_00 u 290). Rage threshold 300 (Garuga 400).
- **Tired:** identical to Garuga [L0 M14].
- **Controls:** State, Flashed, Damage Table (Table 0 / 1); his tail break from the Parts panel.

## 26. Giadrome (em034_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M33], drool; four attacks swap to tired forms; tired-calm u 220 in place of u 200 [L4 M1-M4, L4 M10]
  (states-em014_00.md 1.5, 11).
- **States:** shells [L4 M1, L4 M2, L4 M3]; the head break does not change his attacks.
- **Controls:** State, Flashed.

## 27. Malfestio (em079_00)
- **Hyper parts:** G: Part 3 + Part 2 / Part 3 + Part 4; below G: Part 2 + Part 4 / Part 3 + Part 4 (the files group Part 2
  differently). **No eye-glow record.**
- **Hyper speed:** Part 2 (ID 1) -- x1.4 [L2 M14]; Part 3 -- x1.4 [L2 M15], x1.2 [L2 M46*G, L2 M48*G]; both x1.1 [L2 M2, L2 M5,
  L2 M7, L2 M26]; Part 4 -- x1.4 [L2 M12, L2 M35], one slowed to x0.7 [L2 M34]. Bursts u 1311 / 1312 / 1313 on the same clips.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired record (key 130) [L2 M12], the Exhausted idle [L0 M14], the drool.
- **Tired:** tired idle [L0 M14] (timer 4800); eye set 4 adds group 7 (it shows on the model); drool; c 130 fires calm or
  tired, not enraged [L2 M12] (states-em079_00.md 5).
- **States:** Hypnosis turns on the "Hypno Effect" part [L2 M16-M19]; the dives the "Torso" parts [L2 M20-M25]. Rage lights the
  eyes; shockwaves u 20 / 21 only on enraged forms (dev/em079-hypnosis-and-gaps.md 1, 3).
- **Controls:** State, Hyper, Flashed.

### Nightcloak Malfestio (em079_04) -- variant of Malfestio
- **No Hyper version.**
- **Variant vs base:** the cloak -- stealth materials and clips only in his files; it cancels at every death. u 361 only under
  (7, 0xcc / 0xcd) [L1 M27]; his own shell00 blades [L1 M27 f8, L9 M4 f74]; two reactions of his own [L3 M4 -> M6 -> M8]; his
  own model (1.2x) and break records (states-em079_04.md 0, 3, 7).
- **Tired:** as Malfestio; u 100 is held while tired **and** cloaked (states-em079_04.md 5).
- **Controls:** State, Flashed, **Cloaked** (working name: drives u 100 and the cloaked-death u 200; the stealth look itself
  is not drawn).

## 28. Great Maccao (em085_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M18], drool (timer 3600); no tired-gated record; (7, 0x60) becomes (7, 0x65); no Maccao call
  (states-em085_00.md 5).
- **States:** [L0 M21] fires c 111, or c 118 + c 112 (map 1 area 7 only; the viewer alternates). Crest or tail break knocks
  him over; a broken tail remaps three attacks [L2 M31]; at G the tail break fires nothing. Rage: nothing on the model
  (dev/em085_00-effects-spec.md 1, 3; motion-states.js em085_00 header).
- **Controls:** State, Flashed.

## 29. Zinogre (em057_00)
- **Hyper parts:** Part 0 + Part 7 / Part 4 + Part 7 / Part 3 + Part 7. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 7 -- up to x1.8 [L2 M30], x1.5 [L2 M15, L2 M18], slowed x0.8 [L2 M17, L2 M20], burst u 1314. Part 0 --
  x1.5 [L2 M31, L2 M32], x1.3 [L2 M22], u 1311. Part 4 / Part 3 -- x1.3 [L2 M39], u 1312 / 1313 [L2 M26, L2 M39, L2 M43 / M44].
- **Hyper projectiles:** **x3 size** (shell18, the biggest Hyper scale) with Part 0 held [L2 M31, L2 M32].
- **Absent under Hyper:** the tired forms of the records u 200 / 201 / 202 / 290 / 440 [L0 M20, L2 M1, L2 M2, L2 M15, L2 M18,
  L2 M42] (the same records fire when he is not tired, so nothing visible is lost), the Exhausted idle [L0 M10], the drool.
- **Tired:** tired idle [L0 M10], drool (timer 3600); he cannot tire while charged and charging cures it; his tired-calm
  bindings name the same records as calm (states-em057_00.md 5.7).
- **States:** charge gauge -- tier 2 (50-74) holds u 30, tier 3 (75+) u 31, fully charged and calm u 32, charged and enraged
  none; dropping off the charge fires u 90; charged forms add bits 27-31; a charged death fires u 650 / 651
  (dev/em057-effects-spec.md 10).
- **Controls:** State, Hyper, Flashed, **Charge State** (Normal / Charging / Fully Charged), **Gauge Tier 3** (u 30 -> u 31),
  Damage Table.

### Thunderlord Zinogre (em057_04) -- variant of Zinogre
- **No Hyper version.**
- **Never tires:** bit 19 in his flag word and no stamina block -- no drool, no Exhausted (cenreport.py ACCEPTED_A em057_04
  c 1104).
- **Variant vs base:** uncharged-calm he holds u 42, charged-calm u 32, enraged none; no gauge tier, so u 30 / u 31 never fire.
  His base body already looks charged; charging swaps group 30 for 40 + 41. At G his word clears the enraged bits (u 220 /
  221 and the shared puff only below G; his own puff u 250 at 1.2x at G). His list 9: u 90 [L9 M1, L9 M5], u 280 [L9 M2]; own
  shells (dev/em057-effects-spec.md 10-11; states-em057_00.md 7.3).
- **Controls:** State (Normal / Enraged), Flashed, **Charge State** (Charged / Overcharged; no uncharged rung).

## 30. Congalala (em021_00)
- **Hyper: G rank only** (the below-G file is empty). Parts Part 0 + Part 4 / Part 1 + Part 4. Eye glow on Part 0 (u 1301).
- **Hyper speed (G):** Part 1 -- x1.3 [L2 M11], x1.1 [L2 M2], burst u 1312 [L2 M1, L2 M10, L2 M13, L5 M28]. Part 0 -- wind-ups
  slowed (to x0.2) [L2 M7, L2 M16], burst u 1311. Part 4 -- bursts u 1313 [L0 M20, L2 M5, L5 M12, L5 M14]. ModifyData: Part 0
  x1.1 / x1.2 [L0 M8 / L0 M10, L0 M14]; Part 4 **x0.8** (slower) [L5 M12, L5 M18].
- **Hyper projectiles (G):** the gas breath shell04 x1.35 with Part 0 held [L2 M7, L2 M16]; with Part 4 held shell01 x1.5
  [L5 M12] and shell00 x1.75 [L0 M20, L2 M5, L5 M14].
- **Absent under Hyper:** the tired-only u 240 / u 241 (the gas-less breath) [L2 M5, L2 M7], the Exhausted idle [L0 M40], the drool.
- **Tired:** tired idle [L0 M40], drool; tired turns his gas attack into (7, 0x3b); tired-only u 241 [L2 M5], u 240 [L2 M7]
  (states-em021_00.md 6; rom-map `0xdcee10`).
- **States:** rage is a nose material only. Eating heal u 500 [L0 M43]. Pitfall: enraged at the end of the hold he makes a gas
  cloud [L3 M14] (motion-states.js CLASS_TIMERS em021_00; shells.js "THE PIT").
- **Controls:** State, Hyper, Flashed, **Gas Type** (None / Gas 1-4: his breath's gas u 200..203 [L2 M16]), **Charges**
  (5..0: 2+ left u 130..160, the last u 300..330), Damage Table (Normal / Belly Pump); the Items row (what his tail holds,
  c 150..153 [L0 M25]).

## 31. Blangonga (em022_00)
- **Hyper parts:** Part 1 + Part 2 (one pair). **No eye-glow record.**
- **Hyper speed:** Part 1 -- x1.2 [L2 M2, L2 M22], some slowed (x0.5-0.7) [L2 M1, L2 M21], burst u 1311. The pair together --
  x1.5 [L2 M4], and at G x1.3 [L4 M7] and more; bursts u 1311 + u 1312 [L2 M3; L4 M6*G, L4 M9*G].
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired-only u 230 [L2 M8], the Exhausted idle [L0 M35], the drool.
- **Tired:** own tired idle [L0 M35], drool (timer 3600); no model change; tired-only u 230 [L2 M8] (states-em022_00.md 5).
- **States:** Teeth break (level 2) stops the Blango summon for good and turns off c 120 on the roar and howl [L0 M32,
  L0 M33]. Tail break takes the tip off (no sever). Snow dive: u 60 at his position [L0 M20 copy B]
  (dev/em022_00-effects-spec.md 1).
- **Controls:** State, Hyper, Flashed, Damage Table (Table 0 / 1). No Begins Burrowed.

## 32. Rajang (em023_00)
- **Hyper parts:** G: Part 0 + Part 1 / Part 0 + Part 2; below G: Part 1 + Part 2 only (Part 0's aura is G only). Eye glow on
  Part 0 (u 1303) -- so only at G.
- **Hyper speed:** Part 1 (and Part 2 at G) -- x1.5 [L2 M34], x1.3 [L2 M4, L2 M28, L2 M36, L2 M37], x1.2 [L2 M15, L2 M25], some
  slowed to x0.7-0.9 [L2 M3, L2 M5, L2 M18, L2 M19, L2 M22, L2 M23], bursts u 1311 / 1312. Part 0 (G) -- the beam clips start
  slowed (to x0.1) then x1.1 [L2 M8, L2 M9, L2 M10, L2 M12, L2 M20, L2 M21], burst u 1313.
- **Hyper projectiles (G, Part 0 held):** the beam x1.5 (look and hit radius; reach unchanged) [L2 M8, L2 M20, L2 M21]; shell00
  x1.3 [L2 M8, L2 M12].
- **Absent under Hyper:** the tired-only u 310 [L2 M8, L2 M20, L2 M21], the Exhausted idle [L0 M17], the drool.
- **Tired:** tired idle [L0 M17], drool (timer 2400); tired ends rage (mane and tail calm, arms leave Armor Mode); the beam
  lights no u 291; tired-only u 310; the exhaust c 1109 fires [L3 M2] (states-em023_05.md 6; dev/em023-effects-spec.md 1).
- **States:** rage swaps mane, hairline and tail sets and scales the mane joint; aura c 0 at rage start; no rage puff.
  Armor Mode (Pump Up) [L2 M24], 3600 frames, held only while enraged; c 30 when it ends. Horns break one then both;
  the tail sever ends his rage for good (motion-states.js em023_00; CLASS_TIMERS em023_00).
- **Controls:** State (Normal / Enraged / Armor Mode / Exhausted), Hyper, Flashed, Damage Table.

### Furious Rajang (em023_05) -- variant of Rajang
- **No Hyper version.**
- **Never tires:** no stamina block and bit 19 in his flag word -- no L0 M17, no drool, u 310 never fires, no exhaust c 1109
  (cenreport.py em023_05 c 1104 / u 310 / c 1109).
- **Variant vs base:** permanently enraged in look from spawn (mane, hairline, short tail forced); the real rage flag drives
  only the aura c 0, the puff and the mane scale. He keeps the rage puff u 1121 (Rajang has none). Armor Mode holds whether
  enraged or not. The tail sever shows nothing. Break records 0.8x (Rajang 0.7x) (states-em023_05.md 0, 4.4, 10).
- **Controls:** State (Enraged / Armor Mode), Flashed, Damage Table.

## 33. Bulldrome (em030_00)
- **No Hyper version.**
- **Tired:** own tired idle [L0 M15], drool (timer 7200); two attacks slow to a 0.8 rate (which two: not read); no tired-only
  record (states-em030_00.md 5).
- **States:** his model never changes (no breaks, no sever, eyes never shut). The dig charge holds u 1400 [L0 M5];
  u 0 at f143 [L0 M23] (dev/em030_00-effects-spec.md 3).
- **Controls:** State, Flashed.

## 34. Arzuros (em060_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M3] (shared with other actions), drool (stamina 5400); no tired-only record
  (dev/em060-effects-spec.md 2).
- **States:** Arms break at level 1, no record. Rage roar [L0 M13]. Burrow sink drawn 1000 below ground [L0 M1, L0 M4, L0 M8,
  L0 M9]. No shells.
- **Controls:** State, Flashed, **Begins Burrowed**, Damage Table (Table 0 / 1).

### Redhelm Arzuros (em060_04) -- variant of Arzuros
- **No Hyper version.**
- **Variant vs base:** Hair breaks (level 2, u 1001); Arms break at level 2. Redhelm-only c 60 on the roar [L0 M13, L0 M17].
  His list 9: a thrown shot with u 30 [L9 M9], a slam that makes a ground shell [L9 M1, L9 M10], and at G u 320 on the slam
  [L9 M1]. u 120 draws only on some ground types [L0 M22] (dev/em060-effects-spec.md 1, 3; cenreport.py em060_00 c 60).
- **Tired:** as Arzuros.
- **Controls:** State, Flashed, **Begins Burrowed**.

## 35. Lagombi (em061_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M34 -> L0 M15], drool on joint 5 (timer 7200); no tired-only record (states-em061_00.md 0, 7.3).
- **States:** the Ears row is his only break (level 1, u 1000). Rage: puff only. A "stance" byte picks alternate clips (no
  control). Snowball shell; u 30 at f217 [L0 M32]; c 10 never fires on Lagombi [L0 M2, L0 M52].
- **Controls:** State, Flashed.

### Snowbaron Lagombi (em061_04) -- variant of Lagombi
- **No Hyper version.**
- **Variant vs base:** bigger (1.35 vs 1.1) and tougher; tired timer 3600 (7200); the Ears break also removes group 102.
  Snowbaron-only c 10 [L0 M2, L0 M52] and u 302 [L2 M57]. He places, rolls, lifts and throws snow lumps [L9 M2, L9 M3, L9 M10,
  L9 M11] (states-em061_00.md 7.2-7.3; cenreport.py em061_00 c 10; dev/em061-shells-spec.md 3).
- **Tired:** as Lagombi, timer 3600.
- **Controls:** State, Flashed.

## 36. Volvidon (em062_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M3] (shared), drool (stamina 7200); u 220 in place of the calm u 201 [L2 M28, L2 M37]
  (dev/em060-effects-spec.md 2; CLIP_EFFECTS em062_00).
- **States:** Arzuros's class. The Back breaks (level 1, u 1000). Burrow sink drawn; [L0 M22] is the emerge. Shells [L2 M28,
  L2 M37].
- **Controls:** State, Flashed. No Begins Burrowed.

## 37. Kecha Wacha (em065_00)
- **Hyper parts:** Part 0 + Part 5 (one pair). Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.1 after a x0.6 wind-up, burst u 1311 [L2 M77, L2 M78, L2 M80, L2 M117]. Part 5: none.
- **Hyper projectiles:** his water shots x1.2 with Part 0 held [L2 M77, L2 M78, L2 M80, L2 M117].
- **Absent under Hyper:** the tired u 211 on the same shots (u 210 stays) [L2 M77, L2 M78, L2 M80, L2 M117], the drool.
- **Tired:** tired idle [L0 M38] (shared), drool (stamina 5400); u 211 in place of the calm u 210 on his water shots
  (dev/em065_00-effects-spec.md).
- **States:** head breaks (level 2, u 1001); parts 2 and 5 at level 1, no record. His head sets and the "Enraged Effect" (Ear
  Effect) row follow rage. Floor records c 210..240 draw on Ground B only.
- **Controls:** State, Hyper, Flashed.

## 38. Gammoth (em083_00)
- **Hyper parts:** Part 1 + Part 2 / Part 1 + Part 3 / Part 0 + Part 2 / Part 0 + Part 3. **No eye-glow record** (Part 0's aura
  is a x1.5 hardness bias).
- **Hyper speed:** Part 1 -- x1.3 [L2 M13, L2 M16], x1.1 [L2 M11], some slowed [L2 M5, L2 M19, L2 M29], burst u 1311. Part 0 --
  x1.4 [L2 M82, L2 M83], slowed [L2 M80, L2 M81], u 1312. Part 2 -- x1.5 [L2 M1], u 1313. Part 3 -- x1.5 [L2 M2], u 1314.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired record (key 25) [L0 M33], the Exhausted idle [L0 M15], the drool.
- **Tired:** tired idle [L0 M15], drool 2x (timer 5000); nothing on the model; no tired-only clip record (motion-states.js
  em083_00).
- **States:** snow on four legs and the tail (Parts rows: Full / Partial / No / Animated Snow / Broken); knock-off one limb per
  play [L3 M1]; stomps shed snow u 60 / 61; head breaks at levels 2 and 3. Her snowball splits only at G
  (dev/em083-shells-spec.md 2, 6).
- **Controls:** State, Hyper, Flashed; the snow Parts rows.

### Elderfrost Gammoth (em083_04) -- variant of Gammoth
- **No Hyper version.**
- **Variant vs base:** the ice sits on the front legs and trunk (not four legs and tail); Parts rows Front Left / Front Right
  Leg and Trunk. Rear legs cannot break; the trunk breaks through the ice (u 1050 / 1051); trunk-snow shell u 62 is his.
  Ice back on [L0 M29 -> M30; L0 M32]. His own list 9 (23 clips): u 511 or u 220 [L9 M16], u 120 held and u 140 [L9 M16,
  L9 M17]. Rage threshold 800, duration 7200; his snowball splits at every rank (states-em083_04.md 11; dev/em083-effects-spec.md 1-2).
- **Tired:** identical to Gammoth.
- **Controls:** State, Flashed; the ice Parts rows.

## 39. Plesioth (em010_00)
- **Hyper parts:** Part 0 + Part 7 / Part 6 + Part 7. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M4; L2 M1 x1.25*G], some clips slowed (to x0.2-0.6) [L2 M3, L2 M16], burst u 1311.
  Part 6 -- x1.2 [L2 M2], u 1312. Part 7 -- x1.2 [L2 M8], slowed [L2 M9], u 1313.
- **Hyper projectiles:** none.
- **Absent under Hyper:** nothing tired-only is recorded (his tired idle is also his peaceful idle).
- **Tired:** tired idle = his peaceful idle [L0 M1]; drool (timer 3600); nothing on the model (states-em010_00.md 5).
- **States:** fin and wing breaks change the material's alpha test, not the mesh. Water states change nothing on the model;
  [L0 M18] copy A shallow, B deep (dev/em010_00-effects-spec.md 2). Flash: enraged never, calm on land only.
- **Controls:** State, Hyper, Flashed.

## 40. Cephadrome (em017_00)
- **No Hyper version.**
- **Tired:** own tired idle [L0 M14], drool (timer 5400); nothing else (states-em017_00.md 5).
- **States:** the sand states change only the hit-data row. [L4 M11] copy A fires c 60, copy B does not.
- **Controls:** State. Flash-immune.

## 41. Lavasioth (em036_00)
- **Hyper parts:** Part 6 + Part 4 / Part 6 + Part 7. Eye glow on Part 6 (u 1301).
- **Hyper speed:** Part 6 -- x1.3 [L2 M6], x1.2 [L4 M1*G], bursts u 1311 [L2 M6, L2 M10, L2 M11, L2 M14, L2 M15]. Part 4 --
  u 1312 [L2 M2]. Part 7 -- x1.3, u 1314 [L2 M13].
- **Hyper projectiles:** shell00 x1.3 with Part 6 held [L2 M6, L2 M10, L2 M12, L4 M1].
- **Absent under Hyper:** the Exhausted idle [L0 M39], the drool (and so the tired magma stop: the never-tired rule, not a hyper-attacks.md row).
- **Tired:** tired idle [L0 M39], drool (rotated); tired stops his magma (Magma_stop -- not shown in the viewer) and cancels
  his L4 M1 lava shells (states-em036_00.md 4, 6.5; piscine-shells-spec.md).
- **States:** u 60 held for the whole of (7, 0xf..0x14) / (6, 4 / 5) [L0 M30 B, L2 M10 B, L2 M11, L0 M18 B, L0 M16 B, L0 M21 C];
  the dive fires u 1120 [L0 M21 A / C]; L2 M14 fires u 241 above quest rank 4, else u 231 (dev/em036_00-effects-spec.md 2-4).
- **Controls:** State, Hyper. Flash-immune.

## 42. Lagiacrus (em046_00)
- **Hyper parts:** Part 0 + Part 6 / Part 0 + Part 3. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M1], slowed x0.9 [L4 M3, L4 M4], at G x1.3 [L4 M36], x1.2 [L4 M34, L4 M37], burst u 1311.
  Part 3 (ID 5) -- x1.3 [L4 M5], x1.2 [L2 M37, L4 M6, L4 M30-M33], slowed [L2 M4, L2 M36], burst u 1315. Part 6: ModifyData
  x1.1 [L2 M2] only. ModifyData Part 0 x1.1 [L4 M3, L4 M4; L4 M34-M36*G]. (Part 3 has no ModifyData entry.)
- **Hyper projectiles:** with Part 3 held -- shell00 x1.3 [L2 M36, L2 M37, L4 M6, L4 M15, L4 M30-M33]; shell01 x1.3
  below G, x1.1 at G [L4 M2, L4 M10]; shell26 **x2.5** below G, x1.5 at G [L4 M10]. With Part 0 held, shell01 x1.3 at G [L4 M36].
- **Absent under Hyper:** the tired records (keys 220 / 221) on [L2 M4, L2 M36, L2 M37, L4 M5, L4 M15,
  L4 M30-M33], the Exhausted idle [L0 M19], the drool.
- **Tired:** tired idle [L0 M19], drool (rotated; timer 4000); going tired empties his charge (u 30 stops; the viewer's
  Charged toggle does not follow); tired thunderballs' floor discharge takes mode 14 (states-em046_00.md 5;
  leviathan-shells-spec.md 1a).
- **States:** charge tier 99+ holds u 30 and lights bits 15-17 [L2 M3, L2 M7-M9]; the back-spine break caps it at 99. Rage
  shows nothing (puff u 1121). Cut tail. The dive chain holds u 300 / u 310 [L4 M34, L4 M37 A / B]
  (dev/em046_00-effects-spec.md 1, 3).
- **Controls:** State, Hyper, Flashed, **Discharge** (his Charged toggle).

## 43. Royal Ludroth (em047_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 5 / Part 4 + Part 3 / Part 4 + Part 5. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.2 [L2 M1, L2 M4, L2 M5, L2 M6], burst u 1311 [L2 M1]. Part 3 / Part 4 -- x1.1 [L2 M12, L2 M22 /
  L2 M11, L2 M23; L2 M7*G], bursts u 1312 / 1313. Part 5 -- x1.3, u 1314 [L2 M15].
- **Hyper projectiles:** none.
- **Absent under Hyper:** the Exhausted idle [L0 M9] and the drool (and so the tired mane shrink: the never-tired rule).
- **Tired:** tired idle [L0 M9], drool (timer 5400); tired, the mane shrinks to 70% and its hit capsule goes -- not wired in
  the viewer (states-em047_00.md 4.5, 5).
- **States:** rage turns his head frills (not wired). c 212 / 213 stop once the tail is cut [L2 M15]; L2 M7 fires c 183
  above quest rank 4, else c 182 (dev/em047_00-effects-spec.md 1-2).
- **Controls:** State, Hyper, Flashed.

## 44. Agnaktor (em049_00)
- **Hyper parts:** Part 0 + Part 6 / Part 0 + Part 2 / Part 3 + Part 6 / Part 3 + Part 2. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- bursts u 1311 on 10 clips at their own speed [L2 M1, L2 M4, L2 M11, L2 M13-M16, L2 M27, L2 M28,
  L2 M30], one slowed to x0.6 [L2 M14]. Part 6 -- x1.2 [L2 M5], x1.1 [L2 M3, L2 M25, L2 M26], u 1312. Part 3 / Part 2 -- x1.2 on
  [L0 M4-M10], no burst.
- **Hyper projectiles:** his beam **x1.6** (look and hit radius; reach unchanged) with Part 0 held [L2 M4]; shell01 x1.2 with
  Part 6 held at G [L2 M5].
- **Absent under Hyper:** the Exhausted idle [L0 M19] and the drool.
- **Tired:** tired idle [L0 M19], drool. The tired no-beam [L2 M12] heats chest and head; the tired L2 M30 is wired as the
  normal beam (dev/em049-heat.md 6; HEAT_CLIPS).
- **States:** heat -- the beam clips heat on their own (chest f0, head f100 [L2 M4, L2 M11, L2 M30]; all six regions
  [L2 M17, L2 M19-M21, L2 M24, L2 M27, L2 M28]); the viewer reverts at the clip end (the game holds 30 s, cools over 6 s). His
  L2 M2 / L2 M5 shells need heat, an intact part and G rank (dev/em049-heat.md 3-6; leviathan-shells-spec.md 3).
- **Controls:** State, Hyper, Flashed, **Heated** (on by default), **Beam heated**.

## 45. Nibelsnarf (em056_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 2. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.5 after x0.5 [L2 M9, L2 M10], u 1311. Part 3 -- x1.6 [L2 M16], x1.2 [L2 M25, L2 M35]; Part 2 --
  x1.6 [L2 M19], x1.2 [L2 M26, L2 M35]; both slow [L2 M18] to x0.8 with bursts u 1312 / 1313.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired tier of u 240 [L2 M17, L2 M21], the Exhausted idles [L0 M9, L0 M23], the drool.
- **Tired:** tired idle [L0 M9] (in the sand [L0 M23]), drool (timer 3600); his gill hit capsules become hittable
  (states-em056_00.md 5).
- **States:** sand camouflage is a material clip by map and area (requester not read). Swallow and stuck jaw are clips only
  [L3 M22 -> L3 M23]. In the sand the roar is [L0 M22] (states-em056_00.md 0, 2.2, 7).
- **Controls:** State, Hyper, Damage Table (Normal / Flailing). Flash-immune.

## 46. Mizutsune (em082_00)
- **Hyper parts:** Part 5 + Part 0 / Part 5 + Part 3. Eye glow on Part 0 (u 1303).
- **Hyper speed:** Part 5 -- x1.3 [L2 M42, L2 M89], bursts u 1311 also on [L2 M26, L2 M27, L2 M51, L2 M54]. Part 0 -- x1.1
  [L2 M2], wind-ups x0.65-0.8 then x1 [L2 M10, L2 M20, L2 M21, L2 M39], u 1313. Part 3: none.
- **Hyper projectiles:** shell12 (most modes) x1.2 with Part 0 held [L2 M10-M12, L2 M39-M41].
- **Absent under Hyper:** the Exhausted idle [L0 M9], the drool (and so the tired soap colour: the never-tired rule).
- **Tired:** tired idle [L0 M9], drool (timer 2500); the soap overlay turns blue (tired_Change) until he recovers; the bubble
  chooser returns none for the tired set and some throws are skipped (states-em082_00.md 5, 8; leviathan-shells-spec.md 5b).
- **States:** the same overlay turns red when enraged. Head breaks in two stages (u 1000, u 1002). Cut tail.
- **Controls:** State (Normal / Enraged / Exhausted) drives the soap overlay; Hyper; Flashed.

### Soulseer Mizutsune (em082_04) -- variant of Mizutsune
- **No Hyper version.**
- **Variant vs base:** **Soul Flame** -- lit by his rage roars: u 300 on his head, his word moves bits 24-26 -> 27-29, his
  bubbles swap to the lit modes (u 200 / 201 / 210); throws and ghost flames skipped (dev/em082-effects-spec.md 5). His own
  requests: u 310 held [L9 M1 B, L9 M5, L9 M6, L9 M8, L9 M9, L0 M4 C], u 320 / 330 / 321 at action start; ghost-flame shells.
  Grooming list 9 and the fur materials (Tail Fur / Arm Fur: Ungroomed / Groomed). One-stage head break; eyes never close;
  rage 1.0x (Mizutsune 1.15x); flash-immune (states-em082_00.md 12; flashed-state.md 3).
- **Tired:** as Mizutsune; tired also cancels some ghost flames and bubble modes (leviathan-shells-spec.md 5b, 5d).
- **Controls:** State (Normal / Enraged / Exhausted), **Soul Flame** (Off / On), the fur rows in Parts.

## 47. Tetsucabra (em066_00)
- **Hyper parts:** Part 0 + Part 4 / Part 0 + Part 5. Eye glow on Part 0 (u 1301).
- **Hyper speed:** Part 0 -- x1.5 [L4 M1, L4 M2, L4 M31], x1.1 [L4 M3, L4 M4, L4 M24-M27] (wind-ups x0.5-0.6), u 1311.
  Part 4 -- x1.7 [L4 M28], u 1312. Part 5 -- x1.7 [L4 M29], u 1313.
- **Hyper projectiles:** shell00 x1.2 with Part 0 held [L4 M1, L4 M2].
- **Absent under Hyper:** the tired record (key 580) [L2 M12], the Exhausted idle [L0 M14], the drool.
- **Tired:** tired idle [L0 M14], drool (timer 4200); his class never reads tiredness otherwise (states-em066_00.md 5.3).
- **States:** rage changes nothing. The dive holds u 1400 [L0 M7 B]. Broken tusks change the word on [L4 M7, L4 M17];
  [L4 M28, L4 M29] light bits 18-20 only above quest rank 4 (psl-mask.js em066).
- **Controls:** State, Hyper, Flashed, **Boulder** (None / Kind 1 / Kind 3: Kind 1 holds u 10 through the carry; Kind 3 holds
  nothing on him).

### Drilltusk Tetsucabra (em066_04) -- variant of Tetsucabra
- **No Hyper version.**
- **Variant vs base:** his own list 9; Kind 3 rock holds u 12 (2.3x wide) and drops with u 60 (Tetsucabra has neither);
  [L4 M28, L4 M29] light bits 18-20 at any rank; tougher, size 1.3 (dev/em066-effects-spec.md 5; states-em066_00.md 7.3).
- **Tired:** as Tetsucabra.
- **Controls:** State, Flashed, **Boulder** (None / Kind 1 / Kind 2 / Kind 3).

## 48. Zamtrios (em067_00)
- **Hyper parts:** Part 0 + Part 3 / Part 0 + Part 2. Eye glow on Part 0 (u 1303).
- **Hyper speed:** Part 0 -- x1.7 [L4 M59, L4 M60], x1.2 [L2 M12, L4 M10] (wind-ups to x0.2), u 1313. Part 3 -- x1.4 [L2 M10],
  x1.2 [L2 M8], u 1311. Part 2 -- x1.4 [L2 M9], x1.2 [L2 M7], u 1312.
- **Hyper projectiles (Part 0 held):** shell13 x1.3 [L2 M12, L4 M37]; the beam x1.1 below G, x1.3 at G [L4 M59, L4 M60].
- **Absent under Hyper:** the tired records (keys 470 / 471 / 580) [L2 M12, L4 M57, L4 M58, L4 M74], the Exhausted idle
  [L0 M14], the drool.
- **Tired:** tired idle [L0 M14] (Normal and Ice Armor only), drool (rotated; timer 3600); the command table picks other
  moves (states-em067_00.md 7).
- **States:** three forms -- the roar gives Ice Armor, (10, 0xaf) inflates / deflates, (1, 4) returns to Normal; inflate
  [L4 M2], deflate [L4 M3]; the Blob lasts 80 s (dev/em067-forms-spec.md 0, 2.2).
- **Controls:** State, Hyper, Flashed, **Form** (Normal / Ice Armor / Blob), Damage Table.

## 49. Najarala (em068_00)
- **Hyper parts:** Part 3 + Part 4 / Part 7 + Part 4. **No eye-glow record.**
- **Hyper speed:** every entry x1.3 after a x0.8 wind-up: Part 3 [L2 M50], Part 4 [L0 M104, L0 M105, L0 M114, L0 M115, L2 M17,
  L2 M18], Part 7 [L2 M48]; bursts u 1311 / 1312 / 1313. ModifyData x1.3 on the same attacks [L2 M17, L2 M18, L2 M48-M50].
- **Hyper projectiles:** none.
- **Absent under Hyper:** nothing tired-only is recorded (his tired idle is also a not-tired idle).
- **Tired:** tired idle [L0 M38], drool; tired cancels his scale throws [L2 M62, L2 M63] (snake-wyvern-shells-spec.md 1a).
- **States:** L2 M61's word follows part 2's break (Back Crests row). Burrowed [L0 M44 B] holds u 1400.
- **Controls:** State, Hyper, Flashed, Damage Table (Normal / Exhausted).

## 50. Nerscylla (em070_00)
- **Hyper: G rank only** (the below-G file is empty). Parts Part 1 + Part 0 / Part 1 + Part 3. Eye glow on the Part 0 aura
  (u 1301).
- **Hyper speed (G):** Part 0 -- x1.3 [L2 M84], bursts u 1311 on 9 clips (wind-ups to x0.3) [L2 M1, L2 M5, L2 M7, L2 M10, L2 M26,
  L2 M73, L2 M74, L2 M85, L4 M34]. Part 3 -- **x2** [L2 M46], x1.1 [L2 M30], u 1312 on 8 clips. ModifyData Part 0 x1.2 [L2 M6,
  L2 M84].
- **Hyper projectiles (G):** shell00 / shell13 **x1.6** with Part 3 held [L2 M13, L2 M31, L2 M41, L2 M57].
- **Absent under Hyper:** the tired records (keys 291 / 310 / 311 / 350) [L2 M30, L2 M40, L2 M41, L2 M57], the Exhausted idle
  [L0 M14], the drool.
- **Tired:** tired idle [L0 M14], drool; nothing else in the docs (dev/em070_00-effects-spec.md 3).
- **States:** Raven's "Web" row (part 13) is drawn for the whole of [L2 M6, L2 M7, L2 M10, L2 M26, L2 M84, L2 M85, L4 M34]. Rage
  draws the "Enraged Effect" row. Grabs hold u 34 [L2 M24, L2 M25, L2 M75, L2 M76 copy B] (dev/em070-part50-spec.md 0).
- **Controls:** State, Hyper, Flashed.

## 51. Ahtal-Ka (em088_00)
- **No Hyper version.**
- **Tired:** tired idle [L0 M13], drool; no model change (states-em088_00.md 5). Never tired while the fight's stage forces
  his rage (that block sets and clears bit 19; what the stage values mean is not read) (rom-map "P+0x1a8 bit 19 -- the class
  setters"; states-em088_00.md 4.2).
- **States:** rage changes no mesh; the eye material plays angry_start / loop / end; u 130 held while enraged, u 120 whenever
  alive; no rage puff; 1.12x. Webs light u 451 / u 452 [L2 M30]; threads u 340 / 341. Breaks: Face and Head [L3 M9 copy B],
  Tail and both Claws [L3 M2]. No shock-trap or pitfall reaction, no sever (dev/em088_00-effects-spec.md 3).
- **Combined list "Combined (with Ahtal-Neset)":** raises Neset and enters it, Neset falls, re-enters, Neset destroyed; silk
  u 400..410 / u 420 only there (dev/em088-em087-combined-spec.md 4-5).
- **Controls:** State, Flashed, **Carrying** (Nothing / Dragonator / Wheel / Frame on joint 130; feeds his word -- Dragonator
  bits 18-20, Wheel 21-23, Frame 15-17; "Wheel" / "Frame" are names by shape), Damage Table.

### Ahtal-Neset (em087_00) -- listed under Ahtal-Ka
- monsters.json has no name for em087_00; the viewer's picker and dev/effects-walk-order.md call it Ahtal-Neset.
- **No Hyper version.**
- **Tired:** not read yet -- whether it ever tires or enrages (dev/em088_00-effects-spec.md 4). No tired idle, no drool entry;
  the viewer offers no State row for it.
- **States:** breaks [L3 M6 (u 1015), L3 M9 (u 1020), L3 M1 (u 1014, nothing drawn)]; no sleep, paralysis, stun, sever or
  death case; flash-immune (dev/em087_00-effects-spec.md 3). Shells: sp_01, ground beam sp_58, mortar sp_48, rockets sp_59,
  sp_00 shots (dev/ahtal-neset-shells-spec.md 0).
- **Controls:** **Rockets** (Off / Rockets A (0-2) / Rockets B (3-5): three supply rockets fall at the next action start when
  none are out and the 90 s cooldown has run; Off fades the landed ones), **Point 0..6 destroyed** (each fires u 500 / 505 /
  510 / 515 / 520 / 600 / 605 once and sets the Webbed Pile / Cocoon rows) -- working labels (motion-states.js CLASS_CONTROLS
  em087_00, POINT087).

## 52. Daimyo Hermitaur (em019_00)
- **Hyper parts:** Part 6 + Part 2 / Part 6 + Part 3. **No eye-glow record.**
- **Hyper speed:** Part 6 -- x1.1 [L2 M2, L2 M4, L2 M10] (wind-ups to x0.3), u 1311. Part 2 -- x1.3 [L2 M25], x1.1 [L2 M15],
  slowed x0.7 [L2 M24], u 1312. Part 3 -- x1.5 [L0 M7, L0 M9, L0 M11], no burst.
- **Hyper projectiles:** none.
- **Absent under Hyper:** the tired beam failure -- the tired record (key 232) on [L2 M18, L2 M54] -- so a Hyper Daimyo never
  loses his beam; the Exhausted idles [L0 M24, L0 M31]; the drool.
- **Tired:** tired idle [L0 M31 -> L0 M24], drool; **the beam fails**: no beam at f96 of [L2 M18, L2 M54]; if the turn follows,
  it fires at the turn's first frame [L2 M57, L2 M55] (dev/beams/em019_00.md 1; states-em019_00.md 5).
- **States:** Skull Shell Cracked (u 1010) then Broken (u 1011) [L3 M1]; claws [L3 M2 -> M3]. Rage: nothing on the model, puff
  u 1121, 1.2x. Beam at G is the long mode 1 (u 10, 2100), below G mode 0 (u 0, 1200). u 1400 held [L0 M4]
  (states-em019_00.md 0, 4).
- **Controls:** State, Hyper. Flash-immune.

### Stonefist Hermitaur (em019_04) -- variant of Daimyo Hermitaur
- **No Hyper version.**
- **Variant vs base:** beam always mode 0 (u 0, length 2200) -- no G long beam. His own list 9: the slam throws a shell at
  f16 [L9 M11 -> M13]. Left Legs / Right Legs break. L2 M18 / M54 / M61 light bits 21-23 (Daimyo 15-17), so Daimyo's u 231
  never fires on him; bits 30-31 on [L2 M2, L2 M4, L2 M11]; L2 M6 / M8 follow the claw break (dev/em019-em020-effects-spec.md
  1; cenreport.py em019_04 u 231).
- **Tired:** tires (stamina 6000); idle [L0 M31 -> L0 M24]; the beam fails tired as Daimyo's.
- **Controls:** State. Flash-immune.

## 53. Shogun Ceanataur (em020_00)
- **Hyper parts:** Part 6 + Part 4 / Part 5 + Part 4. **No eye-glow record.**
- **Hyper speed:** Part 6 / Part 5 -- x1.3 [L2 M13], x1.2 [L2 M10 / L2 M9; L4 M3*G], x1.1 [L2 M14], slowed [L2 M12; L4 M1*G,
  L4 M2*G], bursts u 1311 / 1312 [L2 M10 / L2 M9, L2 M12; L4 M2*G]. Part 4 -- x1.4 [L2 M3].
- **Hyper projectiles:** none.
- **Absent under Hyper:** nothing tired-only is recorded.
- **Tired:** tires (stamina 5400); idle [L0 M31 -> L0 M24], drool; his skull beam has no tired test (dev/beams/em020_00.md 1).
- **States:** the skull beam [L2 M27 f50] fires only with shell type 3 (Raven's "Gravios Skull"); the skull is a weighted
  random pick by rank. Ceiling jump [L5 M2 -> L5 M7]; burrow [L2 M15, L2 M16] (motion-states.js SHELL_PARTS em020_00).
- **Controls:** State, Hyper. Flash-immune.

### Rustrazor Ceanataur (em020_04) -- variant of Shogun Ceanataur
- **No Hyper version.**
- **Variant vs base:** he alternates Gravios Skull and Glavenus Skull, so Shogun's skull beam never happens. Claws rusted or
  sharpened; a knocked-off claw and the skull type gate his word [L2 M68, L2 M69, L2 M11, L9 M9, L9 M10, L4 M3]. His own water
  beams [L9 M31, L9 M33 (150-degree sweep), L2 M74, L9 M20 f50]; the landing makes a shell [L9 M36] (dev/beams/em020_00.md 1, 5).
- **Tired:** tires (stamina 3600); every water beam needs him not tired -- the sweep still turns, with no beam.
- **Controls:** State; the Shell and Claw Parts rows are his word's inputs. "Sharpened Broken" is not a ROM state of his.

## 54. Seltas Queen (em069_00)
- **Hyper parts:** Part 2 + Part 6 / Part 2 + Part 7 / Part 4 + Part 6 / Part 4 + Part 7. Eye glow on Part 6 (u 1303).
- **Hyper speed:** Part 2 / Part 4 -- x1.7 [L4 M34], x1.3 [L4 M33], x1.2 [L4 M43], bursts u 1311 / 1312 [L4 M33, L4 M43]. Part 7 --
  x1.8 [L4 M36, L4 M37], x1.5 [L4 M39, L4 M69], x1.2 [L4 M70], u 1314. Part 6 -- **x2** at G [L4 M42], u 1313.
- **Hyper projectiles:** none.
- **Absent under Hyper:** nothing tired-only is recorded.
- **Tired:** her eyes go dark (Stamina_low_Start, 60 f; back with Stamina_low_End) -- no viewer handling found; drool; tired
  idle [L0 M14] (states-em069_00.md 0, 5).
- **States:** rage fades in the m03_add material (Angry_Start / Repeat / End), puff u 1121, 1.25x. "Combined (with Seltas)" list;
  while he is linked [L4 M71-M75] light bits 18-20. Coupling glow levels u 0 / 1 / 2 [L4 M66; L0 M1 copy B]. Seven single-level
  breaks; the tail breaks but never severs (dev/em069-duo-spec.md 0; motion-states.js queenLevel069).
- **Controls:** State, Hyper, Flashed.

### Seltas (em076_00) -- listed after Seltas Queen
- **No Hyper version.**
- **Tired:** tires (stamina 3000); drool; idle [L0 M14]. What else it changes: not read.
- **States:** on her back his claws are retracted (his riding attacks grow them [L4 M31, L4 M32]); glow group 8 on and ride_on
  plays when he couples; under her M78 / M79 he freezes rigid then drops off. Horn break [L3 M2] (u 1000)
  (dev/em069-duo-spec.md 0, 5, 15).
- **Controls:** State, Flashed.

## 55. Kirin (em011_00)
- **No Hyper version.** **Never tires** (no stamina block, no (0, 2) case, no c 1104; bit 19).
- **States:** lightning aura with no control -- calm u 0 every 40 frames, enraged u 61 every 32 and u 60 every 45; breaking the
  horn stops u 61 for good. Lightning strikes only on [L4 M7 copy C]. Horn break at level 2 (u 1001) [L3 M1]. Rage swaps hit-zone
  rows only (dev/em011_00-effects-spec.md 3; motion-states.js CLASS_TIMERS em011_00).
- **Controls:** State (Normal / Enraged), Damage Table (Calm / Enraged). Flash-immune.

## 56. Lao-Shan Lung (em012_00)
- **No Hyper version.** Never tires -- no tired case in his class; bit 19 in his flag word (the flag word, read through
  docs/render/notice-sense.js; no doc states it for him by name).
- **States:** one break reaction, no ailment clips. Rage rises with no roar. Rubble shells come from a per-frame event list
  (the viewer re-centres them on him) [L2 M3, L0 M36] (dev/em012_00-effects-spec.md 3; elder-dragon-shells-spec.md 2).
- **Controls:** State (Normal / Enraged). Flash-immune.

## 57. Fatalis (em013_00)
- **No Hyper version.** Never tires (no tired case; bit 19 -- the flag word, as Lao-Shan).
- **States:** no stun hold, shock trap or exhaust. His own puff pick (u 1120 when joint 4 is 20 degrees or more up). Sleep and
  paralysis [L3 M13 A / B / C, L3 M25]. u 202 never draws (dev/em013-effects-spec.md 3, 5; cenreport.py em013_00 202).
- **Controls:** State (Normal / Enraged). Flash-immune.

### Crimson Fatalis (em013_01) -- variant of Fatalis
- **Variant vs base:** his word lights bits 15-17 on [L2 M5, L2 M6] for (7, 0x3b / 0x3c) -- a sp_01 mode-5 shell at f80
  [L2 M5, L2 M6 A]. The meteors are his (sp_00 mode 5 with a ground mark) on [L2 M2, L2 M21, L2 M28] (dev/em013-effects-spec.md 1;
  elder-dragon-shells-spec.md 3). Otherwise as Fatalis.
- **Controls:** State, Damage Table (Calm / Enraged).

### Old Fatalis (em013_02) -- variant of Fatalis
- **Variant vs base:** his word lights bits 18-20 on [L2 M5, L2 M6 B]. His own attacks: the storm [L4 M4], the joint-aimed
  fireball [L2 M25 f146], the mode-2 fireball [L4 M7 f225], side waves, and lightning in place of the meteors (triple strikes).
  His own puff record on joint 131 (dev/em013-effects-spec.md 1; elder-dragon-shells-spec.md 3).
- **Controls:** State, Damage Table (Calm / Enraged).

## 58. Kushala Daora (em024_00)
- **No Hyper version.**
- **Tired:** he tires (stamina 4500; tired idle [L0 M22]) but has no drool (his setup turns it off). Nothing else tired is
  documented, and the viewer offers no Exhausted state for him (dev/em024_00-effects-spec.md 3). With spawn byte P+0x5cb6 == 1
  his class sets never-tired (meaning INFERRED; no control).
- **States:** the wind barrier is always held -- u 230 calm / u 240 enraged (Snow Variants list: u 210 / u 220). Rage [L0 M5],
  in the air [L2 M18] (dev/em024_00-effects-spec.md 3-4).
- **Controls:** State (Normal / Enraged), Flashed, **Wind Aura** (Level 0-3: levels 0-2 light bits 15-17, level 3 bits 21-23;
  aura u 1 / u 0 / u 10 at levels 1 / 2 / 3; a horn break drops the level), **Poisoned** (wind off, c 1100 every 90 frames),
  Damage Table (No Aura / Wind Aura).

## 59. Chameleos (em025_00)
- **No Hyper version.** **Never tires** (bit 19, no stamina block) (rom-map "Chameleos c 1104").
- **States:** the cloak -- horn intact he fades out over 30 frames; horn broken, the semi-invisible stealth materials; any break
  or sever while cloaked ends it; no effect record starts while he is fully cloaked; his eyes go to set 9. The tail never sets
  the level. His own puff pick (dev/em025_00-effects-spec.md 8).
- **Controls:** State (Normal / Enraged), Flashed, **Invisible** (Off / On), Damage Table (Off / On).

## 60. Teostra (em027_00)
- **No Hyper version.** **Never tires** (bit 19; his tired-idle row was withdrawn).
- **States:** the fire aura holds u 0 and fires u 1 as it goes out; a horn break puts it out for good. The nova: charge held on
  [L4 M9], goes off [L4 M10 f50]. u 2 when rage rises, u 3 when it falls (dev/em027_00-effects-spec.md 1-2, 7).
- **Controls:** State, Flashed, **Fire Aura** (Off / On: bits 15-17 on every motion, bits 6-8 cleared on L4 M6), **Size Type**
  (Type 1 holds u 10 in place of u 0 while the aura is on), **Poisoned** (aura off, c 1100 every 90 frames), Damage Table.

## 61. Alatreon (em050_00)
- **No Hyper version.** **Never tires** (bit 19, no stamina block, no c 1104) (states-em050_00.md 6).
- **States:** the form byte -- only the blue form shows (glow clips change, hit-zone slots move); the big knockdown forces red
  [L1 M16 -> L1 M17; L2 M23 -> L2 M25; L3 M4-M7]. His own puff: u 1120 red, u 1121 blue. A head break lengthens the form timer;
  the tail sever changes (7, 0x18) to u 240 [L2 M5] (states-em050_00.md 0, 2, 11).
- **Controls:** State, Flashed, **Form** (Fire/Dragon / Thunder/Ice), Damage Table.

## 62. Amatsu (em058_00)
- **No Hyper version.** Never tires (no tired case in the docs; bit 19 -- the flag word, as Lao-Shan).
- **States:** aura u 0 calm / u 1 enraged, hidden on status-7 attacks except (7, 0xc); dying fires u 2 and u 102. His own puff
  u 1120 every 30 frames while enraged. Tail sever [L3 M9 -> L3 M8] (dev/em058_00-effects-spec.md 5-8).
- **Controls:** State, Flashed, **HP State** (Before / Past the threshold: head sets 15-17, puff u 1121 for u 1120, u 101 for u 100).

## 63. Shagaru Magala (em072_00) -- Gore Magala's class (see Gore Magala below)
- **No Hyper version.** **Never tires** (bit 19; Gore and Chaotic tire and drool, he does not) (motion-states.js gore();
  TIRED_DROOL comment).
- **Versus Gore:** no rage ladder (just Enraged), no BodyLight material, no gauge; eyes of his own (shut = set 7); horns break in
  two steps (u 1000 / u 1001); rage roar [L4 M2]; flashable where Gore and Chaotic are immune. The ring fills u 30 / u 31 and the
  shells are shared with Gore (dev/em071-em072-effects-spec.md 3; flashed-state.md 3).
- **Controls:** State (Normal / Enraged), Flashed.

## 64. Nakarkos (em084_00)
- **No Hyper version.** Never tires (no tired idle -- (0, 2) ends at once; bit 19 -- the flag word) (dev/em084-c131.md 3).
- **States:** the cannon charge steps u 90/94, u 91/95, u 92/96 [L2 M81]; the shot ends them [L2 M82 f285]; phase 1 -> 2 by
  (7, 0x33..0x35). Tentacles (Left / Right): Base, Exposed, Uragaan, Brachydios, Glavenus, Ivory Lagiacrus; an Exposed tentacle
  opens the Face (part-review.json; dev/em084-shells-spec.md 3).
- **Controls:** **State** (Calm / Charge 1-3 / Enraged), **Stance** (Disguise / Revealed), Damage Table (Face Revealed /
  Guarded). Flash-immune.

## 65. Valstrax (em086_00)
- **No Hyper version.** Never tires (nothing in the docs; bit 19 -- the flag word).
- **States:** aura u 200 calm, u 1120 enraged, u 1130 enraged with the head broken. The comet: u 110 [L1 M5 B f30], u 130 held
  through the fall [L1 M5 C], landing [L2 M73]. Tail sever [L3 M21] (dev/em086_00-effects-spec.md 3-5).
- **Controls:** State, Flashed, Damage Table (Calm / Enraged); Parts rows "Enraged Effect" (hidden, follows rage) and "Chest Effect".

## 66. Gore Magala (em071_00)
- **Hyper parts:** Part 0 + Part 6 / Part 0 + Part 3 / Part 3 + Part 6 / Part 3 + Part 3 (Part 3 has an aura in each group).
  **No eye-glow record.**
- **Hyper speed:** Part 0 -- x1.2 [L2 M4, L2 M5, L2 M7, L2 M20, L2 M21, L2 M48], x1.1 [L2 M50, L2 M52], u 1311 on 10 clips. Part 6 --
  **x2** [L1 M6], x1.5 [L1 M9]. Part 3 (group 0) -- x1.2 [L2 M27, L2 M31, L2 M33; L2 M30*G], u 1314. Part 3 (group 1) -- x1.3 [L2 M28],
  x1.15 [L2 M29], x1.1 [L2 M8, L2 M44, L2 M45], u 1315.
- **Hyper projectiles:** shell00 / shell03 x1.5 with Part 0 held [L2 M4, L2 M6, L2 M52].
- **Absent under Hyper:** the tired records (keys 250 / 280) [L2 M4, L2 M6, L2 M7, L2 M52], the Exhausted idle [L3 M23], the drool.
- **Tired:** tired idle [L3 M23], drool (stamina 4800); the tired-only records (keys 250 / 280) on [L2 M4, L2 M6, L2 M7, L2 M52].
- **States:** the BodyLight ladder (Raven's reviewed levels) on the kasan material; the ROM gauge has no per-frame writer for
  Gore. Puff u 1120 only. "Intact (Feelers Out)" also moves his hit-zone rows. Tail sever [L3 M39]. Slot ring u 30 / u 31.
- **Controls:** State (Normal / Level 1-3 / Max / Exhausted), Rage ladder, Hyper. Flash-immune.
- See also **Shagaru Magala** (em072_00, same class), which the app lists with the Elder Dragons (section above).

### Chaotic Gore Magala (em071_05) -- variant of Gore Magala
- **No Hyper version.**
- **Variant vs base:** the **Gauge** (C+0x84, the hunters around him, capped by rank) sets his BodyLight rung (Normal / LV1 / LV2 /
  LV3 / LVMAX at 5000 / 10000 / 20000 / 28000); at G with 20000+ his footfall dust on seven attacks and six extra ring fills run.
  His own shells -- falling balls [L4 M15, L4 M7], [L4 M30] (also zeroes the gauge), [L4 M1], [L4 M24, L4 M28], [L2 M6] modes 4-6.
  Wing Arms are separate rows. Flash-immune by class code (dev/gore-line-shells-spec.md 2.2-2.3; CLASS_CONTROLS2 em071_05).
- **Tired:** tires like Gore [L3 M23]; the class can also set never-tired (at spawn with P+0x5cb6 == 1, and an action-start arm)
  -- meanings INFERRED, not built.
- **Controls:** State (Normal / Enraged / Exhausted), **Gauge (C+0x84)**, Damage Table.


---

## Not read yet -- the gaps (from the cited docs)

Each line is something the docs mark NOT READ / not wired / INFERRED, or that no doc establishes. Source in brackets.

**Shared (every Hyper monster)**
1. Hyper "Part N" has no mapping to Raven's part names (the viewer's working label) [hyper-states.md 3].
2. The draw pass the game's frame uses for the Hyper eyes: what draws before a monster's effects in a hunt [hyper-states.md 5].
3. Exhausted clips stay pickable under Hyper and force tired when played ("viewer partly") [hyper-attacks.md "To build"].

**Per monster**
4. Rathian -- no requester found for u 35 / c 20; what u 221 / 502 / 510 look like [states-em001.md 7].
5. Gold Rathian -- L4 M38 is a dead site (empty motion slot, PSL names u 221) [em001-effects-spec.md 2.2].
6. Dreadqueen -- whether her shell data carries u 36; the quest-number function [em001-effects-spec.md 4].
7. Rathalos -- what u 502 / 503 / 510 look like [em002-effects-spec.md].
8. Silver Rathalos -- his tune values are not in the docs.
9. Dreadking -- his real quest numbers (the "quest 5 or lower" form) [states-em002_04.md].
10. Khezu -- the "after first rage" stretch (plain forms while enraged, no control); ctl+0x24 / +0x28 timers; the Khezu-only
    c 1103 death branch [states-em003_00.md].
11. Basarios -- why u 201 draws nothing; soft ground (e+0x1068 bit 3) [cenreport.py DRAWS_NOTHING].
12. Gravios -- who requests u 150; which L0 M7 play starts sunk; who issues (13, 1) [em005_00-effects-spec.md].
13. Diablos -- ten L4 clips the class names but no list ships [states-em007_00.md 8.5].
14. Bloodbath -- his glow when tired below the first rung; u 200's third condition; which part u 1034 belongs to
    [states-em007_00.md; em007_04-parts-read.md 4].
15. Tigrex -- why vt+0x240 returns 1; the frame his lid opens on waking [states-em032_00.md 10].
16. Grimclaw -- what the Death material clip animates; his L9 phase-1 speeds and turns [em032-shells-spec.md 9.5].
17. Akantor -- his burrowed wait (6, 3) has no clip copy, so u 10 cannot be seen [em033-shells-spec.md 4].
18. Nargacuga -- which hop of the rage entry comes first; what a list-9 request does on him [states-em037_04.md 1.4].
19. Silverwind -- the sever's extra drop and the two tail-break windows [states-em037_04.md 11].
20. Ukanlos -- what L2 M12's unused bits 21 / 22 / 24 / 25 were for [em038_00-effects-spec.md 3].
21. Barioth -- which deaths skip closing his eyes [motion-states.js em042_00].
22. Seregios -- lid frame on waking; c 1201 unwired; shell27 has no maker [em077-shells-spec.md].
23. Astalos -- mixed per-part charge (one rung for all three regions) [psl-mask.js em081_00].
24. Boltreaver -- two docs disagree on his tier-1 (Charging) request sites vs CHARGE_EFFECTS; the L9 M22 beam's stop setter
    [effects-em081_00-charge.md 1.1; em081_04-effects-census.md 3].
25. Deviljho -- who issues his underground travel (6, 3); what reads e+0xb5f8 [states-em043_00.md].
26. Barroth -- the byte behind the wallow's u 210 [em044_00-effects-spec.md].
27. Uragaan -- which byte value picks u 110 vs 120 and u 130 vs 140 [em045_00-effects-spec.md].
28. Duramboros -- his break sets; whether rage changes his model; no doc says why he has no Begins Burrowed [states-em055_00.md].
29. Brachydios -- which actions set each arm's slime level [em063_00-effects-spec.md].
30. Raging Brachydios -- u 204 has no request site; u 41 needs a state the viewer cannot form [em063_00-effects-spec.md 5].
31. Glavenus -- the throat as part 60 is INFERRED; death darkening not shown [states-em080_00.md].
32. Hellblade -- the 5400-frame overheat timers (the viewer holds the overheat for the clip only) [states-em080_04.md].
33. Yian Kut-Ku -- what reads his tired ramp ctl+0x18; his ears are not driven [states-em008_00.md 5].
34. Gypceros -- the crest-light material machine is not wired [motion-states.js em009_00].
35. Gendrome / Iodrome / Giadrome -- command-table groups 6 / 4; whether the tired forms spit [states-em014_00.md 11].
36. Yian Garuga -- what reads his tired ramp ctl+0x20 [states-em018_00.md 5].
37. Deadeye -- what requests his u 60 / 61 / 100 / 110 [states-em018_00.md 7.6].
38. Nightcloak -- what makes him cloak; what reaction 27 is [states-em079_04.md 7.3].
39. Great Maccao -- the chain (.ctc) layout [states-em085_00.md 11].
40. Zinogre -- who issues (1, 5) and the catch (9, n); no control for spawning charged [em057-effects-spec.md 11].
41. Congalala -- what his tired gas attack (7, 0x3b) plays [rom-map `0xdcee10`].
42. Rajang -- the op-0x0c test choosing L0 M37 or the roar [states-em023_05.md 11].
43. Furious Rajang -- who reads his variant-5 value 1.2 (so "faster" is not claimed) [states-em023_05.md 11].
44. Bulldrome -- which two attacks tiredness slows [states-em030_00.md 5].
45. Arzuros -- whether his AI picks the 13 actions past his attack table [rom-map `0x70f40`].
46. Redhelm -- the spec and rom-map name u 120's grounds differently [em060-effects-spec.md "The ground"].
47. Lagombi -- what sends base Lagombi into the Snowbaron-only list-9 route [states-em061_00.md 7.3].
48. Gammoth -- her snow pick-up actions; the regrowth demotion timing [motion-states.js em083_00].
49. Elderfrost -- his one differing .dtb byte [states-em083_04.md 11].
50. Lavasioth -- magma darkening on death not shown; the name of magma clip 2 [states-em036_00.md 4].
51. Lagiacrus -- the thornray colour ramp is not wired; the Charged toggle does not follow tiredness [states-em046_00.md 2.3.2].
52. Royal Ludroth -- the tired mane shrink and the rage frill turn are not wired [states-em047_00.md 4.5].
53. Agnaktor -- the reheat counters and table, the in-lava hold, his spawn action [em049-heat.md 2d, 6].
54. Nibelsnarf -- what requests his sand camouflage; his sand-plume shells (need the map) [states-em056_00.md 2.2].
55. Soulseer -- what decides L9 M1 over L0 M2 as his combat idle [states-em082_00.md 5].
56. Tetsucabra -- the tail-tip swell is not wired [motion-states.js em066_00].
57. Zamtrios -- the form of L0 M16-18, L2 M14-22 and L4 M89-90; the ice fade material [em067-forms-spec.md 3.4, 6].
58. Nerscylla -- u 34's held object; two clears not driven [em070_00-effects-spec.md].
59. Ahtal-Ka -- the stage global behind his forced rage (and its never-tired); what the three carried objects are
    [states-em088_00.md 4.2].
60. Ahtal-Neset -- whether it tires or enrages; where its rocket decision runs [em088_00-effects-spec.md 4].
61. Stonefist / Shogun / Rustrazor -- their breaks (.dtp / .mpm unread), rage and death clips [states-em019_00.md 10].
62. Seltas Queen -- her eye dimming when tired has no viewer handling; her forelimb drive while coupled [states-em069_00.md 5].
63. Seltas -- his eyes, rage and tired clips (no states note) [motion-states.js em076_00].
64. Chaotic Gore -- the bit-19 action arm's conditions; which quests spawn him with P+0x5cb6 == 1; two docs disagree on that
    spawn arm [gore-line-shells-spec.md 2.3; render/monster.js].
65. Kushala -- anything tiredness changes beyond the idle [em024_00-effects-spec.md 3].
66. Chameleos -- the area gate's state; who issues (1, 0x11) / (2, 0x14) [em025_00-effects-spec.md 8.7].
67. Alatreon -- the puff countdown; spawning already blue; the form-gauge caller [states-em050_00.md 12].
68. Lao-Shan / Fatalis line / Amatsu / Nakarkos / Valstrax -- "never tires" rests only on the flag word, not a doc that says it.
69. Old Fatalis -- the aimed mode-5 strike (needs a hunter); the phase-3 dust clip [elder-dragon-shells-spec.md 3].
70. Nakarkos -- what E+0xcb00 means; the step-back path [em084-class-effects.md 2].
71. Valstrax -- the issuers of his sp_01 11 makers; sp_01 9 has no maker [elder-dragon-shells-spec.md Addenda].
