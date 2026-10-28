// laneB3/point087.mjs (lane B3, 2026-10-27): Ahtal-Neset's rocket-point toggles (render/motion-states.js POINT087, index.html point087)
// on the page, the draw meter on (every 2nd frame): mounted on his own entry, idle clip looping, all points intact, a shot; then for each
// point k = 0..6: switch "Point k destroyed" on, check the Parts row it drives went to the destroyed option, wait, a shot (dev/shots/
// laneB3_point087/<k>.png through the page's own __view.shot), and leave it destroyed. Prints, per point, the row's option before /
// after, and the meter's row for its u effect (starts and draws separately). Control: the toggle off restores the intact option.
async function check(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em087_00', monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  for (let k = 0; k < 7; k++) window.__point087.set(k, false);        // all intact (no effect fires on the way back)
  V.state.loop = true;
  await frames(30);
  const rowSel = spec => { const r = [...document.querySelectorAll('[data-row]')].find(x => x.dataset.row === spec); const s = r && r.querySelector('select');
                           return s ? (s.options[s.selectedIndex] || {}).dataset.key + ' (' + (s.options[s.selectedIndex] || {}).textContent + ')' : 'no row'; };
  const ROWS = ['1', '2', '3', '4', '5', '14,15', '12,13'];
  // PASS 1, the meter (no shots: __view.shot sets the clip's timeScale to 0, which stops the effect clock the meter samples on)
  V.effectMeter(true, { every: 2 });
  const per = [];
  for (let k = 0; k < 7; k++){
    const before = rowSel(ROWS[k]);
    window.__point087.set(k, true);
    await frames(180);
    per.push({ k, row: ROWS[k], before, after: rowSel(ROWS[k]) });
  }
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  const KEYS = [500, 505, 510, 515, 520, 600, 605];
  const rows = rep.recs.filter(r => KEYS.some(x => r.key === MON + '|em087_00u|' + x + '|event'))
    .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict, nodraw: r.nodraw }));
  // control: switch point 0 off again -> its row back to intact
  window.__point087.set(0, false); await frames(5);
  const restored = rowSel('1');
  const ok = rows.length === 7 && rows.every(r => r.st === 1) && per.every(p => p.before !== p.after);
  // PASS 2, the shots (dev/shots/laneB3_point087/): all intact, then each point destroyed in turn, 20 frames after its toggle
  for (let k = 0; k < 7; k++) window.__point087.set(k, false);
  await frames(10);
  const shots = [];
  const shoot = async name => { try { await V.shot('laneB3_point087', name); shots.push(name); } catch (e){ shots.push(name + ' failed ' + e.message); } };
  await shoot('intact');
  for (let k = 0; k < 7; k++){
    for (let j = 0; j < 7; j++) window.__point087.set(j, j === k ? true : false);   // one point destroyed per shot
    V.pose.action && (V.pose.action.timeScale = 1);
    await frames(20);
    await shoot('point' + k);
  }
  out.push([ok, 'POINT087', JSON.stringify({ shots, per, restored0: restored, rows })]);
  return out;
}
export const pageCheck = check;
export const args = [[]];
