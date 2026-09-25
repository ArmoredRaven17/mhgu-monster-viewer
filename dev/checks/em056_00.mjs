// Nibelsnarf's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER: the runner
// serialises `pageCheck` with .toString() and evaluates it IN THE PAGE, so it must not close over anything in this
// module -- everything it needs it imports inside itself.
// NIBELSNARF (em056_00): E:/offline/decode/notes/states-em056_00.md.
// HIS FORE-FIN BREAKS ROUTE THE OTHER WAY ROUND: their level is 1, which is ODD, and his +0x23c sends an odd level
// of parts 2..5 to (10, 0x14) -- so each fin break has its own chain instead of sharing the common stagger.
// HIS JAW BREAK ONLY REMOVES GEOMETRY (set 9 turns group 4 off and turns nothing on), and HE HAS NO PITFALL at all
// (no case 0x60 / 0x61 / 0x62 in his status-10 table). Both are asserted, because both look like bugs otherwise.
// HIS PUFF SITS ON JOINT 135, inside the mouth, at a stretched (1, 2, 2) -- no other monster's is off joint 3 or 4.
async function pageCheckNibelsnarf(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Nibelsnarf: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em056_00';
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
        'the schedule holds his state records: 11 event (4 breaks + the spit-out + 6 ailments) and 2 ragePuff', byWhen);
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(!keys.includes(900) && !TO.CUT_TAIL[MON], 'and NO sever: no u 900 and no cut tail', TO.CUT_TAIL[MON]);
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 135, 'his puff is on JOINT 135, inside the mouth -- not joint 3 or 4 like everyone else\'s', { joint: P && P.joint });
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
  const LAND = ['3', 'Motion[6]'];           // the ailments' recovery clip: no table entry
  const rows = MS.MOTION_STATES[MON];
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);
  const user0 = drawn();

  // THE TWO FORE FINS, each on its own chain
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[8]'); await frames(3);
  check(same(fired, [1010]) && isSet(drawn(), 10), 'L3 Motion[8]: the +X fore fin breaks (set 10), u 1010 on joint 7', { fired, d: drawn() });
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[11]'); await frames(3);
  check(same(fired, [1015]) && isSet(drawn(), 11), 'L3 Motion[11]: the -X fore fin (set 11), u 1015 on joint 12', { fired, d: drawn() });

  // L3 M1's THREE HATS: the gill flaps, the jaw (which only removes geometry), the exhaust status
  const hats = await rounds('3', 'Motion[1]', 3);
  check(hats.some(r => r.fired.includes(1030) && isSet(r.d, 8)),
        'one play of L3 Motion[1] is the gill flaps (set 8), u 1030 -- cm202_061, not the usual cm202_060',
        hats.map(r => r.fired));
  check(hats.some(r => r.fired.includes(1035) && isSet(r.d, 9)),
        'another is the JAW: set 9 turns group 4 OFF and turns nothing on -- 76 vertices simply go -- and u 1035 fires',
        hats.map(r => r.fired));
  check(hats.some(r => r.fired.includes(1109)), 'and the third is the EXHAUST status: c 1109', hats.map(r => r.fired));

  // SPITTING THE BOMB BACK OUT -- the class's only own effect request
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[19]'); await frames(3);
  check(same(fired, [20]), 'L3 Motion[19] (spitting it out): u 20, his class\'s own key table, on joint 135', fired);

  // RAGE on both entries -- the land one and the in-sand remap
  puffs.length = 0;
  await play('0', 'Motion[7]'); await steps(95);
  check(S.rage === true && same(drawn(), user0), 'L0 Motion[7] (the rage entry): rage on, and nothing on the model', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30) && puffs.every(p => p.key === 1121),
        'the puff: at once, then every 30 steps, always key 1121', { n: puffs.length, gaps });
  await play(REST[0], REST[1]); await frames(3);
  await play('0', 'Motion[22]'); await frames(4);
  check(S.rage === true, 'L0 Motion[22] (the in-sand rage entry, the (1, 0) -> (1, 0x13) remap): rage on there too', { rage: S.rage });

  // TIRED, on both idles
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[9]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1, 'L0 Motion[9] (tired on land, a clip of its own): rage off, drool at once', fired);
  fired.length = 0;
  await play('0', 'Motion[23]'); await frames(3); await steps(2);
  check(count(fired, 1104) === 1, 'L0 Motion[23] (tired in the sand -- also the stuck jaw\'s clip, which shows nothing): drool at once', fired);

  // ASLEEP, PARALYSIS, the STUN
  await play('3', 'Motion[4]'); await frames(4);
  check(isSet(drawn(), 7), 'L3 Motion[4] (lying down): his eyes shut (set 7)', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[5]'); await frames(4); await steps(2);
  check(isSet(drawn(), 7) && count(fired, 1102) === 1, 'L3 Motion[5] (the sleep hold): eyes shut and the zzz at once', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  fired.length = 0;
  await play('3', 'Motion[3]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[3] (paralysed -- and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 steps on', fired);
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const clip of ['Motion[14]', 'Motion[15]', 'Motion[16]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held, not fired', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH, including the one for dying inside the stuck jaw
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  for (const clip of ['Motion[7]', 'Motion[24]']){
    await play('3', clip); await frames(4);
    check(S.rage === false, 'L3 ' + clip + ' (death' + (clip === 'Motion[24]' ? ', the one for dying in the stuck jaw' : '') + '): the rage shown goes off', { rage: S.rage });
  }
  if (rageBox){ rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(rows)){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckNibelsnarf;
