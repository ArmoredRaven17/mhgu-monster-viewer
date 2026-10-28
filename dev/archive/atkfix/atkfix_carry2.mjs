// atkfix_carry2.mjs (atkfix lane, 2026-10-27): the census-driven CARRY on the page. Spot checks across monsters: the carried row's
// live frames on its clip (scrubbed frame by frame) equal its window less the shift, and a shot at a live frame; then THE LAP: Giadrome's
// (7, 2) record carried into L2 M2 plays live on the first pass (_start 17.., _loop ..42) and not on the _loop's later laps.
async function carry2(run){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const sel = document.getElementById('monAtkBox'), scrub = document.getElementById('animScrub');
  const open = async (mon, list) => {
    if (V.state.id !== mon){
      if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
      monSel.value = mon; await monSel.onchange();
      await until(() => !!V.mounted.main && V.state.id === mon, 900);
    }
    const row = document.getElementById('monAtkBoxRow'), sec = row.closest('section'), head = sec.querySelector('.panel-head');
    if (sec.dataset.open !== 'true') head.click();
    await frames(3);
    sel.value = 'armed'; sel.dispatchEvent(new Event('change'));
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  };
  const CASES = [['em003_00', '2', 'Motion[39]', 29], ['em009_00', '4', 'Motion[29]', 52], ['em019_00', '3', 'Motion[34]', 49],
                 ['em063_00', '2', 'Motion[13]', 23], ['em025_00', '0', 'Motion[41]', 18], ['em032_04', '2', 'Motion[2]', 25],
                 ['em076_00', '2', 'Motion[33]', 8], ['em086_00', '2', 'Motion[84]', 2],
                 ['em001_04', '2', 'Motion[10]', 1030], ['em002_00', '4', 'Motion[25]', 14], ['em049_00', '2', 'Motion[23]', 19], ['em037_00', '2', 'Motion[11]', 23]];
  for (const [mon, list, clip, id] of CASES){
    await open(mon, list);
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start') || [...clipSel.options].find(x => x.value === clip + '_loop');
    if (!o){ out.push([false, mon + ' ' + list + '|' + clip + ': no such clip', JSON.stringify([...clipSel.options].map(x => x.value).filter(v => v.startsWith(clip.slice(0, -1))))]); continue; }
    clipSel.value = o.value; await clipSel.onchange(); await frames(4);
    const total = +scrub.max, live = [];
    let row = null;
    for (let f = 0; f <= total; f++){
      scrub.value = String(f); scrub.dispatchEvent(new Event('input')); await frames(2);
      const st = V.attackBoxes();
      const r = st && st.rows.find(x => x.id === id && x.carried > 0);
      if (r){ row = r; if (r.on) live.push(Math.round(st.frame)); }
    }
    const w = row && row.win;
    const want = w ? [Math.ceil(w[0]), Math.min(Math.ceil(w[1]) - 1, total)] : null;
    let shot = null;
    if (live.length){
      scrub.value = String(live[Math.floor(live.length / 2)]); scrub.dispatchEvent(new Event('input')); await frames(6);
      V.renderer.render(V.scene, V.camera);
      shot = await fetch('/shot?run=' + run + '&name=' + mon + '_L' + list + '_' + clip.replace(/\W/g, '') + '_id' + id, { method: 'POST', body: V.renderer.domElement.toDataURL('image/png') }).then(r => r.status).catch(e => String(e));
    }
    out.push([!!want && live.length > 0 && live[0] === want[0] && live[live.length - 1] === want[1] && live.length === want[1] - want[0] + 1,
      mon + ' ' + o.value + ': carried record ' + id + ' live exactly on its window less the shift',
      JSON.stringify({ clipFrames: total, carried: row && row.carried, action: row && row.action, win: w, want, liveFrom: live[0], liveTo: live[live.length - 1], n: live.length, shot })]);
  }
  // THE LAP: play (not scrub) Giadrome's L2 M2 from its _start through three _loop laps
  await open('em034_00', '2');
  // the viewer loops a selected sub-clip on its own (Loop on): the _start's first pass, then the _loop's laps
  const o = [...clipSel.options].find(x => x.value === 'Motion[2]_loop');
  V.state.loop = true;
  clipSel.value = o.value; await clipSel.onchange();
  const pb = document.getElementById('animPlay'); if (pb && /Play/.test(pb.textContent)) pb.click();
  const seen = []; let lastClip = null, laps = 0, lastT = -1;
  for (let i = 0; i < 260; i++){
    await frames(1);
    const act = V.pose.action, cn = act && act.getClip().name;
    if (cn !== lastClip){ lastClip = cn; lastT = -1; }
    if (act && act.time < lastT - 1e-4) laps++;
    lastT = act ? act.time : -1;
    const st = V.attackBoxes(); const r = st && st.rows.find(x => x.id === 24 && x.carried > 0);
    if (r && r.on) seen.push(cn + '@' + Math.round(st.frame) + (laps ? ' lap' + laps : ''));
  }
  if (pb && /Pause/.test(pb.textContent)) pb.click();
  const later = seen.filter(s => / lap/.test(s));
  out.push([seen.length > 0 && later.length === 0 && /@3[01]$/.test(seen[0]) && /@46$/.test(seen[seen.length - 1]) && laps >= 2,
    'em034_00 L2 M2_loop played through ' + laps + ' wraps: the carried record 24 live on the first lap only (frames 30..46; playback samples from 31)',
    JSON.stringify({ first: seen[0], last: seen[seen.length - 1], n: seen.length, onLaterLaps: later.length, laps })]);
  // THE REPLAY LAP: em027_00 (7, 8) arms record 29 on L4 M1 (25 frames) and plays M1 again: the carried row (shift 25, lap 1)
  // must be live on the clip's SECOND pass only (frames 0..24), the original on the first from frame 8
  await open('em027_00', '4');
  const o2 = [...clipSel.options].find(x => x.value === 'Motion[1]');
  V.state.loop = true;
  clipSel.value = o2.value; await clipSel.onchange();
  if (pb && /Play/.test(pb.textContent)) pb.click();
  const byLap = {}; let laps2 = 0, lastT2 = -1;
  for (let i = 0; i < 110; i++){
    await frames(1);
    const act = V.pose.action;
    if (act && act.time < lastT2 - 1e-4) laps2++;
    lastT2 = act ? act.time : -1;
    const st = V.attackBoxes(); const r = st && st.rows.find(x => x.id === 29 && x.carried > 0);
    if (r && r.on) (byLap[laps2] = byLap[laps2] || []).push(Math.round(st.frame));
  }
  if (pb && /Pause/.test(pb.textContent)) pb.click();
  const l1 = byLap[1] || [];
  out.push([Object.keys(byLap).join() === '1' && l1.length >= 20 && l1[0] <= 1,
    'em027_00 L4 M1 looped ' + laps2 + ' times: the carried replay row (record 29, lap 1) live on the second pass only',
    JSON.stringify({ laps: Object.keys(byLap), from: l1[0], to: l1[l1.length - 1], n: l1.length })]);
  sel.value = 'off'; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = carry2;
export const args = [[globalThis.process && process.env.RUN || 'atkfix-carry2']];
