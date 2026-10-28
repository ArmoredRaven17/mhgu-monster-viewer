"""cenreport.py -- the effects coverage census report (2026-10-24): cen/<id>.out (census.mjs, the draw meter with every input) ->
dev/effects-coverage.md tables + cen/census.json. Buckets, each record in exactly one:
  draws          the meter's verdict 'draws' (or 'off camera': lit when the meter aims at its units)
  starts_nodraw  started, any other verdict (named with it)
  not_requested  the ROM fires it (a class request site's key, efx/class-effects.json) but the viewer exports no such record
  refusal        exported, never started, with a named reason (the cross-monster decisions below)
  open           exported, never started, no named reason yet
Shells are not re-metered: dev/shells-draw-table.md's per-monster verdicts are copied in."""
import json, re, os, sys, glob, collections
SP = os.path.dirname(os.path.abspath(__file__))
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
ORDER = [l.split() for l in open(os.path.join(SP, 'order.txt'))]
walk = {}
for l in open(os.path.join(V, 'dev', 'effects-walk-order.md'), encoding='utf8'):
    c = [x.strip() for x in l.split('|')]
    if len(c) > 5 and re.match(r'^\d+$', c[1] or ''): walk[c[2]] = (int(c[1]), c[3], c[4])
# --- the named refusals (cross-monster decisions) ---
# the rage puff's pick (READ 2026-10-24, rom-map 0xa41b8 row): 0xa425c..0xa42a0 asks vt+0x2a4; == 1 -> id 0 (key 1120), else id 1 (key
# 1121) (0xa4298 movne r1, #1). A class whose vt+0x2a4 is the base stub 0x6bf64 (mov r0, #0) therefore requests u 1121 only
sys.path.insert(0, 'C:/MHGU-Extract/efx'); sys.path.insert(0, 'C:/MHGU-Extract/efx/agents/notice-scratch')
import armdis, emclasses, struct
_CL = emclasses.load()
def pick2a4(mon):
    cls = {'002': 'uEm001_00', '005': 'uEm004_00', '015': 'uEm014_00', '016': 'uEm014_00', '034': 'uEm014_00', '062': 'uEm060_00', '072': 'uEm071_00'}.get(mon[2:5], 'uEm%s_00' % mon[2:5])
    if cls not in _CL: return None
    return struct.unpack_from('<I', armdis.DATA, _CL[cls]['vtable'] - armdis.DA_VA + 0x2a4)[0]
LATCH1400 = {'em010_00', 'em046_00', 'em047_00', 'em033_00', 'em036_00', 'em084_00'}
def refusal(mon, pel, key, when):
    """Only Raven's decisions are refusals (2026-10-25). Everything an agent decided is open until its ROM reason is brought to the
    coordinator: returns (bucket, reason) or None."""
    k = int(key); u = pel.endswith('u')
    if not u and 1130 <= k <= 1137:
        return ('refusal', "Raven's decision (2026-10-25): the blastblight proc, c 1130-1137 (0xaab98 band, one per proc by part P+0x5db0) -- \"simply a small explosion that happens once it procs\"")
    if not u and k == 1106:
        return ('refusal', "Raven's decision (2026-10-25): Paint, c 1106 (the paint timer P+0x5db8, 0xc0c48, on damage type 16) -- \"we would need a projectile to simulate a Paintball being thrown\"")
    if not u and k == 1201 and mon in ('em012_00', 'em088_00'):
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): P+0x1a9 bit 7 (0x159c2dc) sees every hunter outright (0xc37a0..0xc37a8), so the notice memory never runs out and 0xc8d20 never drops 2 -> 0; control: c 1201 fires on the 69 monsters without the bit (<archive>/notice/notice_rest.out)')
    if not u and k in (1200, 1201):
        return ('open', 'notice / disengage: driven since 2026-10-25 (index.html stepNotice, render/notice-sense.js) -- not started in <archive>/notice/notice-check.mjs (Default, then Far)')
    if u and 1311 <= k <= 1320:
        return ('open', 'hyper burst (0xca4e0, per-class hooks): HELD -- the motion side, Raven 2026-10-25 "hold off on the animations"')
    if u and 1301 <= k <= 1310 and HYPER_IDS.get(mon) is not None and (k - 1300) not in HYPER_IDS[mon]:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): DouMouKaID %d is in neither .mdd (IDs %s); 0xca1f8 requests u 1300 + ID for the table IDs only (control: those IDs draw), and no call site asks base u id %d by an immediate (<archive>/hyperid/uidscan.py + wrapscan.py, controls 0xa42a0 / 0xca3c8; not covered: ids built arithmetically elsewhere or passed through more than two wrapper levels)' % (k - 1300, sorted(HYPER_IDS[mon]), k - 1300 + 47))
    if u and 1301 <= k <= 1310:
        return ('open', 'hyper aura: the Hyper toggle holds it (meter it there)')
    if (mon, pel, k) in ROM_REASON:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): ' + ROM_REASON[(mon, pel, k)])
    if (mon, k) in PSL_NEVER and u and when == 'clip':
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): ' + PSL_NEVER[(mon, k)])
    if u and k == 1120 and when == 'ragePuff' and pick2a4(mon) == 0x6bf64:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): vt+0x2a4 is the base stub 0x6bf64 (returns 0), so the shared puff 0xa425c..0xa42a0 requests id 1 (u 1121) only; control: the live picks (the Rath line, Diablos, the Gore line, Chameleos, the Fatalis line) draw u 1120')
    if False:
        return ('open', 'ROM REASON TO BRING: vt+0x2a4 is the base stub 0x6bf64 (returns 0), so the shared puff 0xa425c..0xa42a0 requests id 1 (u 1121) only; control: the live picks (the Rath line, Diablos, the Gore line, Chameleos, the Fatalis line) draw u 1120')
    if not u and k in (1120, 1121) and when == 'ragePuff' and mon in PUFF_C_ACCEPTED:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-25): the shared puff 0xa41b8 requests the u list only (0xa4290, requester e+0xb640); control: u 1120 / u 1121 draw through the same request')
    if not u and k in (1120, 1121) and when == 'ragePuff':
        return ('open', 'ROM REASON TO BRING: the shared puff requests the u list only (0xa4290, requester e+0xb640)')
    if (mon, pel[-1], k) in ACCEPTED_A:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-26): ' + ACCEPTED_A[(mon, pel[-1], k)])
    if (mon, pel[-1], k) in OPEN_REASON_A:
        return ('open', 'ROM REASON TO BRING (lane A, 2026-10-25): ' + OPEN_REASON_A[(mon, pel[-1], k)])
    if (mon, pel[-1], k) in OPEN_REASON_FLASH:
        return ('refusal', 'the ROM never requests it (accepted 2026-10-26): ' + OPEN_REASON_FLASH[(mon, pel[-1], k)])
    return None
LATCH1400 = set()
_HA = json.load(open(os.path.join(V, 'docs', 'hyper-auras.json')))
HYPER_IDS = {m: {a['id'] for f in ('normal', 'g') if v[f] for a in v[f]['auras']} for m, v in _HA.items() if m != '_about'}
AKA = 'dev/em033_00-effects-spec.md 3: '
DRAWS_NOTHING = {('em005_00', '241'): 'MASK1 0x02 selects no row of em005_00_001 -- three ROM recordings reach 0x9bb30c and never 0x9bb330 (control: u 240 / u 251 on the same file reach both)',
                 ('em013_00', '202'): 'MASK1 0x4 selects no row of em013_00_003, whose rows carry 0x1 / 0x2, so no generator is built (dev/em013-effects-spec.md, read 2026-10-19); control: every other record of the file draws',
                 ('em076_00', '272'): 'MASK1 0x2 selects no row of em076_00_005 -- the recorder sets add_em076_00_u272 / _near reach 0x9bb30c and never 0x9bb330 (control: u 260 / 261 / 262 / 263 on the same file reach both; accepted 2026-10-26)',
                 ('em084_00', '215'): 'em084_00_122 row 10 (MASK1 0x2, the only row) is one Model generator whose col2 life is 0 / 0 / 0: spawnLife 0xaea108 starts each particle in the fade-out at counter 1 and the life pass of its spawn frame (0xa60f68 -> 0xaeae40 -> 0xaeb010) frees it before the draw; the recorder sets add_em084_00_u215 / _near take those blocks and never reach the Model draw 0xa92710 (control: u 213 on the same file and clip reaches 0xa92710 271 times and draws 6 models; lane B3, accepted 2026-10-26)',
                 ('em013_01', '202'): 'MASK1 0x4 selects no row of em013_00_003, whose rows carry 0x1 / 0x2, so no generator is built (dev/em013-effects-spec.md, read 2026-10-19); control: every other record of the file draws',
                 ('em061_00', '64'): 'MASK1 0x100000 selects no row of em061_00_001 (rows carry 1 / 2 / 4) -- the recorder sets add_em061_00_c64 / _near reach the zero-generator test 0x9bb30c and never the build 0x9bb330 (control: add_em061_00_u230 / u290 / u300 on the same file reach both; laneA3/reach.py; accepted 2026-10-26)',
                 ('em061_04', '64'): 'MASK1 0x100000 selects no row of em061_00_001 (rows carry 1 / 2 / 4) -- the recorder sets add_em061_04_c64 / _near reach the zero-generator test 0x9bb30c and never the build 0x9bb330 (control: add_em061_04_u302 / u501 on the same file reach both; laneA3/reach.py; accepted 2026-10-26)',
                 ('em004_00', '201'): 'MASK1 4 builds 3 generators that emit nothing before the one-frame bit ends the unit; the recorder native ROM run of the same record and bit draws nothing (unread detail: the generators first-emission rule)'}
ROM_REASON = {('em033_00', 'em033_00c', 1104): AKA + 'never tired (P+0x1a8 bit 19; every P+0x505 writer needs (P+0x1a8 & 0x80001) == 1; vt+0x1fc remaps (0, 2))',
              ('em033_00', 'em033_00c', 1109): AKA + '(10, 0x1b) / (10, 0x1c) have no handler in his status-10 dispatcher 0xe3d1f0 (the default 0x76088)',
              ('em033_00', 'em033_00c', 1105): AKA + '(10, 0x6e) falls to the default; it is gone before 0xa4518 (vt+0x28) asks (vt+0x24 runs first)',
              ('em033_00', 'em033_00u', 1400): AKA + 'his only 0xa499c site 0xe3a5c8 is level 1 = u 1121; the latch bit 20 is raised only by class code he lacks',
              # lane B's ROM reasons, accepted by the coordinator 2026-10-25 (rom-map "Effects lane B (2026-10-25)")
              ('em088_00', 'em088_00u', 1121): "his spawn setup vt+0x1d8 0x10b325c clears e+0xb7d2 (0x10b32b0), the shared puff 0xa41b8's gate (0xa424c; ctor 0xacc4c writes 1); control: the whole-text #0xb7d2 scan finds no write in Rathian's band, whose u 1120 / 1121 draw",
              ('em019_04', 'em019_04u', 231): "L2 M18 / M54 / M61 bit 15: the crab word vt+0x13c 0xdc0ff4 (emulated, psl-mask.js) gives em 0x13 variant 4 bits 21-23 there, never bit 15; control: Daimyo's u 231 draws through bit 15",
              ('em069_00', 'em069_00u', 300): 'L3 M2 bits 24-26 need e+0xcad0 != 0; its one reference in her band 0xf88f40..0xf9a344 is the read 0xf999f8, and a write watch over every (status, n) through her action main / vt+0x204 / vt+0x208 / vt+0x1dc and every vtable slot sees no write (<archive>/laneB/duo/cad0watch.py, cad0all.py); control: the same watch sees 0xf8b49c store e+0xcac4. Not covered: a write from outside her class by pointer',
              ('em084_00', 'em084_00u', 1400): "his two 0xa499c sites are level 1 (u 1121); the shared latch needs e+0x1404 bit 20, raised only by 11 other classes (Akantor's accepted reason); control: those classes' u 1400",
              ('em024_00', 'em024_00c', 1104): "his spawn setup vt+0x1d8 0xdef18c clears e+0xb7d3, the shared tired drool's gate (0xa41b8), although he tires (P+0x1a8 0x40440041, stamina 4500); control: the crabs / Seltas / Gore line (no b7d3 write) draw c 1104",
              ('em024_00', 'em024_00c', 1105): "(10, 0x6e) takes the default change 0xdfb6e0 (zg/tracec.py): no shock-trap script, so the hold 0xa48bc asks never (Akantor's reason); control: Daimyo script 0x17ae250, the Gore line 0x17e5250 draw c 1105",
              ('em025_00', 'em025_00c', 1105): "(10, 0x6e) takes the default change 0xe0d06c (zg/tracec.py): no shock-trap script, so the hold 0xa48bc asks never (Akantor's reason); control: Daimyo script 0x17ae250, the Gore line 0x17e5250 draw c 1105",
              ('em086_00', 'em086_00c', 1105): "(10, 0x6e) takes the default change 0x109c91c (zg/tracec.py): no shock-trap script, so the hold 0xa48bc asks never (Akantor's reason); control: Daimyo script 0x17ae250, the Gore line 0x17e5250 draw c 1105",
              ('em025_00', 'em025_00c', 1104): "never tired: P+0x1a8 0x404c0201 (bit 19: the stamina updater returns at once) and tune+0x30 NULL (Akantor's reason form); control: the crabs (0x440041) tire and draw c 1104"}
# lane B (accepted 2026-10-25): the rage puff's c side on these monsters -- the shared puff requests the u list only
PUFF_C_ACCEPTED = {'em050_00', 'em071_00', 'em071_05'}   # Chaotic added 2026-10-26 ('Gore' = the Gore line)
# lane B2 (accepted 2026-10-26): the Gore line's puff pick never asks u 1121
_PICK071 = ("vt+0x2a4 0xfbec80 (Rathian's 0xd08afc) on joint 4 asks u 1121 only when the joint's third axis is more than 25 degrees above "
            "its parent's plane; over every rotation key of joint 4 in every motion (<archive>/laneB2/puffpick.py) Gore 0 / 14125, Chaotic "
            "0 / 16882, Shagaru 0 / 1178 (angle -19.3 .. +90 degrees); control: Rathian 4592 / 10823 keys, and her u 1121 draws. Not covered: "
            "a blend between two motions")
for _m in ('em071_00', 'em071_05', 'em072_00'): ROM_REASON[(_m, _m + 'u', 1121)] = _PICK071
NR_REASON = {('em043_00', 31): 'its only request sites (0xe8063c / 0xe80688 in 0xe80500) are reached only from 0xe7f07c, behind e+0xb5f5 == 5 (Savage); control: Savage u 30 / u 31 draw through them (rom-map 0xe7f068)',
             ('em005_00', 10): 'ids 1007 / 1008 = (7, 0x3c) / (7, 0x3b): no `00 07 3b / 3c` in em004_00 / em005_00 cmdtbl (control (7, 0x0a) x3) and no change call targets them (control 0xd25e84)',
             ('em005_00', 40): 'ids 1007 / 1008 = (7, 0x3c) / (7, 0x3b): no `00 07 3b / 3c` in em004_00 / em005_00 cmdtbl (control (7, 0x0a) x3) and no change call targets them (control 0xd25e84)',
             ('em007_00', 200): 'both sites behind `ldrb [e+0xb5f5]; cmp #4; bne` (0xd36348 / 0xd365c4) -- variant 4 only; em007_00u has no UNIQUE 200 (control: Bloodbath u 200 draws)',
             ('em088_00', 20): "no request site: neither id 1009 nor 1010 (0x3f1 / 0x3f2) as an immediate in his band, uEm087's or the shared layer, and the thread slots take literal ids only (control: the same scan finds 28 of his 30 ids; lane B 2026-10-25)"}
# the PSL enable word (vt+0x13c 0xd09054, emulated 195,840 runs, 0 mismatches) never sets the record's bit: <archive>/cen/psltest.mjs
PSL_NEVER = {('em001_02', 522): 'L2 M3 bit 18 -- bits 18-20 are the variant-4 arm only (Dreadqueen / Dreadking)',
             ('em001_02', 523): 'L2 M4 bit 18 -- bits 18-20 are the variant-4 arm only',
             ('em002_00', 290): 'L2 M1 bit 24 -- bits 24-26 only for enemy ids 0x201 / 0x202 / 0x401',
             ('em002_04', 290): 'L2 M1 bit 24 -- bits 24-26 only for enemy ids 0x201 / 0x202 / 0x401',
             ('em002_04', 291): 'L2 M1 bit 25 -- bits 24-26 only for enemy ids 0x201 / 0x202 / 0x401'}
# lane A's ROM reasons (2026-10-25), ACCEPTED by the coordinator 2026-10-26 (rom-map rows "effects lane A, 2026-10-25"): each a named
# refusal, "the ROM never requests it", with its positive control
_GLAV_T = 'the heat byte P+0x1bb never forms the word bits: '
_GLAV_C = '; control: the forms each byte state does select draw (Glavenus throat lit / neither, Hellblade overheat u 511 / 512, census 2026-10-24)'
_URA_C = ' (word READ whole, emulated 39936 runs per variant; base word 0xca170 bits 0-14 only); control: L2 M2 u 261 / 263 / 280-283 start and draw'
_SLIME_C = ' (word READ whole, emulated 657920 runs); control: on Brachydios the same records start and draw (cen/pq/arm063.json); Raging c 130 / 131 draw on base bits 0-5'
ACCEPTED_A = {
    ('em080_04', 'u', 202): '1003 needs P+0x1bb bit 4 with bits 3 / 1 clear; bit 1 clears only in machine C death state 0x100bcb0 (the pointer of ldrb [r0, #0x1bb]! at 0x100bc90), after machine B cleared bit 4 (0x100b590) in the same vt+0x210 call 0x100acf8 (rom-map "Hellblade u 202 (1003)"); control: the selector 0xfffb24 forms 1001 / 1002 / 1004 / 1005 and Hellblade u 200 / 201 / 203 / 204 draw (cen/pq/heat080b.json, heat080c.json)',
    ('em080_00', 'u', 240): _GLAV_T + 'L2 M27 bit 29 needs bit 4; variant 0 sets bit 2 there instead (0xfff8fc..0xfff9b0, r7 = e+0xb5f5)' + _GLAV_C,
    ('em080_00', 'u', 241): _GLAV_T + 'L2 M27 bit 28 needs bit 4; variant 0 sets bit 2 there instead (0xfff8fc..0xfff9b0)' + _GLAV_C,
    ('em080_04', 'u', 233): _GLAV_T + 'L9 M7 bit 26 needs bits 4 and 2 clear; bit 2 is never cleared on variant 4 (clearers 0xfff404 / 0xffed9c are v0-only)' + _GLAV_C,
    ('em080_04', 'u', 234): _GLAV_T + 'L2 M27 bit 27 needs bits 4 and 2 clear; bit 2 is never cleared on variant 4' + _GLAV_C,
    ('em080_04', 'u', 236): _GLAV_T + 'L2 M27 bit 26 needs bits 4 and 2 clear; bit 2 is never cleared on variant 4' + _GLAV_C,
    ('em080_04', 'u', 250): _GLAV_T + 'L2 M2 / M11 bit 20 needs bits 3, 1, 0 clear; bit 1 clears only in death (0x100bcb0)' + _GLAV_C,
    ('em045_00', 'u', 267): 'L2 M2 bit 27: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em045_00', 'u', 284): 'L2 M2 bit 30: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em045_00', 'u', 285): 'L2 M2 bit 31: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em045_04', 'u', 267): 'L2 M2 bit 27: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em045_04', 'u', 284): 'L2 M2 bit 30: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em045_04', 'u', 285): 'L2 M2 bit 31: the word 0xe9cb64 gives L2 M2 bits 17-24 only' + _URA_C,
    ('em063_05', 'c', 140): 'bit 19 (L2 M13 / M18 / M54): the arm-slime bits 19-22 are behind e+0xb5f5 == 0 in 0xf469a8 (Brachydios only)' + _SLIME_C,
    ('em063_05', 'c', 141): 'bit 21 (L2 M11 / M16): the arm-slime bits 19-22 are behind e+0xb5f5 == 0 in 0xf469a8 (Brachydios only)' + _SLIME_C,
    ('em018_00', 'u', 290): 'L0 M7 bit 27: the word 0xdb0d10 sets bits 27-29 on L0 M7 only for e+0xb5f5 == 4 with action (7, 0xe3..0xe5) (Deadeye; emulated 8448 runs); control: on Deadeye the same bits fire through the (7, 0xe3) / (7, 0xe5) copies and u 290 / u 531 draw',
}
# lane A2's four, accepted by the coordinator 2026-10-26 (filed by lane A3): named refusals, each with its control
ACCEPTED_A.update({
    ('em057_04', 'c', 1104): '(lane A2, 2026-10-26, the consumer read) P+0x1a8 = 0x4c0201 (0x159c2dc[45]) has bit 19, so every P+0x505 writer writes 0 (0xbd0c8 / 0xbd250 / 0xbd2d4: (P+0x1a8 & 0x80001) == 1) and the stamina updater 0xbd1a4 returns at 0xbd1d4; and [tune+0x30] NULL -> 0x7112c == 0 -> 0xbd1a4 returns at 0xbd1e4, setAction skips the drain (0x75614): 0x81614 never 1, the drool 0xa41b8 never asks; emulated (laneA2/stam1104.py); control: Zinogre (0x440241 + block) reaches P+0x505 1 / 2 / 3 on the same runs and draws c 1104',
})
ACCEPTED_A.update({   # lane A2, 2026-10-26 (rom-map "Effects lane A2"); accepted 2026-10-26
    ('em022_00', 'u', 1400): '(lane A2) no b / bl into 0xa499c in his band (control Bulldrome 0xe1e8d0) and his one class request is id 1001 = u 60 (hyperid/uids.txt, control 0xa42a0), so no base u id 2; the latch needs e+0x1404 bit 20 (11 other classes) and e+0x1408 bit 0 (Lavasioth) -- the accepted Akantor / Nakarkos form',
    ('em061_00', 'c', 10): '(lane A2) L0 M2 / M52 bit 15: the word 0xf32bac (READ whole, emulated 2040 runs) sets bit 15 for variant 4 only, base word bits 0-14; control: Snowbaron c 10 draws through the same bit',
    ('em023_00', 'u', 1121): '(lane A2) vt+0x1d8 0xde1ae0: variant == 0 -> e+0xb7d2 = 0 (0xde1dd4), the shared puff gate 0xa424c; vt+0x2a4 0x6bf64 (u 1121 only); control: Furious Rajang (variant 5) keeps the ctor 1 and his u 1121 draws -- the accepted Ahtal-Ka form',
})
OPEN_REASON_A = {}   # ROM reasons brought, not yet accepted
_L1400 = 'no branch into the u 1400 family in the class band (per-class sweep 2026-09-30); the latch 0xadc98 asks 0xa499c(e, 2) only with e+0x1404 bits 20 + 21 and e+0x1408 bit 0, raised only by uEm036 0xe42bd0'
ACCEPTED_A.update({   # lane A3's five, accepted by the coordinator 2026-10-26 (filed by lane A4; rom-map "Effects lane A3"); control: Bulldrome's class site 0xe1e8d0 draws u 1400 / Rajang's c 1104 draws
    ('em010_00', 'u', 1400): '(lane A3) ' + _L1400 + ' -- Plesioth raises bit 20 (0xd64980), never +0x1408 bit 0',
    ('em046_00', 'u', 1400): '(lane A3) ' + _L1400 + ' -- Lagiacrus raises neither',
    ('em047_00', 'u', 1400): '(lane A3) ' + _L1400 + ' -- Royal Ludroth raises neither',
    ('em023_05', 'c', 1104): '(lane A3) P+0x1a8 = 0x404c0201 (0x159c2dc[22], em 0x517) has bit 19, so every P+0x505 writer writes 0 (0xbd0c8 / 0xbd250 / 0xbd2d4) and he never tires (and his tune+0x30 is NULL, states-em023_05.md 1.1) -- the accepted Thunderlord form; control: Rajang [21] = 0x40440241 tires and his c 1104 draws',
    ('em036_00', 'u', 1400): '(lane A3) his two b 0xa499c sites pass r1 0 (u 1120, 0xe41e10 / 0xe44314); the latch needs e+0x1404 bit 20, raised only by 11 other classes (not uEm036), so his +0x1408 bit 0 (0xe42bd0) never meets bits 20 + 21',
})
OPEN_REASON_A.update({   # lane A4, 2026-10-26 (rom-map "Effects lane A4"): brought to the coordinator, each with its control
    ('em060_00', 'c', 60): '(lane A4) the PSL binds c 60 to L0 M13 / L0 M17 bit 15 only (CLIP_EFFECTS em060_00); the word 0xf1911c (READ whole, emulated 3120 runs; dev/em060-effects-spec.md 1) sets bit 15 there only for e+0xb5f5 == 4 with em 0x3c (Redhelm), and the base word 0xca170 sets bits 0-14; control: Redhelm c 60 draws through the same bit (census: st 2, lit 51, L0 M13 / M17)',
    ('em023_05', 'u', 310): '(lane A4) the PSL binds u 310 to L2 M8 / M20 / M21 bit 12 only; bit 12 is the tired-and-calm group of 0xca170 (0x7000 when 0x81614 and not 0x81670, 0xca19c..0xca1bc), and 0x81614 never returns 1 on Furious Rajang (P+0x1a8 bit 19: every P+0x505 writer writes 0 -- the accepted c 1104 reason); his word 0xded0f4 adds bits 15-17 on L2 M8 only; control: Rajang u 310 draws tired (census: st 3, lit 85, L2 M8 / M20 / M21)',
    ('em023_05', 'c', 1109): '(lane A4) (10, 0x1b) is issued only by the reaction builder 0x9a76c code 8 (0x9a9ac..0x9a9b8, posture 0; (10, 0x1c) at 0x9b040 in posture 2); code 8 is written to P+0x3ae only at 0x9993c (every store to P+0x3ae scanned, 28 register-offset forms, laneA4/issue101b.py; control: the same scan finds code 0x1c at 0x98df0 / 0x99960, the source of the Mizutsune (10, 0xaf)), behind the 0x9a290 code 5, which comes only from 0xa3028; 0xa3028 loads [0x70fbc(e) + 0x44] = tune+0x44 and returns 0 when it is NULL (0xa3038..0xa3044), and the Furious Rajang tune+0x44 is NULL (states-em023_05.md 1.1); control: the Rajang block {200, 600, 5, 0, 100, 600} procs and Rajang c 1109 draws (census: st 3, lit 16, L3 M2)',
})
NR_ACCEPTED_A = {('em057_04', 30): 'ids 1001 / 1002 (u 30 / u 31) come only from the aura machine 0xeed68c..0xeedaa0 gauge-tier arm, which is variant 0; Thunderlord requests 1006 (u 42) uncharged-calm and 1007 (u 32) charged-calm, enraged none (rom-map 0xeecd58, emulated); control: Zinogre u 30 / u 31 draw through the same arm (laneA/tier057.mjs)',
                 ('em057_04', 31): 'as u 30: the 1001 / 1002 tier arm is variant 0 only (rom-map 0xeecd58); control: Zinogre u 31 draws at gauge tier 3 (laneA/tier057.mjs)'}
NR_REASON_A = {}
# the Fatalis line's c 1103 (Flashed state, 2026-10-25; rom-map "Flashed" + its Withdrawn row): NOT filed under the Flashed state --
# the ROM cannot flash him: accepted by the coordinator 2026-10-26 (the Flashed-state agent's proof, control below). The other monsters' c 1103
# under the Flashed switch comes in through <archive>/pq/flashed.out (flashmeter.mjs)
_FLASH_013 = ("0xa3ef0's three arms are all closed for him: no stun case (spec 5), P+0x5cde small monsters only, and no flash -- dtbase "
              "+0x6c = 0x400402, bit 2 clear, so the sense scan's flash test refuses at 0x99c58(e, 4) and P+0x59c is never set "
              "(<archive>/flashed/flashemu.py); control: the same run blinds Rathian (1080) and Fatalis with bit 2 forced on (1800). "
              "The record itself draws when held (flashmeter.mjs FORCED)")
OPEN_REASON_FLASH = {('em013_00', 'c', 1103): _FLASH_013, ('em013_01', 'c', 1103): _FLASH_013, ('em013_02', 'c', 1103): _FLASH_013}
# --- the shells table ---
shells = {}
cur = None
for l in open(os.path.join(V, 'dev', 'shells-draw-table.md'), encoding='utf8'):
    m = re.match(r'^### (em\d{3}_\d{2})', l)
    if m: cur = m.group(1); shells[cur] = collections.Counter(); continue
    if cur and l.startswith('| ') and not l.startswith('| record') and not l.startswith('|---'):
        c = [x.strip() for x in l.split('|')]
        if len(c) > 4 and re.match(r'^[a-z]+ \d+', c[1]): shells[cur][c[4]] += 1
    if l.startswith('## ') and cur and not l.startswith('## Per'): cur = None
# --- class request keys (efx/class-effects.json) ---
CE = json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))
ckeys = {c['class']: set(c['table_keys']) for c in CE['classes']}
SHARED = {'002': 'uEm001_00', '005': 'uEm004_00', '015': 'uEm014_00', '016': 'uEm014_00', '034': 'uEm014_00', '062': 'uEm060_00', '072': 'uEm071_00'}
def klass(mon): return SHARED.get(mon[2:5], 'uEm%s_00' % mon[2:5])
def triage_keys(mon):
    p = os.path.join(V, 'dev', 'effects-triage', mon + '.md')
    out = set()
    if os.path.exists(p):
        for l in open(p, encoding='utf8'):
            c = [x.strip() for x in l.split('|')]
            if len(c) > 4 and c[1] in ('u', 'c') and c[3].isdigit() and c[2] != 'RULED': out.add((c[1], int(c[3])))
    return out
def exported(mon):
    s = set()
    for side in ('', '_left', '_right'):
        p = os.path.join(V, 'docs', 'effects', mon + side + '.json')
        if os.path.exists(p):
            for e in json.load(open(p, encoding='utf8'))['effects']: s.add((e['record']['pel'][-1], e['record']['key']))
    return s
PROBES = sorted(glob.glob(os.path.join(SP, '..', 'pq', '*.out'))) + [os.path.join(SP, 'hyper_meter.out')]
PROBES = [f for f in PROBES if os.path.exists(f)]
res = {}
for (mon,) in ORDER:
    f = os.path.join(SP, mon + '.out')
    d = None
    if os.path.exists(f):
        for l in open(f, encoding='utf8', errors='replace'):
            m = re.match(r'^FAIL REPORT (\S+)\s+--\s+(\{.*\})\s*$', l)
            if m: d = json.loads(m.group(2))
    row = {'mon': mon, 'n': walk.get(mon, (0, '', ''))[0], 'name': walk.get(mon, (0, '', ''))[1], 'group': walk.get(mon, (0, '', ''))[2],
           'measured': d is not None}
    if d is None or 'error' in d:
        row['error'] = (d or {}).get('error', 'not run'); res[mon] = row; continue
    own = (mon + '|', mon + '_left|', mon + '_right|')
    recs = {r['k']: r for r in d['recs'] if r['w'] != 'shell' and r['k'].startswith(own)}
    never = list(d['never'])
    # the retry (census2.mjs: the CLIP_ACTIONS cycle and shell picks replayed over the open records) -- its starts replace the nevers
    # ...and census3.mjs (2026-10-25: copies of split clips, ACTION_EFFECTS / Special tired arms, 900-frame plays, cycle arms, both
    # pieces of a split motion), then the targeted probes (pq/*.out PROBE / HY lines) and the Hyper meter (hyper_meter.out): a later
    # measurement replaces a never, and a draw replaces a starts-no-draw
    added = []
    def take(r):
        k = r['k']
        if r.get('w') == 'shell' or not k.startswith(own): return
        if k in never: recs[k] = r; never.remove(k)
        elif k in recs and recs[k]['verdict'] not in ('draws', 'off camera') and r['verdict'] in ('draws', 'off camera'): recs[k] = r
        # lane B, 2026-10-25: a record exported AFTER the monster's base census (a newly built class request: Seltas Queen's u 0 / 1 / 2)
        # is counted from its later measurement -- before this it was in neither `recs` nor `never` and dropped out of every bucket
        elif k not in recs and k.split('|')[-1] != 'shell': recs[k] = r; added.append(k)
    for sub in ('cen2', 'cen3'):
        f2 = os.path.join(SP, '..', sub, mon + '.out')
        if os.path.exists(f2):
            for l in open(f2, encoding='utf8', errors='replace'):
                m2 = re.match(r'^FAIL REPORT (\S+)\s+--\s+(\{.*\})\s*$', l)
                if m2:
                    for r in json.loads(m2.group(2))['recs']: take(r)
    for f2 in PROBES:
        for l in open(f2, encoding='utf8', errors='replace'):
            m2 = re.match(r'^(?:PASS|FAIL) (?:PROBE|HYPER) (\S+)\s+--\s+(\{.*\})\s*$', l)
            if m2 and m2.group(1) == mon:
                for r in json.loads(m2.group(2)).get('rows', []):
                    take({'k': r['k'], 'w': r['k'].split('|')[-1], 'verdict': r['verdict'], 'clips': r.get('clips')})
    # lane A2, 2026-10-26: a record exported after every measurement that never started is in no measurement's rows at all (Hellblade
    # u 202, exported 2026-10-25 as `event`): count it as never started from the export itself (trap 153's other half)
    for side in ('', '_left', '_right'):
        pj = os.path.join(V, 'docs', 'effects', mon + side + '.json')
        if not os.path.exists(pj): continue
        for e in json.load(open(pj, encoding='utf8'))['effects']:
            if e.get('when') in (None, 'shell'): continue
            k = '%s%s|%s|%d|%s' % (mon, side, e['record']['pel'], e['record']['key'], e['when'])
            if k not in recs and k not in never: never.append(k); added.append(k)
    B = collections.defaultdict(list)
    for k, r in recs.items():
        if r['verdict'] in ('draws', 'off camera'): B['draws'].append(k)
        elif (mon, k.split('|')[2]) in DRAWS_NOTHING:   # the acceptance date: 2026-10-26 where the reason says so (lane B2 / B3), else 2026-10-25
            _dn = DRAWS_NOTHING[(mon, k.split('|')[2])]
            B['refusal'].append((k, 'the ROM draws nothing (accepted %s): ' % ('2026-10-26' if 'accepted 2026-10-26' in _dn else '2026-10-25') + _dn))
        else: B['starts_nodraw'].append((k, r['verdict'], r.get('clips')))
    for k in never:
        _, pel, key, when = k.split('|')
        if when in ('shell',): continue
        why = refusal(mon, pel, key, when)
        if why and why[0] == 'refusal': B['refusal'].append((k, why[1]))
        else: B['open'].append((k, why[1] if why else when))
    # not requested: a class site's key the pel holds, the viewer exports no record of it
    ex = exported(mon); tk = triage_keys(mon)
    for key in sorted(ckeys.get(klass(mon), ())):
        if ('u', key) in tk and ('u', key) not in ex:
            if (mon, key) in NR_ACCEPTED_A:  # lane A's, accepted 2026-10-26: a named refusal
                B['refusal'].append(('%s|%su|%d|class' % (mon, mon, key), 'the ROM never requests it (accepted 2026-10-26): ' + NR_ACCEPTED_A[(mon, key)])); continue
            if (mon, key) in NR_REASON_A:   # lane A 2026-10-25: a ROM reason brought to the coordinator, still not requested
                B['not_requested'].append(('u %d' % key, 'ROM REASON TO BRING (lane A, 2026-10-25): ' + NR_REASON_A[(mon, key)])); continue
            if (mon, key) in NR_REASON:     # accepted 2026-10-25: a named refusal, not a missing export
                B['refusal'].append(('%s|%su|%d|class' % (mon, mon, key), 'the ROM never requests it (accepted 2026-10-25): ' + NR_REASON[(mon, key)]))
            else:
                B['not_requested'].append(('u %d' % key, 'class request site key (efx/class-effects.json), not exported'))
    row.update({b: B[b] for b in ('draws', 'starts_nodraw', 'not_requested', 'refusal', 'open')})
    row['universe'] = d['universe'] + len(added); row['secs'] = d['secs']; row['inputs'] = len(d['inputs'])
    row['shells'] = dict(shells.get(mon, {}))
    res[mon] = row
json.dump(res, open(os.path.join(SP, 'census.json'), 'w'), indent=0)
# --- the markdown ---
GROUPS = ['Flying Wyvern', 'Brute Wyvern', 'Bird Wyvern', 'Fanged Wyvern', 'Fanged Beast', 'Piscine Wyvern', 'Leviathan', 'Amphibian',
          'Snake Wyvern', 'Temnoceran', 'Carapaceon', 'Neopteron', 'Elder Dragon', '???']
L = []
tot = collections.Counter()
for g in GROUPS:
    rows = [r for r in res.values() if r['group'] == g]
    if not rows: continue
    L.append('### ' + g + '\n')
    L.append('| # | monster | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |')
    L.append('|---|---|---|---|---|---|---|---|---|')
    for r in sorted(rows, key=lambda r: r['n']):
        if 'error' in r:
            L.append('| %d | %s (%s) | -- | -- | -- | -- | -- | -- | %s |' % (r['n'], r['name'], r['mon'], 'NOT MEASURED: ' + r['error'])); continue
        sh = r['shells']; shd = sh.get('DRAWS', 0); sho = sum(sh.values()) - shd
        c = [len(r[b]) for b in ('draws', 'starts_nodraw', 'not_requested', 'refusal', 'open')]
        for b, v in zip(('draws', 'starts_nodraw', 'not_requested', 'refusal', 'open'), c): tot[b] += v
        tot['records'] += r['universe']; tot['sh_d'] += shd; tot['sh_o'] += sho
        L.append('| %d | %s (%s) | %d | %d | %d | %d | %d | %d | %s |' % ((r['n'], r['name'], r['mon'], r['universe']) + tuple(c) + (('%d / %d' % (shd, sho)) if sh else '--',)))
    L.append('')
L.insert(0, '| all | records | draws | starts, no draw | not requested | named refusal | open | shells: draw / other |\n|---|---|---|---|---|---|---|---|\n| **%d monsters** | %d | %d | %d | %d | %d | %d | %d / %d |\n' % (
    sum(1 for r in res.values() if 'error' not in r), tot['records'], tot['draws'], tot['starts_nodraw'], tot['not_requested'], tot['refusal'], tot['open'], tot['sh_d'], tot['sh_o']))
# the list: every record not 'draws' and not a named refusal
X = ['', '## Every record that is not drawing and not a named refusal', '', '| # | monster | record | bucket | detail (meter verdict / when / clips) |', '|---|---|---|---|---|']
for r in sorted(res.values(), key=lambda r: r['n']):
    if 'error' in r: continue
    for k, v, clips in r['starts_nodraw']:
        _, pel, key, when = k.split('|'); X.append('| %d | %s | %s %s (%s) | starts, no draw | %s; %s |' % (r['n'], r['mon'], pel[-1], key, when, v, ', '.join(clips or [])))
    for k, why in r['not_requested']: X.append('| %d | %s | %s | not requested | %s |' % (r['n'], r['mon'], k, why))
    for k, when in r['open']:
        _, pel, key, w = k.split('|'); X.append('| %d | %s | %s %s (%s) | open | %s |' % (r['n'], r['mon'], pel[-1], key, w, when if ' ' in when else 'exported, never started under the census inputs'))
open(os.path.join(SP, 'coverage_tables.md'), 'w', encoding='utf8').write('\n'.join(L + X) + '\n')
print('\n'.join(L[:3]))
print(dict(tot))
