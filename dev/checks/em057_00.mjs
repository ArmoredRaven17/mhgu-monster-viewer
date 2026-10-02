// The Zinogre family's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE, TWO
// MONSTERS: there is no `uEm057_04` -- getDTI 0xf02f7c appears exactly once in main.data -- so all 0x480 slots
// hold the same function for both and the override diff is empty in BOTH directions. The function is serialised
// with .toString() and evaluated IN THE PAGE, so it must not close over anything in this module.
// ZINOGRE / THUNDERLORD (em057_00, em057_04): E:/offline/decode/notes/states-em057_00.md.
// THE CHARGED STATE IS THREE THINGS AT ONCE and this check exists mostly to hold all three together: a mesh swap,
// a pair of MATERIAL CLIPS (`normal_Loop` -> `tyoutaiden_Loop`, and `shintaiden_Loop` on Thunderlord), and a HELD
// EFFECT RECORD. The fulgurbugs are RECORDS, not shells -- u 30 / 31 / 32, byte-identical, differing only in
// which handle slot they occupy -- and while charged the ROM stops 30 and 31 and holds 32, which is the one
// wired. The two calm tiers need a gauge the viewer does not have and are stated in the table, not guessed.
// THUNDERLORD'S PART SETS ARE NOT ZINOGRE'S: his pass is a different function with inverted polarity, so his 7/9
// are alive/dead where Zinogre's 7/9 are calm/charged, and he is never uncharged-looking alive. He also has NO
// TIRED STATE AT ALL (`[tune+0x30]` is NULL) and HIS OWN PUFF at G (u key 250 through vtable +0x208).
async function pageCheckZinogre(MON, NAME, U, DEVIANT){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, NAME + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
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
  const keys = S.entries.filter(e => e.def.record).map(e => e.def.record.key);
  check(keys.includes(32) && !keys.includes(30) && !keys.includes(31),
        'the CHARGED aura u 32 is in the schedule and the two CALM tiers are not: u 30 (gauge 50..74) and u 31 ' +
        '(>= 75) need a gauge the viewer has no equivalent of, so they are stated in the table rather than picked',
        keys.filter(k => k < 100));
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em057_00c'] > 0 && pels[U] > 0 && !pels['em057_04c'],
        'the ailments come from em057_00c -- there is no em057_04c.pel -- and the breaks from ' + U, pels);
  const P = MS.RAGE_PUFF[MON];
  if (DEVIANT)
    check(P && P.joint === 2 && P.records.every(r => r[0] === U && r[1] === 250 && r[2] === 'UNIQUE'),
          'HIS PUFF IS HIS CLASS\'S OWN at G: e+0xb7d2 = 0 kills the shared request and vtable +0x208 runs id 1008 ' +
          '-> u key 250. BOTH slots name it, because below G he would use the shared u 1121 and the viewer is at G. ' +
          'The record names its ARRAY because em057_04u holds key 250 in SEQUENCE and in UNIQUE', P && P.records);
  else
    check(P && P.pick() === 0 && P.joint === 2 && P.records.every(r => r[0] === U),
          'his puff is the stub shape on JOINT 2 -- and it is his OWN effect, em057_00_011, not the shared cm200_007',
          { joint: P && P.joint });
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 144, 'his cut tail is on joint 144', TO.CUT_TAIL[MON]);
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
  // THE TWO CLOCKS: `every:` countdowns run in CLIP frames, the puff's cadence in SCHEDULE frames, and this
  // harness advances one clip frame per two schedule steps.
  const clipFrame = () => (V.pose.action ? Math.round(V.pose.action.time * 60) : -1);
  const clipSteps = async n => {
    let acc = 0, prev = clipFrame();
    await until(() => { const c = clipFrame(); acc += c >= prev ? c - prev : Math.max(0, c); prev = c; return acc >= n; },
                80 * n + 600);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const REST = ['0', 'Motion[1]'];
  const LAND = ['3', 'Motion[16]'];        // a list-3 clip with no table entry
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
  V.state.loop = true;
  await play(REST[0], REST[1]); await frames(3);

  // L3 M2: the HEAD's two rungs, the shock trap and the exhaust status
  const m2 = await rounds('3', 'Motion[2]', 3);
  check(m2.some(x => same(x.fired, [1000])), 'L3 Motion[2] shows the HEAD at level 1: u 1000 on joint 3', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1105])), 'and the SHOCK TRAP: c 1105 at once', m2.map(x => x.fired));
  check(m2.some(x => same(x.fired, [1109])), 'and the tune+0x44 status: c 1109 once', m2.map(x => x.fired));

  // L3 M1: the back and both forelegs
  const m1 = await rounds('3', 'Motion[1]', 3);
  check(m1.some(x => same(x.fired, [1011])), 'L3 Motion[1] shows the BACK at level 2: u 1011 on joint 2', m1.map(x => x.fired));
  check(m1.some(x => same(x.fired, [1015])), 'and the +X FORELEG: u 1015 on joint 9', m1.map(x => x.fired));
  check(m1.some(x => same(x.fired, [1020])), 'and the -X FORELEG: u 1020 on joint 13', m1.map(x => x.fired));

  // THE TAIL SEVER
  await play(LAND[0], LAND[1]); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[19]'); await frames(4);
  check(same(fired, [900]) && isSet(drawn(), 18),
        'L3 Motion[19]: the tail severed -- set 17 -> 18 -- and u 900 on JOINT 144', { fired, d: drawn() });
  check(!!V.mounted[TO.CUT_TAIL[MON].piece], 'and the cut tail piece is mounted', Object.keys(V.mounted));

  // THE CHARGED STATE, on and off
  await play(REST[0], REST[1]); await frames(3);
  fired.length = 0;
  await play('0', 'Motion[24]'); await frames(4); await steps(2);
  check(isSet(drawn(), DEVIANT ? 19 : 1),
        DEVIANT ? 'L0 Motion[24] ((1, 4)): CHARGED -- set 0 -> 19, group 30 off and groups 40 + 41 on, 426 of ' +
                  'those vertices being his sixth material XfB_N__E_m00_body1'
                : 'L0 Motion[24] ((1, 4)): CHARGED -- set 0 -> 1, group 6 off / 9 on (+342 effect vertices), the ' +
                  'light 16 and 23 on, and the hair 17 -> 18 raised', drawn());
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key)
    .map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  check(evReqs(32).includes('r'), 'and the fulgurbug aura u 32 is HELD -- a record, not a shell', evReqs(32));
  await play('0', 'Motion[25]'); await frames(4);
  check(isSet(drawn(), 0), 'L0 Motion[25] ((1, 5)): the charge drops -- back to set 0', drawn());
  check(!evReqs(32).includes('r'), 'and the aura is stopped with it', evReqs(32));

  // RAGE: nothing on the model
  await play(REST[0], REST[1]); await frames(3);
  const before = drawn();
  puffs.length = 0;
  await play('3', 'Motion[20]'); await steps(95);
  check(S.rage === true && same(drawn(), before),
        'L3 Motion[20] ((1, 9), the rage entry -- and also the common recovery clip): rage on and NOT ONE part ' +
        'changes; +0x2a0 is the base stub and the part pass never reads isEnraged', { rage: S.rage });
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.length > 0 && puffs.every(p => p.key === (DEVIANT ? 250 : 1121)),
        'and every puff is ' + (DEVIANT ? 'u 250, his class\'s own' : 'u 1121'), puffs.map(p => p.key));

  // TIRED -- Thunderlord HAS NO TIRED STATE AT ALL
  if (!DEVIANT){
    await play(REST[0], REST[1]); await frames(3);
    fired.length = 0;
    await play('0', 'Motion[10]'); await frames(3); await steps(2);
    check(S.rage === false && count(fired, 1104) === 1,
          'L0 Motion[10] (the tired idle, a clip of its own): rage off and the drool c 1104 at once', { rage: S.rage, fired });
    await clipSteps(50);
    check(count(fired, 1104) === 2, 'and the drool again 48 clip frames on', fired);
  } else {
    check(!MS.MOTION_STATES[MON]['0|Motion[10]'],
          'HE HAS NO TIRED ROW AT ALL: `[tune+0x30]` is NULL, so there is no stamina block and no tired idle -- ' +
          'the same absence Alatreon has', Object.keys(MS.MOTION_STATES[MON]).filter(k => k.startsWith('0|')));
  }

  // ASLEEP, PARALYSIS, the STUN
  await play(REST[0], REST[1]); await frames(3);
  await play('3', 'Motion[10]'); await frames(3);
  check(isSet(drawn(), 2), 'L3 Motion[10] (lying down, and also capture): his eyes shut -- set 3 -> 2', drawn());
  fired.length = 0; puffs.length = 0;
  await play('3', 'Motion[11]'); await frames(3); await steps(2);
  check(isSet(drawn(), 2) && count(fired, 1102) === 1, 'L3 Motion[11] (the hold): the lid stays and the zzz at once', fired);
  await clipSteps(95);
  check(count(fired, 1102) === 2, 'the zzz again 90 clip frames on', fired);
  check(puffs.length === 0, 'and the puff is PAUSED in the sleep hold', puffs.length);
  fired.length = 0;
  await play('3', 'Motion[7]'); await frames(3); await steps(2);
  check(count(fired, 1101) === 1, 'L3 Motion[7] (paralysed, and the trap\'s second clip): c 1101 at once', fired);
  await clipSteps(65);
  check(count(fired, 1101) === 2, 'and again 60 clip frames on', fired);
  for (const clip of ['Motion[3]', 'Motion[17]', 'Motion[5]']){
    await play('3', clip); await frames(4); await steps(2);
    check(evReqs(1103).includes('r'), 'L3 ' + clip + ' (the stun chain): c 1103 held', evReqs(1103));
  }
  await play(REST[0], REST[1]); await frames(6);
  check(!evReqs(1103).includes('r'), 'and off the chain it is stopped', evReqs(1103));

  // DEATH
  const rageBox = document.getElementById('monRage');
  if (rageBox && !rageBox.checked){ rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3); }
  await play('3', 'Motion[21]'); await frames(4);
  check(S.rage === false, 'L3 Motion[21] (death): the rage shown goes off', { rage: S.rage });
  check(isSet(drawn(), 2),
        'and HIS EYES SHUT (set 2): status-11 raises P+0x5d02 with timer -1. If he died CHARGED the ROM holds the ' +
        'charged body until frame 230 of this clip, which a frame-0 table cannot place -- the calm case is shown',
        drawn());
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

export const pageCheck = pageCheckZinogre;
export const args = [['em057_00', 'Zinogre', 'em057_00u', false],
                     ['em057_04', 'Thunderlord Zinogre', 'em057_04u', true]];
