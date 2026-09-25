// Seregios's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// SEREGIOS (em077_00): E:/offline/decode/notes/states-em077_00.md.
// HIS WHOLE APPEARANCE IS A RAGE x BREAK PRODUCT, and that is what this check defends. Seven bladescale regions
// each have a flat and an erect mesh variant; the four that carry no break follow rage on every motion
// (RAGE_PARTS.em077_00, as Barioth's pair does), and the three that do -- both wings and the head -- plus the tail
// follow rage AND the user's level, which is S_WING_R / S_WING_L / S_HEAD / S_TAIL. A regression that dropped
// RAGE_PARTS would leave him flat while enraged and nothing else would notice.
// EVERY BREAK OF HIS IS AT LEVEL 2, at every rank -- there is no level-1 row anywhere in his .dtp -- so each break
// row carries `at: 2` and level 1 repeats level 0 with `fire: null`.
// AND HIS PUFF PICK IS LIVE: vtable +0x2a4 = 0xfeded8 is Rathian's 0xd08afc arithmetic for arithmetic, on her
// joint 4, so the table must hold `rathianPuffPick` itself and not a constant.
async function pageCheckSeregios(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Seregios: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em077_00';
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
  check(byWhen.event === 14 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 14 event (5 breaks + the sever + the landing + 7 state records) and 2 ragePuff',
        byWhen);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.pick === MS.rathianPuffPick && P.joint === 4,
        'HIS PICK IS LIVE: the table holds rathianPuffPick itself, on joint 4 -- his 0xfeded8 is her 0xd08afc and ' +
        '0xfda1a8 writes P+0x5d04 = 4. His two records DIFFER, so a stub pick would show the wrong one',
        { live: P && P.pick === MS.rathianPuffPick, joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 144, 'his cut tail is on joint 144', TO.CUT_TAIL[MON]);
  const RP = MS.RAGE_PARTS[MON];
  check(RP && RP.calm.join() === '2,3' && RP.enraged.join() === '14,15',
        'the four break-free regions are RAGE_PARTS: calm 2 + 3, enraged 14 + 15 -- the part pass re-applies them ' +
        'from P+0x518 every frame, so they are not any one motion\'s sets', RP);
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
  const LAND = ['3', 'Motion[16]'];        // the common recovery clip -- (10, 0x2a) / (10, 0x2b) / (10, 0x70) -- no table entry
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

  // L3 Motion[3] WEARS THREE HATS: the +X wing's break, the +X hind leg's, and the stun for direction 2
  const r3 = await rounds('3', 'Motion[3]', 3);
  const wingR = r3.find(x => same(x.fired, [1006])), legR = r3.find(x => same(x.fired, [1016]));
  check(wingR && isSet(wingR.d, 22) && isSet(wingR.d, 20),
        'L3 Motion[3] shows the +X WING at level 2: set 10 -> 22 AND the flat/erect pair 7 -> 20, u 1006 on joint 9',
        r3.map(x => x.fired));
  check(legR && isSet(legR.d, 30),
        'and its next play the +X HIND LEG: set 5 -> 30 (group 28 on, 111 off), u 1016 on joint 80 -- the legs are ' +
        'not a bladescale region, so one set is the whole of it', r3.map(x => x.fired));
  // L3 Motion[4] IS THE MIRROR
  const r4 = await rounds('3', 'Motion[4]', 3);
  const wingL = r4.find(x => same(x.fired, [1011])), legL = r4.find(x => same(x.fired, [1021]));
  check(wingL && isSet(wingL.d, 23) && isSet(wingL.d, 21), 'L3 Motion[4] shows the -X WING: sets 23 + 21, u 1011 on joint 13',
        r4.map(x => x.fired));
  check(legL && isSet(legL.d, 31), 'and the -X HIND LEG: set 31, u 1021 on joint 92', r4.map(x => x.fired));

  // THE HEAD, on the flinch clip
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1031]) && isSet(drawn(), 19),
        'L3 Motion[1]: the HEAD at level 2 -- set 9 -> 19 (group 42 on, 110 off) and u 1031 on JOINT 200',
        { fired, set19: isSet(drawn(), 19) });

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 24),
        'L3 Motion[15]: the tail severed -- set 4 -> 24 (group 101 off, 16 on) and u 900 on JOINT 144', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // RAGE: the body swap AND the all-erect defaults, both from RAGE_PARTS, plus the puff
  await play(REST[0], REST[1]); await frames(3);
  const calmD = drawn();
  check(isSet(calmD, 2) && isSet(calmD, 3), 'calm, every region is FLAT: sets 2 and 3 as the part pass writes them', calmD);
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true, 'L0 Motion[4] (the rage entry, (1, 9)): rage on', { rage: S.rage });
  check(isSet(drawn(), 14) && isSet(drawn(), 15),
        'and EVERY REGION READS ERECT: set 2 -> 14 (group 3 off, 4 on, 108 on) and 3 -> 15, applied from the rage ' +
        'shown rather than from this clip', drawn());
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1120 || p.key === 1121),
        'and each puff is one of his two DIFFERENT records, whichever joint 4\'s angle picks that frame',
        puffs.map(p => p.key));
  await play(REST[0], REST[1]); await frames(3);
  check(isSet(drawn(), 2) && isSet(drawn(), 3), 'off the rage clip it is flat again -- there is no fade and no window', drawn());

  // THE NOTICE
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('0', 'Motion[5]'); await frames(3);
  check(same(fired, [1200]), 'L0 Motion[5] ((2, 9), the notice): c 1200 once at frame 0', fired);

  // TIRED: his own idle clip, with the 70-degree drool
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[14] (the tired idle, a clip of its own): rage off and the drool c 1104 at once', { rage: S.rage, fired });
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'and the drool again 48 steps on', fired);

  // ASLEEP: the lid closes on the fall and stays on the hold
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[14]'); await frames(3);
  check(isSet(drawn(), 13), 'L3 Motion[14] (lying down, and also capture): his eyes shut -- set 1 -> 13', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(3); await steps(2);
  check(isSet(drawn(), 13) && count(fired, 1102) === 1, 'L0 Motion[19] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS, THE SHOCK TRAP, THE EXHAUST STATUS and the STUN's held handle
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'L3 Motion[9] (the shock trap\'s first half): c 1105 at once', fired);
  await clipSteps(45);
  check(count(fired, 1105) === 2, 'and again 42 steps on', fired);
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1109]), 'L3 Motion[2] (the tune+0x44 status): c 1109 once at frame 0', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[5]', 'Motion[7]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: the rage appearance reverts on the same frame, and his eyes stay open
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[17]'); await frames(4);
  check(S.rage === false, 'L3 Motion[17] (death, (11, 0) and every unnamed number): the rage shown goes off', { rage: S.rage });
  check(isSet(drawn(), 2) && isSet(drawn(), 3) && !isSet(drawn(), 13),
        'so the calm sets come back the same frame -- and his eyes STAY OPEN, death never raising P+0x5d02', drawn());
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

export const pageCheck = pageCheckSeregios;
