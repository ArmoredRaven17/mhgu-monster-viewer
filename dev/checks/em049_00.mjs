// Agnaktor's page check (em049_00), loaded by dev/motion-states-check.mjs from dev/checks/. dev/em049_00-effects-spec.md: no
// states note existed -- the reactions, breaks, eyes, rage, sever and burrow plays were read for this walk (2026-10-17).
async function pageCheckAgnaktor(){
  const out = [];
  const MON = 'em049_00';
  const check = (ok, label, detail) => out.push([!!ok, 'Agnaktor: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
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
  check([1101, 1102, 1103, 1104, 1105, 1109, 1001, 1006, 1010, 1015, 1020, 1025, 1030, 1035, 900, 905].every(k => keys.includes(k)),
        'the schedule holds the ailments, the drool, the trap, the exhaust, the eight break records and the sever', keys.filter(k => k >= 900));
  check(MS.RAGE_PUFF[MON] && MS.RAGE_PUFF[MON].joint === 2 && MS.TIRED_DROOL[MON] && TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 145,
        'the puff (joint 2, u 1121), the drool and the cut tail (joint 145) are listed');
  // THE WORD
  const W = (l, n, st) => PM.pslMask(MON, String(l), n, null, st || {});
  check(PM.PSL_MASK_MONSTERS.includes(MON) && W(0, 7) === 0x381ff && W(0, 7, { severed: true }) === 0x181ff && W(0, 7, { sunk: true }) === 0x1e01ff &&
        W(0, 6, { sunk: true }) === 0x1c01ff && W(2, 2) === 0x201ff && W(2, 2, { severed: true }) === 0x1ff && W(2, 10) === 0x601ff,
        'the word: L0 M7 tail on / cut / sunk, L0 M6 sunk, L2 M2 / M10 only with the tail on');
  const mask = () => S.clip && S.clip.mask != null ? S.clip.mask >>> 0 : null;
  const LAND = ['0', 'Motion[1]'];
  V.state.loop = true;
  await play(LAND[0], LAND[1]); await frames(2);
  { const o = [...clipSel.options]; listSel.value = '0'; await listSel.onchange();
    const b = [...clipSel.options].find(x => /^Motion\[6\](_loop)?#B$/.test(x.value));
    check(!!b, 'L0 M6 has its burrowed copy B');
    if (b){ clipSel.value = b.value; await clipSel.onchange(); await frames(6); }
    check(mask() === 0x1e01ff || mask() === 0x1c01ff, 'L0 M6 B in the page: burrowed, bits 18-20', mask() == null ? null : '0x' + mask().toString(16)); }
  // THE STATES
  const rounds = async (list, clip, n) => { const seen = []; for (let i = 0; i < n; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(4); seen.push({ f: fired.slice(), d: drawn() }); } return seen; };
  const m2 = await rounds('3', 'Motion[2]', 4);
  check(m2.some(x => x.f.includes(1109)), 'L3 M2 carries the exhaust c 1109', m2.map(x => x.f));
  const sl = await rounds('0', 'Motion[16]', 1);
  check(sl[0].f.includes(1102) && isSet(sl[0].d, 2), 'the sleep hold L0 M16: c 1102 and the eyes shut (set 2)', sl[0]);
  const pa = await rounds('3', 'Motion[9]', 1);
  check(pa[0].f.includes(1101), 'paralysis L3 M9: c 1101', pa[0].f);
  let held = false;
  for (let i = 0; i < 3 && !held; i++){ await play(LAND[0], LAND[1]); await frames(2); await play('3', 'Motion[3]'); await frames(5); held = evReq(1103).includes('r'); }
  check(held, 'one of L3 M3\'s plays is the stun side 1: c 1103 held', evReq(1103));
  await play(LAND[0], LAND[1]); await frames(5);
  const de = await rounds('3', 'Motion[12]', 1);
  check(isSet(de[0].d, 2), 'death L3 M12: the eyes shut', de[0].d);
  const sv = await rounds('3', 'Motion[13]', 1);
  check(sv[0].f.includes(900), 'the sever L3 M13 ((10, 0x72), part 7): u 900', sv[0].f);
  await play(LAND[0], LAND[1]); await frames(3);
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckAgnaktor;
