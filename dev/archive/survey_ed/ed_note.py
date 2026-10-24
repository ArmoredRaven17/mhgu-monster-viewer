"""Elder Dragons effects survey note (survey agent for the Viewer agent, 2026-10-15). Adapted from bw_note.py."""
import json, os, re, glob
SP = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(SP, 'survey.json')))
D = json.load(open(os.path.join(SP, 'detail.json')))
names = {m['id']: m['name'] for m in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf-8'))['monsters']}
DELIB = {1106, 1500, 1200, 1201} | set(range(1130, 1138)) | set(range(1301, 1316))
SHARED_OK = {1100, 1108}          # driven by SharedStates (the Poisoned / Dung toggles); the classifier miscounts them
# Raven's own parking (board 2026-09-15, "hide the aura effects that still need work"): Teostra's fire aura u 0.
PARKED = {('em027_00', 'u0(rage)')}
soak = {}
for f in glob.glob(os.path.join(SP, 'soak', '*.log')):
    mon = os.path.basename(f)[:-4]
    t = open(f, encoding='utf-8', errors='replace').read()
    last = [l for l in t.splitlines() if 'motions played' in l]
    ref = [re.sub(r'\s+', ' ', l.strip())[:160] for l in t.splitlines() if 'REFUSED' in l]
    soak[mon] = (last[-1].split(': ', 1)[1] if last else ('viewer never came up' if 'never came up' in t else 'no result'), ref)
# the CLIP_EFFECTS size per monster: a soak whose count falls short of it stopped early (board, 2026-09-26)
import io as _io
_src = _io.open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js', encoding='utf-8', newline='').read().split('\n')
_s0 = next(i for i, l in enumerate(_src) if l.startswith('export const CLIP_EFFECTS'))
_e0 = next(i for i in range(_s0 + 1, len(_src)) if _src[i] == '};')
CLIPN, _cur = {}, None
for _l in _src[_s0:_e0]:
    _m = re.match(r'  (em\d{3}_\d{2}): \{', _l)
    if _m: _cur = _m.group(1); CLIPN[_cur] = 0; continue
    if _cur and re.match(r"\s+'[^']+ Motion\[\d+\]'", _l): CLIPN[_cur] += 1

# The class's PSL enable word (vt+0x13c, main.data VA 0x1728000), read 2026-10-15; control: uEm004_00 0xd2e0ec,
# uEm007_00 0xd4532c, uEm084_00 0x106cae8 all match, and vt+4 gives 0x6bdd4 on every class.
WORD = {
    'em011_00': 'override `0xd73a18`', 'em012_00': 'override `0xd77ac8`', 'em013_00': 'override `0xd8aecc`',
    'em013_01': 'override `0xd8aecc`', 'em013_02': 'override `0xd8aecc`', 'em024_00': 'override `0xdfd19c`',
    'em025_00': '**base `0xca170`**', 'em027_00': 'override `0xe1a9d8`', 'em050_00': 'override `0xece27c`',
    'em058_00': '**base `0xca170`**', 'em072_00': 'override `0xfc08a8` (uEm071_00)', 'em084_00': 'read (psl-mask.js)',
    'em086_00': '**base `0xca170`**',
}

# Per monster: the assessment of each gap's cause and what closes it. Sources cited inline; unread says unread.
ASSESS = {
'em011_00': [
 '**u 0 / u 60 / u 61 are exported as `clip` but no PSL bit names them** -- they are UNIQUE records the class asks '
 'for itself: the lightning aura, `vtable +0x208` 0xd6df64, READ (E:\\offline\\decode\\notes\\states-em011_00.md 5.2): '
 'calm u 0 every 40 f (joint 0, suppressed on L3 M4 / M5 / M7 / M8 and L4 M6); enraged u 61 every 32 f (no joint) '
 'while the horn is intact (`breakLevel(0) < 2`), and u 60 every 45 f (joint 0, pos (0, 0, 30)), neither during the '
 'rage roar (1, 6). The table keys of uEm011_00 are exactly {0, 60, 61} (class-effects.json). Needs: retag from `clip` '
 'and a small periodic class driver (RAGE_PUFF\'s shape cannot carry it: a calm record, two periods, a motion '
 'suppress list and the horn gate). Mechanism read; runtime not built.',
 'Rage puff: none, deliberately -- the class writes `e+0xb7d2 = 0` (0xd6d19c, states-em011_00.md 1.3) and '
 '`em011_00u` has no 1120 / 1121.',
 'Enable word `0xd73a18` (skimmed 2026-10-15, not transcribed): 0xca170, then by motion id -- L4 M7 (0x407) with '
 'action (7, 5 / 7 / 11 / 13 / 45..48) ORs 0x238000 (bits 15-17, 21), with (1, 6) ORs 0x3c0000 (bits 18-21); L2 M4 '
 '(0x204) ORs 0x7000000 (bits 24-26) when `0x6fe88(e, 7, 2)` is 0 (0x6fe88 unread). That covers u 350 / 351 / 352 / '
 '200 / 201 and u 352\'s L2 M4 b24; u 200 / u 201 come in with --apply; u 230 (em011_00_003) is `partial: type 20 '
 'not built`.',
],
'em012_00': [
 '**u 1000 / u 1001 (part breaks, `event`)**: no MOTION_STATES block and no states note for em012_00 -- the break '
 'ladder and its reaction clips are UNREAD (states read needed: E:\\offline\\decode\\notes has no states-em012_00.md).',
 '**u 1120 / u 1121 (rage puff)**: no `e+0xb7d2` / `+0xb7d3` / `0x5d04` immediate in the class band 0xd751cc..0xd7ba60 '
 '(controls: Alatreon 0xec4a94 and Ukanlos 0xe5a2dc found the same way), vt+0x2a4 = 0x6bf64 (the base pick, always 0): '
 'the shared puff runs. Config-only: RAGE_PUFF {period 30, pick () => 0, joint: the record\'s, as the dromes} + `_autoOnRage`. '
 '(Band = address range from class-effects.json, membership not proven.)',
 'Enable word `0xd77ac8` (skimmed): 0xca170, then `+0x13f4 |= 0x3f8000 | 0x7c00000` UNCONDITIONALLY (bits 15-26), '
 'then two calls per matching (13, motion) entry of a table at `e+0xb6ec` (`0x7db70`, `0xb07b4` -- not read for the '
 'word). Zero bindings outside the file mask, so the transcription changes the state gating only. No c 11xx records '
 'exist for him (none exported).',
],
'em013_00': [
 '**c 1101 / 1102 / 1103 (paralysis, sleep, stun) and u 1000 (break)**: no MOTION_STATES block, no states note for '
 'em013 -- the (10, 0x1f) / sleep / stun scripts and the break ladder are UNREAD (states read needed; '
 'efx/agents/notice-scratch/probe.py + scr.py resolve status-10 scripts).',
 '**u 1120 / u 1121**: the class has its OWN puff pick, vt+0x2a4 = `0xd7e800` (unread), and sets `P+0x5d04 = 4` '
 '(0xd7d964..0xd7d980); no `e+0xb7d2` write in the band, so the shared puff runs with that pick. Needs the pick read '
 '(as Akantor / Ukanlos / Rathian have theirs) + RAGE_PUFF + `_autoOnRage`.',
 'Enable word `0xd8aecc` (skimmed): 0xca170, then by motion id and the VARIANT byte `e+0xb5f5` -- L2 M5 / M6 under '
 '(7, 0x3b / 0x3c) and variant 1 bits 15-17, under (7, 0 / 0x13) and variant 2 bits 18-20; L0 M5 under (13, 0), (7, '
 '0x15) or (1, 3 / 10 / 12) bits 21-23. One method, three variant arms (Fatalis / Crimson / Old).',
],
'em024_00': [
 '**c 1101-1105, c 1109, u 1000**: no MOTION_STATES block, no states note for em024 -- UNREAD (states read).',
 '**u 900 / u 905 (tail sever)**: CUT_TAIL entry; `em024_00_tail.glb` is staged; the sever joint (`+0x1477`, the kind '
 'byte at the class\'s `bl 0xc2274`) is UNREAD.',
 '**u 1120 / u 1121**: no `e+0xb7d2` write, vt+0x2a4 base: the shared puff runs -- config-only RAGE_PUFF + `_autoOnRage`.',
 '**u 220 / u 240 tagged `rage` are his WIND BARRIER** (UNIQUE em024_00_100 / em024_00_101, distinct from the SEQUENCE '
 '220 / 240 that already fire as clip records). READ on the board (2026-09-14, "Kush\'s wind barrier"): `vtable +0x208` '
 '0xdeffc4 holds it at `e+0xcac8`, ids 1004..1007 -> keys 210 / 220 / 230 / 240 by `[ctl+0x2c]` (scale) and `[ctl+0x2d]` '
 '(the file: the snow maps, rom-map 0xdef0c8); the aura level is `P+0x1bb` (rom-map 0xdfc814). So `rage` with 220 and '
 '240 both on is not the ROM\'s shape, 210 / 230 are not exported, and the records are placement MODE 4 (camera-attached, '
 'READ 2026-10-05, dev/effect-placement-mode4.md) -- they refused at 0x329e68 before the camera chain was lifted; the '
 'board\'s open item says re-record (predicted 0x31d298).',
 'The class writes `e+0xb7d3 = 0` in its per-reset init `vtable +0x1d8` 0xdef008 (at 0xdef18c; r4 = the enemy): the '
 'shared TIRED DROOL switch (0xa42c0) -- so c 1104 likely never fires for him (INFERRED: no later re-set was looked for).',
 'Unexported c 61 / c 62 (cm202_020, L2 M3 / M4, inside the file mask) are the stage-ray records refused before '
 '2026-10-07: now recordable (--apply / --record).',
 'Enable word `0xdfd19c` (skimmed): 0xca170, then `0x1c0000` when `ctl+0x2c == 1 && ctl+0x2d != 0`, else a table word '
 'indexed by the aura level `P+0x1bb` (0xff -> 0; 3 -> 2 or 3 and 2 -> 1 or 2 by `ctl+0x18`). One outside-mask binding, '
 'u 286, names no record: state gating only.',
],
'em025_00': [
 '**c 1101-1105, c 1109, u 1000**: no MOTION_STATES block, no states note -- UNREAD.',
 '**u 900 / u 905**: CUT_TAIL; `em025_00_tail.glb` staged; sever joint UNREAD.',
 '**u 1120 / u 1121**: own pick vt+0x2a4 = `0xe025f0` (unread), `P+0x5d04 = 4` (0xdff2dc..0xdff2ec); no `e+0xb7d2` write: '
 'the shared puff runs with that pick.',
 'Unexported u 240 (cm202_020, L2 M6 / M8, inside the mask): a stage-ray record, now recordable.',
 'Enable word: the BASE `0xca170` -- `() => 0` + --apply, zero outside-mask bindings (state gating only).',
 'Class table empty (class-effects.json lists three sites 0xe110ec.., which are in uEm027_00\'s band -- rom-map trap, '
 'class-effects over-reports across class boundaries). His invisibility is materials, not effects.',
],
'em027_00': [
 '**u 0 (`rage`) is the fire aura, PARKED BY RAVEN** (board 2026-09-15: "hide the aura effects that still need work"; '
 'em027_00 taken off `_autoOnRage`). Not a gap until he lifts it. READ: `vtable +0x208` 0xe10f7c fires ids 1001..1005 = '
 'keys 0, 10, 1, 2, 3 (board; dev/monster-review.md 3871); keys 1 (em027_00_018) and 2 / 3 (em027_00_019) were removed '
 'on Raven\'s visual call -- his to reverse.',
 '**c 1101-1103, u 1000**: no states note -- UNREAD.',
 '**u 900 / u 905**: CUT_TAIL; `em027_00_tail.glb` staged; sever joint UNREAD.',
 '**u 1120 / u 1121**: no `e+0xb7d2` write, vt+0x2a4 base: the shared puff runs -- config-only RAGE_PUFF (`_autoOnRage` '
 'is what Raven took him off; ask before re-adding).',
 'Enable word `0xe1a9d8` (skimmed): 0xca170, then L1 M14 under number 0x27 bits 18-20; L2 M1 under number 10 / 21 / 22 '
 'bits 24-26; bits 15-17 when `0xa1f0c(e, 2) == 0` and `P+0x1bb` is not 0 / 0xff (and L4 M6 clears bits 6-8); and '
 '**it stops the effect handle at `e+0xcacc`** (`0x329c40(h, 0)`) on every motion but L4 M9 -- a side effect inside '
 'the word\'s method, unread. u 285 / 286 / 289 (outside the mask, not exported) come in with it.',
 'Nine PSL keys inside the file mask name no record in either pel (u 200 / 210 / 220 / 230 / 240 / 250, c 62 / 70 / 150): '
 'not effects.',
],
'em050_00': [
 'Every exported record is driven (states-em050_00.md; RAGE_PUFF em050_00 with his own form-picked puff; CUT_TAIL).',
 'Enable word `0xece27c`: NOT skimmed to its end -- its two jump tables (0xece2c4, 0xece390) reach past the first '
 'return (0xece478), so the extent is open. 9 bindings outside the mask; u 200 / 231 / 240 / 450 / 451 / 550 '
 '(not exported) come in with it.',
],
'em058_00': [
 '**c 1101-1103, u 1001**: no states note -- UNREAD.',
 '**u 900 / u 905**: CUT_TAIL; `em058_00_tail.glb` staged; sever joint UNREAD.',
 '**u 1120 / u 1121 are NOT the shared puff for him**: the class writes `e+0xb7d2 = 0` in `vtable +0x1d8` 0xf06dbc (at 0xf07178), which '
 'switches the shared request off (0xa424c), and 1120 / 1121 are in his own class table (with 0-3, 100-102, 1600, '
 '1601): Alatreon\'s pattern -- his own puff, UNREAD.',
 'Enable word: the BASE `0xca170` -- `() => 0`, zero outside-mask bindings.',
],
'em072_00': [
 'Shagaru is not in efx/class-effects.json under his own number: he runs **uEm071_00** (Gore\'s class; vtable '
 '0x17e418c; dev/shell-map.md -- the class tests `+0xb5f4` against 71 and 72; dev/notice-marks.md).',
 '**c 1101-1103, u 1000, u 1001**: no states note for em071 / em072 -- UNREAD.',
 '**u 900 / u 905**: CUT_TAIL; `em072_00_tail.glb` staged; sever joint UNREAD.',
 '**u 1120 / u 1121**: own pick vt+0x2a4 = `0xfbec80` (unread), `P+0x5d04 = 4` (0xfadb58 / 0xfadbac); no `e+0xb7d2` write.',
 'Unexported c 101 (cm202_020) / c 110 (em071_00_019), inside the mask: stage-ray records, now recordable.',
 'Enable word `0xfc08a8` (26 instructions, skimmed whole): 0xca170, then only on L2 M7 (0x207) under action (7, 0x58) '
 'bits 15-17 or (7, 0x60) bits 18-20, each also CLEARING bits 6 and 9 (`bic #0x240`). No variant test -- Gore and '
 'Shagaru share it. u 260 (L2 M7 b6 / b9 / b15 / b18) comes in with it; the other 21 outside-mask bindings are base '
 'bits (0-5 / state groups).',
],
'em084_00': [
 'Enable word READ and transcribed (psl-mask.js CLASS_MASK.em084_00; dev/em084-psl-mask.md).',
 '**u 1120 / u 1121**: in `_autoOnRage` but no RAGE_PUFF entry. No `e+0xb7d2` write, vt+0x2a4 base: the shared puff '
 'runs -- config-only. ALSO: his class asks u 1121 itself through `0xa499c(e, 1)` at 0x10739d0 (L0 M50) and 0x1073474 '
 '(group-6 dispatcher) -- READ, rom-map "u 1400 -- the per-class sweep" (a row on L0 M50; the hold / start shape '
 'is the site\'s to read).',
 '**u 1400 (`event`)**: no class site (rom-map sweep: both sites resolve 1121) -- he closes on the shared one-shot '
 'latch 0xadc98, whose gate bits (`+0x1404` bits 20 / 21, `+0x1408` bit 0) are NOT READ.',
 '**32 tentacle PSL records** (u 0 / 10 / 50 / 51 / 90 / 105.. on the `l_N` / `r_N` lists) are left out as "entity motion: '
 'not bound -- the viewer hangs every effect from the body": board PHASE 3 of the Tentacle Form item; the arm\'s enable '
 'method 0x107f0e4 is READ (dev/em084-psl-mask.md 6); needs the arm as an effect parent for PSL clip effects.',
 'Class records READ but not exported: c 800 x3 at L3 M65 (0x106af68, rom-map), c 1600 / c 1601 on (10, 0x6a) '
 '(0x1067be0). Mechanism read; a CLIP_ACTIONS / MOTION_STATES-style row each.',
],
'em086_00': [
 '**c 1101-1103, c 1105, u 1000, u 1001**: no states note -- UNREAD.',
 '**u 900 / u 905**: CUT_TAIL; `em086_00_tail.glb` staged; sever joint UNREAD.',
 '**u 1120 / u 1121 are NOT the shared puff**: the class writes `e+0xb7d2 = 0` in `vtable +0x1d8` 0x109e0c8 (at 0x109e180) and holds 1120 / '
 '1121 in its own table (with 100 / 110 / 120 / 130 / 200 / 1130): his own puff, UNREAD.',
 'Enable word: the BASE `0xca170` -- `() => 0`. Its one outside-mask binding (u 101, L1 M2 b15) is then correctly off.',
 'Class table key u 130 not exported (class-effects.json); sites 0x109ab60.. unread here.',
],
}
ASSESS['em013_01'] = ['As Fatalis (`em013_00`): the same class, the same gaps -- c 1101-1103, u 1000, u 1120 / u 1121 (pick 0xd7e800), the variant-1 arm of `0xd8aecc`.']
ASSESS['em013_02'] = ['As Fatalis (`em013_00`): the same class, the same gaps; the variant-2 arm of `0xd8aecc` (10 outside-mask bindings: u 202 on L4 M8 / M9, u 290 L4 M12, u 601 L4 M8 / M9). Not in SHELL_DATA: his beam id 0x8c starts no effect (beam-spawns.js, dev/beams/em013_00.md).']

L = []
L.append('# Elder Dragons -- effects survey (survey agent for the Viewer agent, 2026-10-15)\n')
L.append('Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."\n')
L.append('Scope: Kirin, Lao-Shan Lung, Fatalis / Crimson / Old, Kushala Daora, Chameleos, Teostra, Alatreon, Amatsu, '
         'Shagaru Magala, Nakarkos, Valstrax. Assessment only: nothing under docs/ was changed, no recorder or lift ran.\n')
L.append('## How it was measured\n')
L.append('- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared '
         'states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the '
         'state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the '
         'deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), '
         'c 1500 (lying in water), c 1106 (Raven). Teostra\'s fire aura u 0 is Raven\'s own parking (2026-09-15), listed but '
         'not counted.')
L.append('- **The PSL enable word**: the class\'s vtable +0x13c word read off main.data (vtable from efx/class-effects.json; '
         'controls uEm004_00 0xd2e0ec, uEm007_00 0xd4532c, uEm084_00 0x106cae8 match, vt+4 holds 0x6bdd4 on every class). '
         'add_effects.py plan() run on the blocks\' FILE masks and on the WHOLE blocks; the difference is what the enemy '
         '+0x13f4 word decides. `*` = named outside the file mask. A name with no file is a bit naming a key that has no '
         'record in any array: not an effect. The overrides were SKIMMED (capstone, from the entry to the return) to size '
         'the read -- not transcribed, not emulated.')
L.append('- **Rage puff gate**: per class, the immediates `0xb7d2` / `0xb7d3` / `0x5d04` in the class band (class-effects.json '
         '`code_lo..code_hi`, an address range, not proven membership) and vt+0x2a4 (the puff pick; 0x6bf64 = base). '
         'Controls: Alatreon 0xec4a94 (`e+0xb7d2 = 0`, states-em050_00.md) and Ukanlos 0xe5a2dc (`P+0x5d04 = 3`, rom-map) '
         'found; Kirin\'s 0xd6d19c matches states-em011_00.md 1.3.')
L.append('- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, every bound motion '
         'in the viewer, one monster at a time. A refusal stops every effect of the monster until reload.\n')
L.append('## Summary\n')
L.append('| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |')
L.append('|---|---|---|---|---|---|---|---|---|')
gapcount = {}
for i, (mon, r) in enumerate(S.items(), 1):
    ow = []
    for w in r['wiredList']:
        k = int(w.split('(')[0][1:])
        if k in DELIB or k in SHARED_OK or (mon, w) in PARKED: continue
        ow.append(w)
    gapcount[mon] = ow
    det = D.get(mon, {})
    ne = [k for k, v in det.items() if not v['exported'] and v['efl']] if det else (r['pslRecordsNotExported'] if mon != 'em084_00' else [])
    if mon == 'em084_00': ne = ['32 on the tentacle lists']
    ne = [x + ' (partial: type 20)' if (mon, x) == ('em011_00', 'u230') else x for x in ne]
    sk = soak.get(mon, ('not run', []))
    L.append('| %d | %s `%s` | %d | %d | %s | %s | %d | %s | %s |' % (
        i, names.get(mon, mon), mon, r['exported'], r['implemented'] + sum(1 for w in r['wiredList'] if int(w.split('(')[0][1:]) in SHARED_OK),
        ' '.join(ow) or '--', WORD[mon], r['outsideMaskBindings'],
        ' '.join(ne) or '--', ('**%d refused**' % len(sk[1])) if sk[1] else ('clean' if sk[0].startswith(tuple('0123456789')) else '**' + sk[0] + '**')))
L.append('')
L.append('## Per monster\n')
for mon, r in S.items():
    L.append('### %s (`%s`)\n' % (names.get(mon, mon), mon))
    sk = soak.get(mon, ('not run', []))
    L.append('- Soak: %s (CLIP_EFFECTS holds %s motions)' % (sk[0], CLIPN.get(mon, '?')))
    for x in sk[1]: L.append('  - REFUSED: `%s`' % x)
    if r['enableWordRead']:
        L.append('- Enable word read: every named PSL bit is bound as the class gives it.')
    else:
        L.append('- Enable word %s, not transcribed: %d bindings named outside the file mask (%d file-mask bindings, %d whole-block).'
                 % (WORD[mon], r['outsideMaskBindings'], r['pslBindingsFileMask'], r['pslBindingsWhole']))
    if gapcount[mon]: L.append('- Exported but undriven (not deliberate): %s' % ' '.join(gapcount[mon]))
    for a in ASSESS.get(mon, []):
        L.append('- ' + a)
    det = D.get(mon, {})
    if det:
        L.append('- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):')
        for k, v in det.items():
            if not v['efl']:
                continue
            L.append('  - %s %s `%s` (%s): %s%s' % (k, 'exported' if v['exported'] else '**not exported**', v['efl'],
                     v['types'], ' '.join(v['motions'][:8]), ' +%d more' % (v['nMotions'] - 8) if v['nMotions'] > 8 else ''))
        empty = [k for k, v in det.items() if not v['efl']]
        if empty: L.append('  - named with no record in any array (not effects): %s' % ' '.join(empty))
    L.append('')
L.append(open(os.path.join(SP, 'closing.md'), encoding='utf-8').read())
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\elder-dragons-effects-survey.md', 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('\n'.join(L[:30]))
