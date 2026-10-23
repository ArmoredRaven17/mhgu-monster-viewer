// The uEm060_00 family's page check (Arzuros em060_00, Redhelm em060_04, Volvidon em062_00 -- one class, no uEm062_00), loaded by
// dev/motion-states-check.mjs from dev/checks/. dev/em060-effects-spec.md: the enable word 0xf1911c, the states read off the ROM
// (no states note exists), the part pass 0xf18558, the eyes 0x71398, the rage stream g6 s0, the puff and the drool.
async function pageCheckArzuros(MON, NAME, C, U, BREAK){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, NAME + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const PM = await import('/render/psl-mask.js');
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
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_loop');
    if (!o){ check(false, 'the list has a clip for ' + list + '|' + clip); return false; }
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  const evReq = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const keys = S.entries.filter(e => e.when === 'event').map(e => e.def.record.key);
  check([1101, 1102, 1103, 1104, 1105, 1109].every(k => keys.includes(k)) && (!BREAK || keys.includes(BREAK)),
        'the schedule holds the ailments, the trap, the drool, the exhaust' + (BREAK ? ' and the break u ' + BREAK : ''), keys);
  check(MS.RAGE_PUFF[MON] && MS.RAGE_PUFF[MON].joint === 3 && MS.TIRED_DROOL[MON], 'the rage puff (joint 3, the stub pick: u 1121) and the drool are listed');
  // THE WORD
  const W = (l, s, st) => PM.pslMask(MON, String(l), s, null, st || {});
  check(PM.PSL_MASK_MONSTERS.includes(MON) && W(0, 4) === 0xe001ff && W(0, 4, { sunk: true }) === 0x1ff && W(0, 1) === 0xe001ff,
        'the word: L0 M1 / M4 bits 21-23 on the surface, none sunk', [W(0, 4), W(0, 4, { sunk: true })].map(w => '0x' + w.toString(16)));
  const red = MON === 'em060_04';
  check(W(0, 13) === (red ? 0x81ff : 0x1ff) && W(9, 1, { rank: 5 }) === (red ? 0x1c01ff : 0x1ff),
        red ? 'Redhelm: L0 M13 bit 15 (c 60), L9 M1 at G bits 18-20 (u 320)' : 'no Redhelm arm: L0 M13 / L9 M1 the base', [W(0, 13), W(9, 1, { rank: 5 })].map(w => '0x' + w.toString(16)));
  // THE STATES, in the page
  const LAND = ['0', 'Motion[1]'];
  const rounds = async (list, clip, n) => { const seen = []; for (let i = 0; i < n; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(4); seen.push(fired.slice()); } return seen; };
  V.state.loop = true;
  const m1 = await rounds('3', 'Motion[1]', MON === 'em060_04' ? 3 : 2);
  check(m1.some(f => f.includes(1109)), 'L3 M1 carries the exhaust (10, 0x1b): c 1109 once', m1);
  const SL = MON === 'em062_00' ? ['3', 'Motion[10]'] : ['3', 'Motion[15]'];
  await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(SL[0], SL[1]); await frames(4);
  check(fired.includes(1102) && isSet(drawn(), 3), 'the sleep hold ((10, 0x1e)): c 1102 and the eyes shut (set 3)', { fired, d: drawn() });
  const PA = MON === 'em062_00' ? ['3', 'Motion[17]'] : ['3', 'Motion[22]'];
  await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(PA[0], PA[1]); await frames(4);
  check(fired.includes(1101), 'paralysis ((10, 0x1f)): c 1101 at once', fired);
  const ST = MON === 'em062_00' ? ['3', 'Motion[15]'] : ['3', 'Motion[20]'];
  await play(ST[0], ST[1]); await frames(5);
  check(evReq(1103).includes('r'), 'the stun ((10, 0x20)): c 1103 held', evReq(1103));
  await play(LAND[0], LAND[1]); await frames(5);
  check(!evReq(1103).includes('r'), 'and stopped off it', evReq(1103));
  const DE = MON === 'em062_00' ? ['3', 'Motion[14]'] : ['3', 'Motion[19]'];
  await play(DE[0], DE[1]); await frames(4);
  check(isSet(drawn(), 3), 'death ((11, 0)): the eyes shut (P+0x5d02)', drawn());
  await play(LAND[0], LAND[1]); await frames(3);
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckArzuros;
export const args = [['em060_00', 'Arzuros', 'em060_00c', 'em060_00u', 0],
                     ['em060_04', 'Redhelm Arzuros', 'em060_00c', 'em060_04u', 1001],
                     ['em062_00', 'Volvidon', 'em062_00c', 'em062_00u', 1000]];
