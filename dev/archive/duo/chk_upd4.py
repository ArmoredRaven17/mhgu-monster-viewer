p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
a = s.index("  const play = async (list, clip) => {")
b = s.index("  // the tail grab: his M79 loop under her M77")
NEW = r"""  // her raw lists play her ALONE; the combined list ('duo') carries every duo animation. `playRaw` picks a raw clip;
  // `play(list, clip)` picks that clip's entry on the combined list (required, else '+ Seltas free')
  const pickOn = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip);
    if (!o){ check(false, 'the list ' + list + ' has ' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    const ok = await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    await frames(2);
    return ok;
  };
  const DUO = 'duo';
  const duoList = () => V.MON.monsters.find(m => m.id === MON).lists.find(l => l.id === DUO);
  const duoName = (list, clip) => {
    const L = duoList(), n1 = 'Queen L' + list + ' ' + clip, n2 = n1 + ' + Seltas free';
    return L.clips.some(c => c.clip === n1) ? n1 : L.clips.some(c => c.clip === n2) ? n2 : null;
  };
  const play = async (list, clip) => {
    if (list === DUO || list === 'Special') return pickOn(list, clip);
    const n = duoName(list, clip);
    if (!n){ check(false, 'the combined list has ' + list + '|' + clip); return false; }
    return pickOn(DUO, n);
  };
  const playRaw = pickOn;
  const P = () => V.partner();
  const fr = x => Math.round(x * 60);
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  let r;

  // ---- THE LISTS: her raw lists never mount him; the combined list holds the duo animations, grouped
  {
    const L = duoList();
    const g = L && L.groups;
    check(!!L && L.label === 'Combined (with Seltas)' && g && g.required === 44 && g.joined === 1 && g.his === 7 && g.free === 95 &&
          L.clips.length === 147 && !V.MON.monsters.find(m => m.id === MON).lists.some(l => l.id === 'Special'),
          'the combined list: 44 required clips of hers, 1 joined, 7 of his, 95 of hers with him free -- and the Special list (it held only the duo clip) is gone', g);
    const order = L.clips.map(c => c.group);
    check(order.join(',') === [...Array(44).fill('required'), 'joined', ...Array(7).fill('his'), ...Array(95).fill('free')].join(','),
          'grouped in order: required, joined, his, free');
    const names = new Set(L.clips.map(c => c.clip));
    const outs = ['Queen L0 Motion[16]_start', 'Queen L4 Motion[29]', 'Queen L4 Motion[68]_loop', 'Queen L3 Motion[18]', 'Queen L0 Motion[21]',
                  'Queen L4 Motion[89]'];
    check(outs.every(n => !names.has(n) && !names.has(n + ' + Seltas free')), 'solo / release / unresolved clips are not on it', outs);
    check(names.size === L.clips.length, 'one entry per animation (no duplicate names)');
  }
  for (const [list, clip] of [['4', 'Motion[6]'], ['4', 'Motion[83]'], ['4', 'Motion[36]'], ['0', 'Motion[1]_loop'], ['3', 'Motion[24]'], ['4', 'Motion[77]']]){
    await playRaw(list, clip);
    r = await P();
    check(!r.mounted && !document.querySelector('#monGroups .field[data-row="partner:em076_00"]'),
          'raw L' + list + ' ' + clip + ': the Queen alone, no Seltas row', { mounted: r.mounted });
  }
  // EVERY entry of the combined list mounts him and plays its ROM pair
  {
    const M_ = await import('/render/monster.js'), spec = M_.ROM_PARTNER_BODY.em069_00;
    const bad = [];
    for (const c of duoList().clips){
      await pickOn(DUO, c.clip);
      const q = await P();
      let want = null;
      if (c.her){
        const pr = M_.partnerPairOf(spec, c.her.list, c.her.clip);
        want = pr.seq[0].clip === 'Motion[35]_loop' && !spec.pairs[c.her.list + '|' + c.her.clip] ? 'free' : pr.seq[0].clip;
      } else if (c.his) want = c.his;
      const ok = q.mounted && (want === 'free' ? (q.mode === 'free' && q.local && q.local.clip === 'Motion[35]_loop')
                             : want ? (q.local && q.local.clip === want) : q.mode === 'seq');
      if (!ok) bad.push({ entry: c.clip, want, got: q.local, mode: q.mode, mounted: q.mounted });
    }
    check(bad.length === 0, 'every one of the 147 combined-list entries mounts him and plays its ROM pair at frame 0', bad.slice(0, 6));
  }
  // leaving the list drops him
  await playRaw('4', 'Motion[36]');
  r = await P();
  check(!r.mounted, 'leaving the combined list (raw L4 Motion[36]) drops him', r.mounted);

  // ---- THE PAIRS: his clip and his frame against hers, read at live frames (one clock: his time is set from hers)
  const pairAt = async (list, clip, expect, label, n = 4) => {
    await play(list, clip);
    const seen = [];
    for (let i = 0; i < n; i++){
      await frames(7);
      const q = await P();
      seen.push({ body: fr(q.bodyTime), local: q.local, t: q.clipTime });
    }
    check(seen.every(x => x.local && expect(x.body, x.local)), label, seen);
    return seen;
  };
  await pairAt('4', 'Motion[6]', (b, l) => l.clip === 'Motion[6]' && near(l.frame, b), 'her L4 Motion[6] -> his Motion[6] frame for frame (3:0x38)');
  await pairAt('4', 'Motion[17]', (b, l) => l.clip === 'Motion[6]' && near(l.frame, Math.min(137 + b, 194)), 'her L4 Motion[17] -> his Motion[6] from frame 137 (his one clip under her two)');
  await pairAt('4', 'Motion[24]', (b, l) => l.clip === 'Motion[7]' && near(l.frame, 49 + b), 'her L4 Motion[24] -> his Motion[7] from frame 49');
  await pairAt('4', 'Motion[10]', (b, l) => l.clip === 'Motion[5]_loop', 'her L4 Motion[10] -> his Motion[5] loop (3:0x3c / 3:0x42)');
  await pairAt('4', 'Motion[83]', (b, l) => l.clip === 'Motion[45]_loop', 'her L4 Motion[83] (two-layer attack) -> his Motion[45] loop (7:0x3b, request 0xe)');
  await pairAt('4', 'Motion[73]', (b, l) => l.clip === 'Motion[73]' && near(l.frame, b), 'her L4 Motion[73] -> his Motion[73] (3:0x40)');
  await pairAt('3', 'Motion[24]', (b, l) => l.clip === 'Motion[48]' && near(l.frame, Math.min(181 + b, 238)), 'her L3 Motion[24] -> his Motion[48] from 181 (3:0x36, request 0xd)');
  // her both clips on the combined list: he is on her, following his own logic (no frozen clip)
  for (const [list, clip] of [['4', 'Motion[46]'], ['4', 'Motion[47]'], ['4', 'Motion[55]_loop'], ['4', 'Motion[90]'], ['0', 'Motion[10]']]){
    await play(list, clip);
    r = await P();
    check(r.mounted && r.class === 'both' && r.mode === 'free', 'combined L' + list + ' ' + clip + ' + Seltas free: mounted, his own logic', { mounted: r.mounted, class: r.class, mode: r.mode });
  }
  // ...a combined-list entry picked while a list change is still in flight still mounts him
  { listSel.value = '0'; const p1 = listSel.onchange(); listSel.value = DUO; const p2 = listSel.onchange();
    clipSel.value = 'Queen L4 Motion[83]'; const p3 = clipSel.onchange(); await Promise.all([p1, p2, p3]);
    await until(async () => { const q = await P(); return q.mounted && q.bodyClip === 'Queen L4 Motion[83]'; }, 300);
    r = await P();
    check(r.mounted && r.bodyClip === 'Queen L4 Motion[83]' && r.local && r.local.clip === 'Motion[45]_loop', 'a combined entry picked during a list change in flight mounts him', { mounted: r.mounted, clip: r.bodyClip, local: r.local }); }
"""
s = s[:a] + NEW + s[b:]
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("  const sl = [...listSel.options].find(o => o.value === 'S_4');", "  const sl = [...listSel.options].find(o => o.value === DUO);")
rep("check(!!sl, 'her Animation list offers his combined clips (list S_4, \"Seltas (combined)\")'", "check(!!sl, 'her Animation list offers the combined list (duo, \"Combined (with Seltas)\")'")
rep("    await play('S_4', 'Seltas Motion[31]');", "    await play(DUO, 'Seltas Motion[31]');")
rep("    check(r.mounted && r.rowValue === '1' && r.clip === 'Motion[31]'", "    check(r.mounted && r.clip === 'Motion[31]'")
i = s.index("    await play('S_4', 'Seltas Motion[6]');")
j = s.index("    await V.partner(true);", i)
s = s[:i] + s[j:]
rep("  check(r.mounted && r.rowValue === '1' && r.rowDisabled, 'after a reload of her and a list change to L4 Motion[16]: mounted, the row reads Combined (locked)', { mounted: r.mounted, row: r.rowValue });",
    "  check(r.mounted, 'after a reload of her and a list change to the combined Queen L4 Motion[16]: mounted', { mounted: r.mounted });")
rep("    await play('S_4', 'Seltas Motion[33] with her 7:0x4e');", "    await play(DUO, 'Seltas Motion[33] with her 7:0x4e');")
rep("  listSel.value = 'Special'; await listSel.onchange();", "  listSel.value = DUO; await listSel.onchange();")
rep("  check(so && r.rowValue === '1', 'S. Motion[76]-[79] is on her Special list (not list 4) and the row reads Combined', { found: !!so, row: r.rowValue });",
    "  check(so && r.mounted, 'S. Motion[76]-[79] is on the combined list, and mounts him', { found: !!so, mounted: r.mounted });")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
