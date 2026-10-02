// Furious Rajang's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in
// this module -- everything it needs it imports inside itself (`await import('/render/monster.js')`).
// FURIOUS RAJANG (em023_05): what his motions show, against E:/offline/decode/notes/states-em023_05.md. He is
// `uEm023_00` with variant 5, and three of his firsts are what this checks.
// "PERMANENTLY ENRAGED" IS A BOOT STATE, NOT THE RAGE FLAG: the part pass forces sets 12 / 13 / 17 for variant 5 and
// vtable +0x1d8 starts `Angry_Start` at time 60.0, its last keyframe -- so there is no motion row for the look, and
// the panel opens on it. The real rage flag still runs underneath, and the three things that follow it are checked
// here: the aura (c 0, once on the rising edge), THE PUFF and -- in monster.js, not this table -- the mane joint.
// HIS PUFF EXISTS ONLY BECAUSE HE IS THE VARIANT: the class writes e+0xb7d2 = 0 when variant == 0, so plain Rajang
// has no puff and he does. THE PUFF IS ALWAYS KEY 1121; 1120 is never asked for.
// HE CANNOT GET TIRED (tune+0x30 is NULL) and HIS SEVER SHOWS NOTHING (no .dtp row, no record, no cut-tail model),
// so the absence of a tired row, of a drool record and of a CUT_TAIL entry is asserted rather than assumed.
async function pageCheckFuriousRajang(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Furious Rajang: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em023_05';
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
  const puffs = [], auras = [];
  const s0 = S.start.bind(S);
  S.start = e => {
    if (e.when === 'ragePuff') puffs.push({ key: e.def.record.key, step: S.frame });
    if (e.when === 'rageStart') auras.push({ key: e.def.record.key, step: S.frame });
    return s0(e);
  };
  const byWhen = {};
  for (const e of S.entries) byWhen[e.when] = (byWhen[e.when] || 0) + 1;
  check(byWhen.event >= 5 && byWhen.ragePuff === 2 && byWhen.rageStart === 1,
        'the schedule holds his state records: 5 event (2 head breaks + 4 ailments), 2 ragePuff and the 1 rageStart aura', byWhen);
  check(!S.entries.some(e => e.def.record && e.def.record.key === 1104),
        'and NO drool record (c 1104): tune+0x30 is NULL, so he can never be tired');
  check(!S.entries.some(e => e.def.record && e.def.record.key === 1020),
        'and NO sever record (u 1020): his .dtp has no part-4 row, so the sever finds nothing to request');
  check(!TO.CUT_TAIL[MON], 'and NO cut tail: descriptor 0x15961a8 has both option slots -1 on both Rajangs', TO.CUT_TAIL[MON]);
  const T = MS.MOTION_STATES[MON];
  check(!Object.values(T).some(s => s.tired), 'his table carries no tired row at all');
  check(!Object.values(T).some(s => s.drops), 'and no `drops`: there is no cut-tail model to fly');
  check(!T['3|Motion[15]'] && !T['3|Motion[17]'] && !T['3|Motion[23]'],
        'and L3 M15 / M17 / M23 are NOT death rows -- they are the knockdown and the pit ailments, and `dead` there ' +
        'would force the rage shown off in the middle of one');

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
  // change, so letting a frame run first plays whatever clip that index names in the new list -- in his list 3 that
  // could be L3 M1 or L3 M2, either of which fires a break record into the middle of an assertion.
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
  const REST = ['0', 'Motion[1]'];           // his plain idle loop: no table entry
  const LAND = ['3', 'Motion[3]'];           // the common recovery clip: no table entry, so it is safe to land on
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  // THE BOOT LOOK. Sets 12 (mane group 3), 13 (hairline group 11) and 17 (the short tail) are forced every frame for
  // variant 5, and part-review.json opens him on exactly that (State rungs Enraged / Armor Mode, Tail on Broken).
  check(user0 && isSet(user0, 12) && isSet(user0, 13) && isSet(user0, 17),
        'at rest: the boot look is drawn -- set 12 (the angry mane), set 13 (the hairline) and set 17 (the short tail)', user0);

  // THE HEAD BREAK, and it is CUMULATIVE: level 2 keeps level 1's set
  check(await pick('4,102+5,103', 'One Horn Broken'), 'the Head row set to One Horn Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  const d1 = drawn();
  check(same(fired, [1000]) && isSet(d1, 9), 'L3 Motion[1] at level 1: set 9 (horn A a stub), u 1000', { fired, d: d1 });
  check(await pick('4,102+5,103', 'Both Horns Broken'), 'the Head row set to Both Horns Broken');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  const d2 = drawn();
  check(same(fired, [1001]) && isSet(d2, 9) && isSet(d2, 10),
        'and at level 2: sets 9 AND 10 -- the level-1 set is KEPT -- and u 1001', { fired, d: d2 });
  // THE SECOND ROUTE: the same break on L3 M2, which vtable +0x23c takes once the SUM of all eight parts' break
  // levels passes 2. L3 M2 is also the tail sever's clip, which shows nothing for him, and the exhaust's.
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1001]) && isSet(drawn(), 9) && isSet(drawn(), 10),
        'L3 Motion[2] (the (10, 0x14) route, and the sever\'s clip): the same break, and the sever shows nothing of its own',
        { fired, d: drawn() });
  await pick('4,102+5,103', 'Intact');
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the Head row back to Intact: the parts are the user\'s again', drawn());

  // RAGE: no mesh change (the sets are already forced), the aura ONCE on the rising edge, and the puff every 30
  puffs.length = 0; auras.length = 0;
  await play('0', 'Motion[5]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[5] (the rage roar -- the only (1, 5) in the whole command table): rage on, and nothing on the mesh changes',
        { rage: S.rage, d: drawn() });
  check(auras.length === 1 && auras[0].key === 0,
        'the aura c 0 (em023_00_009) fires ONCE on the rising edge, not on a countdown', auras);
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121),
        'and every puff is KEY 1121 -- the base stub returns 0 and 0xa425c turns that into id 1; 1120 is never asked for',
        puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 2 && P.pick() === 0, 'the puff is on joint 2 with the stub pick (() => 0)', { joint: P && P.joint, pick: P && P.pick() });

  // ASLEEP: the lids close -- and for him shut is SET 8, not set 1
  await play('0', 'Motion[23]'); await frames(4);
  check(isSet(drawn(), 8), 'L0 Motion[23] (lying down): his lids close -- SET 8 (group 1 on, 14 off), the applier being 0x71398(e, 1, 8, -1)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[24]'); await frames(4); await steps(2);
  check(isSet(drawn(), 8) && count(fired, 1102) === 1, 'L0 Motion[24] (the sleep hold): lids shut and the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  await play(REST[0], REST[1]); await frames(3);
  check(isSet(drawn(), 1), 'off the sleep chain the lids open again (set 1)', drawn());

  // PARALYSIS (the shock trap shares its hold, so paralysis is what L3 M13 shows)
  fired.length = 0;
  await play('3', 'Motion[13]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);

  // THE STUN: one held handle across all three clips, and NO left/right split
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[11]', 'Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH: only his two death-only clips carry it, and they force the rage shown off
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);
  const userRage = S.rage;                   // whatever the panel leaves him at: his Enraged control is hidden
  check(userRage === true, 'with the user enraged (or his rage pinned on by the part-review rungs), the shown rage is on', { rage: userRage });
  for (const clip of ['Motion[19]', 'Motion[18]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death, his only death-only clip pair): the rage shown goes off', { rage: S.rage });
    check(isSet(drawn(), 8),
          'and HIS EYES SHUT at death (set 8): 0xbd594 raises P+0x5d02 with the timer at P+0x5d00 and 0x75c1c calls it with -1 in the status-11 block. A check that does not assert this passes while showing the wrong thing, which is how it survived so long', drawn());
  }
  await play('3', 'Motion[15]'); await frames(4);
  check(S.rage === userRage, 'but L3 Motion[15] (the knockdown, which (11, 1) shares) leaves rage alone', { rage: S.rage, userRage });
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(T)){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckFuriousRajang;
