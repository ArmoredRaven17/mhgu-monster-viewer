// The level-request copies, loaded by dev/motion-states-check.mjs from dev/checks/ (the runner serialises `pageCheck`
// with .toString() and evaluates it IN THE PAGE, so it imports everything inside itself).
// THE SHARED LEVEL REQUEST 0xa499c(e, level) -- u 1120 / 1121 / 1400 by level -- is asked by a class on SOME plays of a
// clip, not every play. The re-walk of the Flying / Brute / Bird Wyverns (2026-10-18; zg/reqtrace.py: the action main per
// action with all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked) found eleven rows holding the record
// on every play; each is now a copy (motion-states.js CLIP_VARIANTS), and this check plays every copy: the copy whose
// actions ask holds its record, copy A holds nothing. Barroth's three copies are in em044_00.mjs.
async function pageCheckLevelCopies(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Level copies: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  // [monster, list, clip, { copy: [pel, key] }] -- the copies past A and the record each holds
  const CASES = [
    ['em004_00', '0', 'Motion[7]',  { B: ['em004_00u', 1400] }],
    ['em007_00', '0', 'Motion[7]',  { B: ['em007_00u', 1400], C: ['em007_00u', 1121] }],
    ['em007_04', '0', 'Motion[7]',  { B: ['em007_04u', 1400], C: ['em007_04u', 1121] }],
    ['em033_00', '0', 'Motion[2]',  { B: ['em033_00u', 1121] }],
    ['em043_00', '0', 'Motion[6]',  { B: ['em043_00u', 1400] }],
    ['em043_05', '0', 'Motion[6]',  { B: ['em043_05u', 1400] }],
    ['em045_00', '0', 'Motion[6]',  { B: ['em045_00u', 1400] }],
    ['em045_04', '0', 'Motion[6]',  { B: ['em045_04u', 1400] }],
    ['em055_00', '0', 'Motion[6]',  { B: ['em055_00u', 1400] }],
    ['em063_00', '0', 'Motion[10]', { B: ['em063_00u', 1400] }],
    ['em063_05', '0', 'Motion[10]', { B: ['em063_05u', 1400] }],
  ];
  for (const [MON, list, clip, copies] of CASES){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    if (!(V.state.id === MON && V.mounted.main)){ check(false, MON + ' mounted', V.state.id); continue; }
    await V.effects(false); await V.effects(true);
    const ok = await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
    if (!ok){ check(false, MON + ': the effect runtime is up'); continue; }
    const fx = M.effectRuntimeInstance(), S = fx.schedule;
    const held = (pel, key) => S.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.pel === pel && e.def.record.key === key)
      .some(e => e.requests.some(q => !q.stopped));
    const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
    const play = async (value) => {
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
      const o = [...clipSel.options].find(x => x.value === value || x.value === value.replace('#', '_loop#') || x.value === value.replace(/^(Motion\[\d+\])/, '$1_loop'));
      if (!o){ check(false, MON + ': the list has ' + list + '|' + value, [...clipSel.options].map(x => x.value).filter(v => v.startsWith(clip))); return false; }
      clipSel.value = o.value; await clipSel.onchange();
      const name = o.value.replace(/#.*$/, '');
      await until(() => V.pose.action && V.pose.action.getClip().name === name, 300);
      await frames(4); await steps(2);
      return true;
    };
    const recs = Object.values(copies);
    if (await play(clip))
      check(recs.every(([p, k]) => !held(p, k)), MON + ' L' + list + ' ' + clip + ' copy A: none of ' + recs.map(r => 'u ' + r[1]).join(' / ') + ' held',
            recs.map(([p, k]) => k + ':' + held(p, k)));
    for (const [copy, [pel, key]] of Object.entries(copies)){
      if (!(await play(clip + '#' + copy))) continue;
      const others = recs.filter(r => r[1] !== key);
      check(held(pel, key) && others.every(([p, k]) => !held(p, k)), MON + ' copy ' + copy + ': u ' + key + ' HELD while it plays' +
            (others.length ? ', not ' + others.map(r => 'u ' + r[1]).join(' / ') : ''), recs.map(([p, k]) => k + ':' + held(p, k)));
    }
    check(!fx.failed, MON + ': the effect runtime never stopped', fx.failed);
  }
  return out;
}

export const pageCheck = pageCheckLevelCopies;
