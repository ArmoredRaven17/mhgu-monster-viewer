p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("""    check(!!L && L.label === 'Combined (with Seltas)' && g && g.required === 44 && g.joined === 1 && g.his === 7 && g.free === 95 &&
          L.clips.length === 147 && !V.MON.monsters.find(m => m.id === MON).lists.some(l => l.id === 'Special'),
          'the combined list: 44 required clips of hers, 1 joined, 7 of his, 95 of hers with him free -- and the Special list (it held only the duo clip) is gone', g);
    const order = L.clips.map(c => c.group);
    check(order.join(',') === [...Array(44).fill('required'), 'joined', ...Array(7).fill('his'), ...Array(95).fill('free')].join(','),
          'grouped in order: required, joined, his, free');""",
"""    check(!!L && L.label === 'Combined (with Seltas)' && g && g.required === 44 && g.joined === 1 && g.leaves === 5 && g.his === 7 && g.free === 95 &&
          L.clips.length === 152 && !V.MON.monsters.find(m => m.id === MON).lists.some(l => l.id === 'Special'),
          'the combined list: 44 required clips of hers, 1 joined, 5 where he leaves her, 7 of his, 95 of hers with him free -- and the Special list (it held only the duo clip) is gone', g);
    const order = L.clips.map(c => c.group);
    check(order.join(',') === [...Array(44).fill('required'), 'joined', ...Array(5).fill('leaves'), ...Array(7).fill('his'), ...Array(95).fill('free')].join(','),
          'grouped in order: required, joined, leaves, his, free');""")
rep("""    const outs = ['Queen L0 Motion[16]_start', 'Queen L4 Motion[29]', 'Queen L4 Motion[68]_loop', 'Queen L3 Motion[18]', 'Queen L0 Motion[21]',
                  'Queen L4 Motion[89]'];
    check(outs.every(n => !names.has(n) && !names.has(n + ' + Seltas free')), 'solo / release / unresolved clips are not on it', outs);""",
"""    const outs = ['Queen L0 Motion[16]_start', 'Queen L4 Motion[29]', 'Queen L4 Motion[68]_loop', 'Queen L3 Motion[18]', 'Queen L0 Motion[21]',
                  'Queen L4 Motion[89]'];
    check(outs.every(n => !names.has(n) && !names.has(n + ' + Seltas free')), 'solo / release / unresolved clips are not on it as hers-with-him', outs);
    const lv = L.clips.filter(c => c.group === 'leaves').map(c => c.clip);
    check(lv.includes('Queen L4 Motion[68]_loop + Seltas leaves') && lv.includes('Queen L3 Motion[18] + Seltas leaves') &&
          lv.every(n => / \\+ Seltas leaves$/.test(n)) && !names.has('Queen L0 Motion[16]_start + Seltas leaves'),
          'the release clips (request 7) are on it only as "+ Seltas leaves"', lv);""")
rep("""      if (c.her){
        const pr = M_.partnerPairOf(spec, c.her.list, c.her.clip);""",
"""      if (c.leaves) want = spec.leaves[0].clip;
      else if (c.her){
        const pr = M_.partnerPairOf(spec, c.her.list, c.her.clip);""")
rep("""      const ok = q.mounted && (want === 'free'""", """      const ok = q.mounted && (c.leaves ? (q.released && q.local && q.local.clip === want) : true) && (want === 'free'""")
rep("""'every one of the 147 combined-list entries""", """'every one of the 152 combined-list entries""")
# the release test, after "leaving the list drops him"
rep("""  check(!r.mounted, 'leaving the combined list (raw L4 Motion[36]) drops him', r.mounted);
""", """  check(!r.mounted, 'leaving the combined list (raw L4 Motion[36]) drops him', r.mounted);

  // ---- HE LEAVES HER (request 7 -> his 1:0x13, 0xfc5054 unlink, M46 b4 then M47 b0, 0xfc8e84): from her frame 0 his root
  // stays where joint 200 was at that frame, in world space, while her joint moves on; his glow (group 8) is off
  {
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    await play(DUO, 'Queen L4 Motion[68]_loop + Seltas leaves');
    const at = async f => { V.pose.action.time = f / 60; await frames(3); return P(); };
    const q0 = await at(0), q1 = await at(40), q2 = await at(80);
    check(q0.mounted && q0.released && q0.local && q0.local.clip === 'Motion[46]' && dist(q0.frameAt, q0.bodyJointAt) < 0.01,
          'L4 M68 + Seltas leaves: at her frame 0 he is released exactly at joint 200, playing his M46', { f: q0.frameAt, j: q0.bodyJointAt, local: q0.local });
    check(dist(q1.frameAt, q0.frameAt) < 1e-3 && dist(q2.frameAt, q0.frameAt) < 1e-3 &&
          Math.max(dist(q1.bodyJointAt, q0.bodyJointAt), dist(q2.bodyJointAt, q0.bodyJointAt)) > 1,
          'after the unlink his root stops following joint 200: his frame is fixed while her joint moves', { f: [q0.frameAt, q1.frameAt, q2.frameAt], j: [q0.bodyJointAt, q1.bodyJointAt, q2.bodyJointAt] });
    const m46 = Math.round(V.MON.monsters.find(m => m.id === 'em076_00').lists.find(l => l.id === '4').clips.find(x => x.clip === 'Motion[46]').dur * 60);
    const q3 = await at(Math.min(m46 + 10, Math.round(V.pose.action.getClip().duration * 60) - 1));
    check(q3.local && (q3.local.clip === 'Motion[47]' || q3.local.clip === 'Motion[46]'), 'he plays M46 then M47 (0xfc8e84)', { m46, local: q3.local });
    check(q0.groupsOn && !q0.groupsOn.includes(8), 'released: his combined glow (group 8) is off (0xfc6468)', q0.groupsOn);
    // a linked entry still follows her joint, as a control for the same readback
    await play('4', 'Motion[36]');
    const c0 = await at(0), c1 = await at(40);
    check(!c0.released && dist(c0.frameAt, c0.bodyJointAt) < 0.01 && dist(c1.frameAt, c1.bodyJointAt) < 0.01 && dist(c1.frameAt, c0.frameAt) > 1e-3,
          'control: on a linked entry (L4 M36 + Seltas free) his root follows joint 200 frame by frame', { f: [c0.frameAt, c1.frameAt], j: [c0.bodyJointAt, c1.bodyJointAt] });
  }
""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
