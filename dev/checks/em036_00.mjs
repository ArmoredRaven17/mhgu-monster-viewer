// Lavasioth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// LAVASIOTH (em036_00): E:/offline/decode/notes/states-em036_00.md.
// BOTH HIS BREAK ROWS ARE AT LEVEL 2 at both ranks and his u.pel has no key 1000 and no key 1030, so the first
// depletion of each is genuinely invisible -- asserted here, because "nothing happened" otherwise reads as a bug.
// HE HAS NO TAIL SEVER even though the counter exists: it runs out, plays a reaction and changes nothing. And his
// eye-set fields are all -1, so sleep shows nothing on him either. Both absences are asserted.
// HIS MAGMA is a material machine driven by TIREDNESS, which is a second state axis the table cannot index, so the
// break rows wire the flowing form; the stopped form is in the table's block comment.
async function pageCheckLavasioth(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Lavasioth: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em036_00';
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
  check(byWhen.event >= 8 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 8 event (2 breaks + 6 ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(1000) && !keys.includes(1030),
        'and NO u 1000 / u 1030: both his rows are at LEVEL 2, so there is no level-1 record to hold');
  check(!keys.includes(900) && !TO.CUT_TAIL[MON],
        'and NO sever: his tail counter runs out, plays a reaction and changes nothing', TO.CUT_TAIL[MON]);
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
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[11]'];          // the ailments' recovery clip: no table entry
  const HEAD = '1,21,101,121', BODY = '2,22,102,122';
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();
  // by GROUP, not by set: his intact sets also name the additive magma groups, and the viewer's Lava Effect row owns
  // those -- so a whole-set compare is the magma's state, not the break state this line is about
  check(user0 && user0[101] === true && user0[102] === true && user0[1] === false && user0[2] === false,
        'at rest: the intact head (101) and body (102) meshes are drawn and their broken forms (1, 2) are not', user0);

  // THE BODY: L3 M1 CARRIES NOTHING. The status-10 dispatcher plays it for (10, 7) with parts 1, 2, 3, 4, 5 and 7,
  // none of which has a .dtp row -- parts 0 and 6, the two that break, take L3 M2 on that route (states-em036_00.md
  // 3.3). The body break is on the (10, 0x14) chain L3 M6 -> M7 x4 -> M8, which `vtable +0x23c` sends part 0 to ONLY
  // while its level EQUALS the threshold (2), so that row carries `at: 2` and shows the break whatever the Parts
  // panel says.
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0 && drawn()[2] === false && drawn()[102] === true,
        'L3 Motion[1] shows nothing at all: no part with a .dtp row plays it', { fired, d: drawn() });
  const six = await rounds('3', 'Motion[6]', 2);
  const body = six.find(x => same(x.fired, [1001]));
  check(body && isSet(body.d, 4),
        'L3 Motion[6] (the (10, 0x14) chain): set 2 -> 4 and u 1001 on joint 1, with the Body row still INTACT -- ' +
        'the ROM plays this clip only as the break lands', six.map(x => x.fired));

  // THE HEAD, on L3 M2, whose other plays are the shock trap and the exhaust status. L3 M2 is BOTH of part 6's
  // routes, so a play can be either depletion: that row keeps `at: 1` and the Parts panel decides the level.
  check(await pick(HEAD, 'Broken'), 'the Head row set to Broken');
  const m2 = await rounds('3', 'Motion[2]', 3);
  const head = m2.find(x => same(x.fired, [1031]));
  check(head && isSet(head.d, 3), 'L3 Motion[2] shows the head at level 2: set 3, u 1031 on joint 2', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1105])), 'another of its plays is the SHOCK TRAP: c 1105 at once', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and another the EXHAUST status: c 1109 once at frame 0', m2.map(x => x.fired));
  for (const r of [[BODY, 'Intact'], [HEAD, 'Intact']]) await pick(r[0], r[1]);
  await play(REST[0], REST[1]); await frames(3);
  check(same(drawn(), user0), 'the rows back to Intact: the parts are the user\'s again', drawn());

  // PARALYSIS and the STUN
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  // Motion[6] is left out: it now alternates between the body break and the hold, and the chain engages the
  // handle at Motion[7] either way.
  for (const clip of ['Motion[7]', 'Motion[8]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (a stun chain clip): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // RAGE: nothing on the model, and the puff -- whose two records are NOT identical on him
  puffs.length = 0;
  await play('0', 'Motion[2]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[2] (the rage entry): rage on, and nothing on the model', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121),
        'and every puff is KEY 1121 -- his 1120 sits 30 units away, so the wrong way round would show', puffs.map(p => p.key));

  // TIRED and ASLEEP
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[39]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[39] (tired -- the state that stops his magma): rage off, drool at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[17]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && same(drawn(), user0),
        'L3 Motion[17] (the sleep hold): the zzz at once, and NOTHING on the model -- he has no eye sets', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[12]', 'Motion[16]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off', { rage: S.rage });
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

export const pageCheck = pageCheckLavasioth;
