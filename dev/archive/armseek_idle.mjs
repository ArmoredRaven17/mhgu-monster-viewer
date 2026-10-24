async function probe(){
  const out = [];
  const note = (label, d) => out.push([false, label, JSON.stringify(d)]);
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em084_00')) monSel.add(new Option('em084_00', 'em084_00'));
  monSel.value = 'em084_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const side = k => V.sideEffectRuntimeObj(k);
  await until(() => side('em084_00_left') && side('em084_00_left').schedule, 900);
  const play = async (list, clip) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange(); await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300); };
  const liveOf = rt => rt.schedule.entries.filter(e => e.when === 'clip' && e.requests.some(q => !q.stopped)).map(e => e.def.efl.split('/').pop() + ':' + e.def.record.key);
  V.state.loop = false;
  for (const [list, clip, at] of [['0', 'Motion[2]', 60], ['0', 'Motion[3]', 90]]){
    await play('3', 'Motion[1]'); await frames(2); await play(list, clip);
    for (let i = 0; i < 400 && !(V.pose.action && V.pose.action.time * 60 >= at); i++) await frames(1);
    const L = side('em084_00_left'), R = side('em084_00_right');
    const live = { left: L ? liveOf(L) : null, right: R ? liveOf(R) : null, leftClip: L && L.schedule.clip && L.schedule.clip.key, body: liveOf(M.effectRuntimeInstance()) };
    let err = null;
    try { document.getElementById('animFirst').onclick(); } catch (e){ err = String(e.message || e).slice(0, 90); }
    note('body L' + list + ' ' + clip + ' seek back at ' + at, { live, err });
    await frames(2);
  }
  return out;
}
export const pageCheck = probe;
