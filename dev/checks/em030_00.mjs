// Bulldrome's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// BULLDROME (em030_00): E:/offline/decode/notes/states-em030_00.md.
// HIS MODEL NEVER CHANGES, FOR ANY STATE -- his archive ships no .mpm at all, his class has zero setVisibleGroup
// calls and no material call -- so this check's job is the opposite of the usual one: it asserts that his table
// carries NO sets anywhere, that his parts are untouched through rage, sleep and death, and that the three states
// sharing L3 M11 take turns. He also has no breaks, no sever and no rage entry action at all.
async function pageCheckBulldrome(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Bulldrome: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em030_00';
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
  check(byWhen.event >= 6 && byWhen.ragePuff === 2, 'the schedule holds 6 event records (his ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.some(k => k >= 1000 && k < 1100) && !keys.includes(900) && !TO.CUT_TAIL[MON],
        'and NO break record, NO sever record and no cut tail: his .dtp row count is 0', keys);
  const T = MS.MOTION_STATES[MON];
  check(!Object.values(T).some(s => s.sets || s.levels || (s.cycle || []).some(c => c.sets || c.levels)),
        'HIS TABLE CARRIES NO PART SET ANYWHERE -- he has no .mpm at all, so there is nothing any state could apply');
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
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
  const LAND = ['3', 'Motion[12]'];          // the ailments' recovery clip: no table entry
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();

  // L3 M11's THREE STATES, in turn: paralysis, the stun, the shock trap
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[11], 1st play: PARALYSIS -- c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  await play(LAND[0], LAND[1]); await frames(2);
  await play('3', 'Motion[11]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'its 2nd play is the STUN -- the same script as the paralysis in the ROM -- and c 1103 is HELD', evReqs(1103));
  await play(LAND[0], LAND[1]); await frames(4);
  check(!evReqs(1103).includes('r'), 'and off the clip it is stopped', evReqs(1103));
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(count(fired, 1105) === 1, 'and its 3rd play is the SHOCK TRAP: c 1105 at once', fired);
  await clipSteps(47);
  check(count(fired, 1105) === 2, 'and again 42 steps on', fired);

  // THE EXHAUST STATUS
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3); await steps(2);
  // ONCE PER PLAY, not once ever: `start` fires on the motion's frame 0, and with the viewer's clip loop on a short
  // clip reaches frame 0 again every time it wraps -- which is what the ROM does too, since each play is a new action
  check(count(fired, 1109) === 1, 'L3 Motion[1] (the exhaust status, and the short-flinch depletion): c 1109 at frame 0', fired);

  // RAGE: no entry motion exists, so the toggle is the only way in -- and nothing changes on him
  const rageBox = document.getElementById('monRage');
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await steps(95);
  check(same(drawn(), before), 'with the Enraged toggle on: NOT ONE part changes -- and his ROM has no rage entry action at all', drawn());
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121 -- the whole of what rage shows on him', { n: puffs.length, gaps });
  check(!Object.values(T).some(s => s.rage === true), 'and his table has no rage row, because no motion means rage started');
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }

  // TIRED and ASLEEP -- and sleep shows nothing, because he has no eye sets
  fired.length = 0;
  await play('0', 'Motion[15]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[15] (tired, a clip of its own): rage off, drool c 1104 at once', fired);
  await clipSteps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[13]'); await frames(4); await steps(2);
  check(count(fired, 1102) === 1 && same(drawn(), user0),
        'L3 Motion[13] (asleep -- one clip for the fall and the hold): the zzz at once, and NOTHING on the model, because he has no eye sets', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 steps on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // DEATH: his one death-only clip
  if (rageBox){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[9]'); await frames(4);
  check(S.rage === false && same(drawn(), user0),
        'L3 Motion[9] (death, the tail of his only death chain): the rage shown goes off, and nothing on the model reverts because nothing ever changed',
        { rage: S.rage });
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

export const pageCheck = pageCheckBulldrome;
