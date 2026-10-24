p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
up = {
    "| uEm011_00 (Kirin) | `0x179f740` | `0xd73a18` | ": "**R, emulated (369120 runs, 0 mismatches) and transcribed (psl-mask.js em011_00; dev/em011_00-effects-spec.md 1, 2026-10-18)** -- was: ",
    "| uEm012_00 (Lao-Shan Lung) | `0x17a062c` | `0xd77ac8` | ": "**R, emulated (369120 runs, 0) and transcribed; the lists are at [e+0x13f4+0xb6ec] = e+0xcae0, run populated (dev/em012_00-effects-spec.md 1, 2026-10-18)** -- was: ",
    "| uEm013_00 (Fatalis, Crimson, Old) | `0x17a5a24` | `0xd8aecc` | ": "**R, emulated (369120 runs x3 variants, 0) and transcribed (psl-mask.js em013; dev/em013-effects-spec.md 1, 2026-10-18)** -- was: ",
    "| uEm024_00 (Kushala Daora) | `0x17b36d8` | `0xdfd19c` | ": "**R, emulated (123120 runs x4, 0) and transcribed; the aura level is the Wind Aura control (dev/em024_00-effects-spec.md 1-2, 2026-10-18)** -- was: ",
    "| uEm027_00 (Teostra) | `0x17b65cc` | `0xe1a9d8` | ": "**R, emulated (98496 runs x2, 0) and transcribed; the aura is the Fire Aura control (dev/em027_00-effects-spec.md 1-2, 2026-10-18)** -- was: ",
    "| uEm050_00 (Alatreon) | `0x17c7254` | `0xece27c` | ": "**R, extent resolved (..0xece650, three tables), emulated (262656 runs, 0) and transcribed (dev/em050_00-effects-spec.md 1, 2026-10-18)** -- was: ",
}
for a, ins in up.items():
    assert s.count(a) == 1, a[:40]
    s = s.replace(a, a + ins)
a = "| uEm071_00 (Gore Magala; ALSO Shagaru em072_00 -- no uEm072_00 class, dev/shell-map.md) | `0x17e418c` | `0xfc08a8` | "
assert s.count(a) == 1
s = s.replace(a, a + "**R, emulated (16416 runs, 0) and transcribed (psl-mask.js em071; dev/em071-em072-effects-spec.md 1, 2026-10-18)** -- was: ")
anchor = "### Rajang (em023_00) -- the variant-0 state arms"
sec = """### The Elder Dragons and the Gore line -- words, plays, states, class timers (Elder Dragon walk, 2026-10-18; dev/em011_00-, em012_00-, em013-, em024_00-, em025_00-, em027_00-, em050_00-, em058_00-, em071-em072-, em084_00-, em086_00-effects-spec.md)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xd6df64` (vt+0x208) | Kirin's lightning aura: calm u 0 / 40 f (id 1001), enraged u 61 / 32 f (1002, horn intact) and u 60 / 45 f (1003, not L4 M7 below f60), countdowns e+0xcac4 / c8 / cc zeroed by calm or the roar (1, 6), u 0 held off on L3 M4 / M5 / M7 / M8 / L4 M6; nothing at death | uEm011_00 | R (whole, to 0xd6e2d4) | em011 spec 3; motion-states.js CLASS_TIMERS |
| `0xd7d958` / `0xdef1d8` / `0x109e288` / `0xfadcc8` | eye appliers `0x71398`: Fatalis (2, 1), Kushala (1, 6), Valstrax (3, 2), Shagaru (1, 7; em 0x48 only) | various | R | specs 3 |
| `0xd7e800` / `0xe025f0` (vt+0x2a4) | puff picks: Fatalis 1 iff angle in [0xe39, 0x8000); Chameleos 1 iff (u & 0xfffe) > 0x1555 | uEm013_00 / uEm025_00 | R (whole) | fatalisPuffPick / chameleosPuffPick |
| `0xdeffc4` (vt+0x208) | Kushala's wind barrier: e+0xcac8 holds id by ctl+0x2c / 0x2d (1004..1007 -> 210 / 220 / 230 / 240), a wrong key (+0x1b4) stopped and re-requested; stopped at death | uEm024_00 | R (to 0xdf00fc) | em024 spec 4; CLASS_TIMERS holds |
| `0xdef314` (vt+0x204) / `0xdff4f0` / `0xe107ac` / `0xf08e7c` / `0xfadfa0` / `0x109f830` | (10, 0x72) arms: the tail sever `0xc2274(e, 0, 0, 0x8f)` (Amatsu 0x8e) on part 2 (Kushala, Teostra) / 6 (Chameleos, Gore line, Valstrax) / any (Amatsu); the horn `0x9d438(e, 0)` on part 0 (Kushala, Teostra, Chameleos + P+0x3b4 bit 1) | various | R (emulated, hook204b.py) | specs 3 |
| `0x17a6..`, `0x17b4..`, `0x17b5..`, `0x17b7..`, `0x17cc..`, `0x17e5..`, `0x17f1..`, `0x17f9..` scripts | status-10 / 11 scripts per class (dumped: scrdump.py -- ops 0 / 2 a motion record, 3 wait, 5 / 0xa turns, 1 a sub-record, 0xfd / 0xfe / 0xff ends) | various | R | specs 3 |
| part passes `0xd7709c` / `0xd8a780` / `0xdfcc60` / `0xe00eb4` / `0xe1a604` / `0xf09d0c` / `0xfbf97c` / `0x10a1230` | set by break level per class -- static (Lao-Shan, Fatalis, Kushala, Chameleos, Teostra, Amatsu) or RUN (ppemu.py: Gore line, Valstrax; control Lao-Shan reproduced) | various | R | specs 3 |
| Teostra `0xe17e3c..0xe1850c` | the nova machine ids 1006..1015 (keys 160..165 / 170..173) into e+0xcacc | uEm027_00 | NOT READ (named) | em027 spec 4 |
| Amatsu `0xf09308` / Valstrax `0x109ed50` frame handlers | their own puffs (e+0xb7d2 = 0) and class tables -- sites listed | uEm058_00 / uEm086_00 | NOT READ (named) | em058 / em086 spec 4 |
| `0xa1f0c(e, mask)` | P+0x5e08 & mask (Kushala's ctl+0x18, Teostra's aura gate) -- its writers not read | shared | R (the read) | em024 / em027 spec 1 |

"""
assert s.count(anchor) == 1; s = s.replace(anchor, sec + anchor)
a = "Snake / Temnoceran / Carapaceons / Neopterons `em068_00-`, `em070_00-`, `em019-em020-`, `em069_00-effects-spec.md` | Fanged Beasts / Piscine / Leviathans / Amphibians / Snake / Temnoceran / Carapaceons / Neopterons effects specs"
b = "Snake / Temnoceran / Carapaceons / Neopterons `em068_00-`, `em070_00-`, `em019-em020-`, `em069_00-effects-spec.md`; Elder Dragons / Gore `em011_00-`, `em012_00-`, `em013-`, `em024_00-`, `em025_00-`, `em027_00-`, `em050_00-`, `em058_00-`, `em071-em072-`, `em084_00-`, `em086_00-effects-spec.md` | Fanged Beasts / Piscine / Leviathans / Amphibians / Snake / Temnoceran / Carapaceons / Neopterons / Elder Dragons effects specs"
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
