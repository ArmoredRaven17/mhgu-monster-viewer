p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
a = s.index("  // ---- HER COMBINED ATTACK 7:0x4e / 0x4f with his 7:0x3f, from his list")
b = s.index("  // ---- SYNC across a loop wrap and a scrub")
NEW = r"""  // ---- HER COMBINED ATTACK 7:0x4e / 0x4f with his 7:0x3f, phase by phase (0xfd58ac; shells spec 2b): M33 0..60, then three
  // spit sets of M33 from 40 (two spits a crossing, the third one), each but the last followed by M33 100..120; his flag at f105
  // of the last set, 285 frames in; her L0 M65 loops to there, then her L4 M42 from 90
  {
    await play(DUO, 'Seltas Motion[33] with her 7:0x4e');
    V.pose.action.paused = true;
    const at = async f => { V.pose.action.time = f / 60; await frames(2); const q = await P(); return q.local && q.local.clip + '@' + q.local.frame; };
    const want = { 0: 'Motion[33]@0', 59: 'Motion[33]@59', 60: 'Motion[33]@40', 119: 'Motion[33]@99', 120: 'Motion[33]@100', 139: 'Motion[33]@119',
                   140: 'Motion[33]@40', 220: 'Motion[33]@40', 284: 'Motion[33]@104', 286: 'Motion[33]@106' };
    const got = {};
    for (const f of Object.keys(want)) got[f] = await at(+f);
    r = await P();
    check(r.mounted && r.herSide && JSON.stringify(r.herSide.body) === JSON.stringify(['0|Motion[65]', '4|Motion[42]@90']) &&
          Object.keys(want).every(f => got[f] === want[f]) && r.herSide.frames >= 285,
          'his 7:0x3f: M33 0..60, from 40 at 60, 100..120, from 40 at 140 and 220, the flag frame 105 at 285; her M65 then M42 from 90', { got, her: r.herSide });
    // his spits, on HIS runtime: 15 (2 + 2 + 2, 2 + 2 + 2, 1 + 1 + 1) at the crossings 68 / 88 / 96 of each set; her three after the flag
    const FX = await import('/render/rom/effect-mounts.js');
    const PR = FX.partnerEffectRuntime(), BR = M.effectRuntimeInstance();
    if (PR && PR.schedule && BR && BR.schedule){
      V.pose.action.time = 0; await frames(2);
      const seen = new Map(), mine = [];
      const scan = () => {
        for (const R of [PR, BR]){
          const st = R.schedule.shells && R.schedule.shells.state;
          for (const x of (st ? st.shells : [])){
            const k = R.monsterId + ':' + x.id;
            if (seen.has(k) || x.creator != null) continue;
            seen.set(k, 1);
            mine.push({ who: R === PR ? 'his' : 'her', t: Math.round(V.pose.action.time * 60), shell: x.shell, mode: x.modeIndex });
          }
        }
      };
      for (const R of [PR, BR]){ const st = R.schedule.shells && R.schedule.shells.state; for (const x of (st ? st.shells : [])) seen.set(R.monsterId + ':' + x.id, 1); }
      V.pose.action.paused = false;
      for (let i = 0; i < 340 && V.pose.action.time * 60 < 330; i++){ await frames(1); scan(); }
      V.pose.action.paused = true;
      const his = mine.filter(x => x.who === 'his' && x.shell === 'shell00'), hers = mine.filter(x => x.who === 'her' && x.shell === 'shell00');
      const T = [88, 88, 108, 108, 116, 116, 168, 168, 188, 188, 196, 196, 248, 268, 276];
      check(his.length === 15 && his.every((x, i) => Math.abs(x.t - T[i]) <= 2 && x.mode === 3),
            'his 7:0x3f: 15 spits, two at each crossing 68 / 88 / 96 of the first two sets and one in the third (his entry frames ' + T.join(' ') + ')', his);
      check(hers.length === 3 && [295, 305, 315].every((t, i) => Math.abs(hers[i].t - t) <= 2),
            'her 7:0x4f (L4 M42 from 90 after his flag at 285): her three spits at 295 / 305 / 315', hers);
    } else check(false, 'both effect runtimes are up for the 7:0x3f spits', { his: !!PR, her: !!BR });
    V.pose.action.paused = false;
  }

"""
s = s[:a] + NEW + s[b:]
open(p, 'w', encoding='utf-8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-seltas-check.mjs'
s = open(p, encoding='utf-8').read()
old = """    const w = await watch(() => [body(), P()], 420, x => x.filter(y => !y.partner && y.shell === 'shell00').length >= 3 &&
                                                          x.filter(y => y.partner && y.shell === 'shell00').length >= 6);
    const his = w.filter(x => x.partner && x.shell === 'shell00'), hers = w.filter(x => !x.partner && x.shell === 'shell00');
    check(his.length === 6 && his.every(x => x.mode === 3 && x.action === '7:3f'), 'his 7:0x3f: six shell00 3 (two a crossing), on his runtime', his);"""
assert s.count(old) == 1
new = """    // (the duo agent, 2026-10-17: the entry now plays his 7:0x3f's three sets -- spec 2b -- so FIFTEEN spits, 2 + 2 + 1 a crossing)
    const w = await watch(() => [body(), P()], 420, x => x.filter(y => !y.partner && y.shell === 'shell00').length >= 3 &&
                                                          x.filter(y => y.partner && y.shell === 'shell00').length >= 15);
    const his = w.filter(x => x.partner && x.shell === 'shell00'), hers = w.filter(x => !x.partner && x.shell === 'shell00');
    check(his.length === 15 && his.every(x => x.mode === 3 && x.action === '7:3f'), 'his 7:0x3f: fifteen shell00 3 (three sets: two, two, one a crossing), on his runtime', his);"""
s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
