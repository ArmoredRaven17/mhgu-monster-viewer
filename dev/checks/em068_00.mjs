// Najarala's page check (em068_00), loaded by dev/motion-states-check.mjs from dev/checks/. dev/em068_00-effects-spec.md: no
// states note existed -- the reactions, breaks, eyes, rage and burrow plays were read for this walk (2026-10-18).
async function pageCheckNajarala(){
  const out = [];
  const MON = 'em068_00';
  const check = (ok, label, detail) => out.push([!!ok, 'Najarala: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const PM = await import('/render/psl-mask.js');
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
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const MONSTER = V.MON.monsters.find(e => e.id === MON);
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => MONSTER.partIds.includes(p))) : null; };
  const isSet = (d, n) => (MONSTER.groups[n] || []).filter(([g]) => MONSTER.partIds.includes(g)).every(([g, on]) => d[g] === on);
  const listOf = id => MONSTER.lists.find(l => l.id === id);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_loop') ||
              [...clipSel.options].find(x => x.value === clip + '_start');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value.replace(/#.*$/, ''), 300);
  };
  const evReq = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const keys = S.entries.filter(e => e.when === 'event').map(e => e.def.record.key);
  check([1101, 1102, 1103, 1104, 1105, 1109, 1001, 1010, 1015, 1030, 1035, 1400].every(k => keys.includes(k)),
        'the schedule holds the ailments, the drool, the trap, the exhaust, the five break records and u 1400', keys.filter(k => k >= 1000));
  const W = (l, n, st) => PM.pslMask(MON, String(l), n, null, st || {});
  check(PM.PSL_MASK_MONSTERS.includes(MON) && W(2, 61) === 0x381ff && W(2, 61, { part2Broken: true }) === 0x1c01ff &&
        W(0, 44) === 0x381ff && W(0, 44, { sunk: true }) === 0x401ff, 'the word: L2 M61 by the part-2 break, L0 M44 by sunk');
  const LAND = ['0', 'Motion[11]'];   // his idle (0, 0): 0xb0230(e, 0xb)
  V.state.loop = true;
  const rounds = async (list, clip, n) => { const seen = []; for (let i = 0; i < n; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(4); seen.push({ f: fired.slice(), d: drawn() }); } return seen; };
  const m2 = await rounds('3', 'Motion[2]', 3);
  check(m2.some(x => x.f.includes(1109)), 'L3 M2 carries the exhaust c 1109', m2.map(x => x.f));
  const sl = await rounds('0', 'Motion[56]', 1);
  check(sl[0].f.includes(1102) && isSet(sl[0].d, 7), 'the sleep hold L0 M56: c 1102 and the eyes shut (set 7)', sl[0]);
  const pa = await rounds('3', 'Motion[37]', 1);
  check(pa[0].f.includes(1101), 'paralysis L3 M37: c 1101', pa[0].f);
  const de = await rounds('3', 'Motion[19]', 1);
  check(isSet(de[0].d, 7), 'death L3 M19: the eyes shut', de[0].d);
  // L0 M44: u 1400 on the burrowed copy only
  await play(LAND[0], LAND[1]); await frames(2);
  listSel.value = '0'; await listSel.onchange();
  const a = [...clipSel.options].find(x => /^Motion\[44\](_start|_loop)?$/.test(x.value)), b = [...clipSel.options].find(x => /^Motion\[44\](_start|_loop)?#B$/.test(x.value));
  if (a){ clipSel.value = a.value; await clipSel.onchange(); await frames(5); }
  const offA = !evReq(1400).includes('r');
  if (b){ clipSel.value = b.value; await clipSel.onchange(); await frames(5); }
  check(!!a && !!b && offA && evReq(1400).includes('r'), 'L0 M44: no u 1400 on the surface plays (A), held on the burrowed ones (B)', evReq(1400));
  await play(LAND[0], LAND[1]); await frames(3);
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckNajarala;
