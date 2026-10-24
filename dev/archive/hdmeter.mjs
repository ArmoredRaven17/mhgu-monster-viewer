// hdmeter.mjs: THE HUNTER CONTROL in the page -- per monster and setting (window.__hunter.set(dist, side, 0)), the plays named, through
// the draw meter; one REPORT line each (starts / lit per record) for hd_diff.py
async function hdMeter(mon, ctl, plays, dist, side){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl');
  if (cs){ cs.value = String(ctl == null ? 0 : ctl); cs.dispatchEvent(new Event('change')); }
  window.__hunter.set(dist, side, 0);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const rt = M.effectRuntimeInstance();
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.state.loop = false;
  V.effectMeter(true, { every: 5 });
  const missing = [];
  for (const [list, clip, n] of plays){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start') || [...clipSel.options].find(x => x.value === clip + '_loop');
    if (!o){ missing.push(list + '|' + clip); continue; }
    clipSel.value = o.value; await clipSel.onchange();
    await frames(n || 400);
  }
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  window.__hunter.set(-1, 0, 0);
  if (cs){ cs.value = '0'; cs.dispatchEvent(new Event('change')); }
  out.push([false, 'REPORT ' + mon + ' ' + dist + '/' + side, JSON.stringify({ failed: rt.failed || null, missing,
    recs: rep.recs.map(r => ({ k: r.key, st: r.starts, s: r.samples, lit: r.litSamples, verdict: r.verdict })) })]);
  return out;
}
export const pageCheck = hdMeter;
const PLAYS = {
  em024_00: [3, [['0', 'Motion[8]', 400], ['1', 'Motion[16]', 400], ['2', 'Motion[18]', 300], ['0', 'Motion[5]', 300]]],
  em027_00: [null, [['0', 'Motion[5]', 420], ['0', 'Motion[5]#B', 420]]],
  em083_00: [null, [['0', 'Motion[30]', 330], ['2', 'Motion[21]', 160], ['2', 'Motion[15]', 300]]],
  em083_04: [null, [['0', 'Motion[30]', 330], ['2', 'Motion[21]', 160], ['2', 'Motion[15]', 300]]],
  em057_00: [null, [['2', 'Motion[15]', 300], ['2', 'Motion[18]', 300], ['2', 'Motion[24]', 300]]],
  em050_00: [null, []],
};
const SETS = [[-1, 0], [0, 0], [500, 0], [1200, 0], [-1, 180]];
const ids = (typeof process !== 'undefined' && process.env.HD_IDS ? process.env.HD_IDS : 'em024_00,em027_00,em083_00,em083_04,em057_00').split(',');
export const args = ids.flatMap(m => SETS.map(([d, s]) => [m, PLAYS[m][0], PLAYS[m][1], d, s]));
