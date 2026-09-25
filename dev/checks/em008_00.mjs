// Yian Kut-Ku's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it IN THE
// PAGE, so it must not close over anything in this module.
// YIAN KUT-KU (em008_00): against E:/offline/decode/notes/states-em008_00.md. He is the simplest monster wired so
// far and the check leans on that: ONE breakable part, no sever, no cut tail, no rage mesh change, no material
// animation. Seven of his eight parts take a depletion reaction that changes nothing because they have no .dtp
// row, so most of what this asserts is that nothing happens where nothing should.
// Two things are his alone. HIS STUN IS NOT SIDED -- his .dtb direction table is zero at every index, so there is
// ONE three-clip chain where Barioth and Malfestio have two, and L3 M3/M5/M7 carries no held handle at all.
// And HIS TWO PUFF RECORDS DIFFER: same file, same joint, same offset, scale 1.0 on u 1120 against 0.7 on
// u 1121. Every monster before him had a byte-identical pair, so the stubbed pick was a distinction without a
// difference; on him it picks a visibly smaller puff, which makes `pick: () => 0` worth asserting properly.
async function pageCheckKutKu(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Kut-Ku: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em008_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  const f0 = fx.fire.bind(fx); fx.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  // SIX, not seven: c 1105 (the shock trap) shares the paralysis hold, so his table never names it and it is not
  // exported. A record the table cannot request is a record the viewer cannot play, and every monster wired before
  // the rule carried a dead one. He is the first with none.
  check(byWhen.event === 6 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 6 event and 2 ragePuff, with NO dead c 1105', byWhen);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  // TWO CLOCKS: the puff counts SCHEDULE frames, motion-states' `every` timers count CLIP frames, and the pose
  // advances one clip frame per two schedule steps on this harness.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 40 * n + 400); };
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 2), 'at rest: the head intact (set 2)', user0);

  // NO SEVER, NO CUT TAIL -- four independent facts in the note, asserted here as an absence so it cannot read as
  // an oversight later.
  check(!TO.CUT_TAIL[MON], 'he has NO cut tail entry -- no sever at all', Object.keys(TO.CUT_TAIL));
  check(!Object.keys(MS.MOTION_STATES[MON]).some(k => (MS.MOTION_STATES[MON][k] || {}).drops), 'and no motion drops one');

  // THE ONE BREAK: two depletions, level 1 shows nothing (his .dtp row is at level 2 and key 1030 is absent).
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 2),
        'L3 Motion[1] (the HEAD) at the default level: set 2 kept and NOTHING fired -- level 1 has no record',
        { fired, d: drawn() });
  const head = MS.MOTION_STATES[MON]['3|Motion[1]'];
  check(head && same(head.levels, [[2], [2], [4]]) && head.fire[0] === null && head.fire[1] === null &&
        same(head.fire[2], ['em008_00u', 1031]),
        'and the table gives him THREE levels, with set 4 and u 1031 only at level 2', head && head.levels);

  // THE EXHAUST STATUS on L3 Motion[2] -- the clip is also the body and tail depletions, neither of which shows
  // anything, so unlike Malfestio's L3 M2 this needs no cycle.
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await steps(2);
  check(count(fired, 1109) === 1, 'L3 Motion[2] (the tune+0x44 status): c 1109 once at frame 0', fired);

  // THE STUN, and it is NOT SIDED: one chain, M4 -> M6 -> M8.
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const m of ['Motion[4]', 'Motion[6]', 'Motion[8]']){
    await play('3', m); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + m + ' (the single stun chain): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));
  check(!MS.MOTION_STATES[MON]['3|Motion[3]'] && !MS.MOTION_STATES[MON]['3|Motion[5]'] &&
        !MS.MOTION_STATES[MON]['3|Motion[7]'],
        'and L3 M3/M5/M7 carry NOTHING -- his .dtb direction table is zero, so he has one chain where the sided monsters have two');

  // RAGE: nothing on the model at all
  puffs.length = 0;
  await play('0', 'Motion[101]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[101]: rage on, and NOTHING on the model changes', { rage: S.rage, d: drawn() });
  check(!MS.RAGE_PARTS[MON], 'and he has no RAGE_PARTS entry', Object.keys(MS.RAGE_PARTS));
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  // HIS PAIR IS NOT IDENTICAL, so the stubbed pick is a visible choice: 1121 is the 0.7-scale one.
  check(puffs.length > 0 && puffs.every(p => p.key === 1121),
        'and EVERY request is u 1121 -- the 0.7-scale record, where u 1120 is 1.0 and is never asked for',
        puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED -- his own clip
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired, his own clip): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 CLIP frames on', fired);

  // ASLEEP -- and the zzz fires ONCE, because its period is NOT READ
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 3), 'L3 Motion[14] (lying down): the eyes close (set 3)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 3) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes closed and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 1,
        'and it does NOT repeat -- his note gives no period for c 1102, so the table fires it once rather than importing another monster\'s 90',
        fired);
  check(puffs.length === 0, 'the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);

  // DEATH -- nothing reverts, because rage changed nothing to revert
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const m of ['Motion[17]', 'Motion[12]', 'Motion[20]']){
    await play('3', m); await frames(4);
    check(S.rage === false, 'L3 ' + m + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
  }
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckKutKu;
