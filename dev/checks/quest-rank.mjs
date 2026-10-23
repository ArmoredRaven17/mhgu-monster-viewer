// dev/checks/quest-rank.mjs (effects lane, 2026-10-20; run by dev/motion-states-check.mjs): the Quest Rank control and Chaotic Gore's
// Gauge, in the page. Per monster (args): the low-rank break rows (motion-states.js `lowRank`: Gravios's back / head, Agnaktor's chest /
// tail, Great Maccao's tail), Thunderlord's puff (u 250 at G, the shared u 1121 below), Gypceros's puddle (u 3 below G, u 4 at G, his
// L4 M6 spit), and Chaotic's gauge fills (C+0x84 at 20000 and G rank: L2 M27 f85 fills the slot ring). Each case also runs at G, the
// default, so the control's two sides are both asserted. The rank is put back to G at the end.
async function questRank(mon){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, mon + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  window.__quest.set(5, 10);
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  check(await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900), 'the effect runtime is up');
  const S = () => M.effectRuntimeInstance().schedule;
  const fired = [], started = [];
  const hook = () => {
    const sch = S();
    if (sch.__qrHooked) return; sch.__qrHooked = true;
    const f0 = sch.fire.bind(sch); sch.fire = (pel, key) => { fired.push(key); return f0(pel, key); };
    const s0 = sch.start.bind(sch); sch.start = e => { if (e.def && e.def.record) started.push(e.def.record.key + '|' + e.when); return s0(e); };
  };
  hook();
  const MONSTER = V.MON.monsters.find(e => e.id === mon);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (n) => { const d = drawn(); return (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on); };
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // (a landing clip whose NAME differs from the break clip's: a list change replays the same-named clip and would count as a play)
  const LAND = { em005_00: ['3', 'Motion[3]'], em049_00: ['3', 'Motion[3]'], em085_00: ['0', 'Motion[1]'] }[mon] || ['0', 'Motion[1]'];
  // a fresh monster per rank (the cycles count plays from the mount)
  const remount = async rank => { window.__quest.set(rank, 10); monSel.onchange && await monSel.onchange(); await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900); hook(); };
  const breakPlay = async (list, clip) => { await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(3); return fired.slice(); };
  // (the state driver's cycles count plays for the page's life, so each case plays the whole cycle and reads it order-free)
  if (mon === 'em005_00'){
    for (const rank of [1, 5]){
      await remount(rank);
      const plays = [];
      for (let i = 0; i < 2; i++){ const f = await breakPlay('3', 'Motion[106]'); plays.push({ f, s18: isSet(18) }); }
      const back = plays.find(p => JSON.stringify(p.f) === '[1000]');
      const head = await breakPlay('3', 'Motion[102]'), head4 = isSet(4);
      if (rank === 1){
        check(back && back.s18, 'rank 1: L3 M106 (the back arm) with the Back intact BREAKS it (set 18) and fires u 1000 (lowRank)', plays);
        check(JSON.stringify(head) === '[1025]' && head4, 'rank 1: L3 M102 with the Head intact breaks it (set 4) and fires u 1025', { head, head4 });
      } else {
        check(back && !back.s18, 'G: the back arm fires the level-1 u 1000 and keeps set 17', plays);
        check(JSON.stringify(head) === '[1025]' && !head4, 'G: L3 M102 with the Head intact fires u 1025 and keeps set 3', { head, head4 });
      }
    }
  }
  if (mon === 'em049_00'){
    for (const rank of [1, 5]){
      await remount(rank);
      const all = (await breakPlay('3', 'Motion[1]')).concat(await breakPlay('3', 'Motion[1]')).sort((a, b) => a - b);
      if (rank === 1) check(JSON.stringify(all) === '[1006,1035]', 'rank 1: L3 M1 (both arms) break the chest (level 2, u 1006) and the tail (level 1, u 1035)', all);
      else check(JSON.stringify(all) === '[]', 'G: L3 M1 (first plays) fire nothing (chest at 3, tail at 2)', all);
    }
  }
  if (mon === 'em085_00'){
    for (const rank of [1, 5]){
      await remount(rank);
      const all = (await breakPlay('3', 'Motion[3]')).concat(await breakPlay('3', 'Motion[3]'));
      if (rank === 1) check(all.includes(1011), 'rank 1: L3 M3 (the tail arm) fires u 1011 (lowRank, the record only below G asks for)', all);
      else check(!all.includes(1011), 'G: the tail arm fires nothing (em085_00u has no key 1012)', all);
    }
  }
  if (mon === 'em057_04'){
    for (const rank of [1, 5]){
      await remount(rank);
      const rg = document.getElementById('monRage'); rg.checked = true; await rg.onchange({ target: rg });
      started.length = 0;
      await play('0', 'Motion[1]'); await frames(90);
      const puffs = started.filter(k => k.endsWith('|ragePuff'));
      const want = rank === 1 ? '1121|ragePuff' : '250|ragePuff';
      check(puffs.length > 0 && puffs.every(k => k === want), 'rank ' + rank + ': his rage puff is u ' + want.split('|')[0], puffs.slice(0, 4));
      rg.checked = false; await rg.onchange({ target: rg });
    }
  }
  if (mon === 'em009_00'){
    for (const rank of [1, 5]){
      await remount(rank);
      V.effectMeter(true, { every: 5 });
      // two plays: the shells' pick for L4 M6 alternates its actions, and only the spit makes the puddle
      await play('4', 'Motion[6]'); await frames(240); await play('0', 'Motion[1]'); await frames(5); await play('4', 'Motion[6]'); await frames(240);
      const recs = V.effectMeterReport().recs.filter(r => /\|em009_00u\|[34]\|shell$/.test(r.key)).map(r => r.key.split('|')[2] + ':' + r.starts + ':' + r.verdict);
      V.effectMeter(false);
      const want = rank === 1 ? '3' : '4';
      check(recs.some(x => x.startsWith(want + ':') && x.endsWith(':draws')) && !recs.some(x => x.startsWith((want === '3' ? '4' : '3') + ':')),
            'rank ' + rank + ': L4 M6\'s puddle is u ' + want + ' and draws', recs);
    }
  }
  if (mon === 'em071_05'){
    const gs = document.getElementById('monClassCtl2');
    for (const step of [0, 3]){
      await remount(5);
      if (gs){ gs.value = String(step); gs.dispatchEvent(new Event('change')); await frames(2); }
      await play('2', 'Motion[27]'); await frames(110);
      const R = S().ring;
      if (step === 3) check(R && R.slots.some(s => s.byte !== 0xff), 'Gauge 20000, G: L2 M27 f85 fills the slot ring (0xfb855c)', R && R.slots);
      else check(!R || R.slots.every(s => s.byte === 0xff), 'Gauge 0: L2 M27 makes no fill', R && R.slots);
    }
    // THE BODYLIGHT FOLLOWS THE GAUGE (0xfbf97c: tier 0..4 -> BodyLight_Normal / _Start_LV1 / _LV2 / _LV3 / _LVMAX), under the rank's
    // cap (0x16a1530: 20000 at G, 24000 at rank 3, 32000 at rank 1) -- the ladder row hidden, the rung set from the gauge, no enrage
    const lad = M.rageLadder(V.mounted.main);
    check(lad.length === 4 && /LV1$/.test(lad[0].clip) && /LV2$/.test(lad[1].clip) && /LV3$/.test(lad[2].clip) && /LVMAX$/.test(lad[3].clip),
          'his ladder is BodyLight_Start_LV1 / LV2 / LV3 / LVMAX', lad.map(l => l.clip));
    for (const [rank, want] of [[5, [0, 1, 2, 3, 3]], [3, [0, 1, 2, 3, 3]], [1, [0, 1, 2, 3, 4]]]){
      window.__quest.set(rank, 10); await frames(2);
      const got = [];
      for (let step = 0; step <= 4; step++){
        if (gs){ gs.value = String(step); gs.dispatchEvent(new Event('change')); await frames(2); }
        got.push({ rung: V.state.rageLevel | 0, rage: !!V.state.rage });
      }
      check(JSON.stringify(got.map(g => g.rung)) === JSON.stringify(want) && got.every(g => !g.rage),
            'rank ' + rank + ': Gauge 0 / 5000 / 10000 / 20000 / 28000 put the BodyLight rung at ' + want.join(' / ') + ' and never enrage him', got);
    }
    check(document.getElementById('monRageLevelRow').hidden, 'the ladder row is hidden (the Gauge owns the rung)');
    check([...document.getElementById('monState').options].some(o => o.value === 'rage'),
          'his Enraged state is its own option', [...document.getElementById('monState').options].map(o => o.value));
    // THE LIGHT GOES OUT IN DEATH (C+0xca, 0xfbf890): L3 M21 crossing f238 puts BodyLight_Normal on the kasan over the gauge's rung
    window.__quest.set(5, 10); await frames(2);
    if (gs){ gs.value = '3'; gs.dispatchEvent(new Event('change')); await frames(2); }
    let kasan = null;
    V.mounted.main.traverse(o => { for (const m of [].concat(o.material || [])) if (m && m.name === 'XfB_W__m01_kasan') kasan = m; });
    const anim = kasan && kasan.userData && kasan.userData.rom && kasan.userData.rom.anim || [];
    check(anim.some(c => c && c.name === 'BodyLight_Normal'), 'the kasan carries BodyLight_Normal', anim.map(c => c && c.name));
    const out = () => (V.mounted.main.userData.motionClips || []).filter(x => x.clip === 'BodyLight_Normal' && x.mats.includes('XfB_W__m01_kasan')).length;
    await play('3', 'Motion[21]');
    await frames(150);
    const before = { rung: V.state.rageLevel | 0, out: out(), frame: V.pose.action && Math.round(V.pose.action.time * 60) };
    await frames(120);
    const after = { out: out(), frame: V.pose.action && Math.round(V.pose.action.time * 60) };
    check(before.rung === 3 && before.out === 0 && after.out === 1 && after.frame >= 238,
          'Gauge 20000 (LV3): L3 M21 shows no Normal before f238 and BodyLight_Normal after it (C+0xca)', { before, after });
    await play('0', 'Motion[5]'); await frames(3);
    check(out() === 0, 'leaving the death motion hands the kasan back to the gauge', V.mounted.main.userData.motionClips);
    if (gs){ gs.value = '0'; gs.dispatchEvent(new Event('change')); }
  }
  window.__quest.set(5, 10);
  return out;
}
export const pageCheck = questRank;
export const args = ['em005_00', 'em049_00', 'em085_00', 'em057_04', 'em009_00', 'em071_05'].map(m => [m]);
