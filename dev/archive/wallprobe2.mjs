// wallprobe.mjs: Kushala's shell clips (every SHELL_DATA action, up to 3 plays each) with a WALL placed WALL_AT ahead (__view.box), the
// meter on: do the landing records of hit type 0 (c 29..35, u 130 / 131) start, and do they draw?
async function probe(mon, at, keys){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SH = await import('/render/shells.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.effectMeter(true, { every: 5 });
  const acts = Object.values((SH.SHELL_DATA[mon] || {}).actions || {});
  const ctl = document.getElementById('monClassCtl');
  const levels = ctl && ctl.options.length > 1 ? [ctl.options[ctl.options.length - 1].value] : [null];
  for (const lv of levels){
  if (lv !== null){ ctl.value = lv; ctl.dispatchEvent(new Event('change')); await frames(4); }
  const seen = new Set();
  for (const a of acts){
    const k = a.list + '|' + a.clip; if (seen.has(k)) continue; seen.add(k);
    for (let r = 0; r < 2; r++){
      if (V.state.list !== String(a.list)){ listSel.value = String(a.list); await listSel.onchange(); }
      const o = [...clipSel.options].find(x => x.value === a.clip) || [...clipSel.options].find(x => x.value === a.clip + '_start') || [...clipSel.options].find(x => x.value === a.clip + '_loop');
      if (!o) break;
      clipSel.value = o.value; await clipSel.onchange(); await frames(2);
      if (V.box){ V.box('wall', at); V.box('wall', true); }
      await frames(260);
    }
  }
  }
  const rows = V.effectMeterReport().recs.filter(r => keys.some(k => r.key.endsWith(k)));
  for (const r of rows) out.push([false, 'WALL ' + r.key, JSON.stringify({ starts: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, aimed: r.aimedLit + '/' + r.aimed, verdict: r.verdict, unitsAt: r.diag && r.diag.unitsAt })]);
  out.push([false, 'WALL summary', 'records matched ' + rows.length + ' of ' + keys.length + '; V.box ' + typeof V.box]);
  V.effectMeter(false);
  return out;
}
export const pageCheck = probe;
export const args = [[process.env.W_MON || 'em024_00', +(process.env.WALL_AT || 15), (process.env.W_KEYS || 'em024_00c|29|shell,em024_00c|30|shell,em024_00c|32|shell,em024_00c|33|shell,em024_00c|34|shell,em024_00c|35|shell,em024_00u|130|shell,em024_00u|131|shell,em024_00c|31|shell').split(',')]];
