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
  // his OWN u pel's keys (em057_00c's c 30 / c 31 are footfall clip records, cm202_001 -- not the aura tiers)
  const keys = S.entries.filter(e => e.def.record && e.def.record.pel === U).map(e => e.def.record.key);
  check(keys.includes(32) && keys.includes(90) && !keys.includes(31) && (DEVIANT ? keys.includes(42) && keys.includes(280) && !keys.includes(30)
                                                                                  : keys.includes(30) && keys.includes(120) && !keys.includes(42)),
        'the auras and the discharge are in the schedule: u 32 charged, ' + (DEVIANT ? 'u 42 his uncharged aura (id 1006), u 280 the slam\'s'
        : 'u 30 the Charging rung (gauge tier 2 / 3: u 31 is the same record in another slot), u 120 the death discharge') +
        ', u 90 the discharge', keys.filter(k => k < 300));
  const pels = {};
  for (const e of S.entries) if (e.def.record) pels[e.def.record.pel] = (pels[e.def.record.pel] || 0) + 1;
  check(pels['em057_00c'] > 0 && pels[U] > 0 && !pels['em057_04c'],
        'the ailments come from em057_00c -- there is no em057_04c.pel -- and the breaks from ' + U, pels);
  const P = MS.RAGE_PUFF[MON];
  if (DEVIANT)
    // [2026-10-20, effects lane: the Quest Rank control -- the pick now reads the rank: records [u 250 UNIQUE, the shared u 1121],
    // u 250 at G, u 1121 below; the puff itself is played at both ranks by dev/checks/quest-rank.mjs]
    check(P && P.joint === 2 && P.records[0][0] === U && P.records[0][1] === 250 && P.records[0][2] === 'UNIQUE' && P.records[1][1] === 1121 &&
          P.pick(null, { rank: 5 }) === 1 && P.pick(null, { rank: 1 }) === 0,
          'HIS PUFF IS HIS CLASS\'S OWN at G: e+0xb7d2 = 0 kills the shared request and vtable +0x208 runs id 1008 ' +
          '-> u key 250 (UNIQUE: em057_04u holds key 250 in SEQUENCE and in UNIQUE); below G the shared u 1121 -- by the Quest Rank', P && P.records);
  else
    check(P && P.pick() === 0 && P.joint === 2 && P.records.every(r => r[0] === U),
          'his puff is the stub shape on JOINT 2 -- and it is his OWN effect, em057_00_011, not the shared cm200_007',
          { joint: P && P.joint });
  // the drop joint is the sever call's kind byte 0x8f = 143 (0xeed254), not u 900's 144
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail drops from joint 143', TO.CUT_TAIL[MON]);
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
  // THE BACK BREAKS AT LEVEL 2 ([[7], [7], [8]]): an arm shows max(1, the user's level), and levels 0 / 1 draw the same set,
  // so the back's break shows once the Back row is Broken (set 8) -- the first depletion shows and fires nothing
  const pickRow = async (row, text) => {
    const f = document.querySelector('[data-row="' + row + '"]'), sel = f && f.querySelector('select');
    const o = sel && [...sel.options].find(x => x.textContent.trim() === text);
    if (!o) return false;
    sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(2); return true;
  };
  const m1a = await rounds('3', 'Motion[1]', 3);
  check(!m1a.some(x => x.fired.includes(1011)), 'L3 Motion[1] with the Back Intact: the back\'s turn is level 1 and fires nothing', m1a.map(x => x.fired));
  check(await pickRow('7,8,10,11,12', 'Broken'), 'the Back row set to Broken');
  const m1 = await rounds('3', 'Motion[1]', 3);
  await pickRow('7,8,10,11,12', 'Intact');
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
  if (DEVIANT) check(evReqs(32).includes('r'), 'and the fulgurbug aura u 32 is HELD from the (1, 4) start (id 1007) -- a record, not a shell', evReqs(32));
  else check(!evReqs(32).includes('r'), 'and u 32 is NOT held during the (1, 4) charge-up itself: the aura machine skips it on that start (0xeed798)', evReqs(32));
  fired.length = 0;
  await play('0', 'Motion[25]'); await frames(4);
  check(isSet(drawn(), 0), 'L0 Motion[25] ((1, 5)): the charge drops -- back to set 0', drawn());
  check(!evReqs(32).includes('r'), 'and the aura is stopped with it', evReqs(32));
  check(fired.includes(90), 'and the (1, 5) start fires the discharge u 90 (0xeecb28 -> 0xeecc2c, id 1005)', fired);

  // THE CHARGE RUNGS AS THE GAUGE (CHARGE_EFFECTS em057_00 / em057_04): the held aura per rung, calm only where the ROM's machine
  // tests rage, the discharge on leaving the charged rung, the death discharge, the auras dropped at death
  const lvSel0 = document.getElementById('monLevel');
  const rung0 = async n => { lvSel0.value = String(n); lvSel0.onchange({ target: lvSel0 }); await frames(4); };
  const CHR = DEVIANT ? 1 : 2, UNC = DEVIANT ? 42 : 30;
  await play(REST[0], REST[1]); await frames(3);
  await rung0(DEVIANT ? 0 : 1);
  check(evReqs(UNC).includes('r'), (DEVIANT ? 'the Charged rung (P+0x5df3 0): u 42 held' : 'the Charging rung (tier 2 / 3): u 30 held'), evReqs(UNC));
  await rung0(CHR);
  check(evReqs(32).includes('r') && !evReqs(UNC).includes('r'), 'the charged rung: u 32 held, the uncharged aura stopped', [evReqs(32), evReqs(UNC)]);
  const rb0 = document.getElementById('monRage');
  if (rb0){ rb0.checked = true; await rb0.onchange({ target: rb0 }); await frames(4); }
  check(!evReqs(32).includes('r'), 'enraged while charged: no aura (0xeed6b4 / 0xeed774)', evReqs(32));
  if (rb0){ rb0.checked = false; await rb0.onchange({ target: rb0 }); await frames(4); }
  check(evReqs(32).includes('r'), 'calm again: u 32 back', evReqs(32));
  fired.length = 0;
  await rung0(0);
  check(fired.includes(90) && !evReqs(32).includes('r'), 'dropping off the charged rung: the discharge u 90 once, u 32 stopped', fired);
  await rung0(CHR); fired.length = 0;
  await play('3', 'Motion[21]'); await frames(4);
  check(fired.includes(DEVIANT ? 90 : 120) && !evReqs(32).includes('r'),
        'death while charged: ' + (DEVIANT ? 'u 90 (variant 4 never takes id 1004)' : 'u 120 (id 1004, status 11 + variant 0)') + ', the aura dropped', fired);
  await rung0(0); await play(REST[0], REST[1]); await frames(3);
  // the uncharged rung is gauge tier 0 or >= 1: two deaths, one without the request and one with it (0xeed0e4 / 0xeed104)
  const dz = [];
  for (let i = 0; i < 2; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play('3', 'Motion[21]'); await frames(4); dz.push(fired.slice()); }
  check(dz.filter(f => f.includes(DEVIANT ? 90 : 120)).length === 1,
        'two deaths at the uncharged rung: one at tier 0 (nothing), one at tier >= 1 (' + (DEVIANT ? 'u 90' : 'u 120') + ')', dz);
  await play(REST[0], REST[1]); await frames(3);
  if (DEVIANT){
    fired.length = 0;
    await play('9', 'Motion[2]'); await clipSteps(32);
    check(fired.includes(280), 'L9 Motion[2] ((7, 0xd9), the charged slam chain): u 280 at f25 (id 1009, 0xefb2a0)', fired);
    await play(REST[0], REST[1]); await frames(3);
  }

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

  // THE ENABLE WORD (psl-mask.js em057; dev/em057-effects-spec.md 1-3): uEm057_00 vt+0x13c = 0xf0279c, read whole and run
  // 254464 times against the ROM. The charged byte P+0x5df3 is the Charge State rung the part pass draws while it is up --
  // Zinogre's Fully Charged (2), Thunderlord's Overcharged (1); e+0xb5f8 == 9 is the (7, 0x9d..0xab / 0xf9..0xfe) bodies'
  // and their (7, 0xfb / 0xfc) follows'. At G Thunderlord's word clears the enraged group (bits 9-11) on every motion.
  const PM = await import('/render/psl-mask.js');
  check(PM.PSL_MASK_MONSTERS.includes(MON) && PM.CLIP_ACTIONS[MON], 'he is listed: his clip effects follow the enable word');
  const Wd = (list, slot, action, st) => PM.pslMask(MON, String(list), slot, action, Object.assign({ rank: 5 }, st));
  const WORDS = DEVIANT ? [
    [2, 1, [7, 0xe9], {}, 0x1ff, 'L2 M1 (7, 0xe9) uncharged: bit 6 (u 201)'],
    [2, 1, [7, 0xfb], {}, 0x4001bf, 'L2 M1 (7, 0xfb), the follow out of L2 M44 (b5f8 9), uncharged: bit 6 off, bit 22 (u 245)'],
    [2, 1, [7, 0xe9], { charged: true }, 0x380001bf, 'L2 M1 (7, 0xe9) charged: bit 6 off, 27-29 (u 211)'],
    [2, 1, [7, 0xfb], { charged: true }, 0xc00001bf, 'L2 M1 (7, 0xfb) charged: 30-31 (u 235)'],
    [2, 15, null, {}, 0xe001ff, 'L2 M15 uncharged: 21-23 (u 270)'], [2, 15, null, { charged: true }, 0x380001ff, 'charged: 27-29 (u 260)'],
    [2, 24, null, {}, 0xe001fe, 'L2 M24 uncharged: bit 0 CLEARED (u 290 off), 21-23 (u 300)'], [2, 24, null, { charged: true }, 0x1ff, 'charged: the base'],
    [2, 58, null, {}, 0xe001ff, 'L2 M58 at G uncharged: 21-23 (u 245)'], [2, 58, null, { charged: true }, 0x380001ff, 'charged: 27-29 (u 235 / 251)'],
    [2, 43, [7, 0xfa], {}, 0x4001ff, 'L2 M43 uncharged: bit 22 (u 242)'], [2, 43, [7, 0xfa], { charged: true }, 0xc00001ff, 'charged: 30-31 (u 232)'],
    [0, 20, [7, 0x71], {}, 0x3800003f, 'L0 M20 (7, 0x71) uncharged: bits 6-11 off, 27-29 (u 480)'],
    [0, 20, [7, 0x71], { charged: true }, 0x1c003f, 'charged: 18-20 (u 470)'], [0, 20, [1, 0x2d], {}, 0x1ff, '(1, 0x2d): the base'],
    [0, 24, [1, 4], {}, 0x70001ff, 'L0 M24 (1, 4): 24-26 (u 500)'], [0, 24, [7, 0x71], {}, 0x380001ff, '(7, 0x71) uncharged: 27-29 (u 481)'],
    [0, 24, [7, 0x71], { charged: true }, 0x1c01ff, '(7, 0x71) charged: 18-20 (u 471)'],
    [3, 20, [1, 9], { rage: true }, 0x803f, 'L3 M20 the rage roar (1, 9), enraged at G: bit 15 (c 60) and the enraged group CLEARED'],
    [3, 21, [11, 0], {}, 0x70001ff, 'L3 M21 death uncharged: 24-26 (u 680 / 681)'], [3, 21, [11, 0], { charged: true }, 0xe001ff, 'died charged: 21-23 (u 650 / 651)'],
    [2, 1, [7, 0xe9], { rage: true }, 0x7f, 'enraged at G: bits 9-11 cleared on every motion (u 221 never); the L2 M1 arm still sets bit 6 (u 201)'],
    [2, 18, null, { rage: true }, 0xe0003f, 'L2 M18 enraged at G: the base\'s 9-11 cleared (c 202 b9 never), 21-23 (u 270)'],
  ] : [
    [2, 1, [7, 0xe9], {}, 0x1ff, 'L2 M1 (7, 0xe9) uncharged: the base'],
    [2, 1, [7, 0xe9], { charged: true }, 0x380001ff, 'charged: 27-29 (u 211)'],
    [2, 1, [7, 0xfb], { charged: true }, 0xc00001ff, 'L2 M1 (7, 0xfb), the follow out of L2 M44 (b5f8 9), charged: 30-31 (u 235)'],
    [2, 44, [7, 0xf9], { charged: true }, 0xc00001ff, 'L2 M44 (7, 0xf9) charged: 30-31 (u 233)'], [2, 44, [7, 0xf9], {}, 0x1ff, 'uncharged: the base'],
    [2, 26, null, { charged: true }, 0x380001ff, 'L2 M26 charged: 27-29 (u 350)'], [2, 42, null, { charged: true }, 0x1ff, 'L2 M42 charged: none (u 410 there never)'],
    [2, 60, null, {}, 0xc00001ff, 'L2 M60 at G: 30-31 (u 235)'],
    [0, 20, [7, 0x71], {}, 0x1c003f, 'L0 M20 (7, 0x71): bits 6-11 off (u 440), 18-20 (u 470)'], [0, 20, [1, 0x2d], {}, 0x1ff, '(1, 0x2d): the base'],
    [0, 24, [1, 4], {}, 0x70001ff, 'L0 M24 (1, 4): 24-26 (u 500)'], [0, 24, [7, 0x71], {}, 0x1c01ff, '(7, 0x71): 18-20 (u 471)'],
    [3, 20, [1, 9], { rage: true }, 0x8e3f, 'L3 M20 the rage roar (1, 9): bit 15 (c 60)'], [3, 20, [1, 2], { rage: true }, 0xe3f, '(1, 2): none'],
    [3, 21, [11, 0], { charged: true }, 0xe001ff, 'L3 M21 died charged: 21-23 (u 650 / 651)'], [3, 21, [11, 0], {}, 0x1ff, 'died calm: none'],
    [3, 13, [11, 7], { charged: true }, 0xe001ff, 'L3 M13 died charged: 21-23'],
  ];
  for (const [l, s, a, st, want, label] of WORDS){
    const w = Wd(l, s, a, st);
    check(w === want, 'the word: ' + label, '0x' + (w >>> 0).toString(16));
  }
  // and in the page: the rung, the clip, each play the next of CLIP_ACTIONS
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  const lvSel = document.getElementById('monLevel');
  const rung = async n => { lvSel.value = String(n); lvSel.onchange({ target: lvSel }); await frames(4); };
  const CH = DEVIANT ? 1 : 2;
  // at G Zinogre's L2 M1 is never the (7, 0xfb) follow (his remap sends (7, 0xf9) to 0xa2 always); Thunderlord's is, charged and calm
  const PLAYS = [[CH, '2', 'Motion[1]', [DEVIANT ? 0x380001bf : 0x380001ff, DEVIANT ? 0xc00001bf : 0x380001ff]],
                 [0, '0', 'Motion[24]', [0x70001ff, DEVIANT ? 0x380001ff : 0x1c01ff]],
                 [CH, '3', 'Motion[21]', [0xe001ff]]];
  for (const [r, list, clip, want] of PLAYS){
    await rung(r); await play(LAND[0], LAND[1]); await frames(3);
    const got = [];
    for (let i = 0; i < want.length; i++){ await play(list, clip); await frames(6); got.push(mask()); }
    check(same(got, want), 'played at rung ' + r + ': ' + list + '|' + clip + ' takes ' + want.map(w => '0x' + w.toString(16)).join(', then '),
          got.map(w => w == null ? null : '0x' + w.toString(16)));
  }
  await rung(0); await play(REST[0], REST[1]); await frames(3);

  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');   // a copy's row ('#B') is its clip's
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
