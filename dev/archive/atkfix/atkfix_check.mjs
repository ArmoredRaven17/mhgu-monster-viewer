// atkfix_check.mjs (atkfix lane, 2026-10-27): Giadrome / Volvidon and the monsters their arms were copied from (Akantor / Lagombi),
// each on an attack clip with the Attack Hitboxes overlay on: the clip's records (id, missing?, window vs the clip's length, set,
// joints), the shapes placed vs skipped (a joint the model lacks), how far each placed shape's ends sit from the nearest joint of the
// monster's own skeleton, and a screenshot at the first armed frame (POST /shot -> dev/shots/<run>/<name>.png).
//   node run-check.mjs atkfix_check.mjs --url http://localhost:<port>      (RUN env not available in-page: the run name is an arg)
async function atkfix(run){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const sel = document.getElementById('monAtkBox'), scrub = document.getElementById('animScrub');
  const CASES = [['em034_00', '2', 'Motion[1]'], ['em033_00', '2', 'Motion[1]'], ['em034_00', '2', 'Motion[18]'],
                 ['em062_00', '2', 'Motion[17]'], ['em061_00', '2', 'Motion[17]'], ['em062_00', '2', 'Motion[16]']];
  for (const [mon, list, clip] of CASES){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange();
    await until(() => !!V.mounted.main && V.state.id === mon, 900);
    // the Animation panel open (the overlay row lives there)
    const row = document.getElementById('monAtkBoxRow'), sec = row.closest('section'), head = sec.querySelector('.panel-head');
    if (sec.dataset.open !== 'true') head.click();
    await frames(3);
    sel.value = 'armed'; sel.dispatchEvent(new Event('change'));
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start');
    if (!o){ out.push([false, mon + ' ' + list + '|' + clip + ': no such clip', '']); continue; }
    clipSel.value = o.value; await clipSel.onchange();
    await frames(4);
    const total = +scrub.max;
    const st0 = V.attackBoxes();
    const rows = st0 ? st0.rows : [];
    // every armed record of the clip, its window and its joints
    const AH = await import('/render/attack-hitboxes.js');
    const all = AH.armedFor(mon, list + '|' + clip, null);
    const missing = all.filter(a => a.why).map(a => a.id + ' (' + a.why + ')');
    const wins = rows.map(r => r.id + '@' + (r.win ? r.win.join('-') : 'none') + ' set ' + r.set + ' j' + [...new Set(r.shapes.flatMap(s => s[0] === 2 ? [s[1], s[2]] : [s[1]]))].join('/'));
    const skipped = rows.reduce((s, r) => s + (r.skipped | 0), 0);
    const inClip = rows.filter(r => r.win && r.win[0] < total);
    // the first armed frame: scrub there
    const first = inClip.length ? Math.min(...inClip.map(r => r.win[0])) : 0;
    const at = Math.min(total, Math.round(first + Math.min(...inClip.map(r => Math.max(1, (Math.min(r.win[1], total) - r.win[0]) / 2))) || first));
    scrub.value = String(at); scrub.dispatchEvent(new Event('input'));
    await frames(6);
    const st = V.attackBoxes();
    // how far a placed shape's ends sit from the nearest joint of this monster's skeleton (game units: view x 100)
    const grp = V.scene.children.find(c => c.name === 'attack-hitboxes');
    const bonesW = []; V.mounted.main.updateMatrixWorld(true);
    V.mounted.main.traverse(n => { if (n.isBone){ const p = n.getWorldPosition(new n.position.constructor()); bonesW.push(p); } });
    let ends = 0, worst = 0, sumd = 0;
    if (grp) for (const g of grp.children) if (g.visible && g.userData.readback) for (const sh of g.userData.readback()){
      for (const P of [sh.A, sh.B]){
        let best = Infinity; for (const b of bonesW){ const d = Math.hypot(b.x - P[0], b.y - P[1], b.z - P[2]); if (d < best) best = d; }
        ends++; sumd += best; worst = Math.max(worst, best);
      }
    }
    // the screenshot at that frame
    V.renderer.render(V.scene, V.camera);
    const url = V.renderer.domElement.toDataURL('image/png');
    const name = mon + '_L' + list + '_' + clip.replace(/[^\w]/g, '');
    const resp = await fetch('/shot?run=' + encodeURIComponent(run) + '&name=' + encodeURIComponent(name), { method: 'POST', body: url }).then(r => r.status).catch(e => String(e));
    out.push([missing.length === 0 && skipped === 0 && inClip.length === rows.length && rows.length > 0,
      mon + ' ' + list + '|' + clip + ': every armed record is the monster\'s own (none missing, no joint skipped, every window inside the clip)',
      JSON.stringify({ clipFrames: total, records: rows.length, missing, skipped, outsideClip: rows.filter(r => !(r.win && r.win[0] < total)).map(r => r.id + '@' + (r.win ? r.win.join('-') : 'none')), wins })]);
    out.push([!!st && st.armed > 0 && ends > 0, mon + ' ' + list + '|' + clip + ': shapes armed and drawn at frame ' + at + ', ends to the nearest own joint (game units)',
      JSON.stringify({ frame: st && Math.round(st.frame), armed: st && st.armed, ends, meanToJoint: ends ? Math.round(sumd / ends * 100) : null, worstToJoint: Math.round(worst * 100), shot: resp, file: 'dev/shots/' + run + '/' + name + '.png' })]);
  }
  sel.value = 'off'; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = atkfix;
export const args = [[globalThis.process && process.env.RUN || 'atkfix-before']];
