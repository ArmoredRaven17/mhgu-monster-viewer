// Great Maccao's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything
// in this module -- everything it needs it imports inside itself.
// GREAT MACCAO (em085_00): E:/offline/decode/notes/states-em085_00.md.
// HE IS THE SECOND MONSTER WITH A RANK-DEPENDENT BREAK, and the sharper of the two: his tail row is {2, 2, 3, 2},
// so at G the record id resolves to KEY 1012, WHICH `em085_00u` DOES NOT CONTAIN. At the viewer's rank the tail
// break shows its set and fires nothing at all, and u 1011 -- the record only low rank can reach -- is deliberately
// NOT exported. This check defends both halves of that: the set must still move, and 1011 must be absent.
// BOTH HIS BREAKS PLAY L3 Motion[3], because `vtable +0x23c` is overridden to "this part just reached its break
// level" where Barioth's tests tiredness, so each play of that clip shows the next break.
async function pageCheckGreatMaccao(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Great Maccao: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em085_00';
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
  check(byWhen.event === 7 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 7 event (the crest break + 6 ailment records) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(keys.includes(1001) && !keys.includes(1011),
        'u 1001 (the crest) is there and u 1011 IS NOT: at G the tail break asks for key 1012, which his pel does ' +
        'not hold, so the low-rank record is never reachable and is not exported', keys);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.period === 30,
        'his puff is the ordinary stub shape: pick() === 0, which schedule.js inverts into records[1] = u 1121, on joint 4',
        { pick: P && P.pick(), joint: P && P.joint });
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
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  // THE TWO CLOCKS. `every:` countdowns are stepped by motion-states.step in CLIP frames, while the rage
  // puff's cadence is counted by schedule.js in SCHEDULE frames -- and this harness advances one clip frame
  // per two schedule steps, so waiting out a period with `steps` waits half of one. `acc` accumulates across
  // a _loop wrap: at the wrap the frame drops, so the frames since the last sample are the new frame itself.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[16]'];          // a list-3 clip with no table entry, to land between plays
  // A CYCLE'S PHASE IS NOT ASSUMABLE: `motionStates.plays` counts every frame 0 that motion has ever had on this
  // runtime instance, so the first play this check sees need not be the first spec. Take N consecutive plays from a
  // clean landing each time and assert the SET of what they show.
  const rounds = async (list, clip, n, settle = 3) => {
    const seen = [];
    for (let i = 0; i < n; i++){
      await play(LAND[0], LAND[1]); await frames(2);
      fired.length = 0;
      await play(list, clip); await frames(settle);
      seen.push({ fired: fired.slice(), d: drawn() });
    }
    return seen;
  };
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);

  // L3 Motion[3]: THE CREST, then THE TAIL -- and the tail's play fires NOTHING at this rank
  const r3 = await rounds('3', 'Motion[3]', 2);
  const crest = r3.find(x => same(x.fired, [1001])), tail = r3.find(x => x.fired.length === 0);
  check(crest && isSet(crest.d, 4), 'L3 Motion[3] shows the CREST break: set 3 -> 4, u 1001 on joint 3', r3.map(x => x.fired));
  check(tail && isSet(tail.d, 6),
        'and its other play shows the TAIL at G: set 5 -> 6 AND NOT ONE RECORD -- key 1012 is not in his pel',
        tail && { fired: tail.fired, set6: isSet(tail.d, 6) });

  // L3 Motion[1]: the shock trap's periodic record, and the exhaust's single one
  const r1 = await rounds('3', 'Motion[1]', 2);
  check(r1.some(x => same(x.fired, [1105])), 'L3 Motion[1] shows the shock trap: c 1105 at once', r1.map(x => x.fired));
  check(r1.some(x => same(x.fired, [1109])), 'and its other play the exhaust status: c 1109 once at frame 0', r1.map(x => x.fired));
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  if (same(fired, [1105])){ await clipSteps(45); check(count(fired, 1105) === 2, 'and the trap record again 42 steps on', fired); }

  // RAGE and the puff
  await play(REST[0], REST[1]); await frames(3);
  puffs.length = 0;
  await play('0', 'Motion[17]'); await steps(95);
  check(S.rage === true, 'L0 Motion[17] (the rage entry): rage on -- nothing on his mesh moves with it', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // TIRED: his own idle clip, with the drool
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[18]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[18] (the tired idle, a clip of its own): rage off and the drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 steps on', fired);

  // ASLEEP: the lid closes on the lying-down clip and stays on the hold
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[6]'); await frames(3);
  check(isSet(drawn(), 1), 'L3 Motion[6] (lying down): his eyes shut -- set 2 -> set 1, the lid drawn', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[7]'); await frames(3); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L3 Motion[7] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[8]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[8] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[15]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[15] (the stun, and it is NOT sided): c 1103 held, not fired', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the clip it is stopped', evReqs(1103));

  // DEATH: the break sets stay and his eyes stay open
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[10]'); await frames(4);
  check(S.rage === false, 'L3 Motion[10] (death): the rage shown goes off', { rage: S.rage });
  check(!isSet(drawn(), 1), 'and his eyes STAY OPEN -- status 11 never raises P+0x5d02', drawn());
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
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

export const pageCheck = pageCheckGreatMaccao;
