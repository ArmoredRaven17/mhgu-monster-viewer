import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em088_00.mjs'
s = open(p, encoding='utf-8', newline='').read()
a = """  await setCarry(4); await frames(2);
  check(S.threadState().off.some(x => /web anchors/.test(x.why)), 'the web / Neset threads are named off (anchors, e+0xd410, Ahtal-Neset)',
        S.threadState().off);
"""
assert s.count(a) == 1
b = """  await setCarry(4); await frames(2);
  check(S.threadState().off.some(x => /e\\+0xd408/.test(x.why)), 'the e+0xd408 rows (u 340 off L2 M30 / 342 / 343 / 344) are named off',
        S.threadState().off);
  // THE WEBS (class-threads.js em088Latch / em088Webs; dev/em088-d410-writer.md): L2 M30 played through its wrap -- the
  // wind-up's start writes its point (d410 for (1, 0x1c) / (1, 0x22), d440 for (1, 0x1e) / (1, 0x24)) 4000 x size above him,
  // the wrap makes the anchors (shells.js), and each anchor past the ROM's gate gets u 341 from that point to its +0x40
  check(!!thr(340) && !!thr(341) && /em088_00_022_s/.test(thr(341).def.efl), 'u 340 / u 341 are exported `when: thread` (em088_00_022_s)',
        [!!thr(340), !!thr(341)]);
  await play('2', 'Motion[30]');
  const act = () => (S.threadInput ? S.threadInput().action : null);
  await until(() => S.shells && S.webAnchors088Probe !== undefined || (TH.CLASS_THREADS[MON].anchors(S.shells && S.shells.state) || { d420: [], d450: [] })
                       .d420.concat(TH.CLASS_THREADS[MON].anchors(S.shells && S.shells.state).d450).some(x => x && x.thread), 900);
  await settle();
  {
    const a = act(), n = a && a[0] === 1 ? a[1] : null, five = n === 0x1c || n === 0x1d || n === 0x22 || n === 0x23;
    const key = five ? 'd410' : 'd440', P = S.parent, want = [P.position[0], P.position[1] + 4000 * P.scale, P.position[2]];
    const pt = S.threads.mem[key];
    check(pt && dist(pt, want) < 0.01, 'L2 M30 under ' + JSON.stringify(a) + ': ' + key + ' = his position + (0, 4000 x size, 0), latched at the start',
          { pt, want });
    const webs = S.threadState().on.filter(o => o.key === 341);
    const anc = TH.CLASS_THREADS[MON].anchors(S.shells.state)[five ? 'd420' : 'd450'];
    st = stretched().filter(r => r.u === 341);
    check(webs.length > 0 && webs.every(o => dist(o.A, pt) < 0.01 && anc[o.b.p] && dist(o.B, anc[o.b.p].point) < 0.01) && tight(st),
          'u 341: one thread per gated anchor (slots ' + (five ? '10..14' : '15..17') + '), from ' + key + ' to the anchor\\'s +0x40, stretched',
          { slots: webs.map(o => o.slot), st });
    const s340 = S.threadState().on.find(o => o.key === 340);
    check(s340 && s340.slot === (five ? 7 : 19) && s340.a === 149 && dist(s340.B, pt) < 0.01,
          'u 340 slot ' + (five ? 7 : 19) + ': joint 149 -> ' + key, s340 && { slot: s340.slot, a: s340.a, B: s340.B });
  }
"""
s = s.replace(a, b)
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
