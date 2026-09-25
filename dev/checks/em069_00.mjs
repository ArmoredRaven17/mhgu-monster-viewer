// Seltas Queen's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything
// in this module -- everything it needs it imports inside itself.
// SELTAS QUEEN (em069_00): E:/offline/decode/notes/states-em069_00.md, a STATIC decode -- nothing in it was run
// under the emulator, and the note says so.
// SHE HAS SEVEN BREAK ROWS AND ONLY ONE LEVEL EACH, at every rank: each member swaps the first time its
// durability runs out and never again. SIX OF THEM SHARE ONE CLIP (L3 Motion[1], the (10, 7) flinch), so that row
// is a seven-way cycle whose last member is the shock trap; the head has L3 Motion[2] to itself.
// AND SHE HAS NO EYE SETS, NO TAIL SEVER AND NO CUT TAIL -- her class never calls 0x71398, so the eye fields stay
// -1, and her tail BREAKS (u 1035) without ever coming off. All three absences are asserted here, because each of
// them is the kind of thing a later edit would "fix" by adding.
async function pageCheckSeltasQueen(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Seltas Queen: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em069_00';
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
  check(byWhen.event === 13 && byWhen.ragePuff === 2,
        'the schedule holds her state records: 13 event (7 breaks + 6 state records) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(900), 'and NO u 900: she has no tail sever at all -- four independent reads say so', keys);
  check(!TO.CUT_TAIL[MON], 'and no CUT_TAIL entry: her tail breaks and stays on', TO.CUT_TAIL[MON]);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 1,
        'her puff is the ordinary stub shape: pick() === 0, which schedule.js inverts into records[1] = u 1121, on ' +
        'joint 1 -- her vtable +0x208 IS overridden, but with the male Seltas\'s coupling aura, not a puff of her own',
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
  const LAND = ['3', 'Motion[17]'];        // a list-3 clip with no table entry, to land between plays
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

  // L3 Motion[1] CARRIES SIX BREAKS AND THE SHOCK TRAP -- seven plays, and every one of them must appear
  const r1 = await rounds('3', 'Motion[1]', 7);
  const SIX = [[1005, 10, 'the smaller legs'], [1010, 11, 'the +X front leg'], [1015, 13, 'the +X rear leg'],
               [1020, 12, 'the -X front leg'], [1025, 14, 'the -X rear leg'], [1035, 15, 'the tail']];
  for (const [key, set, what] of SIX){
    const hit = r1.find(x => same(x.fired, [key]));
    check(hit && isSet(hit.d, set), 'L3 Motion[1] shows ' + what + ': set ' + set + ', u ' + key, r1.map(x => x.fired));
  }
  check(r1.some(x => same(x.fired, [1105])), 'and its seventh play is the SHOCK TRAP: c 1105 at once', r1.map(x => x.fired));

  // THE HEAD, on a clip of its own
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1030]) && isSet(drawn(), 9),
        'L3 Motion[2]: the HEAD -- set 1 -> 9 (group 1 off, 2 on) and u 1030 on joint 1', { fired, set9: isSet(drawn(), 9) });

  // RAGE: no mesh change at all -- the Angry material clips are the whole of it
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[5]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[5] ((1, 13), the rage entry): rage on and NOT ONE part changes -- XfB__m03_add\'s Angry clips ' +
        'are the whole of what rage shows, and they are not this table\'s to drive', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // ASLEEP: the zzz and the paused puff -- and NO lid, because she has no eye set
  await play(REST[0], REST[1]); await frames(3);
  const awake = drawn();
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(count(fired, 1102) === 1 && same(drawn(), awake),
        'L0 Motion[19] (the sleep hold, and capture\'s tail): the zzz at once and NO eye set -- she has none',
        { fired, changed: !same(drawn(), awake) });
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS, the EXHAUST status and the STUN's held handle
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3);
  check(same(fired, [1109]), 'L3 Motion[9] (the tune+0x44 status): c 1109 once at frame 0', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[26]', 'Motion[6]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'),
          'L3 ' + clip + ' (the stun chain -- and it is NOT sided, her handler never reads the direction): c 1103 held',
          evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: three clips, and what death does to her is clear the rage flag
  const rageBox = document.getElementById('monRage');
  for (const clip of ['Motion[51]', 'Motion[35]', 'Motion[36]']){
    if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off, which is what runs Angry_End', { rage: S.rage });
  }
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip she carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckSeltasQueen;
