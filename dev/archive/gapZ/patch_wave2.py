P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    o = old.replace('\n', nl); n = new.replace('\n', nl)
    assert s.count(o) == 1, (old[:80], s.count(o)); s = s.replace(o, n)
rep("""      // index 5 then sets phase 3 and plays L2 Motion[3] again from frame 40 (0xd17e30..0xd17e54), which makes modes
      // 18 and 19 at 176.0 of that second play (0xd17130..0xd172cc). The viewer has no action phase, so only the
      // first wave is listed; the second is NOT MODELLED.
      { action: [7, 0x4d], code: 0xd16e08, args: [5], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [15, 16, 17], spawner: 0xd16e08, pick: 'ai', variant: '7:0x4d' },""",
"""      // index 5 then sets phase 3 and plays L2 Motion[3] again from frame 40 (0xd17e30..0xd17e54: 0xafce8, blend 20, start 40) at 200.0
      // (0xd17df8, the table's second word 0xd17f54), which makes modes 18 and 19 at 176.0 of that second play (0xd17130..0xd172cc), then
      // L2 M13 at 254.0. FIVE bolts in all: 0, +-55 (life 72) and, 136 frames later, +-33 (life 72) -- the fan's slices. `wave2`: on the
      // Special entry 'S. Motion 3 (7:0x4d)' (render/monster.js ROM_ANIMATIONS: the same motion set again shows here as a wrap to frame 40,
      // the action going on), the second play's 176.0 crossing makes modes 18 / 19 and the first wave is not made again. A plain L2 M3 play
      // has no second play (the viewer's clip runs on into its _loop), so it makes the first wave only.
      { action: [7, 0x4d], code: 0xd16e08, args: [5], list: '2', clip: 'Motion[3]', frame: 176.0, shell: 'shell03',
        modes: [15, 16, 17], spawner: 0xd16e08, pick: 'ai', variant: '7:0x4d', wave2: { again: 40, frame: 176.0, modes: [18, 19] } },""")
rep("""    } else if (passed && a.spawner === 0xd16e08){
      // Khezu's lightning: the action's index makes its whole triple in this step, each bolt inited here and moved below
      const got = boltInputs(input);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, modes: (a.modes || []).slice(), why: got.why });
      else for (const S of spawnBolts(state, D, a, state.prevJoints, ctx, got, out)){ out.spawned.push(S); state.shells.push(S); }""",
"""    } else if (passed && a.spawner === 0xd16e08){
      // Khezu's lightning: the action's index makes its whole triple in this step, each bolt inited here and moved below. (7, 0x4d)'s
      // phase 3 (`wave2`): after the motion was set again from `again` (a wrap to it in this action: state.again003), its own modes
      const w2 = a.wave2 && state.again003 === a ? a.wave2 : null;
      const b = w2 ? { ...a, modes: w2.modes } : a;
      const got = boltInputs(input);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, modes: (b.modes || []).slice(), why: got.why });
      else for (const S of spawnBolts(state, D, b, state.prevJoints, ctx, got, out)){ if (w2) S.wave = 2; out.spawned.push(S); state.shells.push(S); }""")
# the wrap to `again` marks the action's second play (before the spawn tests)
rep("""  ctx.ownerAction = a && a.action ? a.action : null;
  // THE ACTION CLOCK (shells lane, 2026-10-26; rom-map trap 162)""",
"""  ctx.ownerAction = a && a.action ? a.action : null;
  // Khezu's (7, 0x4d) phase 3: the motion set again from 40 reaches the shells as a wrap to that frame (loopStart = 40) in the same action
  if (fresh) state.again003 = null;
  else if (a && a.wave2 && ctx.wrapped && state.loopStart === snapFrame(a.wave2.again)) state.again003 = a;
  // THE ACTION CLOCK (shells lane, 2026-10-26; rom-map trap 162)""")
open(P, 'wb').write(s.encode('utf8')); print('ok')
