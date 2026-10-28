// atkfix_carry.mjs (atkfix lane, 2026-10-27): the dromes' (7, 2) arm carried from L2 M1 (23 frames) into L2 M2, the motion the action
// plays next (docs/action-motions.json: phase 1, on M1's end). Its record (start 40, duration 26; flags 3, bit 0 set: not locked to the
// motion, 0x7ddb8) should show on M2 frames 21..47 (record start 40 + the lead, M1's blend 4, less M1's 23 frames) and on no frame of M1. Shots at M2 frame 25 -> dev/shots/<run>/.
async function carry(run){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const sel = document.getElementById('monAtkBox'), scrub = document.getElementById('animScrub');
  const ID = { em014_00: 3, em015_00: 8, em016_00: 9, em034_00: 24 };
  for (const mon of Object.keys(ID)){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange();
    await until(() => !!V.mounted.main && V.state.id === mon, 900);
    const row = document.getElementById('monAtkBoxRow'), sec = row.closest('section'), head = sec.querySelector('.panel-head');
    if (sec.dataset.open !== 'true') head.click();
    await frames(3);
    sel.value = 'armed'; sel.dispatchEvent(new Event('change'));
    if (V.state.list !== '2'){ listSel.value = '2'; await listSel.onchange(); }
    const res = {};
    for (const clip of ['Motion[1]', 'Motion[2]_loop', 'Motion[2]']){
      const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start');
      if (!o){ res[clip] = 'no clip'; continue; }
      clipSel.value = o.value; await clipSel.onchange();
      await frames(4);
      const total = +scrub.max, live = [];
      for (let f = 0; f <= total; f++){
        scrub.value = String(f); scrub.dispatchEvent(new Event('input')); await frames(2);
        const st = V.attackBoxes();
        if (st && st.rows.some(r => r.on && r.id === ID[mon])) live.push(Math.round(st.frame));
      }
      const st = V.attackBoxes();
      res[clip] = { clip: o.value, frames: total, win: (st.rows.find(r => r.id === ID[mon]) || {}).win || null, liveFrom: live[0], liveTo: live[live.length - 1], n: live.length };
      if (clip === 'Motion[2]'){
        scrub.value = '25'; scrub.dispatchEvent(new Event('input')); await frames(6);
        V.renderer.render(V.scene, V.camera);
        const url = V.renderer.domElement.toDataURL('image/png');
        res.shot = await fetch('/shot?run=' + encodeURIComponent(run) + '&name=' + mon + '_L2_Motion2_f25', { method: 'POST', body: url }).then(r => r.status).catch(e => String(e));
        res.armedAt25 = V.attackBoxes().armed;
      }
    }
    const m1 = res['Motion[1]'], m2 = res['Motion[2]'], lp = res['Motion[2]_loop'];
    // _start (30 frames) then _loop (frames 30.. of Motion[2]: the viewer adds the _start's length)
    out.push([m1 && m1.n === 0 && m2 && m2.win && m2.win[0] === 21 && m2.win[1] === 47 && m2.liveFrom === 21 && lp && lp.liveTo === 46 && res.armedAt25 > 0,
      mon + ': record ' + ID[mon] + ' never live on L2 M1, live on L2 M2 frames 21..46 (window 21-47 = start 40 + the lead 4 (the M1 blend) - 23 (the M1 frames): _start 21.., _loop ..46), drawn at f25', JSON.stringify(res)]);
  }
  sel.value = 'off'; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = carry;
export const args = [[globalThis.process && process.env.RUN || 'atkfix-carry']];
