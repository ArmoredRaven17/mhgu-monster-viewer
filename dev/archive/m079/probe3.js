const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = [];
let T0 = null;
async function mon(id){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2000);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
  T0 = V.controls.target.clone();
}
function rageSet(on){ const b = document.getElementById('monRage'); if (b && b.checked !== on){ b.checked = on; b.onchange({ target: b }); } }
function cam(view){
  V.controls.target.copy(T0); const t = V.controls.target;
  const [dx, dy, dz, lz] = view;
  V.camera.position.set(t.x + dx, t.y + dy, t.z + dz); V.controls.target.set(t.x, t.y, t.z + lz); V.controls.update();
  V.renderer.setClearColor(0x15171c, 1); V.scene.background = null;
}
async function shotAfter(list, base, name, { rage = false, after = 6, view = [22, 10, 22, 2], wantKey = null, tries = 4 } = {}){
  rageSet(rage);
  const S = M.effectRuntimeInstance().schedule;
  for (let k = 0; k < tries; k++){
    S.shellTally = { spawned: 0, beams: [], refused: [] };
    const starts = [];
    const rq0 = S.host.requestEffect;
    S.host.requestEffect = function(owner, parent, rec){ if (parent !== S.parent) starts.push({ key: rec.key, f: S.clip ? Math.round(S.clip.frame) : null }); return rq0.apply(this, arguments); };
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options].map(o => o.value);
    clipSel.value = opts.find(v => v === base) || opts.find(v => v === base + '_start') || opts.find(v => v === base + '_loop');
    await clipSel.onchange();
    const ok = await until(() => starts.some(s => wantKey == null || s.key === wantKey), 400);
    if (ok){
      const f0 = S.clip.frame; await until(() => S.clip.frame >= f0 + after || S.clip.frame < f0, 200);
      cam(view);
      const shot = await V.shot('m079', name, V.pose.action.time); V.pose.action.timeScale = 1;
      S.host.requestEffect = rq0;
      out.push({ name, starts, frame: Math.round(S.clip.frame), refused: S.shellTally.refused, shot: shot.saved.split(/[\\/]/).pop(), fail: M.effectRuntimeInstance().failed || null });
      return;
    }
    S.host.requestEffect = rq0;
    // another clip, then try again (the play's pick advances)
    const o2 = opts.find(v => /Motion\[1\]/.test(v)) || opts[0]; clipSel.value = o2; await clipSel.onchange(); await wait(150);
  }
  out.push({ name, missing: true });
}
await mon('em079_00');
await shotAfter('2', 'Motion[43]', 'p3_m00_L2M43_u20', { after: 8 });
await shotAfter('1', 'Motion[2]', 'p3_m00_L1M2_c29', { after: 8 });
await shotAfter('1', 'Motion[22]', 'p3_m00_L1M22_c30', { after: 8 });
await shotAfter('2', 'Motion[17]', 'p3_m00_L2M17_u1_front', { after: 40, view: [12, 6, 38, 10] });
await shotAfter('2', 'Motion[14]', 'p3_m00_L2M14_u20', { rage: true, after: 6, wantKey: 20 });
await shotAfter('2', 'Motion[12]', 'p3_m00_L2M12_u21', { rage: true, after: 6, wantKey: 21 });
await shotAfter('2', 'Motion[35]', 'p3_m00_L2M35_u20', { rage: true, after: 6, wantKey: 20 });
rageSet(false); await wait(300);
await shotAfter('2', 'Motion[23]', 'p3_m00_L2M23_u10', { after: 20, wantKey: 10 });
await mon('em079_04');
await shotAfter('1', 'Motion[27]', 'p3_m04_L1M27_u60', { after: 10, wantKey: 60 });
await shotAfter('9', 'Motion[4]', 'p3_m04_L9M4_u60x3', { after: 10, wantKey: 60, view: [30, 14, 30, 6] });
await shotAfter('2', 'Motion[43]', 'p3_m04_L2M43_u30', { after: 8, wantKey: 30 });
await shotAfter('2', 'Motion[23]', 'p3_m04_L2M23_u10', { after: 4, wantKey: 10 });
await shotAfter('2', 'Motion[14]', 'p3_m04_L2M14_u30', { rage: true, after: 6, wantKey: 30 });
rageSet(false);
return out;
