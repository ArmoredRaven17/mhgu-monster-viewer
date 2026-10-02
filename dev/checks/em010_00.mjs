// Plesioth's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER MONSTER, because
// three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and evaluates it IN THE
// PAGE, so it must not close over anything in this module.
// PLESIOTH (em010_00): against E:/offline/decode/notes/states-em010_00.md.
// THE THING WORTH CHECKING HERE IS THAT HIS FINS BREAK BY MATERIAL, NOT BY MESH. The part pass raises the
// alpha-test reference on materials 50 and 51 from the .mrl's 20/255 to 150/255, eroding membranes that live
// inside an always-on group -- a threshold, not a group swap. The viewer does that through ROM_BREAK_ALPHA and
// applyBreakAlpha(), driven off the parts DRAWN rather than off MOTION_STATES, so this check reads the LIVE
// material refs back through window.__breakAlpha() rather than trusting the table. That is the only way to tell
// the difference between "wired" and "the row happens to draw the right group".
// Two other firsts: NOTHING of his is driven by rage, tiredness or sleep -- the part pass reads the four break
// levels and nothing else -- and HE HAS NO LID AT ALL (the class never calls 0x71398), so his sleep hold is the
// first that changes nothing on the model.
async function pageCheckPlesioth(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Plesioth: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em010_00';
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
  check(byWhen.event === 9 && byWhen.ragePuff === 2,
        'the schedule holds his state records: 9 event and 2 ragePuff', byWhen);
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
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 40 * n + 400); };
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const refOf = name => { const r = window.__breakAlpha(); const m = (r.materials || []).find(x => x.name === name); return m ? m.ref : 'no such material'; };
  const REST = ['0', 'Motion[2]'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play('0', 'Motion[1]'); await frames(3);
  const user0 = drawn();
  check(user0 && isSet(user0, 0) && isSet(user0, 3) && isSet(user0, 4),
        'at rest: the head (set 0) and both pectoral fins (sets 3 and 4) intact', user0);
  // AT REST the fin materials must carry the MRL's own reference, not the raised one. `ref: null` is how
  // applyBreakAlpha reports "the MRL's own" -- the 20/255 the file ships.
  check(refOf('XfBAN__E0__m50_wing_l') === null && refOf('XfBAN__E0__m51_wing_r') === null,
        'and both fin membranes carry the .mrl\'s own alpha reference, not the broken one',
        { l: refOf('XfBAN__E0__m50_wing_l'), r: refOf('XfBAN__E0__m51_wing_r') });

  // THE TABLE SAYS THE FINS BREAK BY MATERIAL. Cross-check the wiring rather than the intent: the broken fin sets
  // must turn on exactly the groups ROM_BREAK_ALPHA keys on, or the erosion silently never fires.
  const fins = MS.MOTION_STATES[MON]['3|Motion[1]'];
  const alphaParts = (M.ROM_BREAK_ALPHA[MON] || []).map(r => r.part);
  const brokenGroups = fins.cycle.map(c => (MONSTER.groups[c.levels[2][0]] || []).filter(([, on]) => on).map(([g]) => g)).flat();
  check(same(alphaParts, [7, 9]) && alphaParts.every(p => brokenGroups.includes(p)),
        'his broken fin sets turn on exactly the groups ROM_BREAK_ALPHA keys on (7 and 9), so drawing them raises the reference',
        { alphaParts, brokenGroups });

  // L3 Motion[1] CYCLES through both pectoral fins; L3 Motion[2] through the head, the back and the exhaust
  // status. ALL FOUR BREAKS NEED LEVEL 2 -- level 1 shows nothing at all on any of them.
  check(fins.cycle.length === 2, 'L3 Motion[1] carries a two-rung cycle: both pectoral fins', fins.cycle.length);
  const body = MS.MOTION_STATES[MON]['3|Motion[2]'];
  check(body.cycle.length === 3, 'L3 Motion[2] carries a three-rung cycle: the head, the back and the exhaust status',
        body.cycle.length);
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3);
  check(fired.length === 0, 'L3 Motion[1] at the default level: NOTHING fired -- every break of his needs level 2', fired);

  // THE STUN -- his only sided reaction, and FOUR clips a side rather than three
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  for (const m of ['Motion[6]', 'Motion[7]', 'Motion[20]', 'Motion[8]']){
    await play('3', m); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + m + ' (the direction-1 stun chain, four clips): c 1103 held', evReqs(1103));
  }
  await play('3', 'Motion[4]'); await frames(4); await steps(2);
  check(evReqs(1103).includes('r'), 'L3 Motion[4] (the direction-2 chain): the same held handle', evReqs(1103));
  await play('0', 'Motion[1]'); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off both chains it is stopped', evReqs(1103));

  // RAGE: nothing on the model, on land OR submerged
  puffs.length = 0;
  await play('0', 'Motion[6]'); await steps(95);
  check(S.rage === true && same(drawn(), user0),
        'L0 Motion[6] (rage on land): rage on, and NOTHING on the model changes', { rage: S.rage });
  check(!MS.RAGE_PARTS[MON], 'and he has no RAGE_PARTS entry', Object.keys(MS.RAGE_PARTS));
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === 1121), 'and every request is u 1121', puffs.map(p => p.key));
  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 3, 'his puff is on JOINT 3, not the joint 4 every monster before him used', P && P.joint);
  await play('0', 'Motion[22]'); await frames(4);
  check(S.rage === true, 'L0 Motion[22] (the submerged rage entry): rage on there too', { rage: S.rage });

  // TIRED -- on a clip that is ALSO his peaceful idle, so the drool is the whole signal. Played straight from the rage
  // entry: rage zeroed the countdown, so this first tired play drools at once (a replay of it would not: see below).
  // THE DROOL IS ON THE UNIT'S CLOCK, like the puff (schedule.js stepDrool, TIRED_DROOL): 0xa41b8 counts P+0x5c70 down by
  // [unit+0x1c] x 1.0 a frame (0x7206c -> 0x539d5c, s0 = 1.0 at 0xa42d8) -- the unit's frames, not the clip's -- so it is
  // waited for in schedule `steps`, not `clipSteps`. The countdown keeps its leftover across motions: only the reset
  // (0xba0f4) and rage (0xa42a8) zero it, so tiredness drools at once after rage and then every 48, not at every play.
  fired.length = 0;
  await play('0', 'Motion[1]'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1,
        'L0 Motion[1] (tired -- and also his peaceful idle, so nothing on the clip says it): drool c 1104 at once', fired);
  await steps(50);
  check(count(fired, 1104) === 2, 'the drool again 48 steps on', fired);

  // ASLEEP -- and HE HAS NO LID, so this is the first sleep hold that shows nothing on the model
  fired.length = 0; puffs.length = 0;
  const beforeSleep = drawn();
  await play('3', 'Motion[17]'); await frames(4); await steps(2);
  check(same(drawn(), beforeSleep) && count(fired, 1102) === 1,
        'L3 Motion[17] (the sleep hold): the zzz c 1102 at once and NOTHING on the model -- the class never calls 0x71398, so he has no lid',
        { fired, changed: !same(drawn(), beforeSleep) });
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 CLIP frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);

  // PARALYSIS
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[9] (paralysed, and the shock trap\'s hold): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 CLIP frames on', fired);

  // DEATH -- and nothing reverts, because nothing was ever driven by a state
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const m of ['Motion[12]', 'Motion[13]', 'Motion[16]']){
    await play('3', m); await frames(4);
    check(S.rage === false, 'L3 ' + m + ' (death): the rage shown goes off even with the user enraged', { rage: S.rage });
  }
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('0', 'Motion[1]'); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckPlesioth;
