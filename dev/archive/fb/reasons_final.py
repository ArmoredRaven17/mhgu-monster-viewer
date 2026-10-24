# reasons_final.py -> reasons.json: the last word on the records still not drawing after the seven meter rounds (2026-10-21);
# overrides reasons_agents / reasons_me where the builds or the rounds changed the picture
import json
W, RG, RC, IM, NB, OP, ST = 'NO WALL / HUNTER', 'ROM GIVES NOTHING', 'ROM CONDITION', 'INPUT MISSING', 'NOT BUILT', 'OPEN (PAGE)', 'INPUT STAND-IN'
PAGE = 'the node replay starts it under %s; the page metered under the same input (round %s) does not -- the difference is not found'
R = {
 'em084_00:em084_00u:5': [W, 'the G-rank arm shells 5..8 (BUILT 2026-10-20) draw (u 4); u 5 is their ef 1 / ef 3, the type-0 / type-2 landing -- the floor\'s is (999, -1)'],
 'em088_00:em088_00u:320': [NB, 'sp_57 20..22 are made by NESET\'s b2 request (0x10ac3c8, mode k + 0x14; 24..26 INFERRED his b6 0x10ac1c8) -- uEm087_00\'s code, not transcribed (no Neset rows make Ahtal-Ka shells)'],
 'em088_00:em088_00u:321': [NB, 'ef 0 of Neset\'s 20..22 drop (0x10ac3c8): as u 320'],
 'em088_00:em088_00u:360': [RC, 'BUILT 2026-10-20 (sub 2 0x4397ec starts it); INFERRED: the orbit (7, 0x34) is reached only through (7, 0x33)\'s chain at f86 on L2 M35 and needs a live shell61 anchor -- the page\'s one L2 M35 play after the webs had none'],
 'em086_00:em086_00u:502': [RG, 'sp_01 9: no maker -- every 0x175 create in main.text and every in-band 0x48b884 call read (gapD); control: the same census finds modes 0..8 / 10..14'],
 'em024_00:em024_00c:33': [OP, 'the pulse (BUILT) makes sp_01 1 with ef 0 (c 30, draws) and ef 1 (c 33) at base01\'s init; startEf2 now hands the second to the runtime (node: started) but the page meter records no start -- the same as Teostra\'s c 34'],
 'em024_00:em024_00c:34': [OP, 'as c 33: sp_01 2\'s second init start (ef 1) -- c 31 (ef 0) draws, c 34 never reported on the page'],
 'em024_00:em024_00c:35': [OP, 'as c 33: sp_01 3\'s second init start'],
 'em027_00:em027_00c:34': [OP, 'sp_01 1\'s second init start (startEf2 since 2026-10-18; c 31 draws): never reported by the page meter -- as Kushala\'s c 33 / 34 / 35'],
 'em024_00:em024_00u:80': [OP, PAGE % ('the Wind Aura at 3 on L2 M9 (7, 0x2d)', '4: aura 3, ten plays')],
 'em024_00:em024_00u:162': [OP, PAGE % ('the Wind Aura at 3 on L2 M9 (7, 0x2d)', '4')],
 'em050_00:em050_00u:182': [OP, PAGE % ('rage on L2 M9 (7, 0x40)', '4: enraged, both picks')],
 'em057_04:em057_04u:180': [OP, PAGE % ('Charged on L9 M4', '4: the Charge rung')],
 'em071_05:em071_05u:90': [OP, PAGE % ('the Gauge at 20000 on L2 M25 (7, 0x2f)', '4: no record of that play started at all')],
 'em071_05:em071_05u:91': [OP, PAGE % ('the Gauge at 20000 on L2 M25 (7, 0x2f)', '4')],
 'em002_04:em002_04u:23': [OP, PAGE % ('Quest Level 0 on L4 M38 (7, 0xf5)', '4: u 13 beside it draws')],
 'em081_00:em081_00c:31': [RC, 'INFERRED: L4 M32\'s dust is base01\'s, deleted 900+ above the ground (0x3fa498) while he flies -- as c 30 on L1 M1 (measured: the floor -960 under him); rage reaches the play (round 6)'],
 'em081_04:em081_00c:31': [RC, 'INFERRED: as Astalos\'s -- base01\'s 900 rule on L4 M32 while he flies'],
 'em025_00:em025_00u:1': [ST, 'the spawn lies 12 under the viewer\'s floor stand-in (floor -355, spawn -367, measured probe3): base01\'s ground snap / its landing never meets that floor'],
 'em079_00:em079_00u:20': [RC, 'drawn under rage (round 3)'],
}
json.dump(R, open('reasons.json', 'w'), indent=1)
print(len(R))
