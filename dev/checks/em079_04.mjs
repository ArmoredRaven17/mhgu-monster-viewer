// Nightcloak Malfestio's page check, loaded by dev/motion-states-check.mjs from dev/checks/. ONE FILE PER
// MONSTER, because three Effects sessions run at once. The runner serialises `pageCheck` with .toString() and
// evaluates it IN THE PAGE, so it must not close over anything in this module.
// NIGHTCLOAK (em079_04): against E:/offline/decode/notes/states-em079_04.md. He is uEm079_00 with e+0xb5f5 = 4,
// and his table is LITERALLY Malfestio's -- `nightcloak()` calls `malfestio('em079_04u')` and adds one thing. So
// this check is deliberately not a copy of Malfestio's behavioural pass: what is worth checking on a monster
// built from a factory is that the factory gave him HIS OWN records where they should differ and the SHARED ones
// where they should not, and that the one thing his variant adds is there. Re-testing the cycle and the rage pair
// would be testing `malfestio()` twice.
async function pageCheckNightcloak(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Nightcloak: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const TO = await import('/render/tail-option.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em079_04', BASE = 'em079_00';
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

  // THE FACTORY GAVE HIM THE RIGHT PELS. His breaks, sever-less tail record and puff are his OWN em079_04u; every
  // ailment is Malfestio's em079_00c, because the ROM's resource descriptor names effect\pel\em\em079_00c for BOTH
  // monsters and he ships no c.pel at all. If he were ever given one of his own, these records would silently
  // double rather than fail, so the pel NAME is what is checked.
  const pelOf = key => S.entries.filter(e => e.when !== 'clip' && e.def.record.key === key)
    .map(e => e.def.record.pel).filter((v, i, a) => a.indexOf(v) === i);
  for (const k of [1001, 1010, 1015, 1026, 1120, 1121, 200])
    check(JSON.stringify(pelOf(k)) === JSON.stringify(['em079_04u']), 'record ' + k + ' is his OWN em079_04u', pelOf(k));
  for (const k of [1101, 1102, 1103, 1104, 1109])
    check(JSON.stringify(pelOf(k)) === JSON.stringify(['em079_00c']), 'record ' + k + ' is MALFESTIO\'s em079_00c', pelOf(k));

  // THE TABLE IS THE SAME OBJECT SHAPE as Malfestio's, with his keys substituted -- that is the factory's whole
  // claim, and it is cheap to check directly rather than by replaying every state.
  const a = MS.MOTION_STATES[MON], b = MS.MOTION_STATES[BASE];
  check(JSON.stringify(Object.keys(a)) === JSON.stringify(Object.keys(b)),
        'his table names exactly Malfestio\'s motions -- same class, same scripts, same .mpm, byte-identical .dtp',
        { his: Object.keys(a).length, malfestio: Object.keys(b).length });
  const swap = s => JSON.stringify(s).split('em079_04u').join('em079_00u');
  const diffs = Object.keys(a).filter(k => swap(a[k]) !== JSON.stringify(b[k]));
  check(JSON.stringify(diffs) === JSON.stringify(['3|Motion[17]', '3|Motion[12]', '3|Motion[20]']),
        'and with his u.pel substituted the ONLY motions that differ are the three deaths', diffs);

  // WHAT HIS VARIANT ADDS: entering status 11 cancels the cloak. vtable +0x204 fires u 200 and sets e+0xcb00 = 1.
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play('0', 'Motion[1]'); await frames(3);
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  for (const m of ['Motion[17]', 'Motion[12]', 'Motion[20]']){
    await play('0', 'Motion[1]'); await frames(2);
    fired.length = 0;
    await play('3', m); await frames(4);
    check(fired.includes(200) && S.rage === false,
          'L3 ' + m + ' (death): the CLOAK IS CANCELLED -- u 200 fired -- and the rage shown goes off', { fired, rage: S.rage });
  }
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  check(!Object.keys(b).some(k => JSON.stringify(b[k]).includes('200')),
        'and MALFESTIO fires nothing of the sort on death -- the cloak is Nightcloak\'s alone');

  // HE HAS NO TAIL SEVER EITHER: no .dtt second counter, no 0xc2274 call, both uEnemyOption words -1.
  check(!TO.CUT_TAIL[MON], 'he has NO cut tail entry -- no sever at all, read as an absence', Object.keys(TO.CUT_TAIL));

  const P = MS.RAGE_PUFF[MON];
  check(P && P.joint === 4 && P.period === 30 && P.pick() === 0 && P.records[1][0] === 'em079_04u',
        'his puff is his own records on joint 4 every 30, pick the base stub\'s 0', { joint: P && P.joint, pick: P && P.pick() });

  for (const k of Object.keys(a)){
    const parts = k.split('|'), list = parts[0], clip = parts[1];
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  await play('0', 'Motion[1]'); await frames(3);
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

export const pageCheck = pageCheckNightcloak;
