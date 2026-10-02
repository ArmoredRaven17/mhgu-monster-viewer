// Gypceros's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// GYPCEROS (em009_00): what his motions show, against E:/offline/decode/notes/states-em009_00.md.
// HE HAS ONE BREAK ROW AND IT IS AT LEVEL 2: .dtp `+0x64` is the single row {6, 2, 2, 1}, so his first crest
// depletion shows nothing and fires nothing -- `em009_00u` has no key 1030 at all -- and the second takes set 2 ->
// set 9 and fires u 1031. Both halves are asserted.
// HE PLAYS DEAD, and the half of it the table can hold is asserted too: while L4 M11 and L4 M12 play, `vtable
// +0x2d8` returns 0, so the rage puff and the tired drool are both suppressed. The crest's blink during that hold is
// a material clip and is deliberately not wired (see the block comment in motion-states.js).
async function pageCheckGypceros(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Gypceros: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em009_00';
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
  check(byWhen.event >= 7 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 7 event (the one break + 6 ailments) and 2 ragePuff', byWhen);
  check(!S.entries.some(e => e.def.record && e.def.record.key === 1030),
        'and NO key 1030: his crest has no level-1 record, because his only .dtp row is at level 2');
  check(!TO.CUT_TAIL[MON], 'and no cut tail: he has no sever at all', TO.CUT_TAIL[MON]);
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
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE (the clip select keeps its index across a list
  // change), and THREE ORDERED LOOKUPS rather than one `find` with three disjuncts -- `find` walks the OPTIONS, and
  // 'Motion[N]_start' precedes 'Motion[N]_loop', so one find always hands back the _start, whose short length
  // restarts the motion and its countdowns every few frames. (Effects session A, 2026-09-25)
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
  const LAND = ['3', 'Motion[16]'];          // his common recovery clip: no table entry, safe to land on
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 2), 'at rest: the crest is intact (set 2)', user0);

  // THE CREST BREAK, both halves: level 1 shows and fires nothing, level 2 takes set 9 and fires u 1031
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && isSet(drawn(), 2),
        'L3 Motion[1] with the Crystal Intact: the first depletion shows nothing and fires nothing', { fired, d: drawn() });
  check(await pick('3,4,102', 'Broken'), 'the Crystal row set to Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1031]) && isSet(drawn(), 9),
        'and broken: set 9 (the crest shell and its light mesh gone, the stump in), u 1031', { fired, d: drawn() });
  await pick('3,4,102', 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the Crystal row back to Intact: the parts are the user\'s again', drawn());

  // THE tune+0x44 STATUS: once at frame 0, not on a countdown
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3); await clipSteps(80);
  check(count(fired, 1109) === 1, 'L3 Motion[2] (the exhaust status): c 1109 ONCE at frame 0 and no repeat', fired);

  // PARALYSIS and the SHOCK TRAP -- two records, two periods
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

  // THE STUN: one held handle across the chain the ROM can actually reach (his mirrored script is dead code)
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[4]', 'Motion[6]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // RAGE: the puff is the whole of what the table shows (group 5 is part-review's hidden rage row)
  puffs.length = 0;
  await play('4', 'Motion[1]'); await steps(95);
  check(S.rage === true, 'L4 Motion[1] (the rage entry): rage on', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every puff is KEY 1121 -- 1120 is never asked for', puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 3 && P.pick() === 0, 'the puff is on joint 3 with the stub pick (() => 0)', { joint: P && P.joint, pick: P && P.pick() });

  // PLAYING DEAD: the puff is suppressed while the two clips of the hold play
  await play(REST[0], REST[1]); await frames(3);
  for (const clip of ['Motion[11]', 'Motion[12]']){
    await play('4', clip); await frames(4);
    puffs.length = 0; await steps(70);
    check(puffs.length === 0, 'L4 ' + clip + ' (playing dead): the puff is suppressed', puffs.length);
  }

  // TIRED
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP: his eyes shut into SET 4 -- the lid on, both eye meshes off
  await play('3', 'Motion[14]'); await frames(4);
  check(isSet(drawn(), 4), 'L3 Motion[14] (lying down): his eyes shut (set 4)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[19]'); await frames(4); await steps(2);
  check(isSet(drawn(), 4) && count(fired, 1102) === 1, 'L0 Motion[19] (the sleep hold): eyes shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH: all three death clips force the rage shown off
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[17]', 'Motion[12]', 'Motion[20]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
    check(isSet(drawn(), 4),
          'and HIS EYES SHUT at death (set 4): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
  }
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

export const pageCheck = pageCheckGypceros;
