// Gravios's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// GRAVIOS (em005_00): what his motions show, against E:/offline/decode/notes/states-em005_00.md. Three firsts here.
// HE IS WIRED AT G RANK, the rank index.html's SHELL_QUEST_RANK already fixes at 5: his back and his head raise
// their break threshold from 1 to 2 with rank and fire a DIFFERENT record there -- u 1001 and u 1026 where low rank
// fires u 1000 and u 1025 -- so the first depletion of either has to show and fire NOTHING, and the second has to
// fire the G key, not the low-rank one. Both halves are asserted below.
// HIS BELLY IS TWO SWAPS STACKED on one dtt part: sets 9+11 intact, 10+11 cracked, 10+12 broken, which is the
// merged Belly row Raven reviewed on 2026-09-10 (Intact / Cracked / Broken) and the ROM's own progression.
// AND TWO OF HIS MOTIONS ARE PLAYED BY TWO BREAKS EACH (`cycle`): L3 M106 is the back and the belly's first break
// (and the tail's durability stagger, which shows nothing), L3 M103 is both wing-forelegs. Each play shows the next,
// so the play ORDER is part of what is checked -- and nothing may play either motion before those assertions.
async function pageCheckGravios(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Gravios: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em005_00';
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
  check(byWhen.event >= 16 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 16 event (8 breaks + the sever + the cut-tail landing + 6 ailments) and 2 ragePuff', byWhen);
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
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE: the clip select keeps its index across a list
  // change, so letting a frame run first plays whatever clip that index names in the new list -- and in his list 3
  // that could be a break motion, which would fire a record into the middle of an assertion AND advance a cycle.
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    // THREE ORDERED LOOKUPS, not one `find` with three disjuncts: `find` walks the OPTIONS and returns the first
    // that matches ANY disjunct, and 'Motion[N]_start' precedes 'Motion[N]_loop' in the list -- so one find always
    // hands back the _start, whatever order the disjuncts are in. Dwelling in a short _start restarts the motion
    // and its countdowns every few frames, so a timed record over-fires; preferring the _loop is also what the ROM
    // does, since a _loop clip sets `loopSeg` and motionStates.step treats it as the motion GOING ON rather than
    // starting over, while its frame 0 still opens the spec. (Effects session A, 2026-09-25; dev/checks/em014_00.mjs)
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
  const REST = ['0', 'Motion[1]'];           // his plain idle loop: no table entry, so it shows nothing of its own
  const LAND = ['3', 'Motion[3]'];           // a list-3 clip with no table entry, to land in the list on
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 3) && isSet(user0, 5) && isSet(user0, 7) && isSet(user0, 9) && isSet(user0, 11) &&
        isSet(user0, 13) && isSet(user0, 15) && isSet(user0, 17) && isSet(user0, 19) && isSet(user0, 2),
        'at rest: head, both wings, both belly pairs, both legs, the back and the tail intact (sets 3, 5, 7, 9, 11, ' +
        '13, 15, 17, 19) and the eyes open (set 2)', user0);

  // THE BACK AT G RANK, HALF ONE: the first depletion. The Back row left Intact, L3 M106 must change nothing and
  // fire nothing -- the level-1 rung repeats level 0's sets, because at G his threshold is 2.
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[106]'); await frames(3);
  check(fired.length === 0 && same(drawn(), user0),
        'L3 Motion[106] with the Back Intact: AT G RANK the first depletion shows nothing and fires nothing', { fired, d: drawn() });

  // HALF TWO: the second depletion fires u 1001, the G record -- NOT u 1000, which is low rank's.
  // This is the cycle's second play, so it would be the BELLY's spec -- so the Belly row goes with it and both
  // halves of the cycle are read off the one pair of plays: play 2 = the belly, play 3 = the back again.
  check(await pick('16,17', 'Broken'), 'the Back row set to Broken');
  check(await pick('8,9+10,11', 'Cracked'), 'the Belly row set to Cracked');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[106]'); await frames(3);
  const dBelly = drawn();
  check(same(fired, [1030]) && isSet(dBelly, 10) && isSet(dBelly, 11),
        'the cycle\'s 2nd play of L3 Motion[106] is the BELLY\'s first break: sets 10 + 11 (cracked), u 1030', { fired, d: dBelly });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[106]'); await frames(3);
  const dBack = drawn();
  check(same(fired, [1001]) && isSet(dBack, 18),
        'the 3rd play is the BACK again, at G level 2: set 18, and u 1001 -- the G record, not low rank\'s u 1000', { fired, d: dBack });

  // THE BELLY'S SECOND BREAK, the only depletion of his that reaches (10, 0x14): L3 M107 at level 2, sets 10 AND 12.
  check(await pick('8,9+10,11', 'Broken'), 'the Belly row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[107]'); await frames(3);
  const d107 = drawn();
  check(same(fired, [1031]) && isSet(d107, 10) && isSet(d107, 12),
        'L3 Motion[107] at level 2: sets 10 AND 12 -- the first swap is KEPT -- and u 1031', { fired, d: d107 });

  // THE HEAD AT G RANK, both halves on one motion
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[102]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 3),
        'L3 Motion[102] with the Head Intact: at G rank it shows nothing and fires nothing', { fired, d: drawn() });
  check(await pick('2,3', 'Broken'), 'the Head row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[102]'); await frames(3);
  check(same(fired, [1026]) && isSet(drawn(), 4),
        'and broken: set 4, u 1026 -- the G record, not low rank\'s u 1025', { fired, d: drawn() });

  // THE TWO WING-FORELEGS, one clip and two breaks: each play shows the next, in the parts' order (left, right)
  check(await pick('4,5', 'Broken'), 'the Left Wing row set to Broken');
  check(await pick('6,7', 'Broken'), 'the Right Wing row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[103]'); await frames(3);
  check(same(fired, [1005]) && isSet(drawn(), 6), 'L3 Motion[103], 1st play: the LEFT wing, set 6, u 1005', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[103]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 8), 'and its 2nd play: the RIGHT wing, set 8, u 1010', { fired, d: drawn() });

  // THE HIND LEGS, a motion each
  check(await pick('12,13', 'Broken'), 'the Left Leg row set to Broken');
  check(await pick('14,15', 'Broken'), 'the Right Leg row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[108]'); await frames(3);
  check(same(fired, [1015]) && isSet(drawn(), 14), 'L3 Motion[108]: the LEFT leg, set 14, u 1015', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[109]'); await frames(3);
  check(same(fired, [1020]) && isSet(drawn(), 16), 'L3 Motion[109]: the RIGHT leg, set 16, u 1020', { fired, d: drawn() });

  // THE TAIL SEVER, AND HE DROPS IT -- his cut tail is staged where Basarios's is not, on the Rath line's joint 143
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143 && TO.CUT_TAIL[MON].piece === 'em005_00_tail',
        'his cut tail is em005_00_tail on joint 143 (sever kind 0x8f, as Basarios passes)', TO.CUT_TAIL[MON]);
  check(await pick('18,101', 'Severed'), 'the Tail row set to Severed');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 20), 'L3 Motion[15]: the tail severed (set 20), u 900', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted, so `drops` has something to fly', Object.keys(V.mounted));

  // EVERY BREAK STAYS THROUGH DEATH, because the part pass re-applies all nine sets every frame
  await play('3', 'Motion[17]'); await frames(4);
  const dDead = drawn();
  check(isSet(dDead, 4) && isSet(dDead, 6) && isSet(dDead, 8) && isSet(dDead, 10) && isSet(dDead, 12) &&
        isSet(dDead, 14) && isSet(dDead, 16) && isSet(dDead, 18) && isSet(dDead, 20) && isSet(dDead, 2),
        'L3 Motion[17] (death) with everything broken: every break and the sever STAY, and his eyes stay OPEN (set 2)', dDead);

  // back to intact
  for (const row of [['2,3', 'Intact'], ['4,5', 'Intact'], ['6,7', 'Intact'], ['8,9+10,11', 'Intact'],
                     ['12,13', 'Intact'], ['14,15', 'Intact'], ['16,17', 'Intact'], ['18,101', 'Intact']])
    await pick(row[0], row[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model at all -- no part set, no eye, no joint, no material (he has none) -- and the puff
  // is the whole of what it shows. THE PICK IS THE BASE STUB, and the convention inverts it: `pick: () => 0` is the
  // stub's own return and selects KEY 1121. Key 1120 is never asked for, so every puff here must be 1121.
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[4] (the rage roar): rage on, and NOTHING on the model changes with it',
        { rage: S.rage, d: drawn() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is KEY 1121 -- the base stub returns 0 and 0xa425c turns that into id 1',
        puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4 && P.pick() === 0, 'the puff is on joint 4 with the stub pick (() => 0)', { joint: P && P.joint, pick: P && P.pick() });
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED: the tired idle is a clip of its own for him (L0 M14), and it zeroes the puff's countdown
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes DO shut, and the puff is paused in the hold
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 1), 'L3 Motion[14] (lying down): HIS EYES SHUT (set 1)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 1) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  await play(REST[0], REST[1]); await frames(3);
  check(isSet(drawn(), 2), 'off the sleep chain his eyes open again (set 2)', drawn());

  // PARALYSIS and the SHOCK TRAP -- two records, two periods, and L3 M13 is shown as the paralysis
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'L3 Motion[9] (the shock trap): c 1105 at once', fired);
  await clipSteps(47);
  check(count(fired, 1105) === 2, 'and again 42 steps on', fired);

  // THE STUN: held, not fired, across both clips of the chain, and stopped when it clears
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play('3', 'Motion[110]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[110] (the stun hold): c 1103 held, not fired', evReqs(1103));
  await play('3', 'Motion[111]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'and it stays held across L3 Motion[111], the second clip of the chain', evReqs(1103));
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // THE tune+0x44 STATUS (INFERRED exhaust): once at frame 0, not on a countdown
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await clipSteps(80);
  check(count(fired, 1109) === 1, 'L3 Motion[2] (the exhaust status): c 1109 ONCE at frame 0 and no repeat', fired);

  // DEATH: the rage shown goes off on all three death clips even with the user enraged
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const clip of ['Motion[17]', 'Motion[12]', 'Motion[20]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
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

export const pageCheck = pageCheckGravios;
