// Malfestio's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it IN THE
// PAGE, so it must not close over anything in this module.
// MALFESTIO (em079_00): against E:/offline/decode/notes/states-em079_00.md. Three things here no earlier monster
// has. HIS HEAD FOLLOWS RAGE AS WELL AS ITS BREAK LEVEL, so its sets are a {calm, enraged} pair of ladders and
// rage turns the GLOWING EYES on (groups 20/21, XfB_0__m00_eye). HIS L3 Motion[2] IS FOUR STATES -- both wings,
// the tail and the exhaust status -- so it CYCLES, one per play, which is the only way a single clip can show all
// of what the ROM plays on it. And HE HAS NO TAIL SEVER AT ALL, which is checked as an absence: no CUT_TAIL entry,
// because the class never calls 0xc2274 and his uEnemyOption descriptor is -1.
async function pageCheckMalfestio(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Malfestio: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em079_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  const fired = [];
  // the schedule's fire (live.js fire() passes through to it): the tired drool fires there directly (schedule.js stepDrool)
  const f0 = fx.schedule.fire.bind(fx.schedule); fx.schedule.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => { if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame }); return s0(e); };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event === 9 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 9 event and 2 ragePuff', byWhen);
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
  check(user0 && isSet(user0, 5) && isSet(user0, 1), 'at rest: the calm head (set 5) and the open eye (set 1)', user0);

  // HE HAS NO TAIL SEVER. Read as an absence: no .dtt second counter, no 0xc2274 call, uEnemyOption descriptor -1.
  check(!TO.CUT_TAIL[MON], 'he has NO cut tail entry -- he has no sever at all, which is read and not assumed',
        Object.keys(TO.CUT_TAIL));
  check(!Object.keys(MS.MOTION_STATES[MON]).some(k => (MS.MOTION_STATES[MON][k] || {}).drops),
        'and no motion of his drops one');

  // THE HEAD: two depletions, and level 1 shows nothing at all (em079_00u has no key 1000).
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 5),
        'L3 Motion[1] (the HEAD) at the default level: set 5 kept and NOTHING fired -- level 1 has no record',
        { fired, d: drawn() });
  const head = MS.MOTION_STATES[MON]['3|Motion[1]'];
  check(head && same(head.levels.calm, [[5], [5], [6]]) && same(head.levels.enraged, [[7], [7], [8]]) &&
        same(head.fire[2], ['em079_00u', 1001]),
        'and his head is a {calm, enraged} PAIR of ladders -- calm 5/6, enraged 7/8 -- with u 1001 at level 2',
        head && head.levels);

  // L3 Motion[2] CYCLES through the four states the ROM plays on it: -X wing, +X wing, tail, exhaust.
  const cyc = MS.MOTION_STATES[MON]['3|Motion[2]'];
  check(cyc && cyc.cycle && cyc.cycle.length === 4,
        'L3 Motion[2] carries a FOUR-rung cycle: both wings, the tail and the exhaust status', cyc && cyc.cycle.length);
  const seen = [];
  for (let i = 0; i < 4; i++){
    await play('3', 'Motion[1]'); await frames(2);            // off the clip, so the next play is a fresh frame 0
    fired.length = 0;
    await play('3', 'Motion[2]'); await frames(3);
    seen.push(fired.slice());
  }
  check(same(seen[0], [1010]) && same(seen[1], [1015]) && same(seen[2], []) && same(seen[3], [1109]),
        'and four plays show them in turn: u 1010 (-X wing), u 1015 (+X wing), the tail at level 1 firing nothing, c 1109',
        seen);

  // THE STUN, sided, one held handle across both three-clip chains
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[4]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[4] (the direction-1 stun chain): c 1103 held, not fired', evReqs(1103));
  await play('3', 'Motion[5]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[5] (the direction-2 chain\'s hold): still held', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chains it is stopped', evReqs(1103));

  // RAGE: the head pair swaps and the GLOWING EYES come on
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true && isSet(drawn(), 7),
        'L0 Motion[4]: rage on, and the head takes its ENRAGED half (set 5 -> 7, the glowing eyes on)',
        { rage: S.rage, d: drawn() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and EVERY request is u 1121 -- 1120 is never asked for',
        puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  check(S.rage === false && isSet(drawn(), 5), 'another motion, the user calm: rage off and the calm head back', drawn());

  // TIRED -- and it SHOWS, because his vtable +0x1c8 is live: the eye applier's third slot
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && isSet(drawn(), 4) && count(fired, 1104) === 1,
        'L0 Motion[14] (tired): EYE SET 1 -> 4, the first monster whose tiredness shows on the model, drool c 1104 at once',
        { fired, d: drawn() });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 CLIP frames on', fired);

  // ASLEEP
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 2), 'L3 Motion[14] (lying down): the eyes close (set 2)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[15]'); await frames(4); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L3 Motion[15] (the sleep hold, and the CAPTURE clip): eyes closed, zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 CLIP frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS -- eye set 3 for the whole hold
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(isSet(drawn(), 3) && count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): eye set 3, c 1101 at once',
        { fired, d: drawn() });
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);
  // eye set 3 with no ailment at all
  await play('0', 'Motion[18]'); await frames(3);
  check(isSet(drawn(), 3), 'L0 Motion[18]: eye set 3 on its own, with no ailment', drawn());

  // DEATH: the rage pair REVERTS, and the eyes do NOT close at frame 0 -- the class shuts them at frame 286 of
  // L3 M17, which this table cannot place, so what is checked is that they are still OPEN when it starts.
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[17]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 5),
        'L3 Motion[17] (death): rage off even with the user enraged, and the head reverts to its CALM half',
        { rage: S.rage, d: drawn() });
  check(!isSet(drawn(), 2), 'and his eyes are still OPEN at frame 0 -- the class closes them at frame 286, which the table cannot place',
        drawn());
  for (const m of ['Motion[12]', 'Motion[20]']){
    await play('3', m); await frames(4);
    check(S.rage === false, 'L3 ' + m + ' (death): the same', { rage: S.rage });
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

export const pageCheck = pageCheckMalfestio;
