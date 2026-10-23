// Kecha Wacha's page check (em065_00), loaded by dev/motion-states-check.mjs from dev/checks/. dev/em065_00-effects-spec.md: the base
// enable word (BASE_ONLY), the states read off the ROM (no states note exists), the part pass 0xf49e70, the eyes, the puff, the drool.
async function pageCheckKecha(MON, NAME, C, U, BREAK){
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
  check(MS.RAGE_PUFF[MON] && MS.RAGE_PUFF[MON].joint === 4 && MS.TIRED_DROOL[MON], 'the rage puff (joint 4, the stub pick: u 1121) and the drool are listed');
  // THE WORD: base only (vt+0x13c = 0xca170)
  check(PM.PSL_MASK_MONSTERS.includes(MON) && PM.pslMask(MON, '0', 1, null, {}) === 0x1ff && PM.pslMask(MON, '0', 1, null, { rage: true }) === 0xe3f,
        'the word is the base: 0x1ff calm, 0xe3f enraged');
  // THE STATES, in the page
  const LAND = ['0', 'Motion[1]'];
  const rounds = async (list, clip, n) => { const seen = []; for (let i = 0; i < n; i++){ await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(list, clip); await frames(4); seen.push(fired.slice()); } return seen; };
  V.state.loop = true;
  const m2 = await rounds('3', 'Motion[2]', 3);
  check(m2.some(f => f.includes(1109)), 'L3 M2 carries the exhaust (10, 0x1b): c 1109 once', m2);
  const MSr = MS.MOTION_STATES[MON];
  check(MSr['0|Motion[14]#B'] && MSr['0|Motion[14]#B'].sets[0] === 7 && !MSr['0|Motion[14]'],
        'the sleep hold is L0 M14 copy B (eyes shut set 7, c 1102); copy A, the rest chain, has no row', Object.keys(MSr));
  const PA = ['3', 'Motion[6]'];
  await play(LAND[0], LAND[1]); await frames(2); fired.length = 0; await play(PA[0], PA[1]); await frames(4);
  check(fired.includes(1101), 'paralysis ((10, 0x1f)): c 1101 at once', fired);
  const ST = ['3', 'Motion[10]'];
  await play(ST[0], ST[1]); await frames(5);
  check(evReq(1103).includes('r'), 'the stun ((10, 0x20)): c 1103 held', evReq(1103));
  await play(LAND[0], LAND[1]); await frames(5);
  check(!evReq(1103).includes('r'), 'and stopped off it', evReq(1103));
  const DE = ['3', 'Motion[9]'];
  await play(DE[0], DE[1]); await frames(4);
  check(isSet(drawn(), 7), 'death ((11, 0)): the eyes shut (set 7, P+0x5d02)', drawn());
  await play(LAND[0], LAND[1]); await frames(3);
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const parts = k.split('|'), list = parts[0], clip = parts[1].replace(/#.*$/, '');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table entry ' + k + ' is a clip he carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}
export const pageCheck = pageCheckKecha;
export const args = [['em065_00', 'Kecha Wacha', 'em065_00c', 'em065_00u', 1001]];
