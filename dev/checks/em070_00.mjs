// Nerscylla's page check (em070_00), loaded by dev/motion-states-check.mjs from dev/checks/. dev/em070_00-effects-spec.md: no
// states note existed -- the reactions, breaks, eyes, rage and burrow plays were read for this walk (2026-10-18).
async function pageCheckNerscylla(){
  const out = [];
  const MON = 'em070_00';
  const check = (ok, label, detail) => out.push([!!ok, 'Nerscylla: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
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
  check([1101, 1102, 1103, 1104, 1105, 1109, 1006, 1007, 1011, 1021].every(k => keys.includes(k)),
        'the schedule holds the ailments, the drool, the trap, the exhaust and the four break records', keys.filter(k => k >= 1000));
  const W = (l, n, st) => PM.pslMask(MON, String(l), n, null, st || {});
  check(PM.PSL_MASK_MONSTERS.includes(MON) && W(0, 1, { rank: 5 }) === 0xe001ff && W(0, 1, { rank: 3 }) === 0x1c01ff && W(0, 1, { rank: 1 }) === 0x381ff &&
        W(0, 8, { rank: 5, floorFlag8: true }) === 0xc0e001ff, 'the word: every motion by rank, L0 M8 / M6 bits 30-31 with the floor flag');
  const LAND = ['0', 'Motion[1]'];
  V.state.loop = true;
  const rounds = async (list, clip, n) => { const seen = []; for (let i = 0; i < n; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(4); seen.push({ f: fired.slice(), d: drawn() }); } return seen; };
  const m9 = await rounds('3', 'Motion[9]', 1);
  check(m9[0].f.includes(1109), 'the exhaust L3 M9: c 1109', m9[0].f);
  const sl = await rounds('3', 'Motion[37]', 1);
  check(sl[0].f.includes(1102), 'the sleep hold L3 M37 (A): c 1102 (no lid on him)', sl[0].f);
  const pa = await rounds('3', 'Motion[13]', 1);
  check(pa[0].f.includes(1101), 'paralysis L3 M13: c 1101', pa[0].f);
  await play('3', 'Motion[26]'); await frames(5);
  check(evReq(1103).includes('r'), 'the stun L3 M26: c 1103 held', evReq(1103));
  await play(LAND[0], LAND[1]); await frames(6);
  check(!evReq(1103).includes('r'), 'and stopped off the chain', evReq(1103));
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckNerscylla;
