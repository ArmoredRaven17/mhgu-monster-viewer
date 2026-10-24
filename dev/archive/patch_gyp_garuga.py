import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:60], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""  em038_00: { severed: 8 },
};
export function shellTailInput""",
"""  em038_00: { severed: 8 },
  // Yian Garuga / Deadeye: the part pass (uEm018_00 vt+0x210 = 0xda634c) draws set 13 on vt+0x370(e, 1) -- the sever bit;
  // Deadeye's draws set 14 when not severed and part 7's break level reaches .dtp row 5's (2 at both ranks). Set 13 is
  // the only set drawing part 30 on Garuga and part 31 on Deadeye; set 14 the only one drawing Deadeye's part 30
  // (monsters.json groups). Their enable word 0xdb0d10 reads both on L2 M12 / L4 M65 / L4 M77 (psl-mask.js em018):
  // intact / broken / cut, one form each. No shell of theirs reads it (dev/em018_00-effects-spec.md 1).
  em018_00: { severed: 30 },
  em018_04: { severed: 31, broken: 30, level: 2 },
};
export function shellTailInput"""),
("""export const SHELL_PARTS = { em005_00: { headBroken: 3 }, em020_00: { skull: 109 } };""",
"""//   Gypceros's crest broken -- 0x9d36c(e, 6) (P+0x404) at the .dtp +0x64 row's level (2 at both ranks), the part pass's
//     own set-9 test; set 9 is the only set that draws part 3 (monsters.json em009_00 groups). His enable word 0xd5e768
//     drops u 320 / u 321 on L4 M3 / M8 / M25 with it (psl-mask.js em009_00; dev/em009_00-effects-spec.md 1).
export const SHELL_PARTS = { em005_00: { headBroken: 3 }, em020_00: { skull: 109 }, em009_00: { crestBroken: 3 } };"""),
])

patch('docs/render/psl-mask.js', [
("// GREAT MACCAO (em085_00), uEm085_00",
"""// GYPCEROS (em009_00), uEm009_00 vtable 0x179c5d8, +0x13c = 0xd5e768, READ whole (0xd5e768..0xd5e838; literal 0xd5e83c)
// and emulated (dev/em009_00-effects-spec.md 1). 0xca170 first, then on k = motion - 0x403 in 0..0x16:
//   * L4 M3 / L4 M8 / L4 M25 (k in 0x400021): bit 15 unless the crest is broken -- 0x9d36c(e, 6) (P+0x404) >= the .dtp
//     +0x64 row's level (2 at both ranks), the part pass's own set-9 test: u 320 / u 321 / u 320 with the crest on.
//     The viewer reads it from the parts SHOWN (motion-states.js SHELL_PARTS em009_00): state.crestBroken;
//   * L4 M7 / L4 M9 (k in 0x50): status 7 and number 0x26..0x28 -> bits 16-18 (u 280) -- the ENRAGED forms of (7, 0x1c)
//     (L4 M7) and (7, 0x0a) / (7, 0x0c) (L4 M9): cmdtbl g1 s4-s6, op 0x1c = 0x81688 (enraged);
//   * every other motion: the base alone -- L2 M12's bits 15 / 18 / 21 and L1 M104's 24 (no records) never fire.
function em009_00(motion, action, state){
  const k = motion - 0x403;
  if (k < 0 || k > 0x16) return 0;
  if ((0x400021 >>> k) & 1) return state.crestBroken ? 0 : 0x8000;
  if ((0x50 >>> k) & 1) return action && action[0] === 7 && action[1] >= 0x26 && action[1] <= 0x28 ? 0x70000 : 0;
  return 0;
}

// YIAN GARUGA (em018_00) and DEADEYE YIAN GARUGA (em018_04), one class uEm018_00, vtable +0x13c = 0xdb0d10 (vtable
// 0x17abb38), READ whole (0xdb0d10..0xdb0e50) and emulated -- the transcription below against the ROM over 8448
// combinations, 0 mismatches (dev/em018_00-effects-spec.md 1). 0xca170 first, then by motion id; the variant byte
// e+0xb5f5 == 4 (Deadeye) is tested twice:
//   * L2 M12 (0x20c), L4 M65 (0x441), L4 M77 (0x44d): vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, the tail severed) ->
//     bits 21-23; else Deadeye with part 7's break level 0x9d36c(e, 7) at or over .dtp row 5's (A[0x15] at rank <= 4,
//     A[0x16] above; both 2) -> bits 18-20; else bits 15-17. u 560 / 570 / 580, u 380 / 390 / 400, u 381 / 391 / 401:
//     intact / broken / cut (Garuga has no 570 / 390 / 391 record: his tail never breaks). Both read from the parts
//     SHOWN (motion-states.js SHELL_TAIL em018_00 / em018_04): state.severed, state.breakLevel7.
//   * L0 M7 (0x007): Deadeye only, action (7, 0xe3..0xe5) -> bits 27-29 (u 290 b27, u 531 b28).
//   * L1 M104 (0x168): bits 24-26 always (u 90 b24).   * L2 M2 (0x202): CLEARS bits 6, 9, 12 (bic 0x1240).
const em018 = v4 => (motion, action, state) => {
  if (motion === 0x007)
    return v4 && action && action[0] === 7 && action[1] >= 0xe3 && action[1] <= 0xe5 ? 0x38000000 : 0;
  if (motion === 0x168) return 0x7000000;
  if (motion === 0x202) return { set: 0, clear: 0x1240 };
  if (motion === 0x20c || motion === 0x441 || motion === 0x44d)
    return state.severed ? 0xe00000 : (v4 && (state.breakLevel7 | 0) >= 2) ? 0x1c0000 : 0x38000;
  return 0;
};
const em018_00 = em018(false), em018_04 = em018(true);

// GREAT MACCAO (em085_00), uEm085_00"""),
("em079_00, em079_04, em085_00, em008_00 };", "em079_00, em079_04, em085_00, em008_00, em009_00, em018_00, em018_04 };"),
("'em079_00', 'em079_04', 'em085_00', 'em008_00'];", "'em079_00', 'em079_04', 'em085_00', 'em008_00', 'em009_00', 'em018_00',\n  'em018_04'];"),
("""  em085_00: {
    '0|Motion[21]': [{ action: [1, 0x04] }, { action: [1, 0x0f] }],
  },
};""",
"""  em085_00: {
    '0|Motion[21]': [{ action: [1, 0x04] }, { action: [1, 0x0f] }],
  },
  // GYPCEROS, L4 M9 / L4 M7: the status-7 table 0xd5c260 plays L4 M9 for (7, 0x0a / 0x26 / 0x29) and (7, 0x0c / 0x28 /
  // 0x2b) (0xd5c418), L4 M7 for (7, 0x1c / 0x27 / 0x2a) (0xd5c464). Command streams g1 s4-s6 issue the 0x26..0x28 form
  // while ENRAGED (op 0x1c = 0x81688) and the calm one otherwise, so each entry's `rage` is the form shown while the
  // rage toggle is on (dev/em009_00-effects-spec.md 2). NR: op 0x80's condition, under which the calm form is issued
  // even enraged.
  em009_00: {
    '4|Motion[9]': [{ action: [7, 0x0a], rage: [7, 0x26] }, { action: [7, 0x0c], rage: [7, 0x28] }],
    '4|Motion[7]': [{ action: [7, 0x1c], rage: [7, 0x27] }],
  },
  // DEADEYE, L0 M7: the status-2 plays (2, 0x02) / (2, 0x13) give the base word; (7, 0xe3) and (7, 0xe5) -- the
  // (7, 0xe4) chain -- give bits 27-29 (u 290, u 531). Both ROM plays begin at frame 18; the viewer plays the clip from
  // 0 (dev/em018_00-effects-spec.md 3). Garuga's word reads no action.
  em018_04: {
    '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3] }, { action: [7, 0xe5] }],
  },
};"""),
("""// `tired` / `rage` the state shown at its start (the op-0x24 arm)
export function clipActionFor(monId, list, clip, n, { tired = false, rage = false } = {}){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return null;
  const e = a[((n | 0) % a.length + a.length) % a.length];
  return (tired && !rage && e.tired) ? e.tired : e.action;""",
"""// `tired` / `rage` the state shown at its start (the op-0x24 arm; an entry's `rage` is the form a stream issues while
// enraged -- Gypceros's op 0x1c, 0x81688)
export function clipActionFor(monId, list, clip, n, { tired = false, rage = false } = {}){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return null;
  const e = a[((n | 0) % a.length + a.length) % a.length];
  if (rage && e.rage) return e.rage;
  return (tired && !rage && e.tired) ? e.tired : e.action;"""),
])

patch('docs/index.html', [
("""  const severed = !!shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn).tailSevered;""",
"""  const tailNow = shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn);
  const severed = !!tailNow.tailSevered;
  // Deadeye's word reads part 7's break level too, and Gypceros's his crest (psl-mask.js em018 / em009_00): the parts SHOWN
  const breakLevel7 = tailNow.breakLevel7 | 0;
  const crestBroken = !!shellPartsInput(state.id, mounted.main && mounted.main.userData.partsDrawn).crestBroken;"""),
("""pslMask(state.id, list, slot, action, { rage, tired, severed, posture, charge, sunk })""",
"""pslMask(state.id, list, slot, action, { rage, tired, severed, breakLevel7, crestBroken, posture, charge, sunk })"""),
])
print('ok')
