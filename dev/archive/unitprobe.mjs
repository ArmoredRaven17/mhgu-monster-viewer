// Where the UNIT is in the viewer: candidates side by side (game units), Seregios on a ground and two air clips
async function unitProbe(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em077_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule);
  const fx = M.effectRuntimeInstance();
  const g = v => v.map(x => +(x / 0.01).toFixed(1));
  for (const [list, clip, f] of [['0', 'Motion[1]', 0], ['1', 'Motion[1]', 100], ['1', 'Motion[4]', 2], ['2', 'Motion[3]', 40]]){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_loop') || [...clipSel.options].find(x => x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange(); await frames(3);
    const act = V.pose.action; act.paused = true; act.time = f / 60; V.pose.mixer.update(0); await frames(3);
    const cr = V.pose.mixer.getRoot();
    const w = V.world;
    const rootM = fx.root ? (fx.root.updateWorldMatrix(true, false), fx.root.matrixWorld.elements) : null;
    const hips = fx.originBone ? (fx.originBone.updateWorldMatrix(true, false), fx.originBone.matrixWorld.elements) : null;
    out.push([false, list + '|' + o.value + ' f' + f, JSON.stringify({
      parentPos: fx.schedule.parent && fx.schedule.parent.position.map(x => +x.toFixed(1)),
      hips: hips && g([hips[12], hips[13], hips[14]]),
      modelRoot: rootM && g([rootM[12], rootM[13], rootM[14]]),
      clipRootLocal: [cr.position.x, cr.position.y, cr.position.z].map(x => +x.toFixed(3)),
      clipRootIsModel: cr === fx.root, worldPos: g([w.position.x, w.position.y, w.position.z]), worldScale: w.scale.y,
      clipRootScene: g([cr.position.x * w.scale.x + w.position.x, cr.position.y * w.scale.y + w.position.y, cr.position.z * w.scale.z + w.position.z]) })]);
    act.paused = false;
  }
  return out;
}
export const pageCheck = unitProbe;
