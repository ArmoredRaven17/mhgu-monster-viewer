import os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
cur = {}
def load(p):
    cur['p'] = os.path.join(V, p); cur['s'] = open(cur['p'], encoding='utf-8', newline='').read()
def rep(a, b):
    s = cur['s']; assert s.count(a) == 1, (s.count(a), a[:80]); cur['s'] = s.replace(a, b)
def save():
    open(cur['p'] + '.tmp', 'w', encoding='utf-8', newline='').write(cur['s']); os.replace(cur['p'] + '.tmp', cur['p'])

load(r'docs\render\psl-mask.js')
rep("export const CLASS_MASK = { em003_00, em005_00,", """// BARIOTH (em042_00), uEm042_00 vtable +0x13c = 0xe70b78 (vtable 0x17be9a0; +0xf0 the base 0xca52c), READ whole
// (0xe70b78..0xe70d14) and emulated -- 74880 runs against the ROM, 0 mismatches (dev/em042_00-effects-spec.md 1, 6).
// 0xca170 first, then by motion id -- no variant, posture or part-break input:
//   * L2 M8 (0x208), status 7, number in 0 / 1 / 0x0f / 0x14 / 0x1c / 0x1e, tail on -> bits 15-16 (u 200 on (7, 0x0f) /
//     (7, 0x14), the two that play it);
//   * L2 M9 / M10, the same six -> bits 15-16 (nothing bound), 0x21 / 0x22 -> bits 17-18 (u 240), tail on only. The remap
//     vt+0x1fc 0xe64f48 makes (7, 0) / (7, 1) INTO 0x21 / 0x22 while the tail is on, so every intact play fires u 240;
//   * L0 M4, (1, 0) or (1, 0x0e) -> bits 19-20 (c 90 on the rage roar), no sever test;
//   * every other motion: the base alone -- L2 M32 / M33's u 324 / 325 / 330 / 331 / 340 / 341 are never enabled.
const EM042_A = n => (n === 0 || n === 1 || n === 0x0f || n === 0x14 || n === 0x1c || n === 0x1e);
function em042_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion === 0x004) return action && action[0] === 1 && (action[1] === 0 || action[1] === 0x0e) ? 0x180000 : 0;
  if (state.severed) return 0;                                         // both tail arms test P+0x3b4 bit 0
  if (motion === 0x208) return EM042_A(n) ? 0x18000 : 0;
  if (motion === 0x209 || motion === 0x20a) return EM042_A(n) ? 0x18000 : (n === 0x21 || n === 0x22) ? 0x60000 : 0;
  return 0;
}
// SEREGIOS (em077_00), uEm077_00 vtable +0x13c = 0xfee088 (vtable 0x17e7c08; +0xf0 the base 0xca52c), READ whole
// (0xfee088..0xfee128) and emulated -- 69120 runs against the ROM, 0 mismatches (dev/em077_00-effects-spec.md 1, 6).
//   * EVERY motion: P+0x3b4 bit 0 -- the tail cut (0xc2274 at 0xfdae24) -- CLEARS bits 5-7 and ORs 18-20: u 200 / 201 / 230
//     (b6, calm) go, u 202 / 203 / 231 (b18) come; the enraged b9 forms stay;
//   * L2 M26 (0x21a) / L2 M34 (0x222), status 7, number 0x3a / 0x3b / 0x3f / 0x40 -> bits 15-17: u 233 on the (7, 0x3a) /
//     (7, 0x3b) dives, u 234 on the (7, 0x3f) / (7, 0x40) landings that follow them.
function em077_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  const act = (motion === 0x222 || motion === 0x21a) && n >= 0x3a && n <= 0x40 && ((0x63 >> (n - 0x3a)) & 1) ? 0x38000 : 0;
  return state.severed ? { set: 0x1c0000 | act, clear: 0xe0 } : act;
}

export const CLASS_MASK = { em042_00, em077_00, em003_00, em005_00,""")
rep("'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em003_00', 'em005_00',",
    "'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em003_00', 'em005_00',\n  'em042_00', 'em077_00',")
rep("  // KHEZU (dev/em003_00-effects-spec.md 2):", """  // BARIOTH (dev/em042_00-effects-spec.md 5, 7). L2 M8: (7, 0x0f) (L2 M7 -> L2 M8) and (7, 0x14) (L1 M17 -> L2 M14 -> L2 M8)
  // fire u 200 with the tail on; (7, 0x11) plays the same clip without it (all three become L2 M16 plays once both wing-arms
  // are broken: the remap 0xe64f48). L2 M9 / M10: (7, 0x21) / (7, 0x22) while the tail is on, (7, 0) / (7, 1) once cut --
  // the word answers both through state.severed. L0 M4: the rage roar (1, 0) fires c 90, the g0 s0 roar (1, 0x0b) does not.
  em042_00: {
    '2|Motion[8]':  [{ action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x11] }],
    '2|Motion[9]':  [{ action: [7, 0x21] }],
    '2|Motion[10]': [{ action: [7, 0x22] }],
    '0|Motion[4]':  [{ action: [1, 0x00] }, { action: [1, 0x0b] }],
  },
  // SEREGIOS (dev/em077_00-effects-spec.md 4). L2 M26 is the dive after L2 M25: (7, 0x3a) (g1 s47) and (7, 0x3b) (g1 s54)
  // fire u 233, (7, 0) / (7, 3) / (7, 0x38) do not. L2 M34 is the landing: after (7, 0) / (7, 0x3a) the dive body follows
  // into (7, 0x3f), after (7, 0x3b) into (7, 0x40), at L2 M26 f80 -- L2 M70 -> L2 M34 with u 234; (7, 8) / (7, 0x39) play
  // L2 M33 -> L2 M34 without it.
  em077_00: {
    '2|Motion[26]': [{ action: [7, 0x3a] }, { action: [7, 0x3b] }, { action: [7, 0x03] }],
    '2|Motion[34]': [{ action: [7, 0x3f] }, { action: [7, 0x40] }, { action: [7, 0x08] }],
  },
  // KHEZU (dev/em003_00-effects-spec.md 2):""")
save()

load(r'docs\render\motion-states.js')
rep("""  return { breakLevel7: t.broken != null && drawn.get(t.broken) === true ? t.level : 0, tailSevered: drawn.get(t.severed) === true };""",
    """  // `severed` may be a LIST: any of the parts drawn (Seregios lands on set 24 or 28, part 16 / part 18)
  return { breakLevel7: t.broken != null && drawn.get(t.broken) === true ? t.level : 0,
           tailSevered: [].concat(t.severed).some(p => drawn.get(p) === true) };""")
rep("  em002_00: { severed: 8 }, em002_02: { severed: 8 },", """  em002_00: { severed: 8 }, em002_02: { severed: 8 },
  // Barioth: set 19 (his sever row's) is the only set that draws part 14 (dev/em042_00-effects-spec.md 6)
  em042_00: { severed: 14 },
  // Seregios: the sever row lands on set 24 (scales flat) or 28 (erect); part 16 is drawn only on 24, part 18 only on 28
  // (dev/em077_00-effects-spec.md 6; the part pass 0xfdf644's choice of 24 / 28 on the sever bit: I)
  em077_00: { severed: [16, 18] },""")
save()
print('ok')
