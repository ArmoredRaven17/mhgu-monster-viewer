// Brachydios's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the
// runner serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything
// in this module -- everything it needs it imports inside itself.
// BRACHYDIOS (em063_00): E:/offline/decode/notes/states-em063_00.md.
// HIS HEAD BREAK DRAWS DIFFERENTLY IN EACH SLIME COLOUR -- green set 7, red set 13 -- which is the `{ calm,
// enraged }` form of `levels`, and it is the row this check exists for: it plays the same motion calm and enraged
// and asserts both sets off one break.
// HIS THREE BREAK ROWS ARE ALL AT LEVEL 2 with no level-1 record at all, so a first depletion shows and fires
// nothing; and HIS ARM RECORDS ARE CROSSED (u 1011 is fired by the part at x -110 and plays on joint 40 at x +110),
// which is authored data confirmed by three other ROM sources, not a decode slip -- asserted so nobody "fixes" it.
async function pageCheckBrachydios(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Brachydios: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em063_00';
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
  check(byWhen.event >= 11 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 11 event (3 breaks + the sever + the landing + 6 ailments) and 2 ragePuff', byWhen);
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail is on joint 143', TO.CUT_TAIL[MON]);
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
  const REST = ['0', 'Motion[3]'];           // his combat idle
  const LAND = ['3', 'Motion[27]'];          // the common recovery clip: no table entry
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();

  // THE HEAD AT LEVEL 2, IN BOTH COLOURS. Level 1 first: nothing at all.
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[6]'); await frames(3);
  check(fired.length === 0, 'L3 Motion[6] with the Horn Intact: his rows are all at LEVEL 2, so a first depletion fires nothing', fired);
  check(await pick('1,2,9,10,11,13,14', 'Broken'), 'the Horn row set to Broken (green)');
  const green = await rounds('3', 'Motion[6]', 3);
  check(green.some(r => r.fired.includes(1001) && isSet(r.d, 7)),
        'broken GREEN: one play of L3 Motion[6] takes set 7 and fires u 1001 on joint 3', green.map(r => r.fired));
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  check(await pick('1,2,9,10,11,13,14', 'Broken (Enraged)'), 'the Horn row set to Broken (Enraged)');
  const red = await rounds('3', 'Motion[6]', 3);
  check(red.some(r => r.fired.includes(1001) && isSet(r.d, 13)),
        'and broken RED: SET 13, not 7 -- the same break, the other slime colour, off the { calm, enraged } ladder',
        red.map(r => r.fired));
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await pick('1,2,9,10,11,13,14', 'Intact');

  // THE ARMS, both at level 2 on one clip, and their records are crossed relative to their parts
  check(await pick('4,5,15,16', 'Broken'), 'the Left Pounder row set to Broken');
  check(await pick('6,7,17,18', 'Broken'), 'the Right Pounder row set to Broken');
  const arms = await rounds('3', 'Motion[1]', 3);
  check(arms.some(r => r.fired.includes(1011)) && arms.some(r => r.fired.includes(1016)),
        'L3 Motion[1] fires u 1011 on one play and u 1016 on another -- one clip, two arm breaks', arms.map(r => r.fired));
  check(arms.some(r => isSet(r.d, 9)) && arms.some(r => isSet(r.d, 8)),
        'and each play draws its own arm\'s broken set (9 and 8)', arms.map(r => r.fired));
  await pick('4,5,15,16', 'Primed'); await pick('6,7,17,18', 'Primed');

  // THE TAIL SEVER
  check(await pick('8,101', 'Severed'), 'the Tail row set to Severed');
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[22]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 10), 'L3 Motion[22]: the tail severed (set 10), u 900 on joint 143 at 1.4x', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));
  await pick('8,101', 'Intact');
  await play(REST[0], REST[1]); await frames(3);

  // PARALYSIS, the SHOCK TRAP (on the head's clip), the STUN
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[11] (paralysed): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const hats = await rounds('3', 'Motion[6]', 3);
  check(hats.some(r => r.fired.includes(1109)) && hats.some(r => r.fired.includes(1105)),
        'L3 Motion[6]\'s other two hats each take a turn: the exhaust status (c 1109) and the shock trap (c 1105)',
        hats.map(r => r.fired));
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[5]', 'Motion[21]', 'Motion[13]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain, the same for every part and direction): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // RAGE and the puff -- his is on joint 4
  puffs.length = 0;
  await play('0', 'Motion[15]'); await steps(95);
  check(S.rage === true, 'L0 Motion[15] (the rage roar): rage on -- the slime gauge starts climbing here, and the colour lands ten frames later', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps });
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4, 'and it is on JOINT 4', { joint: P && P.joint });

  // TIRED, ASLEEP, DEATH
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[14]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[14] (tired, a clip of its own): rage off, drool at once', fired);
  await play('3', 'Motion[9]'); await frames(4);
  check(isSet(drawn(), 6), 'L3 Motion[9] (lying down): his eyes shut into SET 6 -- Raging\'s are 2 / 1, these are his', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[10]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && puffs.length === 0, 'L3 Motion[10] (the sleep hold): the zzz at once and the puff paused', fired);
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[8]', 'Motion[34]', 'Motion[19]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death): the rage shown goes off -- which is what takes the slime back to green', { rage: S.rage });
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

export const pageCheck = pageCheckBrachydios;
