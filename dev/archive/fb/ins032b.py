p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
a = """function landing032s00(S, D, hit, ctx){
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1 && (S.k.c1660 !== -1 || S.k.c1664 !== -1))
    throw new Error('shells.js: em032 shell00 mode ' + S.modeIndex + ': the landing\\'s children (0xe35624) are not transcribed');
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}"""
assert s.count(a) == 1, 'landing'
b = """function landing032s00(S, D, hit, ctx){
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1 && (S.k.c1660 !== -1 || S.k.c1664 !== -1)) children032s00(S, D, hit.point, ctx);
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
// 0xe35624(shell, &contact) (READ whole; Grimclaw's modes 23 / 26 / 29 / 35 / 41 / 45 / 48 / 51 / 54 / 57..73): +0x1660 != -1 -> a
// shell00 ([owner+0xcac8]) of that mode, 0x3f883c(0x30): +0x10.. the contact, +0x1c 0, +0x20 / +0x28 the GOT vector's x / z (0),
// +0x24 THIS shell's Y word (+0xfec, [r5 - 0x674]), +0x2e 0xffff; then +0x1664 != -1 -> a base01 ([owner+0xcac4]) of that mode,
// 0x3fa2bc(0x40): +0x10.. the contact, +0x20.. a GOT vector, +0x30 / +0x38 the first vector's x / z, +0x34 the Y word, +0x3c 0xffff
function children032s00(S, D, point, ctx){
  const st = ctx.shellState, own = ctx.own001, Y = S.angles[1] >>> 0;
  if (!st || !ctx.out) return;
  if (S.k.c1660 !== -1){
    const S2 = spawnRock(st, D, { action: S.action, shell: 'shell00', mode: S.k.c1660, frame: S.spawnFrame }, st.prevJoints, ctx,
                         { requestPos: point.slice(), requestAngles: [0, Y, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null,
                           size: own.size.slice(), target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY,
                           ownerZ: own.ownerZ });
    if (S2){
      S2.creator = S.id;
      if (own.hitLife) S2.slots = slotsOf011(D.shells.shell00, S2.mode, ctx.out.refused).filter(sl => sl.slot === 0);
      S.events.push({ ev: 'create', stepped: true, shell: 'shell00', id: S2.globalId, mode: S2.modeIndex, position: point.slice(), child: S2.id });
      st.shells.push(S2); ctx.out.spawned.push(S2);
    } else ctx.out.refused.push({ shell: 'shell00', mode: S.k.c1660, creator: S.id, why: S.monId + ' shell00 ' + S.modeIndex + ': the child init refused' });
  }
  if (S.k.c1664 !== -1 && ctx.create)
    ctx.create(S, 'shell01', { id: D.shells.shell01.id, mode: S.k.c1664, position: point.slice(), angles: [0, Y, 0], v20: [0, 0, 0],
                               action: S.action, frame: S.spawnFrame });
}"""
s = s.replace(a, b)
a = """function params032s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 0x80 : 0) | (I(1) !== -1 ? 0x20 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 4 : 0) |
                (I(4) !== -1 ? 8 : 0) | (I(5) !== -1 ? 0x1000 : 0);
  const why = !sh ? 'uShellEm032_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 } };
}"""
assert s.count(a) == 1, 'params'
b = """function params032s01(sh, def){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 0x80 : 0) | (I(1) !== -1 ? 0x20 : 0) | (I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 4 : 0) |
                (I(4) !== -1 ? 8 : 0) | (I(5) !== -1 ? 0x1000 : 0);
  const why = !sh ? 'uShellEm032_sp_01: a mode SHELL_DATA does not carry' : null;
  // GRIMCLAW's body 0xe35c50 (the id 0xc0; READ whole): Tigrex's map plus int 6 -> +0x15e8 (1 / 0), &vec 0 -> +0x1608 (the offset
  // the base turns by the words, 0x3fa65c), float 0 -> +0x1658 (the delay his +0x150 counts down before the next wave, modes 8 / 14)
  const g = !!def && def.id === 0xc0, V = i => !sh || i >= sh.vecs.length ? [0, 0, 0] : sh.vecs[i].map(f);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: g ? V(0) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 },
           i15e8: g && I(6) !== -1 ? 1 : 0, f1658: g && sh && sh.floats.length ? f(sh.floats[0]) : f(0) };
}"""
s = s.replace(a, b)
a = "  if (S.cls === 'uShellEm087_sp_01') return delay087s01(S, ctx);   // Ahtal-Neset's sp_01 +0x150 0x10c2344: the delay, then the next mode\n"
assert s.count(a) == 1, 'move'
s = s.replace(a, a.replace("  if (S.cls === 'uShellEm087_sp_01')", "  if (S.cls === 'uShellEm032_sp_01' && (S.k.flags & 0x20)) wave032(S, ctx);   // the class's sp_01 +0x150 0xe35e00 (Grimclaw's waves)\n  if (S.cls === 'uShellEm087_sp_01')"))
open(p, 'w', encoding='utf8').write(s)
print('ok')
