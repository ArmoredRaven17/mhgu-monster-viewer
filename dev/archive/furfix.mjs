// Rajang / Furious: what toggles over frames -- material clip outputs, mesh visibility, joint scales -- per state
async function furProbe(MON){
  const out = [];
  const V = window.__view;
  const MM = await import('/render/monster.js');
  // THE PROPOSED FIX, applied in the page only (docs/ untouched): Rajang never names `Angry`; Furious holds Angry_Start@60
  MM.SUPPRESS_CLIP.em023_00 = { XfBAN__E1__m01_hairline: ['Angry'], XfBAN__E1__m02_hair_a: ['Angry'] };
  MM.ROM_SPAWN_CLIP.em023_05 = { XfBAN__E1__m01_hairline: 'Angry_Start', XfBAN__E1__m02_hair_a: 'Angry_Start' };
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), sel = document.getElementById('monState');
  const listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  await frames(10);
  const root = V.mounted.main;
  // 1. the clip tables
  const mats = new Map();
  root.traverse(o => { const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && m.userData && m.userData.rom && m.userData.rom.anim && m.userData.rom.anim.length) mats.set(m.name, m); });
  const tbl = {};
  for (const [n, m] of mats) tbl[n] = m.userData.rom.anim.map(c => ({ name: c.name, hash: c.hash, frames: c.frames, loop: c.loop, auto: c.auto,
    tracks: (c.tracks || []).map(t => ({ p: t.name || t.param || t.kind, kind: t.kind, interp: t.interp, cols: t.keys && t.keys[0] && t.keys[0].length - 1,
      keys: (t.keys || []).map(k => k.map(x => +(+x).toFixed(3))) })) }));
  
  const snapMat = m => {
    const r = {};
    if (m.uniforms) for (const [k, u] of Object.entries(m.uniforms)){ const v = u && u.value;
      if (typeof v === 'number') r[k] = +v.toFixed(4);
      else if (v && v.isVector2) r[k] = v.toArray().map(x => +x.toFixed(4)).join(',');
      else if (v && (v.isVector3 || v.isVector4 || v.isColor)) r[k] = v.toArray().map(x => +x.toFixed(4)).join(','); }
    for (const k of ['opacity', 'emissiveIntensity']) if (typeof m[k] === 'number') r['m.' + k] = +m[k].toFixed(4);
    for (const k of ['color', 'emissive']) if (m[k] && m[k].isColor) r['m.' + k] = m[k].toArray().map(x => +x.toFixed(4)).join(',');
    if (m.userData && m.userData.shader && m.userData.shader.uniforms) for (const [k, u] of Object.entries(m.userData.shader.uniforms)){ const v = u && u.value;
      if (typeof v === 'number') r['s.' + k] = +v.toFixed(4);
      else if (v && (v.isVector2 || v.isVector3 || v.isVector4 || v.isColor)) r['s.' + k] = v.toArray().map(x => +x.toFixed(4)).join(','); }
    return r;
  };
  const snapVis = () => { const r = {}; root.traverse(o => { if (o.isMesh || o.isSkinnedMesh){ const k = (o.userData.part !== undefined ? 'p' + o.userData.part : o.name) + ':' + (o.material && o.material.name);
    let vis = o.visible; for (let p = o.parent; p && vis; p = p.parent) vis = p.visible; r[k] = (r[k] || '') + (vis ? '1' : '0'); } }); return r; };
  const joints = () => { const rf = window.__rageFur ? window.__rageFur() : null; return rf ? JSON.stringify(rf.joints[150] && rf.joints[150].scale) + ' t' + rf.timer : null; };
  const run = async (label, nF) => {
    const series = {}; const vis = {}; const js = [];
    for (let f = 0; f < nF; f++){
      await frames(1);
      for (const [n, m] of mats){ const s = snapMat(m); for (const [k, v] of Object.entries(s)){ const key = n + '|' + k; (series[key] = series[key] || []).push(v); } }
      const sv = snapVis(); for (const [k, v] of Object.entries(sv)) (vis[k] = vis[k] || []).push(v);
      js.push(joints());
    }
    const varying = {};
    for (const [k, arr] of Object.entries(series)){ const u = [...new Set(arr.map(String))]; if (u.length > 1){
      // count value changes and sample
      let ch = 0; for (let i = 1; i < arr.length; i++) if (String(arr[i]) !== String(arr[i - 1])) ch++;
      varying[k] = { changes: ch, distinct: u.length, first: arr[0], last: arr[arr.length - 1], samp: arr.filter((_, i) => i % 6 === 0).slice(0, 40) }; } }
    const visVar = {};
    for (const [k, arr] of Object.entries(vis)){ const u = [...new Set(arr)]; if (u.length > 1) visVar[k] = arr.join('|'); else visVar[k] = 'const ' + arr[0]; }
    const jsu = [...new Set(js)];
    out.push([false, MON + ' ' + label, JSON.stringify({ state: { level: V.state.level, rage: V.state.rage, tired: V.state.tired, list: V.state.list, clip: V.pose.action && V.pose.action.getClip().name, matAnim: V.state.matAnim }, varying, visVar, joint150: jsu.slice(0, 8) })]);
  };
  const lvSel = document.getElementById('monLevel');
  const rung = async i => { lvSel.value = String(i); await lvSel.onchange({ target: lvSel }); await frames(2); };
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    if (!o) return false;
    clipSel.value = o.value; await clipSel.onchange();
    return until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  };
  out.push([false, MON + ' levels', JSON.stringify([...lvSel.options].map(o => o.value + '=' + o.textContent)) + ' stateopts ' + JSON.stringify([...sel.options].map(o => o.value + '=' + o.textContent))]);
  V.state.loop = true;
  await play('0', 'Motion[1]');
  const nLv = lvSel.options.length;
  for (let i = 0; i < nLv; i++){
    await rung(i);
    await run('idle L0M1 rung ' + i + ' (from change, 240f)', 240);
  }
  // back to rung 0 then flip to 1, watch the transition
  await rung(0); await frames(200);
  await rung(Math.min(1, nLv - 1));
  await run('idle flip ->1, 120f', 120);
  // Exhausted if offered
  if ([...sel.options].some(o => o.value === 'tired')){ await rung(0); sel.value = 'tired'; await sel.onchange({ target: sel }); await frames(2); await run('tired', 180); sel.value = sel.options[0].value; await sel.onchange({ target: sel }); }
  // a few clips at the enraged rung
  await rung(Math.min(1, nLv - 1));
  for (const [l, c] of [['0', 'Motion[5]'], ['2', 'Motion[8]'], ['2', 'Motion[24]'], ['1', 'Motion[1]']]){
    if (await play(l, c)) await run('enraged rung clip ' + l + '|' + c, 180);
  }
  await rung(0);
  for (const [l, c] of [['0', 'Motion[5]'], ['2', 'Motion[24]']]){
    if (await play(l, c)) await run('rung0 clip ' + l + '|' + c, 180);
  }
  return out;
}
export const pageCheck = furProbe;
export const args = [['em023_00'], ['em023_05']];
