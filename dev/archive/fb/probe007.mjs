export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Diablos dust shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em007_00';
  const open = async () => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const OLD = new Set();
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    OLD.clear();
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) OLD.add(s);
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const watch = async (n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
      for (const s of (st ? st.shells : [])){
        if (seen.has(s) || OLD.has(s)) continue;
        seen.set(s, { shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key, req: !!s.request });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  check(await open(), 'the runtime is up');
  for (const [list, clip, sh] of [['0', 'Motion[24]', 'shell01']]){
    await pick(list, clip);
    const keys = new Set();
    for (let k = 0; k < 200; k++){ await frames(1); const c = body().schedule.clip; const st = body().schedule.shells.state; if (c && c.frame > 50 && c.frame < 62) keys.add((c.frame|0) + ' rock ' + JSON.stringify(body().schedule.rockInput ? body().schedule.rockInput() : null) + ' extra ' + JSON.stringify(body().schedule.shellExtra ? body().schedule.shellExtra() : null).slice(0, 300) + ' T ' + body().schedule.shellTally.spawned + ' hist ' + JSON.stringify(st.hist) + ' mot ' + st.motion + ' n ' + st.shells.length + ' pos ' + JSON.stringify(body().schedule.parent && body().schedule.parent.position)); }
    check(false, 'keys ' + list + clip, [...keys].slice(0, 12));
    const w = await watch(400, x => x.some(y => y.shell === sh));
    const T = body().schedule.shellTally;
    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });
    if (body().failed) await open();
  }
  return out;
}
