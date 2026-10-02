// Gammoth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// GAMMOTH (em083_00): what her motions show, against E:/offline/decode/notes/states-em083_00.md (sections 4.5 and
// 4.6 settled by follow-ups).
// HER SNOW ARMOUR is six counters with their own sets, keys and reaction, and TWO of her motions are worn by
// several states, so the play ORDER is part of what is checked: L3 M1 is the snow knock-off for each of five limbs
// and then the shock trap; L3 M2 is the head break, the trunk break and the exhaust status; L3 M6 and L3 M3 are two
// leg breaks each and then the stun.
// THE LEG BREAK RIDES THE SNOW MACHINE: it forces that limb's counter to 4 and the applier draws the slot's fifth
// set -- 12 / 17 / 22 / 27, the SNOWLESS broken foot (groups 65..68) -- which is part-review's per-leg "Broken".
// That is the claim 4.6 corrected in the note, so it is asserted here from both ends.
async function pageCheckGammoth(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Gammoth: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em083_00';
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
  check(byWhen.event >= 18 && byWhen.ragePuff === 2,
        'the schedule holds her state records: 18 event (7 breaks + 5 snow knock-offs + 6 ailments) and 2 ragePuff', byWhen);
  check(!TO.CUT_TAIL[MON], 'and no cut tail: her option descriptor has -1 where a model would be', TO.CUT_TAIL[MON]);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const pick = async (row, text) => {
    const f = document.querySelector('[data-row="' + row + '"]');
    const sel = f && f.querySelector('select');
    const o = sel && [...sel.options].find(x => x.textContent.trim() === text);
    if (!o) return false;
    sel.value = o.value; sel.dispatchEvent(new Event('change'));
    await frames(2);
    return true;
  };
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
  // A CYCLE'S PHASE IS NOT OURS TO ASSUME. `motionStates.plays` counts every frame 0 a motion has ever had on
  // this runtime instance, so which spec a cycle shows when a check arrives depends on what ran before it.
  // `rounds` plays a motion n times, landing on a clip with no table entry between plays, and returns what
  // each play fired and drew -- so the assertions below say WHAT the cycle contains, which is its promise,
  // rather than the order it happens to be in.
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
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[11]'];          // her recovery clip: no table entry, safe to land on
  const HEAD = '52,53,62,63,102,103', TRUNK = '54,64';
  const LF = '20,30,55,65,70,110', RF = '21,31,56,66,71,111', LR = '22,32,57,67,72,112', RR = '23,33,58,68,73,113';
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1) && isSet(user0, 8) && isSet(user0, 13) && isSet(user0, 18) && isSet(user0, 23),
        'at rest: the head intact (set 1) and all four legs packed with snow (sets 8, 13, 18, 23)', user0);

  // L3 M2: THE HEAD, THE TRUNK, THE EXHAUST -- in that order, one per play. Her head breaks at LEVELS 2 AND 3.
  check(await pick(HEAD, 'Cracked'), 'the Head row set to Cracked');
  check(await pick(TRUNK, 'Broken'), 'the Trunk row set to Broken');
  const three = await rounds('3', 'Motion[2]', 3);
  check(three.some(r => r.fired.includes(1001) && isSet(r.d, 2)),
        'one play of L3 Motion[2] is the head at LEVEL 2: set 2, u 1001 on joint 150', three.map(r => r.fired));
  check(three.some(r => r.fired.includes(1006) && isSet(r.d, 7)),
        'another is the TRUNK: set 7, u 1006 on joint 157', three.map(r => r.fired));
  check(three.some(r => r.fired.includes(1109)),
        'and the third is the EXHAUST status: c 1109', three.map(r => r.fired));
  check(await pick(HEAD, 'Broken'), 'the Head row set to Broken');
  const headLv3 = await rounds('3', 'Motion[2]', 3);
  check(headLv3.some(r => r.fired.includes(1002) && isSet(r.d, 3)),
        'and with the Head row on Broken, its head play is LEVEL 3: set 3, u 1002 on joint 132', headLv3.map(r => r.fired));
  await pick(HEAD, 'Intact'); await pick(TRUNK, 'Intact');

  // THE LEG BREAK, through the snow machine: counter 4 -> the slot's fifth set, the snowless broken foot
  check(await pick(LF, 'Broken'), 'the Left Front Leg row set to Broken');
  check(await pick(LR, 'Broken'), 'the Left Rear Leg row set to Broken');
  const plusX = await rounds('3', 'Motion[6]', 3);
  check(plusX.some(r => r.fired.includes(1010) && isSet(r.d, 12)),
        'one play of L3 Motion[6] is the +X front leg: SET 12, the snowless broken foot, and u 1010 on joint 7',
        plusX.map(r => r.fired));
  check(plusX.some(r => r.fired.includes(1020) && isSet(r.d, 22)),
        'another is the +X rear leg: set 22, u 1020 on joint 14', plusX.map(r => r.fired));
  check(await pick(RF, 'Broken'), 'the Right Front Leg row set to Broken');
  const minusX = await rounds('3', 'Motion[3]', 3);
  check(minusX.some(r => r.fired.includes(1015) && isSet(r.d, 17)),
        'one play of L3 Motion[3] is the -X front leg: set 17, u 1015 on joint 11', minusX.map(r => r.fired));
  for (const r of [LF, RF, LR, RR]) await pick(r, 'Full Snow');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the leg rows back to Full Snow: the parts are the user\'s again', drawn());

  // L3 M1: THE SNOW KNOCK-OFF, one limb per play, then the shock trap -- SIX states on one clip.
  // WHICH PLAY IS WHICH IS NOT OURS TO ASSUME: motionStates.plays is per runtime instance and counts every frame 0
  // the motion has ever had, so the phase the cycle is in when a check arrives depends on what ran before it. Play
  // it six times, collect what each play fired and drew, and assert the SET -- which is what a cycle promises.
  const six = await rounds('3', 'Motion[1]', 6);
  const KNOCK = [[10, 1041, 'the +X front leg'], [15, 1046, 'the -X front leg'], [20, 1051, 'the +X rear leg'],
                 [25, 1056, 'the -X rear leg'], [29, 1060, 'the tail']];
  for (const [set, key, what] of KNOCK)
    check(six.some(r => r.fired.includes(key) && isSet(r.d, set)),
          'one play of L3 Motion[1] knocks the snow off ' + what + ': set ' + set + ', u ' + key,
          six.map(r => r.fired));
  check(six.some(r => r.fired.includes(1105)), 'and one of its plays is the SHOCK TRAP: c 1105', six.map(r => r.fired));
  for (const r of [LF, RF, LR, RR]) await pick(r, 'Full Snow');
  await play(REST[0], REST[1]); await frames(3);

  // PARALYSIS and the STUN
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[7]', 'Motion[8]', 'Motion[4]', 'Motion[5]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chains): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chains it is stopped', evReqs(1103));

  // RAGE: nothing on the model at all -- 0x81670 has not one call site in her class
  puffs.length = 0;
  await play('0', 'Motion[3]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[3] (the roar): rage on, and NOTHING on the model changes', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is KEY 1121 -- 1120 is never asked for', puffs.map(p => p.key));

  // TIRED
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[15]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[15] (tired): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: shut is SET 5 for her (the applier is 0x71398(e, 4, 5, -1))
  await play('3', 'Motion[10]'); await frames(4);
  check(isSet(drawn(), 5), 'L3 Motion[10] (lying down): her eyes shut -- SET 5, not set 1', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[20]'); await frames(4); await steps(2);
  check(isSet(drawn(), 5) && count(fired, 1102) === 1, 'L0 Motion[20] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[16]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
    check(isSet(drawn(), 5),
          'and HIS EYES SHUT at death (set 5): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
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

export const pageCheck = pageCheckGammoth;
