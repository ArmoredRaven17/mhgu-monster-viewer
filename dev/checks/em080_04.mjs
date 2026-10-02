// Hellblade Glavenus's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER:
// the runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over
// anything in this module -- everything it needs it imports inside itself.
// HELLBLADE GLAVENUS (em080_04): E:/offline/decode/notes/states-em080_04.md.
// HE IS NOT A CLASS OF HIS OWN: there is no `uEm080_04` and only one vtable in the family, so every branch is the
// variant byte `e+0xb5f5 == 4`. His ailment records therefore come from `em080_00c` -- the pel he SHARES with
// Glavenus, byte for byte -- while his break records are his own `em080_04u`. Both halves are asserted, because a
// wiring that reached for `em080_04c` would find nothing and one that reached for `em080_00u` would show
// Glavenus's.
// HIS HEAD, FORELEG, HIP AND TAIL FAMILIES ARE SHOWN IN A STATE THIS TABLE HAS NO AXIS FOR -- the throat overheat
// and death -- so they ride the second column of a {calm, enraged} pair with `show: 'enraged'`. The `calm` column
// is always the LIVE ladder so the user's level still reads correctly, and the checks below prove both columns.
async function pageCheckHellbladeGlavenus(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Hellblade Glavenus: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em080_04';
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
  check(byWhen.event === 13 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 13 event (5 breaks + the sever + the landing + 6 state records) and 2 ragePuff',
        byWhen);
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels.em080_00c > 0 && pels.em080_04u > 0 && !pels.em080_04c,
        'and they come from TWO pels: his own em080_04u for the breaks, and em080_00c -- Glavenus\'s, shared byte ' +
        'for byte -- for every ailment. There is no em080_04c', pels);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick() === 0 && P.joint === 4 && P.records.every(r => r[0] === 'em080_04u'),
        'his puff is the stub shape (pick() === 0, which schedule.js inverts into records[1] = u 1121) on joint 4, ' +
        'and the records are HIS -- Glavenus\'s pair is scale 0.8 at different offsets',
        { pick: P && P.pick(), joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 145 && TO.CUT_TAIL[MON].piece === 'em080_04_tail',
        'his cut tail is his OWN model on joint 145', TO.CUT_TAIL[MON]);
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
  const LAND = ['3', 'Motion[10]'];        // the ailments' recovery clip -- (10, 0x2a) / (10, 0x70) -- no table entry
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

  // L3 Motion[9]: the HEAD at its first rung, and the exhaust status
  const r9 = await rounds('3', 'Motion[9]', 2);
  const head = r9.find(x => same(x.fired, [1001]));
  check(head && isSet(head.d, 8),
        'L3 Motion[9] shows the HEAD at level 2 -- his .dtp gives it two rungs, 2 and 3, at both ranks: set 7 -> 8, ' +
        'u 1001 on joint 4', r9.map(x => x.fired));
  check(r9.some(x => same(x.fired, [1109])), 'and its other play the exhaust status: c 1109 once at frame 0', r9.map(x => x.fired));

  // THE HIP / TAIL BASE
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 21),
        'L3 Motion[1]: the HIP at level 1 -- set 20 -> 21 and u 1005 on JOINT 140', { fired, set21: isSet(drawn(), 21) });

  // L3 Motion[2]: the foreleg, the tail, and the shock trap
  const r2 = await rounds('3', 'Motion[2]', 3);
  const fore = r2.find(x => same(x.fired, [1015])), tail = r2.find(x => same(x.fired, [1030]));
  check(fore && isSet(fore.d, 17), 'L3 Motion[2] shows the FORELEG: set 16 -> 17, u 1015 on joint 2', r2.map(x => x.fired));
  check(tail && isSet(tail.d, 25), 'and the TAIL: set 24 -> 25 (the HOT family -- he is hot from spawn), u 1030 on joint 144',
        r2.map(x => x.fired));
  check(r2.some(x => same(x.fired, [1105])), 'and the SHOCK TRAP: c 1105 at once, from em080_00c', r2.map(x => x.fired));

  // THE TAIL SEVER -- ungated, unlike Glavenus's
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 26),
        'L3 Motion[15]: the tail severed -- set 26, the HOT severed family -- and u 900 on JOINT 145. His sever is ' +
        'UNGATED: vtable +0x230 returns 1 for part 6 whatever the level and heat', { fired, set26: isSet(drawn(), 26) });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // THE THROAT OVERHEAT, on and off
  await play(REST[0], REST[1]); await frames(3);
  await play('2', 'Motion[8]'); await frames(3);
  check(isSet(drawn(), 5) && isSet(drawn(), 10),
        'L2 Motion[8] ((7, 8)): the THROAT OVERHEATS -- set 4 -> 5 (60 off, 70 and 80 on) and the head family ' +
        '7/8/9 -> 10/11/12 (72, 82 on) at the user\'s level', drawn());
  await play('3', 'Motion[11]'); await frames(3);
  check(isSet(drawn(), 4) && isSet(drawn(), 7),
        'L3 Motion[11] ((10, 0x72) with part 0): the throat is PUT OUT -- back to set 4 and the head to 7/8/9', drawn());
  // and the overheat column must NOT follow the user's Enraged toggle
  const rageBox = document.getElementById('monRage');
  await play(REST[0], REST[1]); await frames(3);
  const calmD = drawn();
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[11]'); await frames(3);
  check(isSet(drawn(), 7), 'and with the Enraged toggle ON it is still set 7: H_HEAD_ANY holds the live ladder in ' +
        'both columns, because NOTHING on Hellblade reads rage', drawn());
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }

  // RAGE: nothing at all on the model
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('0', 'Motion[5]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L0 Motion[5] ((1, 2)): rage on and NOT ONE part changes -- the part pass never reads isEnraged and the ' +
        'variant-4 path has no rage material machine at all', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is u 1121', puffs.map(p => p.key));

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[8]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[8] (the tired idle): rage off and the drool c 1104 at once -- Glavenus\'s "tiredness puts the ' +
        'throat out" branch is variant-0 only, so nothing on his model changes', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);

  // ASLEEP
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[14]'); await frames(3);
  check(isSet(drawn(), 2), 'L3 Motion[14] (lying down, and also capture): his eyes shut -- set 3 -> 2, the lid on and ' +
        'the eye\'s m06_nodo_r glow off', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[25]'); await frames(3); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L3 Motion[25] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS and the STUN
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[3]', 'Motion[5]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain, and he has NO sided reaction): c 1103 held',
          evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: the machines park and the part pass takes the dead families
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[18]'); await frames(4);
  check(S.rage === false, 'L3 Motion[18] (death, (11, 0) and every unnamed number): the rage shown goes off, which is ' +
        'what m01_blood plays angry_End for', { rage: S.rage });
  check(isSet(drawn(), 2),
        'and HIS EYES SHUT at death (set 2): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
  check(isSet(drawn(), 6) && isSet(drawn(), 13),
        'and the DEAD families are shown: the throat set 6 (60, 70, 80 all off) and the head 13/14/15 with every ' +
        'blood group off, at the user\'s level', drawn());
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

export const pageCheck = pageCheckHellbladeGlavenus;
