// Diablos's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once and every monster used to add its check to the one shared runner -- which
// collides, and made that file grow without bound. The runner serialises `pageCheck` with .toString() and
// evaluates it IN THE PAGE, so it must not close over anything in this module: everything it needs it imports
// inside itself (`await import('/render/monster.js')`).
//   Export `pageCheck`, and `args` when one function serves several monsters (the Rathian family does).
// DIABLOS (em007_00): what his motions show, against E:/offline/decode/notes/states-em007_00.md. Two firsts here.
// HIS HORN BREAK HAS THREE STATES and its sets are CUMULATIVE -- level 1 takes set 3 -> 4, level 2 takes that AND
// set 5 -> 6 -- which is the Horns row Raven reviewed on 2026-09-10 (Intact / One Horn Broken / Both Horns Broken).
// And HIS RAGE-PUFF PICK IS LIVE: vtable +0x2a4 is byte-identical to Rathian's and reads the same joint, so which
// of u 1120 / u 1121 the game asks for depends on where his head is pointing, not on a stub.
async function pageCheckDiablos(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Diablos: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em007_00';
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
  check(byWhen.event >= 10 && byWhen.ragePuff === 2, 'the schedule holds his state records: 10 event and 2 ragePuff', byWhen);
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
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE. The clip select keeps its index across a list
  // change, so letting a frame run first plays whatever clip that index names in the new list -- and for Diablos
  // that is L3 Motion[2], his back break, which fired u 1000 into the middle of the horn-break assertion.
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    // THREE ORDERED LOOKUPS, not one `find` with three disjuncts: `find` walks the OPTIONS and returns the first
    // that matches ANY of them, so for a split motion it hands back the `_start` whatever order the disjuncts are
    // written in. The harness loops whatever clip is selected and does not advance a `_start` into its `_loop`, so
    // dwelling in a short `_start` restarts the motion -- and its countdowns -- every few frames, which makes a
    // timed record over-fire and an `every:` assertion pass for the wrong reason. The `_loop` segment is also the
    // right one to dwell in: it sets loopSeg, which motionStates.step treats as the motion GOING ON rather than
    // starting over, and its frame 0 still opens the spec. (dev/checks/em014_00.mjs; Session C, 2026-09-25.)
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  // TWO CLOCKS, and they are not the same one. `every:` countdowns in motion-states.step are measured in CLIP
  // frames (`d = frame - prev.frame`), while the rage puff's cadence in schedule.js is measured in SCHEDULE
  // frames -- and this harness advances one clip frame per two schedule steps. So `steps(period + 2)` waits about
  // HALF a period: the second fire never comes, and the assertion only passed because the old play() picked a
  // short `_start` clip that the harness restarted every few frames, re-opening the spec and firing the record
  // again. Preferring `_loop` removes that accident and exposes the wrong clock. (Session C, 2026-09-25.)
  // So: anything motion-states.step drives waits in clipSteps; the puff's cadence stays on steps.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[2]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 3) && isSet(user0, 5) && isSet(user0, 7) && isSet(user0, 9) && isSet(user0, 2),
        'at rest: both horns, the back and the tail intact (sets 3, 5, 7, 9) and the eyes open (set 2)', user0);

  // THE HORNS: two levels on ONE motion, and the second level keeps the first's set.
  // Land in list 3 FIRST, on L3 Motion[1] -- a head depletion at level 0, which the table gives nothing -- because
  // the clip select keeps its index across a list change and L3 Motion[2] is his back break, which fired u 1000
  // into the middle of this.
  check(await pick('2,102+3,103', 'One Horn Broken'), 'the Horns row set to One Horn Broken');
  await play('3', 'Motion[1]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[22]'); await frames(3);
  const d1 = drawn();
  check(same(fired, [1030]) && isSet(d1, 4) && isSet(d1, 5),
        'L3 Motion[22] at level 1: set 3 -> 4 (one horn), set 5 untouched, u 1030', { fired, d: d1 });
  check(await pick('2,102+3,103', 'Both Horns Broken'), 'the Horns row set to Both Horns Broken');
  await play('3', 'Motion[1]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[22]'); await frames(3);
  const d2 = drawn();
  check(same(fired, [1031]) && isSet(d2, 4) && isSet(d2, 6),
        'L3 Motion[22] at level 2: sets 4 AND 6 -- the level-1 set is KEPT -- and u 1031', { fired, d: d2 });

  // THE BACK, L3 Motion[2] -- which is also the exhaust status and any other depletion; the break is what it shows
  check(await pick('6,104', 'Broken'), 'the Back row set to Broken');
  await play('3', 'Motion[1]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  const d3 = drawn();
  check(same(fired, [1000]) && isSet(d3, 8) && isSet(d3, 4) && isSet(d3, 6),
        'L3 Motion[2]: the back breaks (set 8), u 1000, and the horns stay broken', { fired, d: d3 });

  // THE TAIL SEVER, and HE DROPS IT -- his cut tail is staged, unlike Basarios's
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 144, 'his cut tail is on JOINT 144, not the Rath line 143', TO.CUT_TAIL[MON]);
  check(await pick('4,101', 'Severed'), 'the Tail row set to Severed');
  await play('3', 'Motion[1]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 10), 'L3 Motion[15]: the tail severed (set 10), u 900', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted, so `drops` has something to fly', Object.keys(V.mounted));
  await pick('2,102+3,103', 'Intact'); await pick('6,104', 'Intact'); await pick('4,101', 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model at all, and the puff is the whole of what it shows
  puffs.length = 0;
  await play('0', 'Motion[22]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[22]: rage on, and NOTHING on the model changes with it', { rage: S.rage, d: drawn() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  // THE PICK IS LIVE. It is Rathian's own function on the same joint, and it answers from where joint 4 points:
  // +Z level gives 1 (u 1120), +Z swung 45 degrees down gives 0 (u 1121). A stub could not do both.
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4 && P.pick === MS.rathianPuffPick, 'the puff reads joint 4 through Rathian\'s own pick', { joint: P && P.joint });
  const s45 = Math.sin(-Math.PI / 8), c45 = Math.cos(-Math.PI / 8);
  check(MS.rathianPuffPick([0, 0, 0, 1]) === 1 && MS.rathianPuffPick([s45, 0, 0, c45]) === 0,
        'and it is LIVE: level gives 1 (u 1120), 45 degrees down gives 0 (u 1121)',
        [MS.rathianPuffPick([0, 0, 0, 1]), MS.rathianPuffPick([s45, 0, 0, c45])]);
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes DO shut
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 1), 'L3 Motion[14] (lying down): HIS EYES SHUT (set 1)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (the shock trap shares its hold) and the STUN, which is held rather than fired
  fired.length = 0;
  await play('3', 'Motion[13]_loop'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[5]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[5] (the stun hold): c 1103 held, not fired', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH, including the BURROWED one he surfaces from
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[17]'); await frames(4);
  // HIS EYES SHUT IN DEATH -- set 2 -> set 1, the same swap his sleep hold makes. Added 2026-09-25 with the
  // correction: states-em042_00.md had said P+0x5d02 is raised only asleep or resting "and at no other time",
  // which was drawn from ONE of its SEVEN writers, and his death rows carried no sets at all as a result. The
  // assertion is here so that negative cannot come back unnoticed. (0xbd594 sets the flag and its timer; 0x75c1c
  // calls it with -1 in the same straight-line block as the status-11 rage clear 0xba7b8 at 0x75b90.)
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[17] (death): the rage shown goes off even with the user enraged, and HIS EYES SHUT (set 1)', { rage: S.rage, d: drawn() });
  await play('3', 'Motion[12]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[12] (death at the end of the fall): the same', { rage: S.rage, d: drawn() });
  await play('3', 'Motion[20]'); await frames(4);
  check(S.rage === false && isSet(drawn(), 1), 'L3 Motion[20] (the BURROWED death, after he surfaces on L3 M21): the same', { rage: S.rage, d: drawn() });
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

export const pageCheck = pageCheckDiablos;
