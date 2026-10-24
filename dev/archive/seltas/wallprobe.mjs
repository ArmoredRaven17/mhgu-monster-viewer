// the wall landings (type 0: her / his u 21, his lob's u 11) with the viewer's wall placed ahead: no refusal, the records start
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'wall: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const open = async MON => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start');
    clipSel.value = o.value; await clipSel.onchange();
  };
  for (const [mon, list, clip, wallAt, keys] of [['em069_00', '4', 'Motion[42]', 9, [21]], ['em076_00', '2', 'Motion[17]', 4, [11]],
                                                 ['em076_00', '4', 'Motion[33]', 3, [21]], ['em076_00', '4', 'Motion[34]', 3, [21]]]){
    await open(mon);
    V.box('wall', wallAt);
    await pick(list, clip);
    await frames(2);
    const info0 = V.box().wall, ri0 = V.rockInput();
    const hits = new Set(), starts = new Set();
    let placed = null;
    for (let i = 0; i < 400; i++){
      await frames(1);
      const st = body().schedule.shells && body().schedule.shells.state;
      // the wall 1.5 m ahead of the first shell, across its flight (a z plane): every later one meets it too
      if (false){
        const s = st.shells[0], z = s.position[2] / 100 + (s.velocity[2] >= 0 ? 1.5 : -1.5);
        V.box('wall', z); await frames(1); const ri = V.rockInput(); placed = { z, v: s.velocity.slice(), p: s.position.slice(), info: V.box().wall, ri: ri && ri.wall };
      }
      for (const s of (st ? st.shells : [])){
        for (const e of (s.events || [])){ if (e.ev === 'hit') hits.add(s.id + ':' + e.type); if (e.ev === 'start') starts.add(e.start.key); }
      }
    }
    const reqs = k => body().schedule.entries.filter(e => e.when === 'shell' && e.def.record.key === k).length;
    check(!body().failed, mon + ' ' + list + '|' + clip + ' with the wall at ' + wallAt + ' m: no refusal', body().failed ? String(body().failed) : null);
    check(keys.every(k => starts.has(k)), mon + ' ' + clip + ': the wall landing starts ' + keys.join(', '), { info0, wall: ri0 && ri0.wall, hits: [...hits], starts: [...starts], rec: keys.map(reqs) });
    V.box('wall', false);
  }
  return out;
}
