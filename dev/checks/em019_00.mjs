// Daimyo Hermitaur's page check, loaded by dev/motion-states-check.mjs from dev/checks/. One file per monster,
// because three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it
// IN THE PAGE, so it must not close over anything in this module -- everything it needs it imports inside itself.
//
// WHAT IS NEW ON HIM (states-em019_00.md): his SHELL is the first part we have wired with a .dtp row at BOTH
// level 1 and level 2, each with its own record and its own mesh set -- 320 durability depleted twice, and the
// swappable shell geometry goes 209 verts -> 150 -> 87. He SWAPS rather than adds. His two CLAWS share one
// reaction clip pair with the tune+0x44 status, so L3 Motion[2] is a three-way `cycle` and the play ORDER is part
// of what is asserted -- nothing may play that motion before the block that tests it. And HE HAS NO EYE MESH at
// all: the class never calls 0x71398, so sleep shuts nothing, which is asserted as a positive rather than left
// unsaid.
// Rows are found BY THE PART THEY CONTROL, not by a hard-coded `data-row` key, and levels are picked by option
// INDEX rather than by label: the label text is the Parts panel's business and changes when Raven reviews it,
// while the set a level draws is the ROM's and is what this is checking.
async function pageCheckDaimyo(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Daimyo: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em019_00';
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
  check(byWhen.event >= 9 && byWhen.ragePuff === 2, 'the schedule holds his state records: 9 event and 2 ragePuff', byWhen);
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  // the Parts row whose cluster carries `part` (row.dataset.row is the cluster's comma-joined part list)
  const rowFor = part => [...document.querySelectorAll('#monGroups .field[data-row]')]
    .find(f => String(f.dataset.row).split(',').includes(String(part)));
  const pickIndex = async (part, i) => {
    const f = rowFor(part), sel = f && f.querySelector('select');
    if (!sel || !sel.options[i]) return false;
    sel.value = sel.options[i].value; sel.dispatchEvent(new Event('change'));
    await frames(2);
    return true;
  };
  // NO FRAME PASSES BETWEEN THE LIST CHANGE AND THE CLIP CHANGE: the clip select keeps its index across a list
  // change, so letting a frame run first plays whatever clip that index names in the new list -- and in his list 3
  // that could be a break motion, which would fire a record into the middle of an assertion AND advance a cycle.
  // THREE ORDERED LOOKUPS, not one `find` with three disjuncts: `find` walks the OPTIONS and returns the first
  // that matches any of them, so with a _start/_loop pair it hands back the _start, which loops in a few frames and
  // restarts the motion's countdowns. (dev/checks/em014_00.mjs has the long version of both.)
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
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
  const REST = ['0', 'Motion[1]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 1) && isSet(user0, 3) && isSet(user0, 5),
        'at rest: both claws intact (sets 1 and 3) and the shell intact (set 5)', user0);

  // THE SHELL LADDER -- the point of him. Two .dtp rows on ONE part, a record and a set for each.
  //   WITH THE ROW INTACT THE REACTION STILL SHOWS RUNG 1, and that is the ROM, not a leak: (10, 7) only plays
  // because a depletion happened, so `at` defaults to 1 and motionStates takes max(at, the user's level). Where
  // Velocidrome's level 1 is a no-op rung -- his .dtp row is at level 3, so level 1 repeats level 0 and fires
  // null -- Daimyo's level 1 is a real one, set 5 -> 6 firing u 1010. An earlier version of this check asserted
  // "nothing shown, nothing fired" here by copying Velocidrome's wording, and the suite caught it: the table was
  // right and the assertion was wrong.
  check(await pickIndex(3, 0), 'the Shell row left at level 0');
  await play('3', 'Motion[3]'); await frames(2);   // L3 M3 has no spec: it leaves the previous one without advancing a cycle
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 6),
        'L3 Motion[1] with the row still intact: the reaction shows rung 1 anyway (set 6, u 1010), because it only plays on a depletion',
        { fired, d: drawn() });
  check(await pickIndex(3, 1), 'the Shell row set to level 1');
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 6), 'L3 Motion[1] at level 1: set 5 -> 6 (group 3 in, 103 out), u 1010', { fired, d: drawn() });
  check(await pickIndex(3, 2), 'the Shell row set to level 2');
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(same(fired, [1011]) && isSet(drawn(), 7), 'L3 Motion[1] at level 2: set 6 -> 7 (4 in too, 104 out), u 1011', { fired, d: drawn() });
  await pickIndex(3, 0);
  await play(REST[0], REST[1]); await frames(3);

  // THE TWO CLAWS AND THE EXHAUST STATUS share L3 M2 -> L3 M3, so each play shows the next of the three. Each
  // claw's only row is at LEVEL 2, so with the rows left intact the two claw plays show and fire nothing, and the
  // third play is the status. That ordering is the assertion.
  check(await pickIndex(1, 0) && await pickIndex(2, 0), 'both claw rows left intact');
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, []) && isSet(drawn(), 1), 'L3 Motion[2] play 1 (+X claw, intact): nothing shown, nothing fired', { fired, d: drawn() });
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, []) && isSet(drawn(), 3), 'L3 Motion[2] play 2 (-X claw, intact): the same', { fired, d: drawn() });
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1109]), 'L3 Motion[2] play 3 is the tune+0x44 status: c 1109 once', fired);
  check(await pickIndex(1, 1), 'the +X claw row set to broken');
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1026]) && isSet(drawn(), 2), 'L3 Motion[2] play 4, the +X claw at level 2: set 1 -> 2, u 1026', { fired, d: drawn() });
  await pickIndex(1, 0);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to intact: the parts are the user\'s again', drawn());

  // RAGE: nothing on the model -- the part pass never reads isEnraged -- so the puff is all of it, and his puff is
  // HIS OWN effect (em019_00_003 on joint 1), not the shared cm200_007
  puffs.length = 0;
  await play('0', 'Motion[3]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[3]: rage on, and NOTHING on the model changes with it', { rage: S.rage, d: drawn() });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'every puff is u 1121: key 1120 is never asked for', puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 1 && P.pick() === 0, 'the puff reads joint 1 and its pick is the base stub\'s 0', { joint: P && P.joint, pick: P && P.pick() });
  await play(REST[0], REST[1]); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage });

  // TIRED -- and his tired idle is its OWN pair, unlike Barioth's
  fired.length = 0;
  await play('0', 'Motion[31]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[31] (the tired entry): rage off, drool c 1104 at once', fired);
  fired.length = 0;
  await play('0', 'Motion[24]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[24] (the tired loop): the same', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP -- and the positive result: HE HAS NO LID, so nothing on the model changes
  fired.length = 0; puffs.length = 0;
  await play('0', 'Motion[16]'); await frames(4); await steps(2);
  check(same(drawn(), user0), 'L0 Motion[16] (the sleep hold): HIS EYES DO NOT SHUT -- he has no eye mesh at all', drawn());
  check(count(fired, 1102) === 1, 'the zzz c 1102 at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS (the shock trap shares its hold) and the STUN, which is his only sided reaction
  fired.length = 0;
  await play('3', 'Motion[10]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[10] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[4]', 'Motion[6]', 'Motion[8]', 'Motion[5]', 'Motion[7]', 'Motion[9]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off it the stun is stopped', evReqs(1103));

  // DEATH: nothing of its own -- the part pass keeps re-applying the break sets, so THE BREAKS STAY, and there is
  // no lid to close and no rage pair to revert
  check(await pickIndex(3, 2), 'the Shell row set to level 2 before death');
  await play(REST[0], REST[1]); await frames(3);
  const broken = drawn();
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[12]'); await frames(4);
  check(S.rage === false && same(drawn(), broken),
        'L3 Motion[12] (his death-only clip): rage off even with the user enraged, and THE BREAK STAYS', drawn());
  await play('3', 'Motion[20]'); await frames(4);
  check(S.rage === false && same(drawn(), broken), 'L3 Motion[20] (death in the pit): the same', drawn());
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await pickIndex(3, 0);
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

export const pageCheck = pageCheckDaimyo;
